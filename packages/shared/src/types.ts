export type Suit = 's' | 'h' | 'd' | 'c';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // e.g. "As", "Kh", "2c"
}

export interface MaskedCard {
  hidden: true;
}

export type HoleCardItem = Card | MaskedCard;

export type GamePhase =
  | 'WAITING_FOR_PLAYERS'
  | 'STARTING'
  | 'PREFLOP'
  | 'FLOP'
  | 'TURN'
  | 'RIVER'
  | 'SHOWDOWN'
  | 'HAND_COMPLETE'
  | 'NEXT_HAND';

export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';

export interface LegalAction {
  type: ActionType;
  minAmount?: number;
  maxAmount?: number;
}

export type RoomStatus = 'LOBBY' | 'PLAYING' | 'PAUSED' | 'ENDED';

export interface RoomConfig {
  maxPlayers: number;
  startingChips: number;
  smallBlind: number;
  bigBlind: number;
  turnTimerSeconds: 15 | 30 | 45 | 60;
  allowSpectators: boolean;
  chatEnabled: boolean;
  reactionsEnabled: boolean;
  voiceEnabled?: boolean;
}

export const DEFAULT_ROOM_CONFIG: RoomConfig = {
  maxPlayers: 8,
  startingChips: 10000,
  smallBlind: 50,
  bigBlind: 100,
  turnTimerSeconds: 30,
  allowSpectators: true,
  chatEnabled: true,
  reactionsEnabled: true,
  voiceEnabled: true,
};

export interface PlayerPublicState {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  currentBet: number;
  seatIndex: number;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  hasFolded: boolean;
  isAllIn: boolean;
  isTurn: boolean;
  holeCards: HoleCardItem[];
  lastAction: { type: ActionType; amount?: number } | null;
}

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface HandWinner {
  playerId: string;
  playerName?: string;
  amount: number;
  handName: string;
  winningCards: Card[];
  holeCards?: Card[];
}

export interface ShowdownHand {
  playerId: string;
  playerName?: string;
  cards: Card[];
  best5?: Card[];
  handRank: string;
  handName: string;
}

export interface HandResult {
  winners: HandWinner[];
  potBreakdown: { potIndex: number; amount: number; winnerIds: string[] }[];
  showdownHands: ShowdownHand[];
  communityCards: Card[];
}

export interface GamePublicState {
  phase: GamePhase;
  communityCards: Card[];
  pot: number;
  sidePots: SidePot[];
  currentBet: number;
  minRaise: number;
  activePlayerId: string | null;
  dealerSeat: number;
  smallBlindSeat: number;
  bigBlindSeat: number;
  players: PlayerPublicState[];
  handNumber: number;
  turnExpiresAt: number | null;
  turnDuration: number;
  lastHandResult: HandResult | null;
  legalActions: LegalAction[]; // for the calling player only
}

export interface RoomPublicState {
  code: string;
  status: RoomStatus;
  hostId: string;
  config: RoomConfig;
  players: {
    id: string;
    name: string;
    avatar: string;
    seatIndex: number;
    isHost: boolean;
    isReady: boolean;
    isConnected: boolean;
    chips: number;
  }[];
  createdAt: number;
  nextHandReadyPlayerIds?: string[];
}

export interface ChatMessage {
  id: string;
  playerId?: string;
  playerName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface ReactionItem {
  id: string;
  playerId: string;
  playerName: string;
  reaction: string;
  timestamp: number;
}
