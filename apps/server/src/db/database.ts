import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { CONFIG } from '../config.js';
import type { RoomConfig, HandResult, Card } from '@poker/shared';

let db: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!db) {
    const dbPath = path.resolve(CONFIG.SQLITE_PATH);
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new DatabaseSync(dbPath);
    initDatabase(db);
  }
  return db;
}

function initDatabase(database: DatabaseSync): void {
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS sessions (
      session_token TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_active_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      host_player_id TEXT NOT NULL,
      config TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hands (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      hand_number INTEGER NOT NULL,
      dealer_seat INTEGER NOT NULL,
      community_cards TEXT NOT NULL,
      total_pot INTEGER NOT NULL,
      winners TEXT NOT NULL,
      showdown_hands TEXT DEFAULT '[]',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS player_stats (
      player_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      hands_played INTEGER NOT NULL DEFAULT 0,
      hands_won INTEGER NOT NULL DEFAULT 0,
      biggest_pot_won INTEGER NOT NULL DEFAULT 0,
      total_chips_won INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export interface PlayerSessionRecord {
  session_token: string;
  player_id: string;
  display_name: string;
  avatar: string;
  created_at: number;
  last_active_at: number;
}

export function saveSession(
  sessionToken: string,
  playerId: string,
  displayName: string,
  avatar: string
): PlayerSessionRecord {
  const database = getDatabase();
  const now = Date.now();
  const stmt = database.prepare(`
    INSERT INTO sessions (session_token, player_id, display_name, avatar, created_at, last_active_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(session_token) DO UPDATE SET
      display_name = excluded.display_name,
      avatar = excluded.avatar,
      last_active_at = excluded.last_active_at
  `);
  stmt.run(sessionToken, playerId, displayName, avatar, now, now);
  return {
    session_token: sessionToken,
    player_id: playerId,
    display_name: displayName,
    avatar,
    created_at: now,
    last_active_at: now,
  };
}

export function getSession(sessionToken: string): PlayerSessionRecord | null {
  const database = getDatabase();
  const stmt = database.prepare(`SELECT * FROM sessions WHERE session_token = ?`);
  const row = stmt.get(sessionToken) as PlayerSessionRecord | undefined;
  return row || null;
}

export function recordHandHistory(
  handId: string,
  roomId: string,
  handNumber: number,
  dealerSeat: number,
  communityCards: Card[],
  totalPot: number,
  winners: HandResult['winners'],
  showdownHands: HandResult['showdownHands'] = []
): void {
  const database = getDatabase();
  try {
    database.exec(`ALTER TABLE hands ADD COLUMN showdown_hands TEXT DEFAULT '[]';`);
  } catch {
    // Column already exists
  }
  const stmt = database.prepare(`
    INSERT INTO hands (id, room_id, hand_number, dealer_seat, community_cards, total_pot, winners, showdown_hands, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    handId,
    roomId,
    handNumber,
    dealerSeat,
    JSON.stringify(communityCards),
    totalPot,
    JSON.stringify(winners),
    JSON.stringify(showdownHands),
    Date.now()
  );
}

export function getRecentHands(roomId: string, limit: number = 10): any[] {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM hands WHERE room_id = ? ORDER BY created_at DESC LIMIT ?
  `);
  const rows = stmt.all(roomId, limit) as any[];
  return rows.map((r) => ({
    ...r,
    community_cards: JSON.parse(r.community_cards),
    winners: JSON.parse(r.winners),
    showdown_hands: r.showdown_hands ? JSON.parse(r.showdown_hands) : [],
  }));
}
