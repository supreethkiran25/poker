import { useEffect, useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';

interface PeerConnection {
  pc: RTCPeerConnection;
  audioEl: HTMLAudioElement;
  candidateQueue: RTCIceCandidateInit[];
  hasRemoteDescription: boolean;
}

// Multi-network ICE servers (Google STUN + Cloudflare STUN + Free Metered OpenRelay TURN for strict NATs)
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelay',
      credential: 'openrelay',
    },
  ],
  iceCandidatePoolSize: 2,
};

// Tune SDP to enable Opus in-band Forward Error Correction (FEC) & optimal voice bitrates
function tuneSdp(sdp: string): string {
  if (!sdp) return sdp;
  return sdp.replace(/a=fmtp:(\d+) (.*)/g, (match, _pt, params) => {
    if (params.includes('useinbandfec')) return match;
    return `${match};useinbandfec=1;maxaveragebitrate=32000;stereo=0;sprop-stereo=0`;
  });
}

function getAudioContainer(): HTMLElement {
  let container = document.getElementById('poker-voice-audio-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'poker-voice-audio-container';
    container.style.display = 'none';
    document.body.appendChild(container);
  }
  return container;
}

export function useVoiceChat(socket: Socket | null, roomCode?: string, _myPlayerId?: string) {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [speakingPeers, setSpeakingPeers] = useState<Record<string, boolean>>({});
  const [mutedPeers, setMutedPeers] = useState<Record<string, boolean>>({});

  const isVoiceActiveRef = useRef(false);
  const isMutedRef = useRef(false);
  const socketRef = useRef(socket);
  const roomCodeRef = useRef(roomCode);

  isVoiceActiveRef.current = isVoiceActive;
  isMutedRef.current = isMuted;
  socketRef.current = socket;
  roomCodeRef.current = roomCode;

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map()); // socketId -> PeerConnection
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isSpeakingRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Global user interaction unlocker for iOS Safari and mobile browsers
  useEffect(() => {
    const unlockAudio = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      peersRef.current.forEach(({ audioEl }) => {
        if (audioEl && audioEl.paused) {
          audioEl.play().catch(() => {});
        }
      });
    };

    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('click', unlockAudio, { passive: true });
    return () => {
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    };
  }, []);

  // Clean up all peer connections & audio elements
  const cleanup = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    peersRef.current.forEach(({ pc, audioEl }) => {
      try {
        pc.close();
        audioEl.srcObject = null;
        audioEl.remove();
      } catch (e) {}
    });
    peersRef.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    isVoiceActiveRef.current = false;
    setIsVoiceActive(false);
    setIsSpeaking(false);
    setSpeakingPeers({});
    setMutedPeers({});
  }, []);

  // Voice Activity Detection (VAD) with Hysteresis & Hangover to avoid clipping speech
  const setupVAD = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Resume if suspended on mobile
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudio = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Hysteresis thresholds for clean speech detection
        const speechTriggerThreshold = 26;
        const speechSilenceThreshold = 18;

        if (average > speechTriggerThreshold && !isMutedRef.current) {
          if (!isSpeakingRef.current) {
            isSpeakingRef.current = true;
            setIsSpeaking(true);
            if (socketRef.current && roomCodeRef.current) {
              socketRef.current.emit('voice:speaking', {
                roomCode: roomCodeRef.current,
                isSpeaking: true,
              });
            }
          }
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else if (average < speechSilenceThreshold) {
          if (isSpeakingRef.current && !silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              isSpeakingRef.current = false;
              setIsSpeaking(false);
              if (socketRef.current && roomCodeRef.current) {
                socketRef.current.emit('voice:speaking', {
                  roomCode: roomCodeRef.current,
                  isSpeaking: false,
                });
              }
              silenceTimerRef.current = null;
            }, 600);
          }
        }

        animFrameRef.current = requestAnimationFrame(checkAudio);
      };

      checkAudio();
    } catch (err) {
      console.warn('VAD setup failed:', err);
    }
  };

  // Create an RTCPeerConnection for a remote socket
  const createPeer = useCallback(
    (peerSocketId: string, _peerPlayerId: string, initiator: boolean) => {
      if (peersRef.current.has(peerSocketId)) {
        return peersRef.current.get(peerSocketId)!.pc;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      (audioEl as any).playsInline = true;
      audioEl.setAttribute('playsinline', 'true');
      audioEl.volume = 1.0;
      audioEl.muted = false;

      const container = getAudioContainer();
      container.appendChild(audioEl);

      const peerEntry: PeerConnection = {
        pc,
        audioEl,
        candidateQueue: [],
        hasRemoteDescription: false,
      };
      peersRef.current.set(peerSocketId, peerEntry);

      // Add local audio tracks if we have local microphone
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('voice:signal', {
            toSocketId: peerSocketId,
            signal: { type: 'candidate', candidate: event.candidate.toJSON() },
          });
        }
      };

      // Handle incoming remote audio stream
      pc.ontrack = (event) => {
        const stream = (event.streams && event.streams[0]) || new MediaStream([event.track]);
        audioEl.srcObject = stream;
        audioEl.play().catch((err) => {
          console.info('Audio playback deferred until user interaction:', err);
        });
      };

      // Connection health & ice restart
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed') {
          console.warn('WebRTC connection failed with peer, restarting ICE:', peerSocketId);
          try {
            pc.restartIce();
          } catch (e) {}
        }
      };

      // If initiator, create and send offer with tuned SDP
      if (initiator) {
        pc.createOffer({ offerToReceiveAudio: true })
          .then((offer) => {
            const tuned = new RTCSessionDescription({
              type: offer.type,
              sdp: tuneSdp(offer.sdp || ''),
            });
            return pc.setLocalDescription(tuned);
          })
          .then(() => {
            if (socketRef.current) {
              socketRef.current.emit('voice:signal', {
                toSocketId: peerSocketId,
                signal: { type: 'offer', sdp: pc.localDescription },
              });
            }
          })
          .catch((err) => console.warn('Error creating offer:', err));
      }

      return pc;
    },
    []
  );

  // Join Voice Call
  const startVoice = useCallback(async () => {
    if (!socketRef.current || !roomCodeRef.current) return;
    setMicError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicError('Microphone not supported on this device/browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          sampleRate: { ideal: 48000 },
          channelCount: { ideal: 1 },
        },
        video: false,
      });

      localStreamRef.current = stream;
      isVoiceActiveRef.current = true;
      setIsVoiceActive(true);
      setIsMuted(false);
      isMutedRef.current = false;
      setupVAD(stream);

      // Add tracks to any peers that were already connected
      peersRef.current.forEach(({ pc }) => {
        stream.getAudioTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      });

      // Tell server we joined voice room
      socketRef.current.emit('voice:join', { roomCode: roomCodeRef.current });
      socketRef.current.emit('voice:state', { roomCode: roomCodeRef.current, isMuted: false });
    } catch (err: any) {
      console.warn('Microphone access denied or error:', err);
      setMicError('Mic permission required to talk');
    }
  }, []);

  // Leave Voice Call
  const stopVoice = useCallback(() => {
    if (socketRef.current && roomCodeRef.current) {
      socketRef.current.emit('voice:leave', { roomCode: roomCodeRef.current });
    }
    cleanup();
  }, [cleanup]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) {
      startVoice();
      return;
    }

    const nextMute = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMute;
    });
    setIsMuted(nextMute);
    isMutedRef.current = nextMute;

    if (socketRef.current && roomCodeRef.current) {
      socketRef.current.emit('voice:state', { roomCode: roomCodeRef.current, isMuted: nextMute });
      if (nextMute) {
        socketRef.current.emit('voice:speaking', { roomCode: roomCodeRef.current, isSpeaking: false });
        setIsSpeaking(false);
      }
    }
  }, [isMuted, startVoice]);

  // Socket signaling listeners
  useEffect(() => {
    if (!socket || !roomCode) return;

    // Existing peers in voice room
    const handlePeers = (data: { peers: { playerId: string; socketId: string }[] }) => {
      if (!Array.isArray(data?.peers)) return;
      data.peers.forEach((peer) => {
        createPeer(peer.socketId, peer.playerId, true);
      });
    };

    // New peer joined
    const handlePeerJoined = (data: { playerId: string; socketId: string }) => {
      if (!data?.socketId) return;
      createPeer(data.socketId, data.playerId, false);
    };

    // WebRTC signal from peer
    const handleSignal = async (data: {
      fromPlayerId: string;
      fromSocketId: string;
      signal: any;
    }) => {
      const { fromSocketId, fromPlayerId, signal } = data;
      if (!fromSocketId || !signal) return;

      let peer = peersRef.current.get(fromSocketId);

      if (!peer) {
        createPeer(fromSocketId, fromPlayerId, false);
        peer = peersRef.current.get(fromSocketId);
        if (!peer) return;
      }

      const { pc } = peer;

      try {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          peer.hasRemoteDescription = true;

          // Flush queued candidates
          if (peer.candidateQueue.length > 0) {
            for (const cand of peer.candidateQueue) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
            }
            peer.candidateQueue = [];
          }

          const answer = await pc.createAnswer();
          const tuned = new RTCSessionDescription({
            type: answer.type,
            sdp: tuneSdp(answer.sdp || ''),
          });
          await pc.setLocalDescription(tuned);

          if (socketRef.current) {
            socketRef.current.emit('voice:signal', {
              toSocketId: fromSocketId,
              signal: { type: 'answer', sdp: pc.localDescription },
            });
          }
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          peer.hasRemoteDescription = true;

          // Flush queued candidates
          if (peer.candidateQueue.length > 0) {
            for (const cand of peer.candidateQueue) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
            }
            peer.candidateQueue = [];
          }
        } else if (signal.type === 'candidate' && signal.candidate) {
          if (peer.hasRemoteDescription && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch((err) => {
              console.warn('Failed to add ICE candidate:', err);
            });
          } else {
            // Queue until remote description is set
            peer.candidateQueue.push(signal.candidate);
          }
        }
      } catch (err) {
        console.warn('Error handling WebRTC signal:', err);
      }
    };

    // Peer left voice
    const handlePeerLeft = (data: { playerId: string; socketId: string }) => {
      const peer = peersRef.current.get(data.socketId);
      if (peer) {
        try {
          peer.pc.close();
          peer.audioEl.srcObject = null;
          peer.audioEl.remove();
        } catch (e) {}
        peersRef.current.delete(data.socketId);
      }
      setSpeakingPeers((prev) => {
        const next = { ...prev };
        delete next[data.playerId];
        return next;
      });
      setMutedPeers((prev) => {
        const next = { ...prev };
        delete next[data.playerId];
        return next;
      });
    };

    // Peer speaking state
    const handlePlayerSpeaking = (data: { playerId: string; isSpeaking: boolean }) => {
      setSpeakingPeers((prev) => ({
        ...prev,
        [data.playerId]: !!data.isSpeaking,
      }));
    };

    // Peer mute state
    const handlePlayerState = (data: { playerId: string; isMuted: boolean }) => {
      setMutedPeers((prev) => ({
        ...prev,
        [data.playerId]: !!data.isMuted,
      }));
    };

    socket.on('voice:peers', handlePeers);
    socket.on('voice:peer-joined', handlePeerJoined);
    socket.on('voice:signal', handleSignal);
    socket.on('voice:peer-left', handlePeerLeft);
    socket.on('voice:player-speaking', handlePlayerSpeaking);
    socket.on('voice:player-state', handlePlayerState);

    return () => {
      socket.off('voice:peers', handlePeers);
      socket.off('voice:peer-joined', handlePeerJoined);
      socket.off('voice:signal', handleSignal);
      socket.off('voice:peer-left', handlePeerLeft);
      socket.off('voice:player-speaking', handlePlayerSpeaking);
      socket.off('voice:player-state', handlePlayerState);
    };
  }, [socket, roomCode, createPeer]);

  // Clean up when leaving room
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [roomCode, cleanup]);

  return {
    isVoiceActive,
    isMuted,
    isSpeaking,
    speakingPeers,
    mutedPeers,
    micError,
    startVoice,
    stopVoice,
    toggleMute,
  };
}
