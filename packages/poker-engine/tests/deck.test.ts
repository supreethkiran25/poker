import { describe, it, expect } from 'vitest';
import { Deck } from '../src/deck.js';

describe('Deck', () => {
  it('creates standard 52-card deck with no duplicates', () => {
    const deck = new Deck();
    expect(deck.remainingCount).toBe(52);
    expect(Deck.validateDeck(deck.getCards())).toBe(true);
  });

  it('draws single and multiple cards correctly', () => {
    const deck = new Deck();
    const card1 = deck.draw();
    expect(card1).toBeDefined();
    expect(deck.remainingCount).toBe(51);

    const cards = deck.drawMany(5);
    expect(cards).toHaveLength(5);
    expect(deck.remainingCount).toBe(46);
  });

  it('shuffles cards effectively without losing or duplicating cards', () => {
    const deck1 = new Deck();
    const deck2 = new Deck();

    // Before shuffle, both decks have identical order
    expect(deck1.getCards()).toEqual(deck2.getCards());

    deck1.shuffle();
    expect(deck1.remainingCount).toBe(52);
    expect(Deck.validateDeck(deck1.getCards())).toBe(true);

    // Cryptographic shuffle should not be identical to fresh ordered deck
    const sameOrder = deck1.getCards().every((c, i) => c.id === deck2.getCards()[i].id);
    expect(sameOrder).toBe(false);
  });
});
