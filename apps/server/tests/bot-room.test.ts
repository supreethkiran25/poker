import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientSocket, type Socket as ClientSocketType } from 'socket.io-client';
import express from 'express';
import { registerSocketHandlers } from '../src/websocket/socket-handler.js';
import { Room } from '../src/rooms/room-manager.js';
import type { RoomPublicState, GamePublicState } from '@poker/shared';

describe('Bot Integration & Automation', () => {
  let server: http.Server;
  let io: SocketIOServer;
  let port: number;

  beforeAll(async () => {
    const app = express();
    server = http.createServer(app);
    io = new SocketIOServer(server, {
      transports: ['websocket'],
    });
    registerSocketHandlers(io);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address() as any;
        port = addr.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    io.close();
    server.close();
  });

  describe('Room Bot Management (Direct)', () => {
    it('allows adding, filling, removing, and clearing bots', () => {
      const room = new Room('host-1', 'Alice', 'avatar-1');
      expect(room.players.size).toBe(1);

      // Add a single bot
      const bot = room.addBot('shark');
      expect(bot.isBot).toBe(true);
      expect(bot.isReady).toBe(true);
      expect(bot.personality).toBe('shark');
      expect(room.players.size).toBe(2);

      // Can start game with 1 human + 1 bot
      expect(room.canStartGame().canStart).toBe(true);

      // Fill bots up to 4
      const filled = room.fillBots(4);
      expect(room.players.size).toBe(4);
      expect(filled.length).toBe(2);

      // Remove specific bot
      room.removeBot(bot.id);
      expect(room.players.size).toBe(3);
      expect(room.players.has(bot.id)).toBe(false);

      // Clear remaining bots
      room.clearBots();
      expect(room.players.size).toBe(1);
      expect(Array.from(room.players.values())[0].name).toBe('Alice');
    });

    it('automates bot turns during gameplay', async () => {
      const room = new Room('host-1', 'Alice', 'avatar-1');
      const bot = room.addBot('shark');

      // Start game
      room.startGame();
      expect(room.engine.isHandInProgress()).toBe(true);

      // If active player is the bot, wait for bot action to be executed automatically
      const initialActiveId = room.engine.getActivePlayerId();
      if (initialActiveId === bot.id) {
        // Wait for bot think delay (up to 3 seconds)
        await new Promise<void>((resolve) => {
          room.onStateChanged = () => {
            if (room.engine.getActivePlayerId() !== bot.id) {
              resolve();
            }
          };
          setTimeout(resolve, 3500);
        });

        // The bot should have acted!
        const botPlayer = room.players.get(bot.id);
        expect(room.engine.getActivePlayerId() !== bot.id || room.engine.getPhase() !== 'PREFLOP').toBe(true);
      }

      room.clearBotTimer();
      room.clearTurnTimer();
      room.clearNextHandTimer();
    });
  });

  describe('WebSocket Bot Handlers', () => {
    it('handles room:bot-add and room:bot-fill via socket', async () => {
      const client: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        client.on('connect', resolve);
      });

      let roomCode = '';
      await new Promise<void>((resolve) => {
        client.emit('room:create', { hostName: 'Gamer' });
        client.on('room:created', (data: { roomCode: string }) => {
          roomCode = data.roomCode;
          resolve();
        });
      });

      // Emit bot add
      await new Promise<void>((resolve) => {
        client.emit('room:bot-add', { roomCode, personality: 'aggressive' });
        client.on('room:state', (state: RoomPublicState) => {
          const bots = state.players.filter((p) => p.isBot);
          if (bots.length >= 1) {
            expect(bots[0].isBot).toBe(true);
            expect(bots[0].personality).toBe('aggressive');
            resolve();
          }
        });
      });

      client.disconnect();
    });

    it('handles 1-click room:quick-play-bots by creating table, adding 4 bots, and starting hand immediately', async () => {
      const client: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        client.on('connect', resolve);
      });

      let createdData: { roomCode: string; roomState: RoomPublicState; gameState: GamePublicState } | null = null;
      await new Promise<void>((resolve) => {
        client.emit('room:quick-play-bots', { playerName: 'SoloPro', botCount: 4 });
        client.on('room:created', (data: any) => {
          createdData = data;
          resolve();
        });
      });

      expect(createdData).not.toBeNull();
      expect(createdData!.roomState.players.length).toBe(5);
      const bots = createdData!.roomState.players.filter((p) => p.isBot);
      expect(bots.length).toBe(4);
      expect(createdData!.gameState.phase).toBe('PREFLOP');
      expect(createdData!.gameState.players.length).toBe(5);

      client.disconnect();
    });
  });
});
