import { useEffect, useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';

interface PeerConnection {
  pc: RTCPeerConnection;
  audioEl: HTMLAudioElement;
  candidateQueue: RTCIceCandidateInit[];
  hasRemoteDescription: boolean;
  transceiver?: RTCRtpTransceiver;
  isPolite: boolean;
  stream?: MediaStream;
  webAudioSource?: MediaStreamAudioSourceNode;
  gainNode?: GainNode;
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

// Global audio context shared across voice features
let sharedAudioContext: AudioContext | null = null;
let sharedSilentTrack: MediaStreamTrack | null = null;
let sharedSilentStream: MediaStream | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioCtx();
  }
  return sharedAudioContext;
}

// Generates an in-memory silent audio track without requesting microphone permissions.
// Allows establishing active 'sendrecv' WebRTC transceivers on room join, eliminating mid-call renegotiation glare.
function getOrCreateSilentTrack(): { track: MediaStreamTrack; stream: MediaStream } {
  if (sharedSilentTrack && sharedSilentTrack.readyState === 'live' && sharedSilentStream) {
    return { track: sharedSilentTrack, stream: sharedSilentStream };
  }
  const ctx = getAudioContext();
  if (!ctx) {
    throw new Error('Web Audio API is not supported on this device.');
  }
  const osc = ctx.createOscillator();
  const dst = ctx.createMediaStreamDestination();
  const gain = ctx.createGain();
  gain.gain.value = 0; // Pure silence, zero amplitude
  osc.connect(gain);
  gain.connect(dst);
  osc.start();

  const track = dst.stream.getAudioTracks()[0];
  track.enabled = true;
  sharedSilentTrack = track;
  sharedSilentStream = dst.stream;
  return { track, stream: dst.stream };
}

// In-viewport, non-suspended audio container for WebKit (macOS Safari & iOS Safari)
function getAudioContainer(): HTMLElement {
  let container = document.getElementById('poker-voice-audio-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'poker-voice-audio-container';
    container.style.position = 'fixed';
    container.style.bottom = '0px';
    container.style.right = '0px';
    container.style.width = '1px';
    container.style.height = '1px';
    container.style.opacity = '0.01';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '-1';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
  }
  return container;
}

// Resilient multi-stage microphone acquisition supporting macOS, iOS, Android, and Windows
async function acquireMicrophoneStream(): Promise<MediaStream> {
  // Check secure context
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    throw new Error(
      'INSECURE_CONTEXT: Microphone requires HTTPS or localhost. When connecting from another device (like Mac or phone), open via HTTPS.'
    );
  }

  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error('NOT_SUPPORTED: Microphone is not supported on this browser or platform.');
  }

  // Attempt 1: Standard high-fidelity voice constraints
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
  } catch (err: any) {
    console.warn('getUserMedia with voice constraints rejected, trying basic fallback:', err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      throw err;
    }
  }

  // Attempt 2: Minimal baseline fallback (AirPods, Bluetooth headsets, older Safari)
  return await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });
}

export function useVoiceChat(socket: Socket | null, roomCode?: string, _myPlayerId?: string) {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [speakingPeers, setSpeakingPeers] = useState<Record<string, boolean>>({});
  const [mutedPeers, setMutedPeers] = useState<Record<string, boolean>>({});

  const isVoiceActiveRef = useRef(false);
  const isMutedRef = useRef(true);
  const socketRef = useRef(socket);
  const roomCodeRef = useRef(roomCode);

  isVoiceActiveRef.current = isVoiceActive;
  isMutedRef.current = isMuted;
  socketRef.current = socket;
  roomCodeRef.current = roomCode;

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map()); // socketId -> PeerConnection
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isSpeakingRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Global user gesture unlocker for MacBook Safari, iOS Safari, and mobile browsers
  const unlockAllAudio = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    peersRef.current.forEach(({ audioEl, gainNode }) => {
      if (audioEl) {
        audioEl.muted = false;
        audioEl.volume = 1.0;
        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // HTMLAudioElement succeeded, mute WebAudio fallback to avoid double audio/echo
              if (gainNode) gainNode.gain.value = 0;
            })
            .catch(() => {
              // HTMLAudioElement blocked, enable WebAudio fallback
              if (gainNode) gainNode.gain.value = 1.0;
            });
        }
      }
    });
  }, []);

  useEffect(() => {
    const handleInteraction = () => {
      unlockAllAudio();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        unlockAllAudio();
      }
    };

    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('touchend', handleInteraction, { passive: true });
    window.addEventListener('pointerdown', handleInteraction, { passive: true });
    window.addEventListener('click', handleInteraction, { passive: true });
    window.addEventListener('keydown', handleInteraction, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('touchend', handleInteraction);
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [unlockAllAudio]);

  // Clean up all peer connections & audio elements
  const cleanup = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    peersRef.current.forEach(({ pc, audioEl, webAudioSource, gainNode }) => {
      try {
        if (webAudioSource) webAudioSource.disconnect();
        if (gainNode) gainNode.disconnect();
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

    isVoiceActiveRef.current = false;
    isMutedRef.current = true;
    setIsVoiceActive(false);
    setIsMuted(true);
    setIsSpeaking(false);
    setSpeakingPeers({});
    setMutedPeers({});
  }, []);

  // Voice Activity Detection (VAD) with Hysteresis & Hangover
  const setupVAD = (stream: MediaStream) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

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

  // Create an RTCPeerConnection for a remote socket using the pre-negotiated sendrecv pipeline
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
      audioEl.setAttribute('webkit-playsinline', 'true');
      audioEl.volume = 1.0;
      audioEl.muted = false;

      const container = getAudioContainer();
      container.appendChild(audioEl);

      const mySocketId = socketRef.current?.id || '';
      const isPolite = mySocketId ? mySocketId < peerSocketId : !initiator;

      // Determine initial track: live mic track if already unmuted, otherwise silent track
      let initialTrack: MediaStreamTrack;
      let initialStream: MediaStream;

      const liveTrack = localStreamRef.current?.getAudioTracks().find((t) => t.readyState === 'live');
      if (liveTrack && localStreamRef.current) {
        initialTrack = liveTrack;
        initialStream = localStreamRef.current;
      } else {
        const silent = getOrCreateSilentTrack();
        initialTrack = silent.track;
        initialStream = silent.stream;
      }

      // Pre-negotiate full-duplex sendrecv transceiver.
      // This establishes the audio pipe immediately with standard SDP, avoiding mid-call renegotiation glare.
      let transceiver: RTCRtpTransceiver | undefined;
      try {
        transceiver = pc.addTransceiver(initialTrack, {
          direction: 'sendrecv',
          streams: [initialStream],
        });
      } catch (e) {
        console.warn('addTransceiver fallback to addTrack:', e);
        try {
          pc.addTrack(initialTrack, initialStream);
        } catch (err) {}
      }

      const peerEntry: PeerConnection = {
        pc,
        audioEl,
        candidateQueue: [],
        hasRemoteDescription: false,
        transceiver,
        isPolite,
      };
      peersRef.current.set(peerSocketId, peerEntry);

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
        const remoteStream = (event.streams && event.streams[0]) || new MediaStream([event.track]);
        peerEntry.stream = remoteStream;

        audioEl.srcObject = remoteStream;
        audioEl.volume = 1.0;
        audioEl.muted = false;

        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (peerEntry.gainNode) peerEntry.gainNode.gain.value = 0;
            })
            .catch((err) => {
              console.info('AudioElement play deferred (Safari/iOS):', err);
              if (peerEntry.gainNode) peerEntry.gainNode.gain.value = 1.0;
            });
        }

        // Dual playback pipeline: Connect to AudioContext destination as fallback for Safari/macOS
        try {
          const ctx = getAudioContext();
          if (ctx) {
            if (ctx.state === 'suspended') {
              ctx.resume().catch(() => {});
            }
            if (!peerEntry.webAudioSource) {
              const source = ctx.createMediaStreamSource(remoteStream);
              const gainNode = ctx.createGain();
              // Default to 0 gain if audioEl plays; raised to 1.0 if audioEl is suspended
              gainNode.gain.value = 0;
              source.connect(gainNode);
              gainNode.connect(ctx.destination);
              peerEntry.webAudioSource = source;
              peerEntry.gainNode = gainNode;
            }
          }
        } catch (e) {
          console.warn('Web Audio destination pipeline note:', e);
        }
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

      // Initiator creates clean standard SDP offer
      if (initiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
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

  // Join Voice Call (request microphone and unmute)
  const startVoice = useCallback(async () => {
    if (!socketRef.current || !roomCodeRef.current) return;
    setMicError(null);

    try {
      unlockAllAudio();

      const stream = await acquireMicrophoneStream();
      const track = stream.getAudioTracks()[0];
      if (!track) {
        throw new Error('No active audio track found on microphone stream.');
      }
      track.enabled = true;

      track.onended = () => {
        localStreamRef.current = null;
        setIsVoiceActive(false);
        setIsMuted(true);
        isVoiceActiveRef.current = false;
        isMutedRef.current = true;
        try {
          const silent = getOrCreateSilentTrack();
          peersRef.current.forEach((peer) => {
            if (peer.transceiver?.sender) {
              peer.transceiver.sender.replaceTrack(silent.track).catch(() => {});
            }
          });
        } catch (e) {}
        if (socketRef.current && roomCodeRef.current) {
          socketRef.current.emit('voice:state', { roomCode: roomCodeRef.current, isMuted: true });
        }
      };

      localStreamRef.current = stream;
      isVoiceActiveRef.current = true;
      setIsVoiceActive(true);
      setIsMuted(false);
      isMutedRef.current = false;
      setupVAD(stream);

      // Instant hardware/RTP track replacement on all peers - zero renegotiation needed!
      for (const [peerSocketId, peer] of peersRef.current.entries()) {
        try {
          if (peer.transceiver?.sender) {
            await peer.transceiver.sender.replaceTrack(track);
          }
        } catch (e) {
          console.warn('Failed to replaceTrack with real mic for peer:', peerSocketId, e);
        }
      }

      // Tell server we are active & unmuted
      socketRef.current.emit('voice:join', { roomCode: roomCodeRef.current });
      socketRef.current.emit('voice:state', { roomCode: roomCodeRef.current, isMuted: false });
    } catch (err: any) {
      console.warn('Microphone access failed:', err);
      if (err.message?.startsWith('INSECURE_CONTEXT')) {
        setMicError('Microphone requires HTTPS on Mac/phones. Please open via https://');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Mic permission denied. Please allow microphone in browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMicError('No microphone detected on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setMicError('Microphone is in use by another application.');
      } else if (err.name === 'OverconstrainedError') {
        setMicError('Microphone constraints not supported by device.');
      } else {
        setMicError(err.message || 'Could not access microphone.');
      }
    }
  }, [unlockAllAudio]);

  // Leave Voice Call
  const stopVoice = useCallback(() => {
    if (socketRef.current && roomCodeRef.current) {
      socketRef.current.emit('voice:leave', { roomCode: roomCodeRef.current });
    }
    cleanup();
  }, [cleanup]);

  // Toggle Mute / Unmute
  const toggleMute = useCallback(async () => {
    if (!localStreamRef.current) {
      await startVoice();
      return;
    }

    const activeTrack = localStreamRef.current.getAudioTracks().find((t) => t.readyState === 'live');
    if (!activeTrack) {
      await startVoice();
      return;
    }

    const nextMute = !isMuted;

    // WebRTC standard track mute
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMute;
    });

    // Also swap RTP track with silent track when muted for guaranteed cross-device privacy
    if (nextMute) {
      try {
        const silent = getOrCreateSilentTrack();
        peersRef.current.forEach((peer) => {
          if (peer.transceiver?.sender) {
            peer.transceiver.sender.replaceTrack(silent.track).catch(() => {});
          }
        });
      } catch (e) {}
    } else {
      peersRef.current.forEach((peer) => {
        if (peer.transceiver?.sender) {
          peer.transceiver.sender.replaceTrack(activeTrack).catch(() => {});
        }
      });
    }

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

  // Auto-join voice room as a participant upon entering table/lobby
  useEffect(() => {
    if (!socket || !roomCode) return;

    socket.emit('voice:join', { roomCode });
    socket.emit('voice:state', { roomCode, isMuted: true });

    return () => {
      socket.emit('voice:leave', { roomCode });
    };
  }, [socket, roomCode]);

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
          const offerCollision = pc.signalingState !== 'stable';

          if (offerCollision) {
            if (!peer.isPolite) {
              return; // Impolite peer ignores colliding offer
            }
            await Promise.all([
              pc.setLocalDescription({ type: 'rollback' }),
              pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)),
            ]);
          } else {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          }

          peer.hasRemoteDescription = true;

          // Flush queued candidates
          if (peer.candidateQueue.length > 0) {
            for (const cand of peer.candidateQueue) {
              await pc.addIceCandidate(cand).catch(() => {});
            }
            peer.candidateQueue = [];
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          if (socketRef.current) {
            socketRef.current.emit('voice:signal', {
              toSocketId: fromSocketId,
              signal: { type: 'answer', sdp: pc.localDescription },
            });
          }
        } else if (signal.type === 'answer') {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            peer.hasRemoteDescription = true;

            // Flush queued candidates
            if (peer.candidateQueue.length > 0) {
              for (const cand of peer.candidateQueue) {
                await pc.addIceCandidate(cand).catch(() => {});
              }
              peer.candidateQueue = [];
            }
          }
        } else if (signal.type === 'candidate' && signal.candidate) {
          if (peer.hasRemoteDescription && pc.remoteDescription) {
            await pc.addIceCandidate(signal.candidate).catch((err) => {
              console.warn('Failed to add ICE candidate:', err);
            });
          } else {
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
          if (peer.webAudioSource) peer.webAudioSource.disconnect();
          if (peer.gainNode) peer.gainNode.disconnect();
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
