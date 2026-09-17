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

export type BotPersonality = 'shark' | 'aggressive' | 'passive' | 'balanced';
export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface BotProfile {
  id: string;
  name: string;
  avatar: string;
  personality: BotPersonality;
  difficulty: BotDifficulty;
  title: string;
  bio: string;
}

export const BOT_PROFILES: BotProfile[] = [
  // ── EASY TIER (Recreational & Casual Home-Game Players) ──
  {
    id: 'bot-sarah',
    name: 'Sarah Jenkins',
    avatar: 'sarah-jenkins',
    personality: 'passive',
    difficulty: 'easy',
    title: 'Recreational Player',
    bio: 'Plays casually on weekends, enjoys seeing flops and keeping pots friendly.',
  },
  {
    id: 'bot-david',
    name: 'David Miller',
    avatar: 'david-miller',
    personality: 'passive',
    difficulty: 'easy',
    title: 'Casual Player',
    bio: 'Friendly and relaxed, rarely raises and checks marginal hands to showdown.',
  },
  {
    id: 'bot-lucas',
    name: 'Lucas Silva',
    avatar: 'lucas-silva',
    personality: 'passive',
    difficulty: 'easy',
    title: 'Social Player',
    bio: 'Plays for the relaxed vibes, checks when uncertain and loves showdowns.',
  },
  {
    id: 'bot-rachel',
    name: 'Rachel Adams',
    avatar: 'rachel-adams',
    personality: 'passive',
    difficulty: 'easy',
    title: 'Weekend Enthusiast',
    bio: 'Home game regular who loves multi-way pots and seeing turn and river cards.',
  },
  {
    id: 'bot-liam',
    name: 'Liam Murphy',
    avatar: 'liam-murphy',
    personality: 'passive',
    difficulty: 'easy',
    title: 'Friendly Caller',
    bio: 'Pleasant table presence who calls comfortably and avoids high-pressure spots.',
  },
  {
    id: 'bot-chloe',
    name: 'Chloe Bennett',
    avatar: 'chloe-bennett',
    personality: 'passive',
    difficulty: 'easy',
    title: 'Relaxed Regular',
    bio: 'Enjoys the rhythm of the game, limps into unraised pots and folds to big aggression.',
  },
  {
    id: 'bot-noah',
    name: 'Noah Fischer',
    avatar: 'noah-fischer',
    personality: 'passive',
    difficulty: 'easy',
    title: 'Casual Amateur',
    bio: 'Patient and easygoing, checks frequently and prefers modest pot sizes.',
  },
  {
    id: 'bot-hannah',
    name: 'Hannah Abbott',
    avatar: 'hannah-abbott',
    personality: 'passive',
    difficulty: 'easy',
    title: 'Social Regular',
    bio: 'Enjoys casual friendly games, checks down drawing boards and values fun.',
  },
  {
    id: 'bot-oliver',
    name: 'Oliver Brooks',
    avatar: 'oliver-brooks',
    personality: 'passive',
    difficulty: 'easy',
    title: 'Gentle Caller',
    bio: 'Never rushes, checks his marginal hands and likes seeing community runouts.',
  },
  {
    id: 'bot-grace',
    name: 'Grace Taylor',
    avatar: 'grace-taylor',
    personality: 'passive',
    difficulty: 'easy',
    title: 'Relaxed Hobbyist',
    bio: 'Plays friendly small-stakes holdem with a relaxed, low-stress strategy.',
  },

  // ── MEDIUM TIER (Balanced Standard GTO & ABC Poker) ──
  {
    id: 'bot-alex',
    name: 'Alex Chen',
    avatar: 'alex-chen',
    personality: 'balanced',
    difficulty: 'medium',
    title: 'Solid Fundamentals',
    bio: 'Disciplined math player who calculates textbook pot odds and position.',
  },
  {
    id: 'bot-marcus',
    name: 'Marcus Reed',
    avatar: 'marcus-reed',
    personality: 'balanced',
    difficulty: 'medium',
    title: 'Balanced Grinder',
    bio: 'Steady and collected, bets when ahead and respects strong turn raises.',
  },
  {
    id: 'bot-penelope',
    name: 'Penelope Ward',
    avatar: 'penelope-ward',
    personality: 'balanced',
    difficulty: 'medium',
    title: 'Disciplined Rock',
    bio: 'Patience first, only enters pots with solid hands and favorable equity.',
  },
  {
    id: 'bot-rohan',
    name: 'Rohan Mehta',
    avatar: 'rohan-mehta',
    personality: 'aggressive',
    difficulty: 'medium',
    title: 'Active Table Player',
    bio: 'Pushes the action with disciplined bets, isolation raises, and good timing.',
  },
  {
    id: 'bot-jessica',
    name: 'Jessica Zhang',
    avatar: 'jessica-zhang',
    personality: 'balanced',
    difficulty: 'medium',
    title: 'Position Tactician',
    bio: 'Capitalizes on late position, extracts value on made pairs, and manages risk.',
  },
  {
    id: 'bot-mateo',
    name: 'Mateo Gomez',
    avatar: 'mateo-gomez',
    personality: 'balanced',
    difficulty: 'medium',
    title: 'Methodical Regular',
    bio: 'Plays standard tight-aggressive ranges and sizes continuation bets cleanly.',
  },
  {
    id: 'bot-nathaniel',
    name: 'Nathaniel Ross',
    avatar: 'nathaniel-ross',
    personality: 'balanced',
    difficulty: 'medium',
    title: 'Textbook Standard',
    bio: 'Thorough knowledge of starting hand charts, pot odds, and bet sizing.',
  },
  {
    id: 'bot-priya',
    name: 'Priya Sharma',
    avatar: 'priya-sharma',
    personality: 'balanced',
    difficulty: 'medium',
    title: 'Analytical Grinder',
    bio: 'Calculates implied odds, avoids dominated kickers, and protects chips.',
  },
  {
    id: 'bot-chris',
    name: 'Chris Weber',
    avatar: 'chris-weber',
    personality: 'balanced',
    difficulty: 'medium',
    title: 'Solid ABC Player',
    bio: 'Consistent and focused, avoids fancy play syndromes and punishes loose calls.',
  },
  {
    id: 'bot-devon',
    name: 'Devon Price',
    avatar: 'devon-price',
    personality: 'balanced',
    difficulty: 'medium',
    title: 'Calculated Tactician',
    bio: 'Patient and observant, executes clean value bets on premium rivers.',
  },

  // ── HARD TIER (Aggressive Table Sharks & Experienced Pros) ──
  {
    id: 'bot-viktor',
    name: 'Viktor Lindqvist',
    avatar: 'viktor-lindqvist',
    personality: 'shark',
    difficulty: 'hard',
    title: 'High Stakes Pro',
    bio: 'Calculates equity vs pot odds, punishes weakness, and value-bets relentlessly.',
  },
  {
    id: 'bot-elena',
    name: 'Elena Rostova',
    avatar: 'elena-rostova',
    personality: 'aggressive',
    difficulty: 'hard',
    title: 'Relentless Sharp',
    bio: 'Applies deep pressure with dynamic multi-street sizing and calculated bluffs.',
  },
  {
    id: 'bot-arjun',
    name: 'Arjun Patel',
    avatar: 'arjun-patel',
    personality: 'shark',
    difficulty: 'hard',
    title: 'Analytical Sharp',
    bio: 'Disciplined tight-aggressive pro with ruthless extraction on made hands.',
  },
  {
    id: 'bot-sophia',
    name: 'Sophia Rivera',
    avatar: 'sophia-rivera',
    personality: 'shark',
    difficulty: 'hard',
    title: 'High-Roller Specialist',
    bio: 'Sharp reader who exploits passive lines and extracts maximum value on monsters.',
  },
  {
    id: 'bot-gabriel',
    name: 'Gabriel Dubois',
    avatar: 'gabriel-dubois',
    personality: 'shark',
    difficulty: 'hard',
    title: 'Master Tactician',
    bio: 'Masters board texture analysis, balances check-raise ranges, and controls pots.',
  },
  {
    id: 'bot-dmitri',
    name: 'Dmitri Volkov',
    avatar: 'dmitri-volkov',
    personality: 'shark',
    difficulty: 'hard',
    title: 'Tournament Pro',
    bio: 'Aggressive tournament finalist with sharp timing and fearless check-raises.',
  },
  {
    id: 'bot-kavita',
    name: 'Kavita Reddy',
    avatar: 'kavita-reddy',
    personality: 'shark',
    difficulty: 'hard',
    title: 'Precision Exploiter',
    bio: 'Identifies betting leaks instantly and applies mathematical pot pressure.',
  },
  {
    id: 'bot-alexander',
    name: 'Alexander Scott',
    avatar: 'alexander-scott',
    personality: 'shark',
    difficulty: 'hard',
    title: 'Deep-Stack Specialist',
    bio: 'Expert at multi-street hand reading and extracting every single chip on rivers.',
  },
  {
    id: 'bot-katarina',
    name: 'Katarina Novak',
    avatar: 'katarina-novak',
    personality: 'shark',
    difficulty: 'hard',
    title: 'Elite Competitor',
    bio: 'Punishes loose openers, executes precise 3-bets, and protects checking ranges.',
  },
  {
    id: 'bot-adrian',
    name: 'Adrian Mercer',
    avatar: 'adrian-mercer',
    personality: 'shark',
    difficulty: 'hard',
    title: 'Strategic Sharp',
    bio: 'Relentless competitor who exploits capped ranges with surgical bet sizing.',
  },
];

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
  isBot?: boolean;
  personality?: BotPersonality;
  difficulty?: BotDifficulty;
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
  handRank?: string;
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
    isBot?: boolean;
    personality?: BotPersonality;
    difficulty?: BotDifficulty;
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
