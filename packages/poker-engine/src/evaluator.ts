import type { Card, Rank, Suit } from '@poker/shared';
import { RANK_STRINGS, SUIT_SYMBOLS } from './card.js';

export enum HandCategory {
  HIGH_CARD = 1,
  ONE_PAIR = 2,
  TWO_PAIR = 3,
  THREE_OF_A_KIND = 4,
  STRAIGHT = 5,
  FLUSH = 6,
  FULL_HOUSE = 7,
  FOUR_OF_A_KIND = 8,
  STRAIGHT_FLUSH = 9,
}

export const HAND_CATEGORY_NAMES: Record<HandCategory, string> = {
  [HandCategory.HIGH_CARD]: 'High Card',
  [HandCategory.ONE_PAIR]: 'One Pair',
  [HandCategory.TWO_PAIR]: 'Two Pair',
  [HandCategory.THREE_OF_A_KIND]: 'Three of a Kind',
  [HandCategory.STRAIGHT]: 'Straight',
  [HandCategory.FLUSH]: 'Flush',
  [HandCategory.FULL_HOUSE]: 'Full House',
  [HandCategory.FOUR_OF_A_KIND]: 'Four of a Kind',
  [HandCategory.STRAIGHT_FLUSH]: 'Straight Flush',
};

export interface EvaluatedHand {
  category: HandCategory;
  categoryName: string;
  handDescription: string;
  ranks: number[]; // Kickers / distinguishing rank values descending
  best5: Card[];
}

/**
 * Evaluates exactly 5 cards.
 */
export function evaluate5Cards(cards: Card[]): EvaluatedHand {
  if (cards.length !== 5) {
    throw new Error(`Expected exactly 5 cards, got ${cards.length}`);
  }

  // Sort descending by rank
  const sorted = [...cards].sort((a, b) => b.rank - a.rank);

  // Check flush
  const isFlush = sorted.every((c) => c.suit === sorted[0].suit);

  // Check straight
  // Check standard straight
  let isStraight = false;
  let straightHighRank = 0;

  const distinctRanks = Array.from(new Set(sorted.map((c) => c.rank)));
  if (distinctRanks.length === 5) {
    if (distinctRanks[0] - distinctRanks[4] === 4) {
      isStraight = true;
      straightHighRank = distinctRanks[0];
    } else if (
      distinctRanks[0] === 14 &&
      distinctRanks[1] === 5 &&
      distinctRanks[2] === 4 &&
      distinctRanks[3] === 3 &&
      distinctRanks[4] === 2
    ) {
      // Ace-low wheel straight (A-2-3-4-5)
      isStraight = true;
      straightHighRank = 5; // 5 is the top card of a wheel straight
    }
  }

  // Straight Flush
  if (isStraight && isFlush) {
    const isRoyal = straightHighRank === 14;
    const best5Cards =
      straightHighRank === 5 && sorted[0].rank === 14
        ? [...sorted.slice(1), sorted[0]]
        : sorted;
    return {
      category: HandCategory.STRAIGHT_FLUSH,
      categoryName: isRoyal ? 'Royal Flush' : 'Straight Flush',
      handDescription: isRoyal
        ? 'Royal Flush'
        : `Straight Flush, ${RANK_STRINGS[straightHighRank as Rank]} High`,
      ranks: [straightHighRank],
      best5: best5Cards,
    };
  }

  // Group by rank
  const counts: Record<number, number> = {};
  for (const c of sorted) {
    counts[c.rank] = (counts[c.rank] || 0) + 1;
  }

  const groups = Object.entries(counts)
    .map(([rankStr, count]) => ({ rank: Number(rankStr), count }))
    .sort((a, b) => {
      // Primary sort by count descending, secondary sort by rank descending
      if (b.count !== a.count) return b.count - a.count;
      return b.rank - a.rank;
    });

  // Four of a kind (4 + 1)
  if (groups[0].count === 4) {
    const quadRank = groups[0].rank;
    const kicker = groups[1].rank;
    const quadCards = sorted.filter((c) => c.rank === quadRank);
    const kickerCards = sorted.filter((c) => c.rank === kicker);
    return {
      category: HandCategory.FOUR_OF_A_KIND,
      categoryName: 'Four of a Kind',
      handDescription: `Four of a Kind, ${RANK_STRINGS[quadRank as Rank]}s`,
      ranks: [quadRank, kicker],
      best5: [...quadCards, ...kickerCards],
    };
  }

  // Full House (3 + 2)
  if (groups[0].count === 3 && groups[1].count === 2) {
    const tripsRank = groups[0].rank;
    const pairRank = groups[1].rank;
    const tripsCards = sorted.filter((c) => c.rank === tripsRank);
    const pairCards = sorted.filter((c) => c.rank === pairRank);
    return {
      category: HandCategory.FULL_HOUSE,
      categoryName: 'Full House',
      handDescription: `Full House, ${RANK_STRINGS[tripsRank as Rank]}s full of ${RANK_STRINGS[pairRank as Rank]}s`,
      ranks: [tripsRank, pairRank],
      best5: [...tripsCards, ...pairCards],
    };
  }

  // Flush
  if (isFlush) {
    return {
      category: HandCategory.FLUSH,
      categoryName: 'Flush',
      handDescription: `Flush, ${RANK_STRINGS[sorted[0].rank]} High`,
      ranks: sorted.map((c) => c.rank),
      best5: sorted,
    };
  }

  // Straight
  if (isStraight) {
    const best5Cards =
      straightHighRank === 5 && sorted[0].rank === 14
        ? [...sorted.slice(1), sorted[0]]
        : sorted;
    return {
      category: HandCategory.STRAIGHT,
      categoryName: 'Straight',
      handDescription: `Straight, ${RANK_STRINGS[straightHighRank as Rank]} High`,
      ranks: [straightHighRank],
      best5: best5Cards,
    };
  }

  // Three of a kind (3 + 1 + 1)
  if (groups[0].count === 3) {
    const tripsRank = groups[0].rank;
    const kicker1 = groups[1].rank;
    const kicker2 = groups[2].rank;
    const tripsCards = sorted.filter((c) => c.rank === tripsRank);
    const kickerCards = sorted.filter((c) => c.rank !== tripsRank);
    return {
      category: HandCategory.THREE_OF_A_KIND,
      categoryName: 'Three of a Kind',
      handDescription: `Three of a Kind, ${RANK_STRINGS[tripsRank as Rank]}s`,
      ranks: [tripsRank, kicker1, kicker2],
      best5: [...tripsCards, ...kickerCards],
    };
  }

  // Two Pair (2 + 2 + 1)
  if (groups[0].count === 2 && groups[1].count === 2) {
    const highPair = groups[0].rank;
    const lowPair = groups[1].rank;
    const kicker = groups[2].rank;
    const highPairCards = sorted.filter((c) => c.rank === highPair);
    const lowPairCards = sorted.filter((c) => c.rank === lowPair);
    const kickerCards = sorted.filter((c) => c.rank === kicker);
    return {
      category: HandCategory.TWO_PAIR,
      categoryName: 'Two Pair',
      handDescription: `Two Pair, ${RANK_STRINGS[highPair as Rank]}s and ${RANK_STRINGS[lowPair as Rank]}s`,
      ranks: [highPair, lowPair, kicker],
      best5: [...highPairCards, ...lowPairCards, ...kickerCards],
    };
  }

  // One Pair (2 + 1 + 1 + 1)
  if (groups[0].count === 2) {
    const pairRank = groups[0].rank;
    const kickers = [groups[1].rank, groups[2].rank, groups[3].rank];
    const pairCards = sorted.filter((c) => c.rank === pairRank);
    const kickerCards = sorted.filter((c) => c.rank !== pairRank);
    return {
      category: HandCategory.ONE_PAIR,
      categoryName: 'One Pair',
      handDescription: `One Pair of ${RANK_STRINGS[pairRank as Rank]}s`,
      ranks: [pairRank, ...kickers],
      best5: [...pairCards, ...kickerCards],
    };
  }

  // High Card
  return {
    category: HandCategory.HIGH_CARD,
    categoryName: 'High Card',
    handDescription: `High Card ${RANK_STRINGS[sorted[0].rank]}`,
    ranks: sorted.map((c) => c.rank),
    best5: sorted,
  };
}

/**
 * Compare two evaluated hands.
 * Returns > 0 if handA > handB
 * Returns < 0 if handA < handB
 * Returns 0 if exact tie
 */
export function compareEvaluatedHands(a: EvaluatedHand, b: EvaluatedHand): number {
  if (a.category !== b.category) {
    return a.category - b.category;
  }
  const len = Math.max(a.ranks.length, b.ranks.length);
  for (let i = 0; i < len; i++) {
    const rA = a.ranks[i] ?? 0;
    const rB = b.ranks[i] ?? 0;
    if (rA !== rB) {
      return rA - rB;
    }
  }
  return 0;
}

/**
 * Generates all subsets of size k from an array.
 */
function combinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  function backtrack(start: number, current: T[]) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(0, []);
  return result;
}

/**
 * Evaluates 7 cards (or 5-7 cards) and selects the best 5-card hand.
 */
export function evaluateHand(cards: Card[]): EvaluatedHand {
  if (cards.length < 5) {
    throw new Error(`Cannot evaluate hand with fewer than 5 cards (got ${cards.length})`);
  }
  if (cards.length === 5) {
    return evaluate5Cards(cards);
  }

  const all5Combos = combinations(cards, 5);
  let bestHand: EvaluatedHand | null = null;

  for (const combo of all5Combos) {
    const evaluated = evaluate5Cards(combo);
    if (!bestHand || compareEvaluatedHands(evaluated, bestHand) > 0) {
      bestHand = evaluated;
    }
  }

  return bestHand!;
}
