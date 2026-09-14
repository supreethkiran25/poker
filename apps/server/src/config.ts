import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  SQLITE_PATH: process.env.SQLITE_PATH || './poker.sqlite',
  SESSION_SECRET: process.env.SESSION_SECRET || 'poker-session-super-secret-key-2026',
  REDIS_URL: process.env.REDIS_URL,
};
