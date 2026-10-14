import type { Card } from '@poker/shared';
import { evaluateHand, HandCategory, type EvaluatedHand } from '@poker/poker-engine';

export interface HandEquityResult {
  winPercent: number; // e.g. 78 (for 78%)
  handTitle: string; // e.g. "Top Pair (Aces)", "Nut Flush Draw", "Full House"
  outsDescription?: string; // e.g. "9 Outs to Flush"
  tier: 'nuts' | 'strong' | 'good' | 'medium' | 'weak';
  phaseName: 'Pre-Flop' | 'Flop' | 'Turn' | 'River';
}

const RANK_NAMES: Record<number, string> = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'Jack',
  12: 'Queen',
  13: 'King',
  14: 'Ace',
};

/**
 * Calculates real-time win percentage (equity) of the player's hand
 * dynamically according to the hole cards and board cards (up to the river).
 * Only visible to the player holding the cards.
 */
export function calculateHandEquity(
  holeCards: (Card | { suit?: any; rank?: any; hidden?: boolean })[] | undefined,
  communityCards: (Card | { suit?: any; rank?: any; hidden?: boolean })[] | undefined,
  activePlayersCount: number = 2
): HandEquityResult | null {
  if (!holeCards || holeCards.length < 2) return null;

  // Filter hidden cards if any
  const validHoles = holeCards.filter(
    (c): c is Card => !('hidden' in c && (c as any).hidden) && 'suit' in c && typeof (c as any).rank === 'number'
  );
  if (validHoles.length < 2) return null;

  const board = communityCards
    ? communityCards.filter(
        (c): c is Card => !('hidden' in c && (c as any).hidden) && 'suit' in c && typeof (c as any).rank === 'number'
      )
    : [];
  const numOpponents = Math.max(1, activePlayersCount - 1);

  const c1 = validHoles[0];
  const c2 = validHoles[1];
  const high = Math.max(c1.rank, c2.rank);
  const low = Math.min(c1.rank, c2.rank);
  const isPair = high === low;
  const isSuited = c1.suit === c2.suit;

  // ──────────────────────────────────────────────
  // 1. PRE-FLOP (0 Community Cards)
  // ──────────────────────────────────────────────
  if (board.length === 0) {
    let headsUpEquity = 50;
    let handTitle = `${RANK_NAMES[high]}-${RANK_NAMES[low]}`;

    if (isPair) {
      if (high === 14) { headsUpEquity = 85; handTitle = 'Pocket Aces (AA)'; }
      else if (high === 13) { headsUpEquity = 82; handTitle = 'Pocket Kings (KK)'; }
      else if (high === 12) { headsUpEquity = 80; handTitle = 'Pocket Queens (QQ)'; }
      else if (high === 11) { headsUpEquity = 77; handTitle = 'Pocket Jacks (JJ)'; }
      else if (high === 10) { headsUpEquity = 75; handTitle = 'Pocket Tens (TT)'; }
      else if (high >= 7) { headsUpEquity = 66 + high; handTitle = `Pocket ${RANK_NAMES[high]}s`; }
      else { headsUpEquity = 54 + high * 2; handTitle = `Pocket ${RANK_NAMES[high]}s`; }
    } else {
      // High card combinations
      if (high === 14 && low === 13) { headsUpEquity = isSuited ? 67 : 65; handTitle = isSuited ? 'Ace-King Suited (Big Slick)' : 'Ace-King Offsuit'; }
      else if (high === 14 && low === 12) { headsUpEquity = isSuited ? 66 : 63; handTitle = 'Ace-Queen'; }
      else if (high === 14 && low === 11) { headsUpEquity = isSuited ? 64 : 61; handTitle = 'Ace-Jack'; }
      else if (high === 14 && low === 10) { headsUpEquity = isSuited ? 63 : 59; handTitle = 'Ace-Ten'; }
      else if (high === 13 && low === 12) { headsUpEquity = isSuited ? 63 : 60; handTitle = 'King-Queen'; }
      else if (high === 13 && low === 11) { headsUpEquity = isSuited ? 61 : 58; handTitle = 'King-Jack'; }
      else if (high === 12 && low === 11) { headsUpEquity = isSuited ? 60 : 57; handTitle = 'Queen-Jack'; }
      else if (high === 11 && low === 10) { headsUpEquity = isSuited ? 58 : 54; handTitle = 'Jack-Ten Suited'; }
      else if (isSuited && high - low === 1) { headsUpEquity = 53 + low; handTitle = 'Suited Connectors'; }
      else if (high === 14) { headsUpEquity = isSuited ? 58 : 52; handTitle = `Ace-${RANK_NAMES[low]}`; }
      else if (high === 7 && low === 2 && !isSuited) { headsUpEquity = 34; handTitle = '7-2 Offsuit'; }
      else {
        headsUpEquity = Math.round(35 + (high * 1.5) + low + (isSuited ? 4 : 0));
      }
    }

    // Scale accurately for multiway players:
    // With N opponents, equity drops as (1 / (1 + (1-E)/E * N^0.75))
    const p = headsUpEquity / 100;
    const multiway = p / (p + (1 - p) * Math.pow(numOpponents, 0.72));
    const winPercent = Math.min(96, Math.max(8, Math.round(multiway * 100)));

    const tier = winPercent >= 70 ? 'nuts' : winPercent >= 55 ? 'strong' : winPercent >= 40 ? 'good' : winPercent >= 25 ? 'medium' : 'weak';

    return {
      winPercent,
      handTitle,
      tier,
      phaseName: 'Pre-Flop',
    };
  }

  // ──────────────────────────────────────────────
  // 2. FLOP, TURN, or RIVER
  // ──────────────────────────────────────────────
  const allCards = [...validHoles, ...board];
  const evalResult: EvaluatedHand = evaluateHand(allCards);

  const highestBoardRank = Math.max(...board.map((c) => c.rank));
  const isRiver = board.length >= 5;
  const isTurn = board.length === 4;
  const isFlop = board.length === 3;

  let basePercent = 45;
  let handTitle = evalResult.categoryName;
  let outs = 0;
  let outsDescription: string | undefined;

  // Compute made hand strength
  switch (evalResult.category) {
    case HandCategory.STRAIGHT_FLUSH:
      basePercent = 99;
      handTitle = evalResult.ranks[0] === 14 ? 'Royal Flush!' : 'Straight Flush';
      break;

    case HandCategory.FOUR_OF_A_KIND:
      basePercent = 96;
      handTitle = `Four of a Kind (${RANK_NAMES[evalResult.ranks[0]]}s)`;
      break;

    case HandCategory.FULL_HOUSE:
      basePercent = 88;
      handTitle = `Full House (${RANK_NAMES[evalResult.ranks[0]]}s full of ${RANK_NAMES[evalResult.ranks[1]]}s)`;
      break;

    case HandCategory.FLUSH: {
      const isNutFlush = validHoles.some((c) => c.rank === 14);
      basePercent = isNutFlush ? 88 : 80;
      handTitle = isNutFlush ? 'Nut Flush (Ace High)' : `Flush (${RANK_NAMES[evalResult.ranks[0]]} High)`;
      break;
    }

    case HandCategory.STRAIGHT: {
      basePercent = 75;
      handTitle = `Straight (${RANK_NAMES[evalResult.ranks[0]]} High)`;
      break;
    }

    case HandCategory.THREE_OF_A_KIND: {
      const isSet = isPair && validHoles[0].rank === evalResult.ranks[0];
      basePercent = isSet ? 72 : 62;
      handTitle = isSet ? `Set of ${RANK_NAMES[evalResult.ranks[0]]}s` : `Three of a Kind (${RANK_NAMES[evalResult.ranks[0]]}s)`;
      if (!isRiver) {
        outs += 7; // Outs to Full House / Quads
      }
      break;
    }

    case HandCategory.TWO_PAIR: {
      const pair1 = evalResult.ranks[0];
      const pair2 = evalResult.ranks[1];
      const isTopTwo = pair1 >= highestBoardRank;
      basePercent = isTopTwo ? 62 : 50;
      handTitle = `Two Pair (${RANK_NAMES[pair1]}s & ${RANK_NAMES[pair2]}s)`;
      if (!isRiver) {
        outs += 4; // 4 outs to Full House
      }
      break;
    }

    case HandCategory.ONE_PAIR: {
      const pairRank = evalResult.ranks[0];
      const usesHole = validHoles.some((c) => c.rank === pairRank);
      if (usesHole) {
        if (pairRank > highestBoardRank) {
          basePercent = 58;
          handTitle = `Overpair (${RANK_NAMES[pairRank]}s)`;
        } else if (pairRank === highestBoardRank) {
          basePercent = 48;
          handTitle = `Top Pair (${RANK_NAMES[pairRank]}s)`;
        } else {
          basePercent = 34;
          handTitle = `Pair of ${RANK_NAMES[pairRank]}s`;
        }
      } else {
        basePercent = 25; // Board pair
        handTitle = `Board Pair (${RANK_NAMES[pairRank]}s)`;
      }

      if (!isRiver) {
        // 2 outs to trips + potential overcards
        outs += 2;
        if (high > highestBoardRank) outs += 3;
      }
      break;
    }

    case HandCategory.HIGH_CARD:
    default: {
      basePercent = high === 14 ? 22 : high >= 12 ? 16 : 10;
      handTitle = `High Card ${RANK_NAMES[high]}`;
      if (!isRiver) {
        // 6 outs to pair either hole card
        outs += 6;
      }
      break;
    }
  }

  // ──────────────────────────────────────────────
  // Draws calculation (Flop & Turn only)
  // ──────────────────────────────────────────────
  if (!isRiver && evalResult.category < HandCategory.FLUSH) {
    // Flush Draw: 4 of same suit
    const suitCounts: Record<string, number> = {};
    for (const c of allCards) {
      suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
    }
    const hasFlushDraw = Object.values(suitCounts).some((cnt) => cnt === 4);
    if (hasFlushDraw) {
      outs += 9;
      const isNutDraw = validHoles.some((c) => c.rank === 14);
      outsDescription = isNutDraw ? 'Nut Flush Draw (9 Outs)' : 'Flush Draw (9 Outs)';
    }

    // Straight Draw check
    if (evalResult.category < HandCategory.STRAIGHT) {
      const distinctRanks = Array.from(new Set(allCards.map((c) => c.rank))).sort((a, b) => a - b);
      let consecutive = 1;
      let maxConsecutive = 1;
      for (let i = 1; i < distinctRanks.length; i++) {
        if (distinctRanks[i] === distinctRanks[i - 1] + 1) {
          consecutive++;
          maxConsecutive = Math.max(maxConsecutive, consecutive);
        } else {
          consecutive = 1;
        }
      }

      if (maxConsecutive === 4) {
        outs += 8;
        outsDescription = outsDescription ? `${outsDescription} + OESD` : 'Open-Ended Straight Draw (8 Outs)';
      }
    }
  }

  // Add draw equity: Flop (Rule of 4), Turn (Rule of 2)
  if (!isRiver && outs > 0) {
    const drawMultiplier = isFlop ? 3.4 : 1.9;
    const drawEquityBoost = Math.min(42, Math.round(outs * drawMultiplier));
    basePercent = Math.min(94, basePercent + drawEquityBoost);
    if (!outsDescription && outs >= 4) {
      outsDescription = `${outs} Outs to Improve`;
    }
  }

  // Scale for number of opponents
  const p = basePercent / 100;
  const multiway = p / (p + (1 - p) * Math.pow(numOpponents, isRiver ? 0.8 : 0.68));
  const winPercent = Math.min(99, Math.max(5, Math.round(multiway * 100)));

  const tier =
    winPercent >= 75 ? 'nuts' : winPercent >= 55 ? 'strong' : winPercent >= 40 ? 'good' : winPercent >= 24 ? 'medium' : 'weak';

  const phaseName = isRiver ? 'River' : isTurn ? 'Turn' : 'Flop';

  return {
    winPercent,
    handTitle,
    outsDescription,
    tier,
    phaseName,
  };
}
