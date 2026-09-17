import type { Card, LegalAction, ActionType, BotPersonality, BotDifficulty } from '@poker/shared';
import { evaluateHand, HandCategory } from './evaluator.js';

export interface BotDecisionContext {
  holeCards: Card[];
  communityCards: Card[];
  pot: number;
  currentTableBet: number;
  myCurrentBet: number;
  myChips: number;
  bigBlind: number;
  minRaise: number;
  legalActions: LegalAction[];
  personality: BotPersonality;
  difficulty?: BotDifficulty;
  playersCount?: number;
  isPreflop: boolean;
}

export interface BotDecision {
  type: ActionType;
  amount?: number;
  thinkDelayMs: number;
  shoutout?: string;
  reaction?: string;
}

/**
 * Score 2 preflop hole cards from 0 to 100.
 */
export function evaluatePreflopScore(c1: Card, c2: Card): number {
  const high = Math.max(c1.rank, c2.rank);
  const low = Math.min(c1.rank, c2.rank);
  const isPair = high === low;
  const isSuited = c1.suit === c2.suit;
  const diff = high - low;

  if (isPair) {
    if (high === 14) return 100; // AA
    if (high === 13) return 98;  // KK
    if (high === 12) return 94;  // QQ
    if (high === 11) return 88;  // JJ
    if (high === 10) return 82;  // TT
    if (high === 9) return 76;   // 99
    if (high === 8) return 72;   // 88
    if (high === 7) return 68;   // 77
    return 56 + high;            // 66-22 (58-62)
  }

  // Non-pairs
  let score = 0;
  // High card value
  if (high === 14) {
    // Ace-X
    if (low === 13) score = isSuited ? 94 : 88; // AK
    else if (low === 12) score = isSuited ? 88 : 82; // AQ
    else if (low === 11) score = isSuited ? 82 : 75; // AJ
    else if (low === 10) score = isSuited ? 78 : 70; // AT
    else score = (isSuited ? 62 : 46) + low; // A9-A2
  } else if (high === 13) {
    // King-X
    if (low === 12) score = isSuited ? 82 : 74; // KQ
    else if (low === 11) score = isSuited ? 76 : 68; // KJ
    else if (low === 10) score = isSuited ? 72 : 62; // KT
    else score = (isSuited ? 54 : 38) + low;
  } else if (high === 12) {
    // Queen-X
    if (low === 11) score = isSuited ? 74 : 66; // QJ
    else if (low === 10) score = isSuited ? 68 : 58; // QT
    else score = (isSuited ? 50 : 34) + low;
  } else if (high === 11) {
    // Jack-X
    if (low === 10) score = isSuited ? 70 : 60; // JT
    else score = (isSuited ? 46 : 30) + low;
  } else {
    // 10 and below
    score = (high * 2.5) + (low * 1.5);
    if (isSuited) score += 12;
    if (diff === 1) score += 10; // Connector
    else if (diff === 2) score += 5;  // One-gapper
  }

  return Math.min(100, Math.max(5, Math.round(score)));
}

/**
 * Score postflop cards (3 to 5 community cards) from 0 to 100.
 */
export function evaluatePostflopScore(holeCards: Card[], communityCards: Card[]): number {
  const allCards = [...holeCards, ...communityCards];
  if (allCards.length < 5) {
    return evaluatePreflopScore(holeCards[0], holeCards[1]);
  }

  const evalResult = evaluateHand(allCards);
  let baseScore = 20;

  switch (evalResult.category) {
    case HandCategory.STRAIGHT_FLUSH:
      baseScore = 98;
      break;
    case HandCategory.FOUR_OF_A_KIND:
      baseScore = 94;
      break;
    case HandCategory.FULL_HOUSE:
      baseScore = 88;
      break;
    case HandCategory.FLUSH:
      baseScore = 82;
      break;
    case HandCategory.STRAIGHT:
      baseScore = 76;
      break;
    case HandCategory.THREE_OF_A_KIND:
      baseScore = 68;
      break;
    case HandCategory.TWO_PAIR:
      baseScore = 58;
      break;
    case HandCategory.ONE_PAIR: {
      // Check if pair uses hole cards
      const highestBoardRank = Math.max(...communityCards.map((c) => c.rank));
      const pairRank = evalResult.ranks[0];
      if (pairRank >= highestBoardRank) {
        baseScore = 52; // Top pair
      } else {
        baseScore = 40; // Second / bottom pair
      }
      break;
    }
    case HandCategory.HIGH_CARD:
    default:
      baseScore = 20;
      break;
  }

  // Check for draws if not already a flush or straight
  if (evalResult.category < HandCategory.STRAIGHT) {
    // Flush draw check (4 of same suit)
    const suitCounts: Record<string, number> = {};
    for (const c of allCards) {
      suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
    }
    const maxSuitCount = Math.max(...Object.values(suitCounts));
    if (maxSuitCount === 4) {
      baseScore += 16; // 4 to a flush draw bonus
    }

    // Straight draw check
    const distinctRanks = Array.from(new Set(allCards.map((c) => c.rank))).sort((a, b) => a - b);
    let consecutiveCount = 1;
    let maxConsecutive = 1;
    for (let i = 1; i < distinctRanks.length; i++) {
      if (distinctRanks[i] === distinctRanks[i - 1] + 1) {
        consecutiveCount++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
      } else {
        consecutiveCount = 1;
      }
    }
    if (maxConsecutive === 4) {
      baseScore += 14; // Open ended or inside straight draw
    }
  }

  return Math.min(100, Math.max(5, Math.round(baseScore)));
}

/**
 * Main decision engine for bot actions.
 */
export function decideBotAction(ctx: BotDecisionContext): BotDecision {
  const {
    holeCards,
    communityCards,
    pot,
    currentTableBet,
    myCurrentBet,
    myChips,
    bigBlind,
    minRaise,
    legalActions,
    personality,
    difficulty,
    isPreflop,
  } = ctx;

  const effectivePersonality: BotPersonality =
    difficulty === 'easy'
      ? 'passive'
      : difficulty === 'hard'
      ? (personality === 'passive' ? 'shark' : personality)
      : personality || 'balanced';

  const canCheck = legalActions.some((a) => a.type === 'check');
  const canCall = legalActions.some((a) => a.type === 'call');
  const canBet = legalActions.some((a) => a.type === 'bet');
  const canRaise = legalActions.some((a) => a.type === 'raise');
  const canAllIn = legalActions.some((a) => a.type === 'all-in');
  const canFold = legalActions.some((a) => a.type === 'fold');

  const betAction = legalActions.find((a) => a.type === 'bet');
  const raiseAction = legalActions.find((a) => a.type === 'raise');

  const toCall = Math.max(0, currentTableBet - myCurrentBet);

  // Calculate hand strength (0-100)
  const strength = isPreflop
    ? evaluatePreflopScore(holeCards[0], holeCards[1])
    : evaluatePostflopScore(holeCards, communityCards);

  // Random factor for bluffing and variance
  const rng = Math.random();

  // Helper for random think delay within a range
  const delay = (minMs: number, maxMs: number) => {
    if (difficulty === 'easy') {
      return Math.floor((minMs * 0.7) + Math.random() * ((maxMs * 0.7) - (minMs * 0.7)));
    }
    return Math.floor(minMs + Math.random() * (maxMs - minMs));
  };

  // 1. FREE TO PLAY (can check)
  if (canCheck) {
    let shouldBet = false;
    let betSizingFactor = 0.5; // fraction of pot

    switch (effectivePersonality) {
      case 'shark':
        // Values strong hands, selective bluffs
        if (strength >= 64 || (strength >= 30 && rng < 0.12)) {
          shouldBet = canBet;
          betSizingFactor = strength >= 80 ? 0.65 : 0.45;
        }
        break;
      case 'aggressive':
        // Bets frequently on mid-strength and frequent bluffs
        if (strength >= 52 || rng < 0.28) {
          shouldBet = canBet;
          betSizingFactor = 0.6 + Math.random() * 0.25;
        }
        break;
      case 'passive':
        // Calling station rarely initiates bets unless monster
        if (strength >= 78) {
          shouldBet = canBet;
          betSizingFactor = 0.35;
        }
        break;
      case 'balanced':
      default:
        if (strength >= 60 || (strength >= 35 && rng < 0.15)) {
          shouldBet = canBet;
          betSizingFactor = 0.5;
        }
        break;
    }

    if (shouldBet && betAction) {
      const minB = betAction.minAmount ?? bigBlind;
      const maxB = betAction.maxAmount ?? myChips;
      const targetBet = Math.max(minB, Math.min(maxB, Math.round(pot * betSizingFactor)));
      return {
        type: 'bet',
        amount: targetBet,
        thinkDelayMs: delay(1200, 2200),
      };
    }

    return {
      type: 'check',
      thinkDelayMs: delay(700, 1400),
    };
  }

  // 2. FACING A BET (toCall > 0)
  const ratioOfStack = toCall / Math.max(1, myChips + myCurrentBet);

  // Personality thresholds
  let foldThreshold = 35;
  let raiseThreshold = 78;

  switch (effectivePersonality) {
    case 'shark':
      foldThreshold = difficulty === 'hard' ? 45 : 42;
      raiseThreshold = difficulty === 'hard' ? 70 : 75;
      break;
    case 'aggressive':
      foldThreshold = 28;
      raiseThreshold = 66;
      break;
    case 'passive':
      // Hates folding cheap bets
      foldThreshold = difficulty === 'easy' ? 16 : 20;
      raiseThreshold = difficulty === 'easy' ? 90 : 84;
      break;
    case 'balanced':
    default:
      foldThreshold = 35;
      raiseThreshold = 76;
      break;
  }

  // If bet is tiny relative to pot / stack, lower fold threshold
  if (toCall <= bigBlind || ratioOfStack < 0.05) {
    foldThreshold -= 15;
  } else if (ratioOfStack > 0.4) {
    // Facing huge bet or shove, tighten up
    foldThreshold += 15;
  }

  // Decide Raise
  const canDoRaise = canRaise && raiseAction;
  if (strength >= raiseThreshold && (canDoRaise || canAllIn)) {
    if (canDoRaise) {
      const minR = raiseAction.minAmount ?? minRaise;
      const maxR = raiseAction.maxAmount ?? myChips;
      const raiseMult = personality === 'aggressive' ? 2.5 : 2.0;
      const targetRaise = Math.max(minR, Math.min(maxR, Math.round(currentTableBet * raiseMult)));

      const shoutouts = [
        'Raising the stakes!',
        "Let's make this interesting.",
        'Not backing down on this.',
      ];
      return {
        type: 'raise',
        amount: targetRaise,
        thinkDelayMs: delay(1400, 2600),
        shoutout: rng < 0.25 ? shoutouts[Math.floor(Math.random() * shoutouts.length)] : undefined,
      };
    } else if (canAllIn && strength >= 85) {
      return {
        type: 'all-in',
        thinkDelayMs: delay(1800, 3000),
        shoutout: "All-in! Let's see it.",
        reaction: '🔥',
      };
    }
  }

  // Decide Call vs Fold
  if (strength >= foldThreshold && canCall) {
    return {
      type: 'call',
      amount: toCall,
      thinkDelayMs: delay(900, 1900),
    };
  }

  // In preflop, if aggressive, small bluff raise chance
  if (isPreflop && personality === 'aggressive' && canDoRaise && rng < 0.12 && toCall <= bigBlind * 3) {
    const minR = raiseAction.minAmount ?? minRaise;
    return {
      type: 'raise',
      amount: minR,
      thinkDelayMs: delay(1300, 2200),
    };
  }

  // Otherwise Fold
  if (canFold) {
    const foldShoutouts = [
      'Too rich for my blood.',
      "I'll catch you next time.",
      'Folded. Nice bet.',
    ];
    return {
      type: 'fold',
      thinkDelayMs: delay(800, 1600),
      shoutout: rng < 0.15 && ratioOfStack > 0.2 ? foldShoutouts[Math.floor(Math.random() * foldShoutouts.length)] : undefined,
    };
  }

  // Fallback to check or fold
  return {
    type: canCheck ? 'check' : 'fold',
    thinkDelayMs: delay(700, 1200),
  };
}
