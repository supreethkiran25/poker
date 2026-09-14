import crypto from 'node:crypto';
import { saveSession, getSession, type PlayerSessionRecord } from '../db/database.js';

export interface AuthenticatedPlayer {
  playerId: string;
  sessionToken: string;
  name: string;
  avatar: string;
}

export function authenticateSession(
  sessionToken?: string,
  providedName?: string,
  providedAvatar?: string
): AuthenticatedPlayer {
  if (sessionToken) {
    const existing = getSession(sessionToken);
    if (existing) {
      // Update name/avatar if explicitly provided
      const name = providedName?.trim() || existing.display_name;
      const avatar = providedAvatar || existing.avatar;
      saveSession(existing.session_token, existing.player_id, name, avatar);
      return {
        playerId: existing.player_id,
        sessionToken: existing.session_token,
        name,
        avatar,
      };
    }
  }

  // Create brand new session
  const newSessionToken = crypto.randomUUID();
  const newPlayerId = crypto.randomUUID();
  const name = providedName?.trim() || 'Player';
  const avatar = providedAvatar || 'avatar-1';

  saveSession(newSessionToken, newPlayerId, name, avatar);

  return {
    playerId: newPlayerId,
    sessionToken: newSessionToken,
    name,
    avatar,
  };
}
