import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  RoomPublicState,
  GamePublicState,
  ChatMessage,
  ReactionItem,
  ActionType,
  RoomConfig,
} from '@poker/shared';
import { soundManager } from '../audio/sound-manager.js';

export interface FloatingReaction extends ReactionItem {
  key: string;
}

export interface TableAlert {
  id: string;
  type: 'INFO' | 'LEAVE' | 'DISCONNECT' | 'RECONNECT' | 'REBUY';
  message: string;
  timestamp: number;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomPublicState | null>(null);
  const [gameState, setGameState] = useState<GamePublicState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const [tableAlerts, setTableAlerts] = useState<TableAlert[]>([]);

  const [playerId, setPlayerId] = useState<string>(() => localStorage.getItem('poker_player_id') || '');
  const [sessionToken, setSessionToken] = useState<string>(() => localStorage.getItem('poker_session_token') || '');
  const [playerName, setPlayerName] = useState<string>(() => localStorage.getItem('poker_player_name') || 'Player');
  const [avatar, setAvatar] = useState<string>(() => localStorage.getItem('poker_avatar') || 'avatar-1');

  // Track turn to play sound only on transition to my turn
  const prevIsTurnRef = useRef(false);

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Handshake with stored token
      const token = localStorage.getItem('poker_session_token');
      const name = localStorage.getItem('poker_player_name');
      const av = localStorage.getItem('poker_avatar');
      socket.emit('auth:handshake', { sessionToken: token, name, avatar: av });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('auth:success', (data: { playerId: string; sessionToken: string; name: string; avatar: string }) => {
      setPlayerId(data.playerId);
      setSessionToken(data.sessionToken);
      setPlayerName(data.name);
      setAvatar(data.avatar);
      localStorage.setItem('poker_player_id', data.playerId);
      localStorage.setItem('poker_session_token', data.sessionToken);
      localStorage.setItem('poker_player_name', data.name);
      localStorage.setItem('poker_avatar', data.avatar);
    });

    socket.on('room:created', (data: { roomCode: string; roomState: RoomPublicState; gameState: GamePublicState }) => {
      setRoomState(data.roomState);
      setGameState(data.gameState);
      window.history.pushState({}, '', `/room/${data.roomCode}`);
    });

    socket.on('room:joined', (data: { roomCode: string; roomState: RoomPublicState; gameState: GamePublicState; sessionToken: string; playerId: string }) => {
      setRoomState(data.roomState);
      setGameState(data.gameState);
      setSessionToken(data.sessionToken);
      setPlayerId(data.playerId);
      localStorage.setItem('poker_session_token', data.sessionToken);
      localStorage.setItem('poker_player_id', data.playerId);
      window.history.pushState({}, '', `/room/${data.roomCode}`);
    });

    socket.on('room:state', (state: RoomPublicState) => {
      setRoomState(state);
    });

    socket.on('game:state', (state: GamePublicState) => {
      setGameState(state);

      // Sound triggers
      const me = state.players.find((p) => p.id === localStorage.getItem('poker_player_id'));
      if (me?.isTurn && !prevIsTurnRef.current) {
        soundManager.playTurnAlert();
      }
      prevIsTurnRef.current = me?.isTurn ?? false;

      if (state.phase === 'HAND_COMPLETE' && state.lastHandResult) {
        soundManager.playWin();
      }
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-49), msg]);
    });

    socket.on('reaction:received', (reaction: ReactionItem) => {
      const key = `${reaction.id}-${Date.now()}`;
      setFloatingReactions((prev) => [...prev, { ...reaction, key }]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.key !== key));
      }, 2500);
    });

    socket.on('table:alert', (alert: { id: string; type: any; message: string }) => {
      const item: TableAlert = { ...alert, timestamp: Date.now() };
      setTableAlerts((prev) => [...prev.slice(-3), item]);
      setTimeout(() => {
        setTableAlerts((prev) => prev.filter((a) => a.id !== alert.id));
      }, 5000);
    });

    socket.on('error:notification', (err: { code: string; message: string }) => {
      setErrorNotification(err.message);
      setTimeout(() => setErrorNotification(null), 4000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const rebuyChips = useCallback((amount?: number) => {
    if (!socketRef.current || !roomState) return;
    socketRef.current.emit('player:rebuy', {
      roomCode: roomState.code,
      amount,
    });
  }, [roomState]);

  const readyForNextHand = useCallback((ready: boolean = true) => {
    if (!socketRef.current || !roomState) return;
    socketRef.current.emit('player:ready-next', {
      roomCode: roomState.code,
      ready,
    });
  }, [roomState]);

  const dealNextHand = useCallback(() => {
    if (!socketRef.current || !roomState) return;
    socketRef.current.emit('game:next-hand', {
      roomCode: roomState.code,
    });
  }, [roomState]);

  const updateRoomConfig = useCallback((config: Partial<RoomConfig>) => {
    if (!socketRef.current || !roomState) return;
    socketRef.current.emit('room:update-config', {
      roomCode: roomState.code,
      config: { ...roomState.config, ...config },
    });
  }, [roomState]);

  const createRoom = useCallback(
    (hostName: string, config?: RoomConfig, selectedAvatar?: string, buyIn?: number) => {
      if (!socketRef.current) return;
      const av = selectedAvatar || avatar;
      setPlayerName(hostName);
      setAvatar(av);
      localStorage.setItem('poker_player_name', hostName);
      localStorage.setItem('poker_avatar', av);

      socketRef.current.emit('room:create', {
        hostName,
        avatar: av,
        config,
        buyIn,
      });
    },
    [avatar]
  );

  const joinRoom = useCallback(
    (roomCode: string, name: string, selectedAvatar?: string, buyIn?: number) => {
      if (!socketRef.current) return;
      const av = selectedAvatar || avatar;
      const token = localStorage.getItem('poker_session_token');
      setPlayerName(name);
      setAvatar(av);
      localStorage.setItem('poker_player_name', name);
      localStorage.setItem('poker_avatar', av);

      socketRef.current.emit('room:join', {
        roomCode: roomCode.trim().toUpperCase(),
        playerName: name,
        avatar: av,
        sessionToken: token || undefined,
        buyIn,
      });
    },
    [avatar]
  );

  const leaveRoom = useCallback(() => {
    if (!socketRef.current || !roomState) return;
    socketRef.current.emit('room:leave', { roomCode: roomState.code });
    setRoomState(null);
    setGameState(null);
    window.history.pushState({}, '', '/');
  }, [roomState]);

  const toggleReady = useCallback((ready: boolean) => {
    if (!socketRef.current || !roomState) return;
    socketRef.current.emit('player:ready', { roomCode: roomState.code, ready });
  }, [roomState]);

  const startGame = useCallback(() => {
    if (!socketRef.current || !roomState) return;
    socketRef.current.emit('game:start', { roomCode: roomState.code });
  }, [roomState]);

  const sendAction = useCallback((type: ActionType, amount?: number) => {
    if (!socketRef.current || !roomState) return;
    const actionId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    if (type === 'check') soundManager.playCheck();
    else if (type === 'fold') soundManager.playFold();
    else soundManager.playChips();

    socketRef.current.emit('game:action', {
      roomCode: roomState.code,
      actionId,
      type,
      amount,
    });
  }, [roomState]);

  const sendChat = useCallback((message: string) => {
    if (!socketRef.current || !roomState || !message.trim()) return;
    socketRef.current.emit('game:chat', {
      roomCode: roomState.code,
      message: message.trim(),
    });
  }, [roomState]);

  const sendReaction = useCallback((reaction: string) => {
    if (!socketRef.current || !roomState) return;
    socketRef.current.emit('game:reaction', {
      roomCode: roomState.code,
      reaction,
    });
  }, [roomState]);

  const rematch = useCallback(() => {
    if (!socketRef.current || !roomState) return;
    socketRef.current.emit('game:rematch', { roomCode: roomState.code });
  }, [roomState]);

  return {
    isConnected,
    playerId,
    sessionToken,
    playerName,
    avatar,
    roomState,
    gameState,
    chatMessages,
    floatingReactions,
    errorNotification,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
    sendAction,
    sendChat,
    sendReaction,
    rematch,
    rebuyChips,
    readyForNextHand,
    dealNextHand,
    updateRoomConfig,
    tableAlerts,
    socket: socketRef.current,
  };
}
