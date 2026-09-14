import type { Card, Suit, Rank } from '@poker/shared';

export const SUITS: Suit[] = ['s', 'h', 'd', 'c'];
export const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣',
};

export const RANK_STRINGS: Record<Rank, string> = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: 'T',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};

export const STRING_TO_RANK: Record<string, Rank> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  T: 10,
  t: 10,
  '10': 10,
  J: 11,
  j: 11,
  Q: 12,
  q: 12,
  K: 13,
  k: 13,
  A: 14,
  a: 14,
};

export function createCard(rank: Rank, suit: Suit): Card {
  return {
    rank,
    suit,
    id: `${RANK_STRINGS[rank]}${suit}`,
  };
}

export function parseCard(cardStr: string): Card {
  const trimmed = cardStr.trim();
  if (trimmed.length < 2) {
    throw new Error(`Invalid card string: ${cardStr}`);
  }

  let rankStr = trimmed.slice(0, -1);
  const suitChar = trimmed.slice(-1).toLowerCase() as Suit;

  if (!SUITS.includes(suitChar)) {
    throw new Error(`Invalid suit in card string: ${cardStr}`);
  }

  const rank = STRING_TO_RANK[rankStr];
  if (!rank) {
    throw new Error(`Invalid rank in card string: ${cardStr}`);
  }

  return createCard(rank, suitChar);
}

export function formatCardPretty(card: Card): string {
  return `${RANK_STRINGS[card.rank]}${SUIT_SYMBOLS[card.suit]}`;
}

export function areCardsEqual(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}
