import { describe, it, expect } from 'vitest';
import { PokerEngine } from '../src/engine.js';
import { DEFAULT_ROOM_CONFIG } from '@poker/shared';

describe('PokerEngine State Machine & Invariants', () => {
  it('manages complete 3-player hand, positions, betting, showdown and chip conservation', () => {
    const engine = new PokerEngine({
      ...DEFAULT_ROOM_CONFIG,
      startingChips: 1000,
      smallBlind: 10,
      bigBlind: 20,
    });

    // 1. Add 3 players
    engine.addPlayer('p1', 'Alex', 'avatar-1', 0);
    engine.addPlayer('p2', 'Rahul', 'avatar-2', 1);
    engine.addPlayer('p3', 'Sam', 'avatar-3', 2);

    const initialTotalChips = 1000 * 3;

    // 2. Start hand
    engine.startHand();
    expect(engine.getPhase()).toBe('PREFLOP');
    expect(engine.getHandNumber()).toBe(1);

    // Initial pot is SB(10) + BB(20) = 30
    const alexViewPreflop = engine.toPublicState('p1');
    expect(alexViewPreflop.pot).toBe(30);

    // CRITICAL SECURITY / PRIVACY CHECK:
    // Alex must only see his own hole cards!
    const alexInView = alexViewPreflop.players.find((p) => p.id === 'p1')!;
    const rahulInView = alexViewPreflop.players.find((p) => p.id === 'p2')!;
    const samInView = alexViewPreflop.players.find((p) => p.id === 'p3')!;

    expect(alexInView.holeCards).toHaveLength(2);
    expect('rank' in alexInView.holeCards[0]).toBe(true);

    expect(rahulInView.holeCards).toHaveLength(2);
    expect('hidden' in rahulInView.holeCards[0]).toBe(true);

    expect(samInView.holeCards).toHaveLength(2);
    expect('hidden' in samInView.holeCards[0]).toBe(true);

    // 3. Play through betting:
    // First to act preflop: UTG (seat 0 / p1 Alex)
    let activeId = engine.getActivePlayerId();
    expect(activeId).toBeDefined();

    // Player 1 calls 20
    let res = engine.handleAction(activeId!, { type: 'call' });
    expect(res.success).toBe(true);

    // Next player acts
    activeId = engine.getActivePlayerId();
    res = engine.handleAction(activeId!, { type: 'call' });
    expect(res.success).toBe(true);

    // Big blind checks
    activeId = engine.getActivePlayerId();
    res = engine.handleAction(activeId!, { type: 'check' });
    expect(res.success).toBe(true);

    // Should now be on the FLOP with 3 community cards!
    expect(engine.getPhase()).toBe('FLOP');
    expect(engine.getCommunityCards()).toHaveLength(3);

    // Flop checks
    for (let i = 0; i < 3; i++) {
      activeId = engine.getActivePlayerId();
      if (!activeId) break;
      res = engine.handleAction(activeId, { type: 'check' });
      expect(res.success).toBe(true);
    }

    // Should now be on the TURN with 4 community cards!
    expect(engine.getPhase()).toBe('TURN');
    expect(engine.getCommunityCards()).toHaveLength(4);

    // Turn checks
    for (let i = 0; i < 3; i++) {
      activeId = engine.getActivePlayerId();
      if (!activeId) break;
      res = engine.handleAction(activeId, { type: 'check' });
      expect(res.success).toBe(true);
    }

    // Should now be on the RIVER with 5 community cards!
    expect(engine.getPhase()).toBe('RIVER');
    expect(engine.getCommunityCards()).toHaveLength(5);

    // River checks
    for (let i = 0; i < 3; i++) {
      activeId = engine.getActivePlayerId();
      if (!activeId) break;
      res = engine.handleAction(activeId, { type: 'check' });
      expect(res.success).toBe(true);
    }

    // Should now reach SHOWDOWN and HAND_COMPLETE!
    expect(engine.getPhase()).toBe('HAND_COMPLETE');

    const stateAfterShowdown = engine.toPublicState('p1');
    expect(stateAfterShowdown.lastHandResult).toBeDefined();
    expect(stateAfterShowdown.lastHandResult!.winners.length).toBeGreaterThanOrEqual(1);

    // CHIP CONSERVATION INVARIANT:
    // Total chips across all players must EXACTLY equal the starting total chips!
    const endTotalChips = engine
      .getPlayers()
      .filter((p) => p !== null)
      .reduce((sum, p) => sum + p!.chips, 0);

    expect(endTotalChips).toBe(initialTotalChips);
  });

  it('correctly handles early fold win when all opponents fold', () => {
    const engine = new PokerEngine({
      ...DEFAULT_ROOM_CONFIG,
      startingChips: 1000,
      smallBlind: 10,
      bigBlind: 20,
    });

    engine.addPlayer('p1', 'Alex', 'avatar-1', 0);
    engine.addPlayer('p2', 'Rahul', 'avatar-2', 1);

    engine.startHand();
    expect(engine.getPhase()).toBe('PREFLOP');

    // In heads-up, SB acts first (p1)
    const active = engine.getActivePlayerId();
    // Active player folds
    const res = engine.handleAction(active!, { type: 'fold' });
    expect(res.success).toBe(true);

    // Should immediately complete hand and award pot to remaining player
    expect(engine.getPhase()).toBe('HAND_COMPLETE');
    const result = engine.toPublicState('p1').lastHandResult;
    expect(result).toBeDefined();
    expect(result!.winners[0].playerId).not.toBe(active);
  });
});
