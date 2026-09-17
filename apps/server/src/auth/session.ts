import crypto from 'node:crypto';
import { saveSession, getSession, getSessionByPlayerId, type PlayerSessionRecord } from '../db/database.js';

export interface AuthenticatedPlayer {
  playerId: string;
  sessionToken: string;
  name: string;
  avatar: string;
}

export function authenticateSession(
  sessionToken?: string,
  providedName?: string,
  providedAvatar?: string,
  providedPlayerId?: string
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

  // Also check if we can restore the player's existing identity by playerId
  if (providedPlayerId) {
    const byPlayerId = getSessionByPlayerId(providedPlayerId);
    if (byPlayerId) {
      const name = providedName?.trim() || byPlayerId.display_name;
      const avatar = providedAvatar || byPlayerId.avatar;
      const token = sessionToken || byPlayerId.session_token;
      saveSession(token, byPlayerId.player_id, name, avatar);
      return {
        playerId: byPlayerId.player_id,
        sessionToken: token,
        name,
        avatar,
      };
    }
  }

  // Create session preserving providedPlayerId if provided
  const newSessionToken = sessionToken || crypto.randomUUID();
  const newPlayerId = providedPlayerId || crypto.randomUUID();
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
