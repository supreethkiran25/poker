import { useEffect, useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';

interface PeerConnection {
  pc: RTCPeerConnection;
  audioEl?: HTMLAudioElement;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useVoiceChat(socket: Socket | null, roomCode?: string, myPlayerId?: string) {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [speakingPeers, setSpeakingPeers] = useState<Record<string, boolean>>({});
  const [mutedPeers, setMutedPeers] = useState<Record<string, boolean>>({});

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map()); // socketId -> connection
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isSpeakingRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up all peer connections & audio elements
  const cleanup = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    peersRef.current.forEach(({ pc, audioEl }) => {
      try {
        pc.close();
        if (audioEl) {
          audioEl.srcObject = null;
          audioEl.remove();
        }
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

    setIsVoiceActive(false);
    setIsSpeaking(false);
    setSpeakingPeers({});
    setMutedPeers({});
  }, []);

  // Voice Activity Detection (VAD)
  const setupVAD = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
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
        const speechThreshold = 18;

        if (average > speechThreshold && !isMuted) {
          if (!isSpeakingRef.current) {
            isSpeakingRef.current = true;
            setIsSpeaking(true);
            if (socket && roomCode) {
              socket.emit('voice:speaking', { roomCode, isSpeaking: true });
            }
          }
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else {
          if (isSpeakingRef.current && !silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              isSpeakingRef.current = false;
              setIsSpeaking(false);
              if (socket && roomCode) {
                socket.emit('voice:speaking', { roomCode, isSpeaking: false });
              }
              silenceTimerRef.current = null;
            }, 350);
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
    (peerSocketId: string, peerPlayerId: string, initiator: boolean) => {
      if (peersRef.current.has(peerSocketId)) {
        return peersRef.current.get(peerSocketId)!.pc;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      const audioEl = new Audio();
      audioEl.autoplay = true;

      peersRef.current.set(peerSocketId, { pc, audioEl });

      // Add local audio tracks if we have any
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('voice:signal', {
            toSocketId: peerSocketId,
            signal: { type: 'candidate', candidate: event.candidate },
          });
        }
      };

      // Handle incoming remote audio stream
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          audioEl.srcObject = event.streams[0];
          audioEl.play().catch(() => {});
        }
      };

      // If initiator, create and send offer
      if (initiator) {
        pc.createOffer({ offerToReceiveAudio: true })
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            if (socket) {
              socket.emit('voice:signal', {
                toSocketId: peerSocketId,
                signal: { type: 'offer', sdp: pc.localDescription },
              });
            }
          })
          .catch((err) => console.warn('Error creating offer:', err));
      }

      return pc;
    },
    [socket]
  );

  // Join Voice Call
  const startVoice = useCallback(async () => {
    if (!socket || !roomCode) return;
    setMicError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localStreamRef.current = stream;
      setIsVoiceActive(true);
      setIsMuted(false);
      setupVAD(stream);

      // Tell server we joined voice room
      socket.emit('voice:join', { roomCode });
      socket.emit('voice:state', { roomCode, isMuted: false });
    } catch (err: any) {
      console.warn('Microphone access denied:', err);
      setMicError('Mic permission required to talk');
    }
  }, [socket, roomCode]);

  // Leave Voice Call
  const stopVoice = useCallback(() => {
    if (socket && roomCode) {
      socket.emit('voice:leave', { roomCode });
    }
    cleanup();
  }, [socket, roomCode, cleanup]);

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

    if (socket && roomCode) {
      socket.emit('voice:state', { roomCode, isMuted: nextMute });
      if (nextMute) {
        socket.emit('voice:speaking', { roomCode, isSpeaking: false });
        setIsSpeaking(false);
      }
    }
  }, [isMuted, socket, roomCode, startVoice]);

  // Socket signaling listeners
  useEffect(() => {
    if (!socket || !roomCode) return;

    // Existing peers in voice room
    const handlePeers = (data: { peers: { playerId: string; socketId: string }[] }) => {
      if (!isVoiceActive) return;
      data.peers.forEach((peer) => {
        createPeer(peer.socketId, peer.playerId, true);
      });
    };

    // New peer joined
    const handlePeerJoined = (data: { playerId: string; socketId: string }) => {
      if (!isVoiceActive) return;
      createPeer(data.socketId, data.playerId, false);
    };

    // WebRTC signal from peer
    const handleSignal = async (data: {
      fromPlayerId: string;
      fromSocketId: string;
      signal: any;
    }) => {
      const { fromSocketId, fromPlayerId, signal } = data;
      let peer = peersRef.current.get(fromSocketId);

      if (!peer) {
        const pc = createPeer(fromSocketId, fromPlayerId, false);
        peer = { pc };
      }

      const pc = peer.pc;

      try {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('voice:signal', {
            toSocketId: fromSocketId,
            signal: { type: 'answer', sdp: pc.localDescription },
          });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } else if (signal.type === 'candidate' && signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.warn('Error handling WebRTC signal:', err);
      }
    };

    // Peer left voice
    const handlePeerLeft = (data: { playerId: string; socketId: string }) => {
      const peer = peersRef.current.get(data.socketId);
      if (peer) {
        peer.pc.close();
        if (peer.audioEl) {
          peer.audioEl.srcObject = null;
          peer.audioEl.remove();
        }
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
        [data.playerId]: data.isSpeaking,
      }));
    };

    // Peer mute state
    const handlePlayerState = (data: { playerId: string; isMuted: boolean }) => {
      setMutedPeers((prev) => ({
        ...prev,
        [data.playerId]: data.isMuted,
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
  }, [socket, roomCode, isVoiceActive, createPeer]);

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
