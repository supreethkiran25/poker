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
  AddBotSchema,
  RemoveBotSchema,
  FillBotsSchema,
  ClearBotsSchema,
  DEFAULT_ROOM_CONFIG,
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
        parsed.data.config,
        parsed.data.buyIn
      );

      sessionData.currentRoomCode = room.code;
      socket.join(`room:${room.code}`);
      room.setPlayerConnection(sessionData.player.playerId, true, socket.id);

      room.onStateChanged = () => {
        broadcastGameState(room);
        broadcastRoomState(room);
      };

      room.onChatMessage = (msg) => {
        io.to(`room:${room.code}`).emit('chat:message', msg);
      };

      socket.emit('room:created', {
        roomCode: room.code,
        roomState: room.getPublicState(),
        gameState: room.getGamePublicState(sessionData.player.playerId),
      });

      broadcastRoomState(room);
    });

    // 2b. Quick Play with Bots (1-Click Instant Game)
    socket.on('room:quick-play-bots', (payload: unknown) => {
      if (!checkRateLimit()) return;

      const data = (payload && typeof payload === 'object') ? (payload as Record<string, any>) : {};
      const playerName =
        typeof data.playerName === 'string' && data.playerName.trim()
          ? data.playerName.trim()
          : sessionData.player.name || 'Player';
      const avatar = typeof data.avatar === 'string' ? data.avatar : sessionData.player.avatar;

      sessionData.player.name = playerName;
      sessionData.player.avatar = avatar;

      // Leave current room if already in one
      if (sessionData.currentRoomCode) {
        const oldRoom = roomManager.getRoomByCode(sessionData.currentRoomCode);
        if (oldRoom) {
          oldRoom.removePlayer(sessionData.player.playerId);
          socket.leave(`room:${oldRoom.code}`);
          broadcastRoomState(oldRoom);
          broadcastGameState(oldRoom);
        }
      }

      const difficulty =
        typeof data.difficulty === 'string' &&
        ['easy', 'medium', 'hard', 'mixed'].includes(data.difficulty)
          ? (data.difficulty as any)
          : 'mixed';

      const botCount =
        typeof data.botCount === 'number' && data.botCount >= 1 && data.botCount <= 7
          ? data.botCount
          : 4;

      const totalSeats = botCount + 1;

      const room = roomManager.createRoom(
        sessionData.player.playerId,
        sessionData.player.name,
        sessionData.player.avatar,
        {
          ...DEFAULT_ROOM_CONFIG,
          smallBlind: 10,
          bigBlind: 20,
          turnTimerSeconds: 30,
          maxPlayers: Math.max(6, totalSeats),
          startingChips: 1000,
        },
        1000
      );

      sessionData.currentRoomCode = room.code;
      socket.join(`room:${room.code}`);
      room.setPlayerConnection(sessionData.player.playerId, true, socket.id);

      room.onStateChanged = () => {
        broadcastGameState(room);
        broadcastRoomState(room);
      };

      room.onChatMessage = (msg) => {
        io.to(`room:${room.code}`).emit('chat:message', msg);
      };

      // Fill with bots of chosen difficulty (e.g. 1 human + N bots)
      room.fillBots(totalSeats, difficulty);

      // Start the hand immediately so user lands directly at live felt
      try {
        room.startGame();
      } catch (err: any) {
        console.error('Failed to auto-start quick play bots game:', err);
      }

      socket.emit('room:created', {
        roomCode: room.code,
        roomState: room.getPublicState(),
        gameState: room.getGamePublicState(sessionData.player.playerId),
      });

      broadcastRoomState(room);
      broadcastGameState(room);
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
          sessionData.player.avatar,
          undefined,
          parsed.data.buyIn
        );
        room.setPlayerConnection(sessionData.player.playerId, true, socket.id);
        sessionData.currentRoomCode = room.code;
        socket.join(`room:${room.code}`);

        room.onStateChanged = () => {
          broadcastGameState(room);
          broadcastRoomState(room);
        };

        room.onChatMessage = (msg) => {
          io.to(`room:${room.code}`).emit('chat:message', msg);
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

    // 4b. Update Room Config (Host only)
    socket.on('room:update-config', (payload: unknown) => {
      if (!checkRateLimit()) return;
      const parsed = UpdateConfigSchema.safeParse(payload);
      if (!parsed.success) return;

      const room = roomManager.getRoomByCode(parsed.data.roomCode);
      if (!room || room.hostId !== sessionData.player.playerId) return;

      room.config = { ...room.config, ...parsed.data.config };
      broadcastRoomState(room);
      broadcastGameState(room);
      io.to(`room:${room.code}`).emit('table:alert', {
        id: crypto.randomUUID(),
        type: 'INFO',
        message: '⚙️ Table settings updated by host',
      });
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

    // 9b. Bot Management (Add, Remove, Fill, Clear)
    socket.on('room:bot-add', (payload: unknown) => {
      if (!checkRateLimit()) return;
      const parsed = AddBotSchema.safeParse(payload);
      if (!parsed.success) return;

      const room = roomManager.getRoomByCode(parsed.data.roomCode);
      if (!room) return;

      // Allow host or solo human player to add bots
      const humanCount = Array.from(room.players.values()).filter((p) => !p.isBot).length;
      if (room.hostId !== sessionData.player.playerId && humanCount > 1) {
        socket.emit('error:notification', {
          code: 'UNAUTHORIZED',
          message: 'Only the host can add bots.',
        });
        return;
      }

      try {
        const bot = room.addBot(
          parsed.data.personality,
          parsed.data.name,
          parsed.data.difficulty
        );
        broadcastRoomState(room);
        broadcastGameState(room);

        io.to(`room:${room.code}`).emit('table:alert', {
          id: crypto.randomUUID(),
          type: 'INFO',
          message: `🤖 ${bot.name} joined the table!`,
        });
      } catch (err: any) {
        socket.emit('error:notification', { code: 'ADD_BOT_FAILED', message: err.message });
      }
    });

    socket.on('room:bot-remove', (payload: unknown) => {
      if (!checkRateLimit()) return;
      const parsed = RemoveBotSchema.safeParse(payload);
      if (!parsed.success) return;

      const room = roomManager.getRoomByCode(parsed.data.roomCode);
      if (!room) return;

      const humanCount = Array.from(room.players.values()).filter((p) => !p.isBot).length;
      if (room.hostId !== sessionData.player.playerId && humanCount > 1) {
        socket.emit('error:notification', {
          code: 'UNAUTHORIZED',
          message: 'Only the host can remove bots.',
        });
        return;
      }

      try {
        const bot = room.players.get(parsed.data.botPlayerId);
        const botName = bot?.name || 'Bot';
        room.removeBot(parsed.data.botPlayerId);
        broadcastRoomState(room);
        broadcastGameState(room);

        io.to(`room:${room.code}`).emit('table:alert', {
          id: crypto.randomUUID(),
          type: 'INFO',
          message: `🤖 ${botName} left the table.`,
        });
      } catch (err: any) {
        socket.emit('error:notification', {
          code: 'REMOVE_BOT_FAILED',
          message: err.message || 'Cannot remove bot',
        });
      }
    });

    socket.on('room:bot-fill', (payload: unknown) => {
      if (!checkRateLimit()) return;
      const parsed = FillBotsSchema.safeParse(payload);
      if (!parsed.success) return;

      const room = roomManager.getRoomByCode(parsed.data.roomCode);
      if (!room) return;

      const humanCount = Array.from(room.players.values()).filter((p) => !p.isBot).length;
      if (room.hostId !== sessionData.player.playerId && humanCount > 1) {
        socket.emit('error:notification', {
          code: 'UNAUTHORIZED',
          message: 'Only the host can fill table with bots.',
        });
        return;
      }

      const added = room.fillBots(parsed.data.targetCount, parsed.data.difficulty);
      if (added.length > 0) {
        broadcastRoomState(room);
        broadcastGameState(room);

        io.to(`room:${room.code}`).emit('table:alert', {
          id: crypto.randomUUID(),
          type: 'INFO',
          message: `🤖 Added ${added.length} bot${added.length > 1 ? 's' : ''} to the table!`,
        });
      }
    });

    socket.on('room:bot-clear', (payload: unknown) => {
      if (!checkRateLimit()) return;
      const parsed = ClearBotsSchema.safeParse(payload);
      if (!parsed.success) return;

      const room = roomManager.getRoomByCode(parsed.data.roomCode);
      if (!room) return;

      const humanCount = Array.from(room.players.values()).filter((p) => !p.isBot).length;
      if (room.hostId !== sessionData.player.playerId && humanCount > 1) {
        socket.emit('error:notification', {
          code: 'UNAUTHORIZED',
          message: 'Only the host can remove bots.',
        });
        return;
      }

      room.clearBots();
      broadcastRoomState(room);
      broadcastGameState(room);

      io.to(`room:${room.code}`).emit('table:alert', {
        id: crypto.randomUUID(),
        type: 'INFO',
        message: '🤖 All bots have been removed.',
      });
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

      // Set player ID on socket immediately
      (socket as any).__playerId = sessionData.player.playerId;

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

    // 11. Leave Room
    socket.on('room:leave', (payload: unknown) => {
      if (!checkRateLimit()) return;
      const data = payload as { roomCode?: string };
      const code = (data?.roomCode || sessionData.currentRoomCode || '').toUpperCase();
      const room = roomManager.getRoomByCode(code);
      if (room) {
        const playerName = sessionData.player.name;
        room.removePlayer(sessionData.player.playerId);
        socket.leave(`room:${room.code}`);
        sessionData.currentRoomCode = undefined;

        // If no human players remain connected in the room, pause bots
        const activeHumans = Array.from(room.players.values()).filter(
          (p) => !p.isBot && p.isConnected
        );
        if (activeHumans.length === 0) {
          room.clearBotTimer();
        }

        broadcastRoomState(room);
        broadcastGameState(room);

        io.to(`room:${room.code}`).emit('table:alert', {
          id: crypto.randomUUID(),
          type: 'LEAVE',
          message: `⚠️ ${playerName} has left the table.`,
        });
      }
    });

    // 12. Player Rebuy (when chips reach 0)
    socket.on('player:rebuy', (payload: unknown) => {
      if (!checkRateLimit()) return;
      const data = payload as { roomCode?: string; amount?: number };
      const code = (data?.roomCode || sessionData.currentRoomCode || '').toUpperCase();
      const room = roomManager.getRoomByCode(code);
      if (!room) return;

      const success = room.rebuyPlayer(sessionData.player.playerId, data?.amount);
      if (success) {
        broadcastRoomState(room);
        broadcastGameState(room);

        const rebuyAmt = data?.amount || room.config.startingChips;
        io.to(`room:${room.code}`).emit('table:alert', {
          id: crypto.randomUUID(),
          type: 'REBUY',
          message: `🪙 ${sessionData.player.name} bought ₹${rebuyAmt.toLocaleString('en-IN')} chips!`,
        });
      }
    });

    // 13. Ready for Next Hand
    socket.on('player:ready-next', (payload: unknown) => {
      if (!checkRateLimit()) return;
      const data = payload as { roomCode?: string; ready: boolean };
      const code = (data?.roomCode || sessionData.currentRoomCode || '').toUpperCase();
      const room = roomManager.getRoomByCode(code);
      if (!room) return;

      const started = room.setPlayerNextHandReady(sessionData.player.playerId, !!data?.ready);
      broadcastRoomState(room);
      broadcastGameState(room);

      if (started) {
        io.to(`room:${room.code}`).emit('table:alert', {
          id: crypto.randomUUID(),
          type: 'INFO',
          message: '♠ All players ready! Dealing next hand...',
        });
      }
    });

    // 14. Host Start Next Hand
    socket.on('game:next-hand', (payload: unknown) => {
      if (!checkRateLimit()) return;
      const data = payload as { roomCode?: string };
      const code = (data?.roomCode || sessionData.currentRoomCode || '').toUpperCase();
      const room = roomManager.getRoomByCode(code);
      if (!room) return;

      if (room.hostId !== sessionData.player.playerId) {
        // Non-host player signals ready for next hand
        const started = room.setPlayerNextHandReady(sessionData.player.playerId, true);
        broadcastRoomState(room);
        if (started) {
          broadcastGameState(room);
          io.to(`room:${room.code}`).emit('table:alert', {
            id: crypto.randomUUID(),
            type: 'INFO',
            message: '♠ All players ready! Starting next hand…',
          });
        } else {
          io.to(`room:${room.code}`).emit('table:alert', {
            id: crypto.randomUUID(),
            type: 'INFO',
            message: `✓ ${sessionData.player.name} is ready for next hand`,
          });
        }
        return;
      }

      const started = room.startNextHand();
      if (started.success) {
        broadcastRoomState(room);
        broadcastGameState(room);
        io.to(`room:${room.code}`).emit('table:alert', {
          id: crypto.randomUUID(),
          type: 'INFO',
          message: '♠ Host dealt the next hand!',
        });
      } else {
        socket.emit('error:notification', {
          code: 'CANNOT_START_NEXT_HAND',
          message: started.reason || 'Cannot start next hand.',
        });
      }
    });

    // 15. Disconnect Handler
    socket.on('disconnect', () => {
      if (sessionData.currentRoomCode) {
        const room = roomManager.getRoomByCode(sessionData.currentRoomCode);
        if (room) {
          room.setPlayerConnection(sessionData.player.playerId, false);
          broadcastRoomState(room);
          broadcastGameState(room);

          io.to(`room:${room.code}`).emit('table:alert', {
            id: crypto.randomUUID(),
            type: 'DISCONNECT',
            message: `⚠️ ${sessionData.player.name} disconnected.`,
          });
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
