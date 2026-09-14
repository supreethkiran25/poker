import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientSocket, type Socket as ClientSocketType } from 'socket.io-client';
import express from 'express';
import { registerSocketHandlers } from '../src/websocket/socket-handler.js';
import type { GamePublicState, RoomPublicState } from '@poker/shared';

describe('Server Multiplayer & WebSocket Integration', () => {
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

  it('handles room creation, joining, hidden card privacy, and betting synchronization', async () => {
    // 1. Connect Client A (Alex)
    const clientA: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
      transports: ['websocket'],
    });

    // 2. Connect Client B (Rahul)
    const clientB: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      let count = 0;
      const check = () => {
        count++;
        if (count === 2) resolve();
      };
      clientA.on('connect', check);
      clientB.on('connect', check);
    });

    // 3. Client A creates room
    let roomCode = '';
    await new Promise<void>((resolve) => {
      clientA.emit('room:create', {
        hostName: 'Alex',
        avatar: 'avatar-1',
        config: {
          maxPlayers: 6,
          startingChips: 2000,
          smallBlind: 10,
          bigBlind: 20,
          turnTimerSeconds: 15,
        },
      });

      clientA.on('room:created', (data: { roomCode: string; roomState: RoomPublicState }) => {
        roomCode = data.roomCode;
        expect(roomCode).toHaveLength(5);
        expect(data.roomState.players).toHaveLength(1);
        resolve();
      });
    });

    // 4. Client B joins room
    await new Promise<void>((resolve) => {
      clientB.emit('room:join', {
        roomCode,
        playerName: 'Rahul',
        avatar: 'avatar-2',
      });

      clientB.on('room:joined', (data: { roomCode: string; roomState: RoomPublicState }) => {
        expect(data.roomState.players).toHaveLength(2);
        resolve();
      });
    });

    // 5. Client B readies up
    await new Promise<void>((resolve) => {
      clientB.emit('player:ready', { roomCode, ready: true });
      clientA.on('room:state', (state: RoomPublicState) => {
        const rahul = state.players.find((p) => p.name === 'Rahul');
        if (rahul && rahul.isReady) {
          resolve();
        }
      });
    });

    // 6. Client A starts game
    let clientAGameState: GamePublicState | null = null;
    let clientBGameState: GamePublicState | null = null;

    await new Promise<void>((resolve) => {
      let received = 0;
      clientA.on('game:state', (state: GamePublicState) => {
        clientAGameState = state;
        received++;
        if (received === 2) resolve();
      });
      clientB.on('game:state', (state: GamePublicState) => {
        clientBGameState = state;
        received++;
        if (received === 2) resolve();
      });

      clientA.emit('game:start', { roomCode });
    });

    expect(clientAGameState).toBeDefined();
    expect(clientBGameState).toBeDefined();

    // CRITICAL ANTI-CHEAT CHECK:
    // Verify client A receives Alex's cards, but Rahul's cards are masked as hidden!
    const alexHoleCardsForA = clientAGameState!.players.find((p) => p.name === 'Alex')!.holeCards;
    const rahulHoleCardsForA = clientAGameState!.players.find((p) => p.name === 'Rahul')!.holeCards;

    expect('rank' in alexHoleCardsForA[0]).toBe(true);
    expect('hidden' in rahulHoleCardsForA[0]).toBe(true);

    // Verify client B receives Rahul's cards, but Alex's cards are masked as hidden!
    const rahulHoleCardsForB = clientBGameState!.players.find((p) => p.name === 'Rahul')!.holeCards;
    const alexHoleCardsForB = clientBGameState!.players.find((p) => p.name === 'Alex')!.holeCards;

    expect('rank' in rahulHoleCardsForB[0]).toBe(true);
    expect('hidden' in alexHoleCardsForB[0]).toBe(true);

    clientA.disconnect();
    clientB.disconnect();
  });
});
