import crypto from 'node:crypto';
import {
  type RoomConfig,
  type RoomPublicState,
  type GamePublicState,
  type ActionType,
  type ChatMessage,
  type ReactionItem,
  DEFAULT_ROOM_CONFIG,
} from '@poker/shared';
import { PokerEngine } from '@poker/poker-engine';
import { recordHandHistory } from '../db/database.js';

export function generateRoomCode(): string {
  // 5 random numbers e.g. "48201"
  return crypto.randomInt(10000, 100000).toString();
}

export interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  seatIndex: number;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  chips: number;
  socketId?: string;
}

export class Room {
  public id: string;
  public code: string;
  public hostId: string;
  public config: RoomConfig;
  public players: Map<string, RoomPlayer> = new Map();
  public engine: PokerEngine;
  public createdAt: number;
  public chatMessages: ChatMessage[] = [];
  public recentActionIds: Set<string> = new Set();
  public timerHandle: NodeJS.Timeout | null = null;
  public turnExpiresAt: number | null = null;
  public nextHandReadyPlayers: Set<string> = new Set();
  public onStateChanged?: () => void;

  constructor(hostId: string, hostName: string, hostAvatar: string, config?: RoomConfig) {
    this.id = crypto.randomUUID();
    this.code = generateRoomCode();
    this.hostId = hostId;
    this.config = config ? { ...DEFAULT_ROOM_CONFIG, ...config } : { ...DEFAULT_ROOM_CONFIG };
    this.createdAt = Date.now();
    this.engine = new PokerEngine(this.config);

    // Add host as seat 0
    this.addPlayer(hostId, hostName, hostAvatar, 0, true);
  }

  public addPlayer(
    id: string,
    name: string,
    avatar: string,
    seatIndex?: number,
    isHost: boolean = false
  ): RoomPlayer {
    const existing = this.players.get(id);
    if (existing) {
      existing.name = name;
      existing.avatar = avatar;
      existing.isConnected = true;
      this.engine.setPlayerConnection(id, true);
      return existing;
    }

    if (this.players.size >= this.config.maxPlayers) {
      throw new Error('Room is full');
    }

    // Engine handles seat assignment
    const internal = this.engine.addPlayer(id, name, avatar, seatIndex);

    const player: RoomPlayer = {
      id,
      name,
      avatar,
      seatIndex: internal.seatIndex,
      isHost,
      isReady: isHost,
      isConnected: true,
      chips: internal.chips,
    };

    this.players.set(id, player);
    return player;
  }

  public removePlayer(id: string): void {
    const p = this.players.get(id);
    if (!p) return;

    this.engine.removePlayer(id);
    this.players.delete(id);

    if (p.isHost && this.players.size > 0) {
      const next = Array.from(this.players.values())[0];
      next.isHost = true;
      this.hostId = next.id;
    }
  }

  public setPlayerReady(id: string, ready: boolean): void {
    const p = this.players.get(id);
    if (p) {
      p.isReady = ready;
      this.engine.setPlayerReady(id, ready);
    }
  }

  public setPlayerConnection(id: string, isConnected: boolean, socketId?: string): void {
    const p = this.players.get(id);
    if (p) {
      p.isConnected = isConnected;
      p.socketId = socketId;
      this.engine.setPlayerConnection(id, isConnected);
    }
  }

  public canStartGame(): { canStart: boolean; reason?: string } {
    if (this.players.size < 2) {
      return { canStart: false, reason: 'Need at least 2 players to start' };
    }
    const unready = Array.from(this.players.values()).filter((p) => !p.isReady);
    if (unready.length > 0) {
      return {
        canStart: false,
        reason: `Waiting for all players to be ready (${unready.map((p) => p.name).join(', ')})`,
      };
    }
    return { canStart: true };
  }

  public startGame(): void {
    const check = this.canStartGame();
    if (!check.canStart) {
      throw new Error(check.reason);
    }

    this.engine.startHand();
    this.startTurnTimer();
  }

  public handlePlayerAction(
    playerId: string,
    actionId: string,
    type: ActionType,
    amount?: number
  ): { success: boolean; error?: string } {
    // Idempotency check
    if (this.recentActionIds.has(actionId)) {
      return { success: true };
    }

    const res = this.engine.handleAction(playerId, { type, amount });
    if (!res.success) {
      return res;
    }

    this.recentActionIds.add(actionId);
    // Limit cache size
    if (this.recentActionIds.size > 500) {
      const first = this.recentActionIds.values().next().value;
      if (first) this.recentActionIds.delete(first);
    }

    // Reset or restart timer
    this.clearTurnTimer();

    if (this.engine.isHandInProgress()) {
      this.startTurnTimer();
    } else if (this.engine.getPhase() === 'HAND_COMPLETE') {
      this.onHandFinished();
    }

    return { success: true };
  }

  private startTurnTimer(): void {
    this.clearTurnTimer();
    const activePlayerId = this.engine.getActivePlayerId();
    if (!activePlayerId) return;

    const durationMs = (this.config.turnTimerSeconds || 30) * 1000;
    this.turnExpiresAt = Date.now() + durationMs;
    this.timerHandle = setTimeout(() => {
      this.handleTurnTimeout();
    }, durationMs);
  }

  private clearTurnTimer(): void {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    this.turnExpiresAt = null;
  }

  private handleTurnTimeout(): void {
    const activePlayerId = this.engine.getActivePlayerId();
    if (!activePlayerId) return;

    // Auto-check if legal, else auto-fold
    const state = this.engine.toPublicState(activePlayerId);
    const canCheck = state.legalActions.some((a: { type: string }) => a.type === 'check');

    const actionType: ActionType = canCheck ? 'check' : 'fold';
    this.handlePlayerAction(activePlayerId, `timeout-${Date.now()}`, actionType);

    if (this.onStateChanged) {
      this.onStateChanged();
    }
  }

  private onHandFinished(): void {
    this.clearTurnTimer();
    const state = this.engine.toPublicState('system');
    if (state.lastHandResult) {
      recordHandHistory(
        crypto.randomUUID(),
        this.id,
        state.handNumber,
        state.dealerSeat,
        state.communityCards,
        state.pot,
        state.lastHandResult.winners
      );
    }

    // Hand finished: players can review results, rebuy if 0, and click Ready for Next Hand
    this.nextHandReadyPlayers.clear();
  }

  public rebuyPlayer(playerId: string, amount?: number): boolean {
    const defaultAmount = this.config.startingChips || 10000;
    const finalAmount = amount && amount > 0 ? amount : defaultAmount;
    const player = this.players.get(playerId);
    if (!player) return false;

    const added = this.engine.addChips(playerId, finalAmount);
    if (added) {
      player.chips = this.engine.getPlayer(playerId)?.chips ?? (player.chips + finalAmount);
      return true;
    }
    return false;
  }

  public setPlayerNextHandReady(playerId: string, ready: boolean): boolean {
    if (ready) {
      this.nextHandReadyPlayers.add(playerId);
    } else {
      this.nextHandReadyPlayers.delete(playerId);
    }

    // Check if all active players with chips are ready (min 2)
    const activeWithChips = this.engine.getPlayers().filter((p) => p !== null && p.chips > 0);
    if (activeWithChips.length >= 2) {
      const allReady = activeWithChips.every((p) => p && this.nextHandReadyPlayers.has(p.id));
      if (allReady && this.engine.getPhase() === 'HAND_COMPLETE') {
        const res = this.startNextHand();
        return res.success;
      }
    }
    return false;
  }

  public startNextHand(): { success: boolean; reason?: string } {
    const activeWithChips = this.engine.getPlayers().filter((p) => p !== null && p.chips > 0);
    if (activeWithChips.length < 2) {
      return {
        success: false,
        reason: 'At least 2 players must have chips. Players with 0 chips must rebuy.',
      };
    }

    this.nextHandReadyPlayers.clear();
    this.engine.startHand();
    this.startTurnTimer();
    return { success: true };
  }

  public getPublicState(): RoomPublicState {
    const enginePlayers = this.engine.getPlayers();
    const playersList = Array.from(this.players.values()).map((p) => {
      const internal = enginePlayers[p.seatIndex];
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        seatIndex: p.seatIndex,
        isHost: p.isHost,
        isReady: p.isReady,
        isConnected: p.isConnected,
        chips: internal?.chips ?? p.chips,
      };
    });

    return {
      code: this.code,
      status: this.engine.isHandInProgress() ? 'PLAYING' : 'LOBBY',
      hostId: this.hostId,
      config: this.config,
      players: playersList,
      createdAt: this.createdAt,
      nextHandReadyPlayerIds: Array.from(this.nextHandReadyPlayers),
    };
  }

  public getGamePublicState(forPlayerId: string): GamePublicState {
    const state = this.engine.toPublicState(forPlayerId);
    state.turnExpiresAt =
      this.engine.isHandInProgress() && this.engine.getActivePlayerId()
        ? this.turnExpiresAt
        : null;
    state.turnDuration = this.config.turnTimerSeconds || 30;
    return state;
  }
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map(); // Keyed by roomCode
  private roomsById: Map<string, Room> = new Map(); // Keyed by roomId

  public createRoom(
    hostId: string,
    hostName: string,
    hostAvatar: string,
    config?: RoomConfig
  ): Room {
    const room = new Room(hostId, hostName, hostAvatar, config);
    while (this.rooms.has(room.code)) {
      room.code = generateRoomCode();
    }
    this.rooms.set(room.code, room);
    this.roomsById.set(room.id, room);
    return room;
  }

  public getRoomByCode(code: string): Room | null {
    return this.rooms.get(code.toUpperCase()) || null;
  }

  public getRoomById(id: string): Room | null {
    return this.roomsById.get(id) || null;
  }

  public removeRoom(code: string): void {
    const room = this.rooms.get(code.toUpperCase());
    if (room) {
      this.rooms.delete(code.toUpperCase());
      this.roomsById.delete(room.id);
    }
  }
}

export const roomManager = new RoomManager();
