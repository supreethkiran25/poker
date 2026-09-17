import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { CONFIG } from './config.js';
import { registerSocketHandlers } from './websocket/socket-handler.js';
import { roomManager } from './rooms/room-manager.js';
import { getRecentHands } from './db/database.js';

const app = express();
const server = http.createServer(app);

// Dynamic origin validator for local network and dev devices
const isAllowedOrigin = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => {
  if (!origin) return callback(null, true);
  if (
    CONFIG.NODE_ENV === 'development' ||
    origin === CONFIG.CLIENT_ORIGIN ||
    origin === 'http://localhost:5173' ||
    origin === 'https://localhost:5173' ||
    origin === 'http://127.0.0.1:5173' ||
    origin === 'https://127.0.0.1:5173' ||
    /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)
  ) {
    return callback(null, true);
  }
  return callback(null, false);
};

// CORS
app.use(
  cors({
    origin: isAllowedOrigin,
    credentials: true,
  })
);

app.use(express.json());

// Health & Keep-alive endpoint for Render (placed before rate limiting so tab pings are never blocked)
app.get(['/health', '/api/keep-alive'], (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});

// Basic API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Room verification endpoint (for landing page / invite links)
app.get('/api/rooms/:code', (req, res) => {
  const room = roomManager.getRoomByCode(req.params.code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  return res.json({
    code: room.code,
    status: room.getPublicState().status,
    playerCount: room.players.size,
    maxPlayers: room.config.maxPlayers,
    startingChips: room.config.startingChips,
    smallBlind: room.config.smallBlind,
    bigBlind: room.config.bigBlind,
  });
});

// Room hand history
app.get('/api/rooms/:code/history', (req, res) => {
  const room = roomManager.getRoomByCode(req.params.code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  const history = getRecentHands(room.id, 20);
  return res.json({ history });
});

// Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: isAllowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 30000,
  pingInterval: 10000,
});

registerSocketHandlers(io);

// Serve static frontend files if built
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDistPath = path.resolve(__dirname, '../../web/dist');

if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
      return next();
    }
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

server.listen(CONFIG.PORT, () => {
  console.log(`[Poker Server] Running on port ${CONFIG.PORT} in ${CONFIG.NODE_ENV} mode`);
});

export { app, server, io };
