import crypto from 'node:crypto';
import {
  type RoomConfig,
  type RoomPublicState,
  type GamePublicState,
  type ActionType,
  type ChatMessage,
  type ReactionItem,
  type BotPersonality,
  type BotDifficulty,
  BOT_PROFILES,
  DEFAULT_ROOM_CONFIG,
} from '@poker/shared';
import { PokerEngine, decideBotAction } from '@poker/poker-engine';
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
  isBot?: boolean;
  personality?: BotPersonality;
  difficulty?: BotDifficulty;
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
  public nextHandTimerHandle: NodeJS.Timeout | null = null;
  public nextHandReadyPlayers: Set<string> = new Set();
  public botTimerHandle: NodeJS.Timeout | null = null;
  public onStateChanged?: () => void;
  public onChatMessage?: (msg: ChatMessage) => void;

  constructor(
    hostId: string,
    hostName: string,
    hostAvatar: string,
    config?: RoomConfig,
    hostBuyIn?: number
  ) {
    this.id = crypto.randomUUID();
    this.code = generateRoomCode();
    this.hostId = hostId;
    this.config = config ? { ...DEFAULT_ROOM_CONFIG, ...config } : { ...DEFAULT_ROOM_CONFIG };
    this.createdAt = Date.now();
    this.engine = new PokerEngine(this.config);

    // Add host as seat 0
    this.addPlayer(hostId, hostName, hostAvatar, 0, hostBuyIn, true);
  }

  public addPlayer(
    id: string,
    name: string,
    avatar: string,
    seatIndex?: number,
    buyIn?: number,
    isHost: boolean = false,
    isBot: boolean = false,
    personality?: BotPersonality,
    difficulty?: BotDifficulty
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
    const internal = this.engine.addPlayer(
      id,
      name,
      avatar,
      seatIndex,
      buyIn,
      isBot,
      personality,
      difficulty
    );

    const player: RoomPlayer = {
      id,
      name,
      avatar,
      seatIndex: internal.seatIndex,
      isHost,
      isReady: isHost || isBot,
      isConnected: true,
      chips: internal.chips,
      isBot,
      personality,
      difficulty,
    };

    this.players.set(id, player);
    return player;
  }

  public addBot(
    personality?: BotPersonality,
    customName?: string,
    difficulty?: BotDifficulty
  ): RoomPlayer {
    if (this.players.size >= this.config.maxPlayers) {
      throw new Error('Room is full');
    }

    // Filter by difficulty if provided
    const matchingProfiles = difficulty
      ? BOT_PROFILES.filter((p) => p.difficulty === difficulty)
      : BOT_PROFILES;

    const existingNames = new Set(Array.from(this.players.values()).map((p) => p.name));
    const availableMatching = matchingProfiles.filter((p) => !existingNames.has(p.name));
    const availableAny = BOT_PROFILES.filter((p) => !existingNames.has(p.name));
    const pool =
      availableMatching.length > 0
        ? availableMatching
        : availableAny.length > 0
        ? availableAny
        : matchingProfiles;

    const profile = pool[Math.floor(Math.random() * pool.length)];

    const finalPersonality = personality || profile.personality;
    const finalDifficulty = difficulty || profile.difficulty || 'medium';
    const finalName = customName || profile.name;
    const botId = `bot-${crypto.randomUUID().slice(0, 8)}`;

    const botPlayer = this.addPlayer(
      botId,
      finalName,
      profile.avatar,
      undefined,
      this.config.startingChips,
      false,
      true,
      finalPersonality,
      finalDifficulty
    );

    return botPlayer;
  }

  public removeBot(botPlayerId: string): void {
    const p = this.players.get(botPlayerId);
    if (!p || !p.isBot) return;

    // Enforce needed-bot protection: minimum 2 players required for game
    if (this.players.size <= 2) {
      throw new Error('Cannot remove bot: at least 2 players are needed for the match.');
    }

    // Protect active hands: cannot kick mid-hand
    if (this.engine.isHandInProgress()) {
      throw new Error('Cannot remove bot while a hand is actively in progress.');
    }

    this.removePlayer(botPlayerId);
  }

  public fillBots(targetCount?: number, difficulty?: BotDifficulty | 'mixed'): RoomPlayer[] {
    const target = Math.min(
      this.config.maxPlayers,
      targetCount || Math.min(6, this.config.maxPlayers)
    );
    const added: RoomPlayer[] = [];
    const diffList: BotDifficulty[] = ['easy', 'medium', 'hard'];
    while (this.players.size < target) {
      try {
        const botDiff =
          difficulty === 'mixed'
            ? diffList[added.length % diffList.length]
            : difficulty;
        const bot = this.addBot(undefined, undefined, botDiff);
        added.push(bot);
      } catch {
        break;
      }
    }
    return added;
  }

  public clearBots(): void {
    const bots = Array.from(this.players.values()).filter((p) => p.isBot);
    for (const bot of bots) {
      this.removePlayer(bot.id);
    }
  }

  public clearBotTimer(): void {
    if (this.botTimerHandle) {
      clearTimeout(this.botTimerHandle);
      this.botTimerHandle = null;
    }
  }

  public scheduleBotTurnIfNeeded(): void {
    this.clearBotTimer();
    if (!this.engine.isHandInProgress()) return;

    const activePlayerId = this.engine.getActivePlayerId();
    if (!activePlayerId) return;

    const player = this.players.get(activePlayerId);
    if (!player || !player.isBot) return;

    const publicState = this.engine.toPublicState(activePlayerId);
    const internalPlayer = this.engine.getPlayer(activePlayerId);
    if (!internalPlayer || !internalPlayer.holeCards || internalPlayer.holeCards.length < 2) return;

    const decision = decideBotAction({
      holeCards: internalPlayer.holeCards,
      communityCards: [...this.engine.getCommunityCards()],
      pot: publicState.pot,
      currentTableBet: publicState.currentBet,
      myCurrentBet: internalPlayer.currentBet,
      myChips: internalPlayer.chips,
      bigBlind: this.config.bigBlind,
      minRaise: publicState.minRaise,
      legalActions: publicState.legalActions,
      personality: player.personality || 'balanced',
      difficulty: player.difficulty,
      isPreflop: this.engine.getPhase() === 'PREFLOP',
    });

    const thinkDelay = decision.thinkDelayMs || 1200;

    this.botTimerHandle = setTimeout(() => {
      this.botTimerHandle = null;
      if (this.engine.getActivePlayerId() !== activePlayerId) return;

      // Bot shoutout message if present
      if (decision.shoutout && this.config.chatEnabled) {
        const msg: ChatMessage = {
          id: crypto.randomUUID(),
          playerId: activePlayerId,
          playerName: player.name,
          message: decision.shoutout,
          timestamp: Date.now(),
        };
        this.chatMessages.push(msg);
        if (this.chatMessages.length > 100) this.chatMessages.shift();
        if (this.onChatMessage) {
          this.onChatMessage(msg);
        }
      }

      const res = this.handlePlayerAction(activePlayerId, `bot-${Date.now()}`, decision.type, decision.amount);
      if (!res.success) {
        // Fallback: If bot calculation produced an illegal action, check or fold to prevent match stall
        const pubState = this.engine.toPublicState(activePlayerId);
        const canCheck = pubState.legalActions.some((a: { type: string }) => a.type === 'check');
        this.handlePlayerAction(activePlayerId, `bot-fallback-${Date.now()}`, canCheck ? 'check' : 'fold');
      }
      if (this.onStateChanged) {
        this.onStateChanged();
      }
    }, thinkDelay);
  }

  public removePlayer(id: string): void {
    const p = this.players.get(id);
    if (!p) return;

    if (this.botTimerHandle && this.engine.getActivePlayerId() === id) {
      this.clearBotTimer();
    }

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
    this.scheduleBotTurnIfNeeded();
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
    this.clearBotTimer();

    if (this.engine.isHandInProgress()) {
      this.startTurnTimer();
      this.scheduleBotTurnIfNeeded();
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

  public clearTurnTimer(): void {
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
    const res = this.handlePlayerAction(activePlayerId, `timeout-${Date.now()}`, actionType);
    if (!res.success && actionType !== 'fold') {
      // If check was rejected by engine, fallback to fold to prevent turn lock
      this.handlePlayerAction(activePlayerId, `timeout-fallback-${Date.now()}`, 'fold');
    }

    if (this.onStateChanged) {
      this.onStateChanged();
    }
  }

  public clearNextHandTimer(): void {
    if (this.nextHandTimerHandle) {
      clearTimeout(this.nextHandTimerHandle);
      this.nextHandTimerHandle = null;
    }
  }

  private onHandFinished(): void {
    this.clearTurnTimer();
    this.clearBotTimer();
    this.clearNextHandTimer();
    const state = this.engine.toPublicState('system');
    if (state.lastHandResult) {
      recordHandHistory(
        crypto.randomUUID(),
        this.id,
        state.handNumber,
        state.dealerSeat,
        state.communityCards,
        state.pot,
        state.lastHandResult.winners,
        state.lastHandResult.showdownHands
      );
    }

    this.nextHandReadyPlayers.clear();

    // Check if any bot is bust (0 chips) and auto-rebuy
    for (const p of this.players.values()) {
      if (p.isBot) {
        const internal = this.engine.getPlayer(p.id);
        if (internal && internal.chips <= 0) {
          this.rebuyPlayer(p.id, this.config.startingChips);
        }
      }
    }

    // Schedule bots to auto-ready after 2 seconds
    setTimeout(() => {
      if (this.engine.getPhase() === 'HAND_COMPLETE') {
        let anyReady = false;
        for (const p of this.players.values()) {
          if (p.isBot) {
            const started = this.setPlayerNextHandReady(p.id, true);
            anyReady = true;
            if (started) break;
          }
        }
        if (anyReady && this.onStateChanged) {
          this.onStateChanged();
        }
      }
    }, 2000);

    // Check if at least 2 players have chips to continue
    const activeWithChips = this.engine.getPlayers().filter((p) => p !== null && p.chips > 0);
    if (activeWithChips.length >= 2) {
      // Auto-continue to next hand after 8 seconds (gives full 7s auto-fade + 700ms transition time)
      this.nextHandTimerHandle = setTimeout(() => {
        this.nextHandTimerHandle = null;
        if (this.engine.getPhase() === 'HAND_COMPLETE') {
          const res = this.startNextHand();
          if (res.success && this.onStateChanged) {
            this.onStateChanged();
          }
        }
      }, 8000);
    }
  }

  public rebuyPlayer(playerId: string, amount?: number): boolean {
    const defaultAmount = this.config.startingChips || 10000;
    const finalAmount = amount && amount > 0 ? amount : defaultAmount;
    const player = this.players.get(playerId);
    if (!player) return false;

    const added = this.engine.addChips(playerId, finalAmount);
    if (added) {
      player.chips = this.engine.getPlayer(playerId)?.chips ?? (player.chips + finalAmount);

      // If waiting at HAND_COMPLETE and now >= 2 players have chips, schedule auto-deal
      const activeWithChips = this.engine.getPlayers().filter((p) => p !== null && p.chips > 0);
      if (
        activeWithChips.length >= 2 &&
        this.engine.getPhase() === 'HAND_COMPLETE' &&
        !this.nextHandTimerHandle
      ) {
        this.nextHandTimerHandle = setTimeout(() => {
          this.nextHandTimerHandle = null;
          if (this.engine.getPhase() === 'HAND_COMPLETE') {
            const res = this.startNextHand();
            if (res.success && this.onStateChanged) {
              this.onStateChanged();
            }
          }
        }, 3000);
      }
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
    this.clearNextHandTimer();
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
    this.scheduleBotTurnIfNeeded();
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
        isBot: p.isBot,
        personality: p.personality,
        difficulty: p.difficulty,
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
    config?: RoomConfig,
    hostBuyIn?: number
  ): Room {
    const room = new Room(hostId, hostName, hostAvatar, config, hostBuyIn);
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

  public findRoomByPlayerId(playerId: string): Room | null {
    if (!playerId) return null;
    for (const room of this.rooms.values()) {
      if (room.players.has(playerId)) {
        return room;
      }
    }
    return null;
  }

  public removeRoom(code: string): void {
    const room = this.rooms.get(code.toUpperCase());
    if (room) {
      room.clearBotTimer();
      room.clearTurnTimer();
      room.clearNextHandTimer();
      this.rooms.delete(code.toUpperCase());
      this.roomsById.delete(room.id);
    }
  }
}

export const roomManager = new RoomManager();
