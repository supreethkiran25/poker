import { describe, it, expect } from 'vitest';
import { parseCard } from '../src/card.js';
import {
  evaluateHand,
  evaluate5Cards,
  HandCategory,
  compareEvaluatedHands,
} from '../src/evaluator.js';

function parseHand(str: string) {
  return str.split(' ').map((s) => parseCard(s));
}

describe('Hand Evaluator', () => {
  it('correctly evaluates a Royal Flush', () => {
    const cards = parseHand('As Ks Qs Js Ts');
    const res = evaluate5Cards(cards);
    expect(res.category).toBe(HandCategory.STRAIGHT_FLUSH);
    expect(res.categoryName).toBe('Royal Flush');
  });

  it('correctly evaluates a Straight Flush', () => {
    const cards = parseHand('9h 8h 7h 6h 5h');
    const res = evaluate5Cards(cards);
    expect(res.category).toBe(HandCategory.STRAIGHT_FLUSH);
    expect(res.ranks[0]).toBe(9);
  });

  it('correctly evaluates Four of a Kind and kickers', () => {
    const cards = parseHand('Kd Kh Ks Kc 9d');
    const res = evaluate5Cards(cards);
    expect(res.category).toBe(HandCategory.FOUR_OF_A_KIND);
    expect(res.ranks).toEqual([13, 9]);
  });

  it('correctly evaluates a Full House', () => {
    const cards = parseHand('Jh Jd Jc 4s 4h');
    const res = evaluate5Cards(cards);
    expect(res.category).toBe(HandCategory.FULL_HOUSE);
    expect(res.ranks).toEqual([11, 4]);
  });

  it('correctly evaluates a Flush', () => {
    const cards = parseHand('Ac Tc 7c 6c 2c');
    const res = evaluate5Cards(cards);
    expect(res.category).toBe(HandCategory.FLUSH);
    expect(res.ranks).toEqual([14, 10, 7, 6, 2]);
  });

  it('correctly evaluates a standard Straight', () => {
    const cards = parseHand('9s 8h 7d 6c 5s');
    const res = evaluate5Cards(cards);
    expect(res.category).toBe(HandCategory.STRAIGHT);
    expect(res.ranks[0]).toBe(9);
  });

  it('correctly evaluates Ace-low wheel Straight (A-2-3-4-5)', () => {
    const cards = parseHand('As 5h 4d 3c 2s');
    const res = evaluate5Cards(cards);
    expect(res.category).toBe(HandCategory.STRAIGHT);
    // Top rank in a 5-high wheel straight is 5
    expect(res.ranks[0]).toBe(5);

    // Verify a 6-high straight beats a 5-high wheel straight
    const sixHigh = evaluate5Cards(parseHand('6c 5d 4s 3h 2c'));
    expect(compareEvaluatedHands(sixHigh, res)).toBeGreaterThan(0);
  });

  it('correctly evaluates Three of a Kind', () => {
    const cards = parseHand('8s 8h 8d Kh 4c');
    const res = evaluate5Cards(cards);
    expect(res.category).toBe(HandCategory.THREE_OF_A_KIND);
    expect(res.ranks).toEqual([8, 13, 4]);
  });

  it('correctly evaluates Two Pair and kicker', () => {
    const cards = parseHand('Ah As Qd Qc 9s');
    const res = evaluate5Cards(cards);
    expect(res.category).toBe(HandCategory.TWO_PAIR);
    expect(res.ranks).toEqual([14, 12, 9]);
  });

  it('correctly evaluates One Pair and kickers', () => {
    const cards = parseHand('Ts Td Ah 7c 3s');
    const res = evaluate5Cards(cards);
    expect(res.category).toBe(HandCategory.ONE_PAIR);
    expect(res.ranks).toEqual([10, 14, 7, 3]);
  });

  it('correctly evaluates High Card', () => {
    const cards = parseHand('As Kd 9c 7h 2s');
    const res = evaluate5Cards(cards);
    expect(res.category).toBe(HandCategory.HIGH_CARD);
    expect(res.ranks).toEqual([14, 13, 9, 7, 2]);
  });

  it('evaluates best 5 out of 7 cards', () => {
    // 2 hole cards: A♠ K♠
    // 5 board cards: Q♠ J♠ T♠ 2h 3d
    // Best 5 is Royal Flush!
    const sevenCards = parseHand('As Ks Qs Js Ts 2h 3d');
    const res = evaluateHand(sevenCards);
    expect(res.category).toBe(HandCategory.STRAIGHT_FLUSH);
    expect(res.categoryName).toBe('Royal Flush');
  });

  it('resolves kicker ties correctly between two hands with the same pair', () => {
    // Player 1: Pair of Aces, King-Queen-Jack kickers
    const p1 = evaluate5Cards(parseHand('As Ah Ks Qd Jc'));
    // Player 2: Pair of Aces, King-Queen-Ten kickers
    const p2 = evaluate5Cards(parseHand('Ac Ad Kh Qs Tc'));

    expect(compareEvaluatedHands(p1, p2)).toBeGreaterThan(0);
  });

  it('identifies exact ties for split pots', () => {
    // Board-only hand or identical kickers in different suits
    const p1 = evaluate5Cards(parseHand('As Kh Qd Jc 9s'));
    const p2 = evaluate5Cards(parseHand('Ah Kd Qc Js 9h'));

    expect(compareEvaluatedHands(p1, p2)).toBe(0);
  });
});
