import { describe, it, expect } from 'vitest';
import {
  calculatePots,
  distributePots,
  type PlayerContribution,
} from '../src/side-pots.js';
import { HandCategory } from '../src/evaluator.js';

describe('Side Pots Engine', () => {
  it('correctly calculates main pot, side pot, and refund for prompt scenario (100 vs 500 vs 1000)', () => {
    // Player A: 100 chips (all-in)
    // Player B: 500 chips (all-in)
    // Player C: 1000 chips (called/bet)
    const contributions: PlayerContribution[] = [
      { playerId: 'A', totalContributed: 100, hasFolded: false, isAllIn: true },
      { playerId: 'B', totalContributed: 500, hasFolded: false, isAllIn: true },
      { playerId: 'C', totalContributed: 1000, hasFolded: false, isAllIn: false },
    ];

    const { pots, refunds } = calculatePots(contributions);

    // C should get 500 refunded (uncalled bet since B only had 500)
    expect(refunds).toEqual([{ playerId: 'C', amount: 500 }]);

    // Pots:
    // Pot 0 (Main Pot): 100 from A, 100 from B, 100 from C = 300. Eligible: A, B, C.
    // Pot 1 (Side Pot): 400 from B, 400 from C = 800. Eligible: B, C.
    expect(pots).toHaveLength(2);

    expect(pots[0].amount).toBe(300);
    expect(pots[0].eligiblePlayerIds).toEqual(['A', 'B', 'C']);

    expect(pots[1].amount).toBe(800);
    expect(pots[1].eligiblePlayerIds).toEqual(['B', 'C']);
  });

  it('absorbs folded players chips without making folded players eligible', () => {
    const contributions: PlayerContribution[] = [
      { playerId: 'A', totalContributed: 200, hasFolded: false, isAllIn: true },
      { playerId: 'Folded', totalContributed: 150, hasFolded: true, isAllIn: false },
      { playerId: 'B', totalContributed: 200, hasFolded: false, isAllIn: false },
    ];

    const { pots, refunds } = calculatePots(contributions);
    expect(refunds).toHaveLength(0);
    expect(pots).toHaveLength(1);
    // Total pot: 200 + 150 + 200 = 550
    expect(pots[0].amount).toBe(550);
    expect(pots[0].eligiblePlayerIds).toEqual(['A', 'B']);
    expect(pots[0].eligiblePlayerIds.includes('Folded')).toBe(false);
  });

  it('correctly distributes side pots when different players win main vs side pot', () => {
    // Pot 0: 300 (Eligible: A, B, C)
    // Pot 1: 800 (Eligible: B, C)
    // Evaluations:
    // A has Full House (Category 7) - Best overall hand!
    // B has Flush (Category 6) - Second best hand!
    // C has Two Pair (Category 3)
    const pots = [
      { amount: 300, eligiblePlayerIds: ['A', 'B', 'C'] },
      { amount: 800, eligiblePlayerIds: ['B', 'C'] },
    ];

    const evaluations = new Map([
      ['A', { category: HandCategory.FULL_HOUSE, ranks: [10, 4] }],
      ['B', { category: HandCategory.FLUSH, ranks: [14, 11, 8, 5, 2] }],
      ['C', { category: HandCategory.TWO_PAIR, ranks: [12, 9, 3] }],
    ]);

    const payouts = distributePots(pots, evaluations);

    // Main pot: A wins (Full House > Flush > Two Pair)
    expect(payouts[0].winners).toEqual([{ playerId: 'A', amount: 300 }]);

    // Side pot: B wins (A is NOT eligible for side pot; B's Flush > C's Two Pair)
    expect(payouts[1].winners).toEqual([{ playerId: 'B', amount: 800 }]);
  });

  it('correctly splits pot on exact tie', () => {
    const pots = [{ amount: 1000, eligiblePlayerIds: ['A', 'B'] }];
    const evaluations = new Map([
      ['A', { category: HandCategory.STRAIGHT, ranks: [10] }],
      ['B', { category: HandCategory.STRAIGHT, ranks: [10] }],
    ]);

    const payouts = distributePots(pots, evaluations);
    expect(payouts[0].winners).toEqual([
      { playerId: 'A', amount: 500 },
      { playerId: 'B', amount: 500 },
    ]);
  });
});
