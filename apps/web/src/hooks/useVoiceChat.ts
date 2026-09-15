import { useEffect, useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';

interface PeerConnection {
  pc: RTCPeerConnection;
  audioEl: HTMLAudioElement;
  candidateQueue: RTCIceCandidateInit[];
  hasRemoteDescription: boolean;
  transceiver?: RTCRtpTransceiver;
  isPolite: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
  stream?: MediaStream;
}

// Multi-network ICE servers (Google STUN + Cloudflare STUN)
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
};

// In-viewport, non-suspended audio container for WebKit (macOS Safari & iOS Safari)
// Size 32x32 at opacity 0.05 prevents WebKit from classifying it as "visually idle" or "invisible",
// which would otherwise throttle or mute the audio stream.
function getAudioContainer(): HTMLElement {
  let container = document.getElementById('poker-voice-audio-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'poker-voice-audio-container';
    container.style.position = 'fixed';
    container.style.bottom = '12px';
    container.style.right = '12px';
    container.style.width = '32px';
    container.style.height = '32px';
    container.style.opacity = '0.05';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '1';
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
      'INSECURE_CONTEXT: Microphone requires HTTPS when connecting from another device (like Mac, iPhone, or Android). Please open via https://'
    );
  }

  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error('NOT_SUPPORTED: Microphone is not supported on this browser or platform.');
  }

  // Attempt 1: Standard high-fidelity voice constraints (Echo Cancellation, AGC, Noise Suppression)
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
    console.warn('getUserMedia with voice constraints failed, trying minimal audio fallback:', err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      throw err;
    }
  }

  // Attempt 2: Minimal baseline fallback (works with AirPods, Bluetooth headsets, older Safari/Android)
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

  // Global user gesture unlocker for MacBook Safari, iOS Safari, and mobile browsers.
  // When any touch, click, or key occurs, ensure all remote peer audio elements are playing.
  const unlockAllAudio = useCallback(() => {
    peersRef.current.forEach(({ audioEl }) => {
      if (audioEl) {
        audioEl.muted = false;
        audioEl.volume = 1.0;
        if (audioEl.paused) {
          audioEl.play().catch(() => {});
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

    isVoiceActiveRef.current = false;
    isMutedRef.current = true;
    setIsVoiceActive(false);
    setIsMuted(true);
    setIsSpeaking(false);
    setSpeakingPeers({});
    setMutedPeers({});
  }, []);

  // Voice Activity Detection (VAD) for visual speaking indicator
  const setupVAD = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

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

        // Speech detection thresholds
        const speechTriggerThreshold = 25;
        const speechSilenceThreshold = 16;

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
            }, 500);
          }
        }

        animFrameRef.current = requestAnimationFrame(checkAudio);
      };

      checkAudio();
    } catch (err) {
      console.warn('VAD setup failed (visual only):', err);
    }
  };

  // Create an RTCPeerConnection for a remote peer with W3C Perfect Negotiation
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
      // Deterministic politeness: exactly one peer is polite, resolving collisions seamlessly
      const isPolite = mySocketId ? mySocketId < peerSocketId : !initiator;

      const peerEntry: PeerConnection = {
        pc,
        audioEl,
        candidateQueue: [],
        hasRemoteDescription: false,
        isPolite,
        makingOffer: false,
        ignoreOffer: false,
      };

      // Add audio transceiver or attach live microphone track if already acquired
      try {
        const liveTrack = localStreamRef.current?.getAudioTracks().find((t) => t.readyState === 'live');
        if (liveTrack && localStreamRef.current) {
          peerEntry.transceiver = pc.addTransceiver(liveTrack, {
            direction: 'sendrecv',
            streams: [localStreamRef.current],
          });
        } else {
          // Pre-allocate audio transceiver in sendrecv mode without synthetic WebAudio tracks
          peerEntry.transceiver = pc.addTransceiver('audio', {
            direction: 'sendrecv',
          });
        }
      } catch (e) {
        console.warn('addTransceiver note:', e);
      }

      peersRef.current.set(peerSocketId, peerEntry);

      // W3C Perfect Negotiation: onnegotiationneeded handles offer creation
      pc.onnegotiationneeded = async () => {
        try {
          peerEntry.makingOffer = true;
          await pc.setLocalDescription();
          if (socketRef.current && pc.localDescription) {
            socketRef.current.emit('voice:signal', {
              toSocketId: peerSocketId,
              signal: { description: pc.localDescription },
            });
          }
        } catch (err) {
          console.warn('Negotiation error for peer:', peerSocketId, err);
        } finally {
          peerEntry.makingOffer = false;
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('voice:signal', {
            toSocketId: peerSocketId,
            signal: { candidate: event.candidate.toJSON() },
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
          playPromise.catch((err) => {
            console.info('Audio playback waiting for user tap/click on Safari/iOS:', err);
          });
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

      // Attach microphone track to all peer connections
      for (const [peerSocketId, peer] of peersRef.current.entries()) {
        try {
          if (peer.transceiver?.sender) {
            await peer.transceiver.sender.replaceTrack(track);
            peer.transceiver.direction = 'sendrecv';
          } else {
            peer.pc.addTrack(track, stream);
          }
        } catch (e) {
          console.warn('Failed to attach mic track to peer:', peerSocketId, e);
        }
      }

      // Notify server
      socketRef.current.emit('voice:join', { roomCode: roomCodeRef.current });
      socketRef.current.emit('voice:state', { roomCode: roomCodeRef.current, isMuted: false });
    } catch (err: any) {
      console.warn('Microphone access failed:', err);
      if (err.message?.startsWith('INSECURE_CONTEXT')) {
        setMicError('Microphone requires HTTPS when connecting from another device. Please open with https://');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Mic permission denied. Please allow microphone in browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMicError('No microphone detected on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setMicError('Microphone is in use by another application or OS.');
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
    // If microphone has not yet been acquired, acquire it now on this user click
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

    // WebRTC standard hardware track mute (instant, zero renegotiation, complete silence)
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

  // Auto-join voice room as a participant upon entering table/lobby
  useEffect(() => {
    if (!socket || !roomCode) return;

    socket.emit('voice:join', { roomCode });
    socket.emit('voice:state', { roomCode, isMuted: true });

    // Handle Socket.io reconnects: re-emit voice:join when socket reconnects
    const handleReconnect = () => {
      socket.emit('voice:join', { roomCode });
      socket.emit('voice:state', { roomCode, isMuted: isMutedRef.current });
    };

    socket.on('connect', handleReconnect);

    return () => {
      socket.off('connect', handleReconnect);
      socket.emit('voice:leave', { roomCode });
    };
  }, [socket, roomCode]);

  // Socket signaling listeners with W3C Perfect Negotiation
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

    // WebRTC signal from peer (W3C Perfect Negotiation Pattern)
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
        const description = signal.description || (signal.type === 'offer' || signal.type === 'answer' ? signal : null);
        const candidate = signal.candidate;

        if (description) {
          const offerCollision =
            description.type === 'offer' &&
            (peer.makingOffer || pc.signalingState !== 'stable');

          peer.ignoreOffer = !peer.isPolite && offerCollision;
          if (peer.ignoreOffer) {
            return;
          }

          await pc.setRemoteDescription(new RTCSessionDescription(description));
          peer.hasRemoteDescription = true;

          // Flush queued candidates
          if (peer.candidateQueue.length > 0) {
            for (const cand of peer.candidateQueue) {
              await pc.addIceCandidate(cand).catch(() => {});
            }
            peer.candidateQueue = [];
          }

          if (description.type === 'offer') {
            await pc.setLocalDescription();
            if (socketRef.current && pc.localDescription) {
              socketRef.current.emit('voice:signal', {
                toSocketId: fromSocketId,
                signal: { description: pc.localDescription },
              });
            }
          }
        } else if (candidate) {
          try {
            if (peer.hasRemoteDescription && pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
              peer.candidateQueue.push(candidate);
            }
          } catch (err) {
            if (!peer.ignoreOffer) {
              console.warn('Failed to add candidate:', err);
            }
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
