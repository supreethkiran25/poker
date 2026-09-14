import type { Server, Socket } from 'socket.io';
import {
  CreateRoomSchema,
  JoinRoomSchema,
  LeaveRoomSchema,
  PlayerReadySchema,
  StartGameSchema,
  GameActionSchema,
  ChatMessageSchema,
  ReactionSchema,
  UpdateConfigSchema,
  KickPlayerSchema,
  type ChatMessage,
  type ReactionItem,
} from '@poker/shared';
import { roomManager, type Room } from '../rooms/room-manager.js';
import { authenticateSession, type AuthenticatedPlayer } from '../auth/session.js';

interface SocketSessionData {
  player: AuthenticatedPlayer;
  currentRoomCode?: string;
  lastMessageTime?: number;
  messageCount?: number;
  chatCount?: number;
  reactionCount?: number;
}

export function registerSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    // Session state attached to socket
    const sessionData: SocketSessionData = {
      player: authenticateSession(),
      messageCount: 0,
      chatCount: 0,
      reactionCount: 0,
    };

    // Helper: broadcast personalized game state so no hole cards are leaked!
    const broadcastGameState = (room: Room) => {
      for (const player of room.players.values()) {
        if (player.socketId) {
          const personalizedState = room.getGamePublicState(player.id);
          io.to(player.socketId).emit('game:state', personalizedState);
        }
      }
      // Send masked state to non-player spectators in the room
      const spectatorState = room.getGamePublicState('spectator');
      socket.to(`room:${room.code}`).emit('game:spectatorState', spectatorState);
    };

    const broadcastRoomState = (room: Room) => {
      io.to(`room:${room.code}`).emit('room:state', room.getPublicState());
    };

    // Rate limiter helper
    const checkRateLimit = (): boolean => {
      const now = Date.now();
      if (!sessionData.lastMessageTime || now - sessionData.lastMessageTime > 1000) {
        sessionData.lastMessageTime = now;
        sessionData.messageCount = 1;
        return true;
      }
      sessionData.messageCount = (sessionData.messageCount || 0) + 1;
      if (sessionData.messageCount > 20) {
        socket.emit('error:notification', {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please slow down.',
        });
        return false;
      }
      return true;
    };

    // 1. Session Auth / Handshake
    socket.on('auth:handshake', (payload: unknown) => {
      try {
        const data = payload as { sessionToken?: string; name?: string; avatar?: string };
        sessionData.player = authenticateSession(data.sessionToken, data.name, data.avatar);
        socket.emit('auth:success', {
          playerId: sessionData.player.playerId,
          sessionToken: sessionData.player.sessionToken,
          name: sessionData.player.name,
          avatar: sessionData.player.avatar,
        });
      } catch (err: any) {
        socket.emit('error:notification', { code: 'AUTH_ERROR', message: err.message });
      }
    });

    // 2. Create Room
    socket.on('room:create', (payload: unknown) => {
      if (!checkRateLimit()) return;
      const parsed = CreateRoomSchema.safeParse(payload);
      if (!parsed.success) {
        socket.emit('error:notification', {
          code: 'INVALID_PAYLOAD',
          message: parsed.error.issues[0].message,
        });
        return;
      }

      sessionData.player.name = parsed.data.hostName;
      sessionData.player.avatar = parsed.data.avatar;

      const room = roomManager.createRoom(
        sessionData.player.playerId,
        sessionData.player.name,
        sessionData.player.avatar,
        parsed.data.config
      );

      sessionData.currentRoomCode = room.code;
      socket.join(`room:${room.code}`);
      room.setPlayerConnection(sessionData.player.playerId, true, socket.id);

      room.onStateChanged = () => {
        broadcastGameState(room);
        broadcastRoomState(room);
      };

      socket.emit('room:created', {
        roomCode: room.code,
        roomState: room.getPublicState(),
        gameState: room.getGamePublicState(sessionData.player.playerId),
      });

      broadcastRoomState(room);
    });

    // 3. Join Room
    socket.on('room:join', (payload: unknown) => {
      if (!checkRateLimit()) return;
      const parsed = JoinRoomSchema.safeParse(payload);
      if (!parsed.success) {
        socket.emit('error:notification', {
          code: 'INVALID_PAYLOAD',
          message: parsed.error.issues[0].message,
        });
        return;
      }

      const room = roomManager.getRoomByCode(parsed.data.roomCode);
      if (!room) {
        socket.emit('error:notification', {
          code: 'ROOM_NOT_FOUND',
          message: 'Room not found. Check the code and try again.',
        });
        return;
      }

      // Re-authenticate or update session
      sessionData.player = authenticateSession(
        parsed.data.sessionToken,
        parsed.data.playerName,
        parsed.data.avatar
      );

      try {
        room.addPlayer(
          sessionData.player.playerId,
          sessionData.player.name,
          sessionData.player.avatar
        );
        room.setPlayerConnection(sessionData.player.playerId, true, socket.id);
        sessionData.currentRoomCode = room.code;
        socket.join(`room:${room.code}`);

        room.onStateChanged = () => {
          broadcastGameState(room);
          broadcastRoomState(room);
        };

        socket.emit('room:joined', {
          roomCode: room.code,
          roomState: room.getPublicState(),
          gameState: room.getGamePublicState(sessionData.player.playerId),
          sessionToken: sessionData.player.sessionToken,
          playerId: sessionData.player.playerId,
        });

        broadcastRoomState(room);
        broadcastGameState(room);
      } catch (err: any) {
        socket.emit('error:notification', { code: 'JOIN_FAILED', message: err.message });
      }
    });

    // 4. Ready Check
    socket.on('player:ready', (payload: unknown) => {
      if (!checkRateLimit()) return;
      const parsed = PlayerReadySchema.safeParse(payload);
      if (!parsed.success) return;

      const room = roomManager.getRoomByCode(parsed.data.roomCode);
      if (!room) return;

      room.setPlayerReady(sessionData.player.playerId, parsed.data.ready);
      broadcastRoomState(room);
    });

    // 5. Start Game (Host only)
    socket.on('game:start', (payload: unknown) => {
      if (!checkRateLimit()) return;
      const parsed = StartGameSchema.safeParse(payload);
      if (!parsed.success) return;

      const room = roomManager.getRoomByCode(parsed.data.roomCode);
      if (!room) return;

      if (room.hostId !== sessionData.player.playerId) {
        socket.emit('error:notification', {
          code: 'UNAUTHORIZED',
          message: 'Only the host can start the game.',
        });
        return;
      }

      try {
        room.startGame();
        broadcastRoomState(room);
        broadcastGameState(room);
      } catch (err: any) {
        socket.emit('error:notification', { code: 'START_FAILED', message: err.message });
      }
    });

    // 6. Game Action (Betting)
    socket.on('game:action', (payload: unknown) => {
      if (!checkRateLimit()) return;
      const parsed = GameActionSchema.safeParse(payload);
      if (!parsed.success) {
        socket.emit('error:notification', {
          code: 'INVALID_ACTION',
          message: parsed.error.issues[0].message,
        });
        return;
      }

      const room = roomManager.getRoomByCode(parsed.data.roomCode);
      if (!room) return;

      const res = room.handlePlayerAction(
        sessionData.player.playerId,
        parsed.data.actionId,
        parsed.data.type,
        parsed.data.amount
      );

      if (!res.success) {
        socket.emit('error:notification', {
          code: 'ILLEGAL_ACTION',
          message: res.error || 'Illegal action',
        });
        return;
      }

      broadcastGameState(room);
      broadcastRoomState(room);
    });

    // 7. Room Chat
    socket.on('game:chat', (payload: unknown) => {
      if (!checkRateLimit()) return;
      const parsed = ChatMessageSchema.safeParse(payload);
      if (!parsed.success) return;

      const room = roomManager.getRoomByCode(parsed.data.roomCode);
      if (!room || !room.config.chatEnabled) return;

      const chatMsg: ChatMessage = {
        id: crypto.randomUUID(),
        playerId: sessionData.player.playerId,
        playerName: sessionData.player.name,
        message: parsed.data.message,
        timestamp: Date.now(),
      };

      room.chatMessages.push(chatMsg);
      if (room.chatMessages.length > 100) room.chatMessages.shift();

      io.to(`room:${room.code}`).emit('chat:message', chatMsg);
    });

    // 8. Reactions
    socket.on('game:reaction', (payload: unknown) => {
      if (!checkRateLimit()) return;
      const parsed = ReactionSchema.safeParse(payload);
      if (!parsed.success) return;

      const room = roomManager.getRoomByCode(parsed.data.roomCode);
      if (!room || !room.config.reactionsEnabled) return;

      const reactionItem: ReactionItem = {
        id: crypto.randomUUID(),
        playerId: sessionData.player.playerId,
        playerName: sessionData.player.name,
        reaction: parsed.data.reaction,
        timestamp: Date.now(),
      };

      io.to(`room:${room.code}`).emit('reaction:received', reactionItem);
    });

    // 9. Rematch
    socket.on('game:rematch', (payload: unknown) => {
      if (!checkRateLimit()) return;
      const room = roomManager.getRoomByCode(sessionData.currentRoomCode || '');
      if (!room) return;

      if (room.hostId !== sessionData.player.playerId) {
        socket.emit('error:notification', {
          code: 'UNAUTHORIZED',
          message: 'Only the host can start a rematch.',
        });
        return;
      }

      try {
        room.startGame();
        broadcastRoomState(room);
        broadcastGameState(room);
      } catch (err: any) {
        socket.emit('error:notification', { code: 'REMATCH_FAILED', message: err.message });
      }
    });

    // 10. Voice Signaling (WebRTC Mesh Audio)
    socket.on('voice:join', (payload: { roomCode: string }) => {
      const roomCode = payload?.roomCode?.toUpperCase();
      if (!roomCode) return;
      const room = roomManager.getRoomByCode(roomCode);
      if (!room) return;

      // Join voice room
      socket.join(`voice:${roomCode}`);

      // Notify others in room
      socket.to(`voice:${roomCode}`).emit('voice:peer-joined', {
        playerId: sessionData.player.playerId,
        socketId: socket.id,
      });

      // Send existing peers in this voice room to the joiner
      const voiceRoom = io.sockets.adapter.rooms.get(`voice:${roomCode}`);
      const peers: { playerId: string; socketId: string }[] = [];
      if (voiceRoom) {
        for (const peerSocketId of voiceRoom) {
          if (peerSocketId !== socket.id) {
            const peerSocket = io.sockets.sockets.get(peerSocketId);
            const peerPlayerId = (peerSocket as any)?.__playerId || peerSocketId;
            peers.push({ playerId: peerPlayerId, socketId: peerSocketId });
          }
        }
      }
      (socket as any).__playerId = sessionData.player.playerId;
      socket.emit('voice:peers', { peers });
    });

    socket.on('voice:signal', (payload: { toSocketId: string; signal: any }) => {
      if (!payload?.toSocketId || !payload.signal) return;
      io.to(payload.toSocketId).emit('voice:signal', {
        fromPlayerId: sessionData.player.playerId,
        fromSocketId: socket.id,
        signal: payload.signal,
      });
    });

    socket.on('voice:speaking', (payload: { roomCode: string; isSpeaking: boolean }) => {
      const roomCode = payload?.roomCode?.toUpperCase();
      if (!roomCode) return;
      io.to(`voice:${roomCode}`).emit('voice:player-speaking', {
        playerId: sessionData.player.playerId,
        isSpeaking: !!payload.isSpeaking,
      });
    });

    socket.on('voice:state', (payload: { roomCode: string; isMuted: boolean }) => {
      const roomCode = payload?.roomCode?.toUpperCase();
      if (!roomCode) return;
      io.to(`voice:${roomCode}`).emit('voice:player-state', {
        playerId: sessionData.player.playerId,
        isMuted: !!payload.isMuted,
      });
    });

    socket.on('voice:leave', (payload: { roomCode: string }) => {
      const roomCode = payload?.roomCode?.toUpperCase();
      if (!roomCode) return;
      socket.leave(`voice:${roomCode}`);
      socket.to(`voice:${roomCode}`).emit('voice:peer-left', {
        playerId: sessionData.player.playerId,
        socketId: socket.id,
      });
    });

    // 11. Disconnect Handler
    socket.on('disconnect', () => {
      if (sessionData.currentRoomCode) {
        const room = roomManager.getRoomByCode(sessionData.currentRoomCode);
        if (room) {
          room.setPlayerConnection(sessionData.player.playerId, false);
          broadcastRoomState(room);
          broadcastGameState(room);
        }
        // Also notify voice room on disconnect
        socket.to(`voice:${sessionData.currentRoomCode}`).emit('voice:peer-left', {
          playerId: sessionData.player.playerId,
          socketId: socket.id,
        });
      }
    });
  });
}
