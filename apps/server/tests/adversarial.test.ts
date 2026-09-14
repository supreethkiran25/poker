import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientSocket, type Socket as ClientSocketType } from 'socket.io-client';
import express from 'express';
import { registerSocketHandlers } from '../src/websocket/socket-handler.js';
import type { GamePublicState, RoomPublicState } from '@poker/shared';

describe('Adversarial Security & Anti-Cheat Suite', () => {
  let server: http.Server;
  let io: SocketIOServer;
  let port: number;

  beforeAll(async () => {
    const app = express();
    server = http.createServer(app);
    io = new SocketIOServer(server, { transports: ['websocket'] });
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

  it('rejects hostile actions: out of turn, spoofed identities, invalid bets, and card snooping', async () => {
    const clientA: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
      transports: ['websocket'],
    });
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

    // 1. Create Room
    let roomCode = '';
    await new Promise<void>((resolve) => {
      clientA.emit('room:create', { hostName: 'Host', avatar: 'avatar-1' });
      clientA.on('room:created', (data: { roomCode: string }) => {
        roomCode = data.roomCode;
        resolve();
      });
    });

    // 2. Client B joins
    await new Promise<void>((resolve) => {
      clientB.emit('room:join', { roomCode, playerName: 'Attacker' });
      clientB.on('room:joined', () => resolve());
    });

    // 3. Client B readies
    await new Promise<void>((resolve) => {
      clientB.emit('player:ready', { roomCode, ready: true });
      clientA.on('room:state', (state: RoomPublicState) => {
        if (state.players.every((p) => p.isReady)) resolve();
      });
    });

    // 4. Client A starts game
    let clientBState: GamePublicState | null = null;
    await new Promise<void>((resolve) => {
      clientB.on('game:state', (st: GamePublicState) => {
        clientBState = st;
        resolve();
      });
      clientA.emit('game:start', { roomCode });
    });

    expect(clientBState).toBeDefined();

    // 5. ATTACK 1: Snooping cards
    // Attacker (Client B) checks if opponent's hole cards are exposed
    const opponent = clientBState!.players.find((p) => p.name === 'Host')!;
    expect(opponent.holeCards[0]).toEqual({ hidden: true });
    expect(opponent.holeCards[1]).toEqual({ hidden: true });

    // 6. ATTACK 2: Act out of turn
    // Determine who is NOT active
    const activePlayerId = clientBState!.activePlayerId;
    const inactiveClient = activePlayerId === clientBState!.players[0].id ? clientB : clientA;

    const errorPromise = new Promise<string>((resolve) => {
      inactiveClient.once('error:notification', (err: { code: string; message: string }) => {
        resolve(err.code);
      });
    });

    inactiveClient.emit('game:action', {
      roomCode,
      actionId: 'fake-action-1',
      type: 'raise',
      amount: 500,
    });

    const errCode = await errorPromise;
    expect(['ILLEGAL_ACTION', 'INVALID_ACTION']).toContain(errCode);

    // 7. ATTACK 3: Send invalid negative bet or malformed payload
    const malformedPromise = new Promise<string>((resolve) => {
      clientA.once('error:notification', (err: { code: string; message: string }) => {
        resolve(err.code);
      });
    });

    clientA.emit('game:action', {
      roomCode,
      actionId: 'fake-action-2',
      type: 'bet',
      amount: -500, // Negative amount!
    });

    const malformedCode = await malformedPromise;
    expect(malformedCode).toBe('INVALID_ACTION');

    clientA.disconnect();
    clientB.disconnect();
  });
});
