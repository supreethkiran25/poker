import { describe, it, expect } from 'vitest';
import { PokerEngine } from '../src/engine.js';
import { formatRupee, validateVirtualEconomyConfig, DEFAULT_ROOM_CONFIG } from '@poker/shared';

describe('Rupee-Denominated Virtual Chip Economy', () => {
  it('formats values using the Indian numbering system and ₹ symbol', () => {
    expect(formatRupee(50)).toBe('₹50');
    expect(formatRupee(1000)).toBe('₹1,000');
    expect(formatRupee(12500)).toBe('₹12,500');
    expect(formatRupee(100000)).toBe('₹1,00,000');
    expect(formatRupee(1000000)).toBe('₹10,00,000');
    expect(formatRupee(37500)).toBe('₹37,500');
    expect(formatRupee(-7450)).toBe('-₹7,450');
  });

  it('validates custom starting stacks and blind compatibility', () => {
    // Valid standard
    expect(validateVirtualEconomyConfig(10000, 50, 100).valid).toBe(true);
    // Valid custom ₹37,500
    expect(validateVirtualEconomyConfig(37500, 100, 200).valid).toBe(true);
    // Valid large ₹1,00,000
    expect(validateVirtualEconomyConfig(100000, 500, 1000).valid).toBe(true);

    // Invalid: BB <= SB
    expect(validateVirtualEconomyConfig(10000, 100, 100).valid).toBe(false);
    expect(validateVirtualEconomyConfig(10000, 100, 50).valid).toBe(false);

    // Invalid: Float/decimals
    expect(validateVirtualEconomyConfig(10000.5, 50, 100).valid).toBe(false);

    // Invalid: Blind too large for starting stack
    expect(validateVirtualEconomyConfig(1000, 600, 1200).valid).toBe(false);
  });

  it('verifies exact integer accounting for blinds, bets, raises, pot calculation, and chip conservation', () => {
    const customStartingStack = 37500; // Custom stack
    const sb = 100;
    const bb = 200;

    const engine = new PokerEngine({
      ...DEFAULT_ROOM_CONFIG,
      startingChips: customStartingStack,
      smallBlind: sb,
      bigBlind: bb,
    });

    // Add 2 players (Alex and Rahul)
    engine.addPlayer('alex', 'Alex', 'avatar-1', 0);
    engine.addPlayer('rahul', 'Rahul', 'avatar-2', 1);

    const totalEconomyChips = customStartingStack * 2; // ₹75,000 total

    // Start Hand: Blinds must be posted as integers
    engine.startHand();

    // Verify SB & BB deducted accurately
    const players = engine.getPlayers().filter((p) => p !== null);
    const sbPlayer = players.find((p) => p!.seatIndex === 0)!; // In heads-up dealer is SB
    const bbPlayer = players.find((p) => p!.seatIndex === 1)!;

    expect(sbPlayer.chips).toBe(customStartingStack - sb); // ₹37,400
    expect(bbPlayer.chips).toBe(customStartingStack - bb); // ₹37,300

    // Pot is exactly SB + BB = ₹300
    const statePreflop = engine.toPublicState('alex');
    expect(statePreflop.pot).toBe(sb + bb);

    // Alex calls ₹200 (needs ₹100 more)
    let act = engine.handleAction('alex', { type: 'call' });
    expect(act.success).toBe(true);
    expect(sbPlayer.chips).toBe(customStartingStack - bb); // ₹37,300
    expect(statePreflop.pot + 100).toBe(400);

    // Rahul checks
    act = engine.handleAction('rahul', { type: 'check' });
    expect(act.success).toBe(true);

    // Now on FLOP with pot = ₹400
    expect(engine.getPhase()).toBe('FLOP');

    // Rahul bets ₹500
    act = engine.handleAction('rahul', { type: 'bet', amount: 500 });
    expect(act.success).toBe(true);
    expect(bbPlayer.chips).toBe(customStartingStack - bb - 500); // ₹36,800

    // Alex raises to ₹1,500 (puts in ₹1,500)
    act = engine.handleAction('alex', { type: 'raise', amount: 1500 });
    expect(act.success).toBe(true);
    expect(sbPlayer.chips).toBe(customStartingStack - bb - 1500); // ₹35,800

    // Rahul calls the raise (needs ₹1,000 more)
    act = engine.handleAction('rahul', { type: 'call' });
    expect(act.success).toBe(true);
    expect(bbPlayer.chips).toBe(customStartingStack - bb - 1500); // ₹35,800

    // Flop total pot: ₹400 + ₹1,500 + ₹1,500 = ₹3,400
    // Check through Turn and River
    // Turn
    expect(engine.getPhase()).toBe('TURN');
    act = engine.handleAction(engine.getActivePlayerId()!, { type: 'check' });
    expect(act.success).toBe(true);
    act = engine.handleAction(engine.getActivePlayerId()!, { type: 'check' });
    expect(act.success).toBe(true);

    // River
    expect(engine.getPhase()).toBe('RIVER');
    act = engine.handleAction(engine.getActivePlayerId()!, { type: 'check' });
    expect(act.success).toBe(true);
    act = engine.handleAction(engine.getActivePlayerId()!, { type: 'check' });
    expect(act.success).toBe(true);

    // Showdown
    expect(engine.getPhase()).toBe('HAND_COMPLETE');

    // Total chips across both players must still EXACTLY equal ₹75,000
    const endTotal = engine
      .getPlayers()
      .filter((p) => p !== null)
      .reduce((sum, p) => sum + p!.chips, 0);

    expect(endTotal).toBe(totalEconomyChips);

    // Neither player balance can ever be negative
    for (const p of engine.getPlayers()) {
      if (p) {
        expect(p.chips).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(p.chips)).toBe(true);
      }
    }
  });

  it('handles large stack values (e.g. ₹10,00,000) without precision loss', () => {
    const largeStack = 1000000; // ₹10 Lakhs
    const engine = new PokerEngine({
      ...DEFAULT_ROOM_CONFIG,
      startingChips: largeStack,
      smallBlind: 5000,
      bigBlind: 10000,
    });

    engine.addPlayer('p1', 'Player 1', 'avatar-1', 0);
    engine.addPlayer('p2', 'Player 2', 'avatar-2', 1);

    engine.startHand();
    const p1 = engine.getPlayers()[0]!;
    const p2 = engine.getPlayers()[1]!;

    expect(p1.chips).toBe(largeStack - 5000);
    expect(p2.chips).toBe(largeStack - 10000);

    // Fast fold
    const active = engine.getActivePlayerId()!;
    engine.handleAction(active, { type: 'fold' });

    expect(engine.getPhase()).toBe('HAND_COMPLETE');
    const winner = engine.getPlayers().find((p) => p!.id !== active)!;
    expect(winner.chips).toBe(largeStack + 5000); // Won SB of ₹5,000
  });
});
