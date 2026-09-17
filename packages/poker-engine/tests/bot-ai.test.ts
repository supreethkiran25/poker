import { describe, it, expect } from 'vitest';
import type { Card } from '@poker/shared';
import {
  evaluatePreflopScore,
  evaluatePostflopScore,
  decideBotAction,
} from '../src/bot-ai.js';

describe('Bot AI Engine', () => {
  const card = (rank: number, suit: 's' | 'h' | 'd' | 'c'): Card => ({
    rank: rank as any,
    suit,
    id: `${rank}${suit}`,
  });

  describe('Preflop Evaluation', () => {
    it('scores pocket Aces as 100', () => {
      const c1 = card(14, 's');
      const c2 = card(14, 'h');
      expect(evaluatePreflopScore(c1, c2)).toBe(100);
    });

    it('scores pocket Kings near 98', () => {
      const c1 = card(13, 's');
      const c2 = card(13, 'h');
      expect(evaluatePreflopScore(c1, c2)).toBe(98);
    });

    it('scores AK suited higher than AK offsuit', () => {
      const akSuited = evaluatePreflopScore(card(14, 's'), card(13, 's'));
      const akOffsuit = evaluatePreflopScore(card(14, 's'), card(13, 'h'));
      expect(akSuited).toBeGreaterThan(akOffsuit);
      expect(akSuited).toBeGreaterThanOrEqual(90);
    });

    it('scores 7-2 offsuit low', () => {
      const score = evaluatePreflopScore(card(7, 's'), card(2, 'h'));
      expect(score).toBeLessThan(35);
    });
  });

  describe('Postflop Evaluation', () => {
    it('scores a full house very high', () => {
      const hole = [card(14, 's'), card(14, 'h')];
      const board = [card(14, 'd'), card(10, 'c'), card(10, 'h')];
      const score = evaluatePostflopScore(hole, board);
      expect(score).toBeGreaterThanOrEqual(85);
    });

    it('scores a flush higher than a straight', () => {
      const flushHole = [card(14, 's'), card(10, 's')];
      const flushBoard = [card(8, 's'), card(5, 's'), card(2, 's')];
      const flushScore = evaluatePostflopScore(flushHole, flushBoard);

      const straightHole = [card(9, 'h'), card(8, 'd')];
      const straightBoard = [card(7, 'c'), card(6, 's'), card(5, 'h')];
      const straightScore = evaluatePostflopScore(straightHole, straightBoard);

      expect(flushScore).toBeGreaterThanOrEqual(80);
      expect(straightScore).toBeGreaterThanOrEqual(75);
      expect(flushScore).toBeGreaterThan(straightScore);
    });

    it('detects flush draws and gives a bonus score', () => {
      const drawHole = [card(14, 's'), card(10, 's')];
      const drawBoard = [card(8, 's'), card(2, 's'), card(5, 'd')];
      const score = evaluatePostflopScore(drawHole, drawBoard);
      // High card with 4-flush draw should be significantly boosted
      expect(score).toBeGreaterThanOrEqual(35);
    });
  });

  describe('Bot Decisions', () => {
    it('checks when legal and hand is marginal', () => {
      const decision = decideBotAction({
        holeCards: [card(7, 's'), card(2, 'h')],
        communityCards: [card(10, 'c'), card(9, 'd'), card(4, 's')],
        pot: 200,
        currentTableBet: 0,
        myCurrentBet: 0,
        myChips: 5000,
        bigBlind: 100,
        minRaise: 100,
        legalActions: [
          { type: 'check' },
          { type: 'bet', minAmount: 100, maxAmount: 5000 },
          { type: 'fold' },
          { type: 'all-in' },
        ],
        personality: 'passive',
        isPreflop: false,
      });

      expect(decision.type).toBe('check');
      expect(decision.thinkDelayMs).toBeGreaterThan(0);
    });

    it('bets when checking is possible and holding a monster', () => {
      const decision = decideBotAction({
        holeCards: [card(14, 's'), card(14, 'h')],
        communityCards: [card(14, 'd'), card(10, 'c'), card(10, 'h')],
        pot: 500,
        currentTableBet: 0,
        myCurrentBet: 0,
        myChips: 5000,
        bigBlind: 100,
        minRaise: 100,
        legalActions: [
          { type: 'check' },
          { type: 'bet', minAmount: 100, maxAmount: 5000 },
          { type: 'fold' },
          { type: 'all-in' },
        ],
        personality: 'shark',
        isPreflop: false,
      });

      expect(decision.type).toBe('bet');
      expect(decision.amount).toBeGreaterThanOrEqual(100);
    });

    it('folds trash when facing a massive bet', () => {
      const decision = decideBotAction({
        holeCards: [card(7, 's'), card(2, 'h')],
        communityCards: [card(14, 'c'), card(13, 'd'), card(12, 's')],
        pot: 3000,
        currentTableBet: 2500,
        myCurrentBet: 0,
        myChips: 3000,
        bigBlind: 100,
        minRaise: 5000,
        legalActions: [
          { type: 'fold' },
          { type: 'call' },
          { type: 'raise', minAmount: 5000, maxAmount: 5000 },
          { type: 'all-in' },
        ],
        personality: 'shark',
        isPreflop: false,
      });

      expect(decision.type).toBe('fold');
    });

    it('calls or raises with pocket Aces facing a raise', () => {
      const decision = decideBotAction({
        holeCards: [card(14, 's'), card(14, 'c')],
        communityCards: [],
        pot: 300,
        currentTableBet: 200,
        myCurrentBet: 100,
        myChips: 9900,
        bigBlind: 100,
        minRaise: 300,
        legalActions: [
          { type: 'fold' },
          { type: 'call' },
          { type: 'raise', minAmount: 300, maxAmount: 9900 },
          { type: 'all-in' },
        ],
        personality: 'shark',
        isPreflop: true,
      });

      expect(['raise', 'call', 'all-in']).toContain(decision.type);
    });
  });
});
