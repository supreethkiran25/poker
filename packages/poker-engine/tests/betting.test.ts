import { describe, it, expect } from 'vitest';
import {
  getLegalActions,
  validateAction,
  isBettingRoundComplete,
  type BettingPlayerState,
} from '../src/betting.js';

describe('Betting Logic', () => {
  const basePlayer: BettingPlayerState = {
    playerId: 'p1',
    chips: 1000,
    currentBet: 0,
    totalContributed: 0,
    hasFolded: false,
    isAllIn: false,
    hasActedInRound: false,
  };

  it('allows check and bet when table bet is 0', () => {
    const actions = getLegalActions(basePlayer, 0, 100, 100);
    const types = actions.map((a) => a.type);
    expect(types).toContain('fold');
    expect(types).toContain('check');
    expect(types).toContain('bet');
    expect(types).toContain('all-in');
    expect(types).not.toContain('call');
    expect(types).not.toContain('raise');
  });

  it('allows call and raise when table bet is greater than current bet', () => {
    const actions = getLegalActions(basePlayer, 200, 400, 100);
    const types = actions.map((a) => a.type);
    expect(types).toContain('fold');
    expect(types).toContain('call');
    expect(types).toContain('raise');
    expect(types).toContain('all-in');
    expect(types).not.toContain('check');
    expect(types).not.toContain('bet');
  });

  it('enforces minimum legal raise size', () => {
    // Current bet is 200, min raise is 400
    const res = validateAction(basePlayer, { type: 'raise', amount: 300 }, 200, 400, 100);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Raise must be to at least 400');

    const validRes = validateAction(basePlayer, { type: 'raise', amount: 400 }, 200, 400, 100);
    expect(validRes.valid).toBe(true);
    expect(validRes.effectiveAmount).toBe(400);
  });

  it('rejects check when facing a bet', () => {
    const res = validateAction(basePlayer, { type: 'check' }, 200, 400, 100);
    expect(res.valid).toBe(false);
  });

  it('determines betting round completion correctly', () => {
    const p1: BettingPlayerState = { ...basePlayer, playerId: 'p1', currentBet: 200, hasActedInRound: true };
    const p2: BettingPlayerState = { ...basePlayer, playerId: 'p2', currentBet: 100, hasActedInRound: true };

    // Not complete because p2 hasn't matched p1's bet
    expect(isBettingRoundComplete([p1, p2])).toBe(false);

    p2.currentBet = 200;
    // Both acted and bets are equal
    expect(isBettingRoundComplete([p1, p2])).toBe(true);
  });
});
