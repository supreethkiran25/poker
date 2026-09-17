import type {
  Card,
  GamePhase,
  GamePublicState,
  HandResult,
  PlayerPublicState,
  RoomConfig,
  ActionType,
  LegalAction,
  SidePot,
  BotPersonality,
  BotDifficulty,
} from '@poker/shared';
import { Deck } from './deck.js';
import { evaluateHand } from './evaluator.js';
import { calculatePots, distributePots, type PlayerContribution } from './side-pots.js';
import {
  determinePositions,
  getNextActiveSeat,
  getNextOccupiedSeat,
  type SeatInfo,
} from './table-positions.js';
import {
  getLegalActions,
  validateAction,
  isBettingRoundComplete,
  type BettingPlayerState,
} from './betting.js';

export interface InternalPlayer {
  id: string;
  name: string;
  avatar: string;
  seatIndex: number;
  chips: number;
  currentBet: number;
  totalContributed: number;
  holeCards: Card[];
  hasFolded: boolean;
  isAllIn: boolean;
  hasActedInRound: boolean;
  isConnected: boolean;
  isReady: boolean;
  isHost: boolean;
  lastAction: { type: ActionType; amount?: number } | null;
  isBot?: boolean;
  personality?: BotPersonality;
  difficulty?: BotDifficulty;
}

export class PokerEngine {
  private config: RoomConfig;
  private deck: Deck;
  private players: (InternalPlayer | null)[] = [];
  private phase: GamePhase = 'WAITING_FOR_PLAYERS';
  private communityCards: Card[] = [];
  private pot: number = 0;
  private sidePots: SidePot[] = [];
  private currentTableBet: number = 0;
  private minRaise: number = 0;
  private lastRaiseDiff: number = 0;
  private activeSeatIndex: number | null = null;
  private dealerSeat: number = 0;
  private smallBlindSeat: number = 0;
  private bigBlindSeat: number = 0;
  private handNumber: number = 0;
  private turnExpiresAt: number | null = null;
  private lastHandResult: HandResult | null = null;

  constructor(config: RoomConfig) {
    this.config = config;
    this.deck = new Deck();
    this.players = new Array(config.maxPlayers).fill(null);
  }

  public getConfig(): RoomConfig {
    return this.config;
  }

  public updateConfig(newConfig: RoomConfig): void {
    if (this.phase !== 'WAITING_FOR_PLAYERS' && this.phase !== 'HAND_COMPLETE') {
      throw new Error('Cannot update configuration during an active hand');
    }
    this.config = newConfig;
  }

  public getPhase(): GamePhase {
    return this.phase;
  }

  public getHandNumber(): number {
    return this.handNumber;
  }

  public getActivePlayerId(): string | null {
    if (this.activeSeatIndex === null) return null;
    return this.players[this.activeSeatIndex]?.id ?? null;
  }

  public getPlayers(): readonly (InternalPlayer | null)[] {
    return this.players;
  }

  public getCommunityCards(): readonly Card[] {
    return this.communityCards;
  }

  public addPlayer(
    id: string,
    name: string,
    avatar: string,
    seatIndex?: number,
    buyIn?: number,
    isBot: boolean = false,
    personality?: BotPersonality,
    difficulty?: BotDifficulty
  ): InternalPlayer {
    const existing = this.players.find((p) => p !== null && p.id === id);
    if (existing) {
      existing.isConnected = true;
      return existing;
    }

    let targetSeat = seatIndex;
    if (targetSeat === undefined || this.players[targetSeat] !== null) {
      targetSeat = this.players.findIndex((p) => p === null);
    }

    if (targetSeat === -1 || targetSeat >= this.config.maxPlayers) {
      throw new Error('Table is full');
    }

    const initialChips = buyIn !== undefined && buyIn >= 0 ? buyIn : this.config.startingChips;
    const isFirst = this.players.every((p) => p === null);
    const newPlayer: InternalPlayer = {
      id,
      name,
      avatar,
      seatIndex: targetSeat,
      chips: initialChips,
      currentBet: 0,
      totalContributed: 0,
      holeCards: [],
      hasFolded: false,
      isAllIn: false,
      hasActedInRound: false,
      isConnected: true,
      isReady: isFirst || isBot, // First player (host) and bots are ready
      isHost: isFirst && !isBot,
      lastAction: null,
      isBot,
      personality,
      difficulty,
    };

    this.players[targetSeat] = newPlayer;
    return newPlayer;
  }

  public getPlayer(id: string): InternalPlayer | null {
    return this.players.find((p) => p !== null && p.id === id) ?? null;
  }

  public addChips(id: string, amount: number): boolean {
    const player = this.players.find((p) => p !== null && p.id === id);
    if (!player || amount <= 0) return false;
    player.chips += amount;
    return true;
  }

  public removePlayer(id: string): void {
    const idx = this.players.findIndex((p) => p !== null && p.id === id);
    if (idx === -1) return;

    const player = this.players[idx]!;

    // If an active hand is in progress and player hasn't folded, fold them
    if (this.isHandInProgress() && !player.hasFolded) {
      player.hasFolded = true;
      if (this.activeSeatIndex === idx) {
        this.advanceTurn();
      }
    }

    const wasHost = player.isHost;
    this.players[idx] = null;

    // Delegate host to next occupied seat if host left
    if (wasHost) {
      const nextPlayer = this.players.find((p) => p !== null);
      if (nextPlayer) {
        nextPlayer.isHost = true;
      }
    }

    // If fewer than 2 players remain, reset to WAITING_FOR_PLAYERS
    const activeCount = this.players.filter((p) => p !== null && p.chips > 0).length;
    if (activeCount < 2 && this.isHandInProgress()) {
      this.phase = 'WAITING_FOR_PLAYERS';
      this.activeSeatIndex = null;
    }
  }

  public setPlayerReady(id: string, ready: boolean): void {
    const p = this.players.find((pl) => pl !== null && pl.id === id);
    if (p) {
      p.isReady = ready;
    }
  }

  public setPlayerConnection(id: string, isConnected: boolean): void {
    const p = this.players.find((pl) => pl !== null && pl.id === id);
    if (p) {
      p.isConnected = isConnected;
    }
  }

  public isHandInProgress(): boolean {
    return (
      this.phase === 'PREFLOP' ||
      this.phase === 'FLOP' ||
      this.phase === 'TURN' ||
      this.phase === 'RIVER'
    );
  }

  /**
   * Starts a new Texas Hold'em hand.
   */
  public startHand(): void {
    const eligiblePlayers = this.players.filter((p) => p !== null && p.chips > 0);
    if (eligiblePlayers.length < 2) {
      throw new Error('Cannot start hand with fewer than 2 players with chips');
    }

    this.handNumber++;
    this.phase = 'STARTING';
    this.deck.reset();
    this.deck.shuffle();
    this.communityCards = [];
    this.pot = 0;
    this.sidePots = [];
    this.lastHandResult = null;

    // Reset player per-hand state
    for (const p of this.players) {
      if (p !== null) {
        p.holeCards = [];
        p.currentBet = 0;
        p.totalContributed = 0;
        p.hasFolded = p.chips <= 0;
        p.isAllIn = false;
        p.hasActedInRound = false;
        p.lastAction = null;
      }
    }

    // Determine positions
    const seatInfos: (SeatInfo | null)[] = this.players.map((p) =>
      p ? { seatIndex: p.seatIndex, playerId: p.id, hasFolded: p.hasFolded, isAllIn: p.isAllIn, chips: p.chips } : null
    );

    const positions = determinePositions(seatInfos, this.handNumber === 1 ? -1 : this.dealerSeat);
    this.dealerSeat = positions.dealerSeat;
    this.smallBlindSeat = positions.smallBlindSeat;
    this.bigBlindSeat = positions.bigBlindSeat;

    // Deal 2 hole cards to each active player
    for (let i = 0; i < 2; i++) {
      for (const p of eligiblePlayers) {
        if (p) {
          p.holeCards.push(this.deck.draw());
        }
      }
    }

    // Post Blinds
    const sbPlayer = this.players[this.smallBlindSeat]!;
    const bbPlayer = this.players[this.bigBlindSeat]!;

    const actualSB = Math.min(sbPlayer.chips, this.config.smallBlind);
    sbPlayer.chips -= actualSB;
    sbPlayer.currentBet = actualSB;
    sbPlayer.totalContributed = actualSB;
    if (sbPlayer.chips === 0) sbPlayer.isAllIn = true;

    const actualBB = Math.min(bbPlayer.chips, this.config.bigBlind);
    bbPlayer.chips -= actualBB;
    bbPlayer.currentBet = actualBB;
    bbPlayer.totalContributed = actualBB;
    if (bbPlayer.chips === 0) bbPlayer.isAllIn = true;

    this.pot = actualSB + actualBB;
    this.currentTableBet = actualBB;
    this.minRaise = actualBB + (actualBB - actualSB);
    this.lastRaiseDiff = actualBB - actualSB;

    this.phase = 'PREFLOP';
    this.activeSeatIndex = positions.firstToActPreflop;

    // In preflop, BB hasn't acted yet despite posting
    // If first player to act is already all-in, advance
    const currentActive = this.players[this.activeSeatIndex]!;
    if (currentActive.isAllIn || currentActive.chips <= 0) {
      this.advanceTurn();
    }
  }

  /**
   * Applies a player action.
   */
  public handleAction(
    playerId: string,
    action: { type: ActionType; amount?: number }
  ): { success: boolean; error?: string } {
    if (!this.isHandInProgress()) {
      return { success: false, error: 'No active hand in progress' };
    }

    if (this.activeSeatIndex === null) {
      return { success: false, error: 'No active player to act' };
    }

    const player = this.players[this.activeSeatIndex];
    if (!player || player.id !== playerId) {
      return { success: false, error: 'Not this player’s turn to act' };
    }

    const bettingState: BettingPlayerState = {
      playerId: player.id,
      chips: player.chips,
      currentBet: player.currentBet,
      totalContributed: player.totalContributed,
      hasFolded: player.hasFolded,
      isAllIn: player.isAllIn,
      hasActedInRound: player.hasActedInRound,
    };

    const validation = validateAction(
      bettingState,
      action,
      this.currentTableBet,
      this.minRaise,
      this.config.bigBlind
    );

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const effectiveAmount = validation.effectiveAmount ?? 0;

    switch (action.type) {
      case 'fold': {
        player.hasFolded = true;
        player.lastAction = { type: 'fold' };
        break;
      }
      case 'check': {
        player.hasActedInRound = true;
        player.lastAction = { type: 'check' };
        break;
      }
      case 'call': {
        player.chips -= effectiveAmount;
        player.currentBet += effectiveAmount;
        player.totalContributed += effectiveAmount;
        this.pot += effectiveAmount;
        if (player.chips === 0) player.isAllIn = true;
        player.hasActedInRound = true;
        player.lastAction = { type: 'call', amount: effectiveAmount };
        break;
      }
      case 'bet': {
        player.chips -= effectiveAmount;
        player.currentBet = effectiveAmount;
        player.totalContributed += effectiveAmount;
        this.pot += effectiveAmount;
        this.currentTableBet = effectiveAmount;
        this.lastRaiseDiff = effectiveAmount;
        this.minRaise = effectiveAmount * 2;
        if (player.chips === 0) player.isAllIn = true;

        // Reset hasActedInRound for all other players
        for (const p of this.players) {
          if (p && p.id !== player.id && !p.hasFolded && !p.isAllIn) {
            p.hasActedInRound = false;
          }
        }
        player.hasActedInRound = true;
        player.lastAction = { type: 'bet', amount: effectiveAmount };
        break;
      }
      case 'raise': {
        const targetTotal = action.amount!;
        const raiseDifference = targetTotal - this.currentTableBet;

        player.chips -= effectiveAmount;
        player.currentBet += effectiveAmount;
        player.totalContributed += effectiveAmount;
        this.pot += effectiveAmount;

        if (raiseDifference >= this.lastRaiseDiff) {
          this.lastRaiseDiff = raiseDifference;
          this.minRaise = targetTotal + raiseDifference;
        } else {
          // All-in short raise
          this.minRaise = targetTotal + this.lastRaiseDiff;
        }

        this.currentTableBet = targetTotal;
        if (player.chips === 0) player.isAllIn = true;

        // Reset hasActedInRound for other active players
        for (const p of this.players) {
          if (p && p.id !== player.id && !p.hasFolded && !p.isAllIn) {
            p.hasActedInRound = false;
          }
        }
        player.hasActedInRound = true;
        player.lastAction = { type: 'raise', amount: targetTotal };
        break;
      }
      case 'all-in': {
        const totalWager = player.currentBet + effectiveAmount;
        player.chips = 0;
        player.currentBet = totalWager;
        player.totalContributed += effectiveAmount;
        this.pot += effectiveAmount;
        player.isAllIn = true;

        if (totalWager > this.currentTableBet) {
          const raiseDiff = totalWager - this.currentTableBet;
          if (raiseDiff >= this.lastRaiseDiff) {
            this.lastRaiseDiff = raiseDiff;
            this.minRaise = totalWager + raiseDiff;
          } else {
            this.minRaise = totalWager + this.lastRaiseDiff;
          }
          this.currentTableBet = totalWager;

          // Re-open action for others
          for (const p of this.players) {
            if (p && p.id !== player.id && !p.hasFolded && !p.isAllIn) {
              p.hasActedInRound = false;
            }
          }
        }
        player.hasActedInRound = true;
        player.lastAction = { type: 'all-in', amount: effectiveAmount };
        break;
      }
    }

    // Re-calculate side pots preview
    this.updatePotsPreview();

    // Check if only 1 player remains un-folded
    const nonFolded = this.players.filter((p) => p !== null && !p.hasFolded);
    if (nonFolded.length === 1) {
      this.handleEarlyFoldWin(nonFolded[0]!);
      return { success: true };
    }

    // Check if current betting round is finished
    const bettingPlayers: BettingPlayerState[] = this.players
      .filter((p) => p !== null)
      .map((p) => ({
        playerId: p!.id,
        chips: p!.chips,
        currentBet: p!.currentBet,
        totalContributed: p!.totalContributed,
        hasFolded: p!.hasFolded,
        isAllIn: p!.isAllIn,
        hasActedInRound: p!.hasActedInRound,
      }));

    if (isBettingRoundComplete(bettingPlayers)) {
      this.advanceStreet();
    } else {
      this.advanceTurn();
    }

    return { success: true };
  }

  private updatePotsPreview(): void {
    const contributions: PlayerContribution[] = this.players
      .filter((p) => p !== null)
      .map((p) => ({
        playerId: p!.id,
        totalContributed: p!.totalContributed,
        hasFolded: p!.hasFolded,
        isAllIn: p!.isAllIn,
      }));
    const { pots } = calculatePots(contributions);
    this.sidePots = pots;
  }

  private advanceTurn(): void {
    if (this.activeSeatIndex === null) return;
    const seatInfos: (SeatInfo | null)[] = this.players.map((p) =>
      p ? { seatIndex: p.seatIndex, playerId: p.id, hasFolded: p.hasFolded, isAllIn: p.isAllIn, chips: p.chips } : null
    );

    const nextSeat = getNextActiveSeat(seatInfos, this.activeSeatIndex);
    this.activeSeatIndex = nextSeat;
  }

  private advanceStreet(): void {
    // Reset round bets
    for (const p of this.players) {
      if (p !== null) {
        p.currentBet = 0;
        p.hasActedInRound = false;
        p.lastAction = null;
      }
    }
    this.currentTableBet = 0;
    this.minRaise = this.config.bigBlind;
    this.lastRaiseDiff = this.config.bigBlind;

    // Check how many players can act postflop
    const canActCount = this.players.filter(
      (p) => p !== null && !p.hasFolded && !p.isAllIn && p.chips > 0
    ).length;

    // Deal community cards according to phase
    if (this.phase === 'PREFLOP') {
      this.phase = 'FLOP';
      // Burn 1, deal 3
      this.deck.draw();
      this.communityCards.push(...this.deck.drawMany(3));
    } else if (this.phase === 'FLOP') {
      this.phase = 'TURN';
      // Burn 1, deal 1
      this.deck.draw();
      this.communityCards.push(this.deck.draw());
    } else if (this.phase === 'TURN') {
      this.phase = 'RIVER';
      // Burn 1, deal 1
      this.deck.draw();
      this.communityCards.push(this.deck.draw());
    } else if (this.phase === 'RIVER') {
      this.phase = 'SHOWDOWN';
      this.handleShowdown();
      return;
    }

    // If 0 or 1 player can act (e.g. all-in runout), fast forward to next street
    if (canActCount <= 1) {
      this.advanceStreet();
      return;
    }

    // Set first to act postflop: first active player clockwise from dealer button
    const seatInfos: (SeatInfo | null)[] = this.players.map((p) =>
      p ? { seatIndex: p.seatIndex, playerId: p.id, hasFolded: p.hasFolded, isAllIn: p.isAllIn, chips: p.chips } : null
    );
    this.activeSeatIndex = getNextActiveSeat(seatInfos, this.dealerSeat);
  }

  private handleEarlyFoldWin(winner: InternalPlayer): void {
    this.phase = 'SHOWDOWN';
    this.activeSeatIndex = null;

    // Refund any uncalled bets and distribute pot
    this.updatePotsPreview();
    const contributions: PlayerContribution[] = this.players
      .filter((p) => p !== null)
      .map((p) => ({
        playerId: p!.id,
        totalContributed: p!.totalContributed,
        hasFolded: p!.hasFolded,
        isAllIn: p!.isAllIn,
      }));
    const { refunds } = calculatePots(contributions);
    let totalRefunded = 0;
    for (const ref of refunds) {
      const p = this.players.find((pl) => pl !== null && pl.id === ref.playerId);
      if (p) {
        p.chips += ref.amount;
        totalRefunded += ref.amount;
      }
    }

    const awardAmount = this.pot - totalRefunded;
    // Winner takes remaining contested pot
    winner.chips += awardAmount;

    this.lastHandResult = {
      winners: [
        {
          playerId: winner.id,
          playerName: winner.name,
          amount: awardAmount,
          handName: 'Won by default (all opponents folded)',
          handRank: 'Opponents Folded',
          winningCards: [...winner.holeCards],
          holeCards: [...winner.holeCards],
        },
      ],
      potBreakdown: [{ potIndex: 0, amount: awardAmount, winnerIds: [winner.id] }],
      showdownHands: [
        {
          playerId: winner.id,
          playerName: winner.name,
          cards: [...winner.holeCards],
          best5: [...winner.holeCards],
          handRank: 'Default',
          handName: 'Won by default (all opponents folded)',
        },
      ],
      communityCards: [...this.communityCards],
    };

    this.phase = 'HAND_COMPLETE';
  }

  private handleShowdown(): void {
    this.activeSeatIndex = null;

    // Uncalled bets refund
    const contributions: PlayerContribution[] = this.players
      .filter((p) => p !== null)
      .map((p) => ({
        playerId: p!.id,
        totalContributed: p!.totalContributed,
        hasFolded: p!.hasFolded,
        isAllIn: p!.isAllIn,
      }));

    const { pots, refunds } = calculatePots(contributions);
    for (const ref of refunds) {
      const p = this.players.find((pl) => pl !== null && pl.id === ref.playerId);
      if (p) p.chips += ref.amount;
    }

    // Evaluate all non-folded hands
    const nonFolded = this.players.filter((p) => p !== null && !p.hasFolded);
    const evaluations = new Map<string, { category: number; ranks: number[] }>();
    const best5Map = new Map<string, Card[]>();
    const showdownHandsList: HandResult['showdownHands'] = [];

    for (const p of nonFolded) {
      const all7 = [...p!.holeCards, ...this.communityCards];
      const evaluated = evaluateHand(all7);
      evaluations.set(p!.id, {
        category: evaluated.category,
        ranks: evaluated.ranks,
      });
      best5Map.set(p!.id, evaluated.best5);
      showdownHandsList.push({
        playerId: p!.id,
        playerName: p!.name,
        cards: [...p!.holeCards],
        best5: evaluated.best5,
        handRank: evaluated.categoryName,
        handName: evaluated.handDescription,
      });
    }

    const payouts = distributePots(pots, evaluations);

    // Apply chip awards
    const winnersSummary: HandResult['winners'] = [];
    const potBreakdown: HandResult['potBreakdown'] = [];

    for (const payout of payouts) {
      potBreakdown.push({
        potIndex: payout.potIndex,
        amount: payout.amount,
        winnerIds: payout.winners.map((w) => w.playerId),
      });

      for (const w of payout.winners) {
        const player = this.players.find((p) => p !== null && p.id === w.playerId);
        if (player) {
          player.chips += w.amount;
        }

        const handInfo = showdownHandsList.find((h) => h.playerId === w.playerId);
        const existingSummary = winnersSummary.find((ws) => ws.playerId === w.playerId);
        const winningCards = best5Map.get(w.playerId) ?? handInfo?.cards ?? [];
        if (existingSummary) {
          existingSummary.amount += w.amount;
        } else {
          winnersSummary.push({
            playerId: w.playerId,
            playerName: player?.name ?? 'Player',
            amount: w.amount,
            handName: handInfo?.handName ?? 'Winner',
            handRank: handInfo?.handRank ?? 'Winner',
            winningCards,
            holeCards: player ? [...player.holeCards] : [],
          });
        }
      }
    }

    this.lastHandResult = {
      winners: winnersSummary,
      potBreakdown,
      showdownHands: showdownHandsList,
      communityCards: [...this.communityCards],
    };

    this.phase = 'HAND_COMPLETE';
  }

  /**
   * Generates a player-specific sanitized state snapshot.
   * Opponent hole cards are STRICTLY MASKED unless it's showdown.
   */
  public toPublicState(forPlayerId: string): GamePublicState {
    const isShowdown = this.phase === 'SHOWDOWN' || this.phase === 'HAND_COMPLETE';

    const publicPlayers: PlayerPublicState[] = [];
    for (const p of this.players) {
      if (!p) continue;

      let holeCards: PlayerPublicState['holeCards'] = [];
      if (p.id === forPlayerId) {
        // Own hole cards are always visible
        holeCards = p.holeCards;
      } else if (isShowdown && !p.hasFolded) {
        // In showdown, active players' cards are visible
        holeCards = p.holeCards;
      } else {
        // Masked for everyone else!
        holeCards = p.holeCards.map(() => ({ hidden: true as const }));
      }

      publicPlayers.push({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        chips: p.chips,
        currentBet: p.currentBet,
        seatIndex: p.seatIndex,
        isHost: p.isHost,
        isReady: p.isReady,
        isConnected: p.isConnected,
        hasFolded: p.hasFolded,
        isAllIn: p.isAllIn,
        isTurn: this.activeSeatIndex !== null && this.players[this.activeSeatIndex]?.id === p.id,
        holeCards,
        lastAction: p.lastAction,
        isBot: p.isBot,
        personality: p.personality,
        difficulty: p.difficulty,
      });
    }

    // Compute legal actions specifically for forPlayerId
    let legalActions: LegalAction[] = [];
    if (this.activeSeatIndex !== null && this.players[this.activeSeatIndex]?.id === forPlayerId) {
      const activePlayer = this.players[this.activeSeatIndex]!;
      const bettingState: BettingPlayerState = {
        playerId: activePlayer.id,
        chips: activePlayer.chips,
        currentBet: activePlayer.currentBet,
        totalContributed: activePlayer.totalContributed,
        hasFolded: activePlayer.hasFolded,
        isAllIn: activePlayer.isAllIn,
        hasActedInRound: activePlayer.hasActedInRound,
      };
      legalActions = getLegalActions(
        bettingState,
        this.currentTableBet,
        this.minRaise,
        this.config.bigBlind
      );
    }

    return {
      phase: this.phase,
      communityCards: this.communityCards,
      pot: this.pot,
      sidePots: this.sidePots,
      currentBet: this.currentTableBet,
      minRaise: this.minRaise,
      activePlayerId: this.getActivePlayerId(),
      dealerSeat: this.dealerSeat,
      smallBlindSeat: this.smallBlindSeat,
      bigBlindSeat: this.bigBlindSeat,
      players: publicPlayers,
      handNumber: this.handNumber,
      turnExpiresAt: this.turnExpiresAt,
      turnDuration: this.config.turnTimerSeconds,
      lastHandResult: this.lastHandResult,
      legalActions,
    };
  }
}
