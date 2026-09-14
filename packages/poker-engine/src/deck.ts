import crypto from 'node:crypto';
import type { Card } from '@poker/shared';
import { SUITS, RANKS, createCard } from './card.js';

export class Deck {
  private cards: Card[] = [];

  constructor(cards?: Card[]) {
    if (cards) {
      this.cards = [...cards];
    } else {
      this.reset();
    }
  }

  public reset(): void {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push(createCard(rank, suit));
      }
    }
  }

  /**
   * Cryptographically secure Fisher-Yates shuffle.
   * Uses crypto.randomInt to prevent predictable PRNG seeds.
   */
  public shuffle(): void {
    const len = this.cards.length;
    for (let i = len - 1; i > 0; i--) {
      // crypto.randomInt(min, max) returns min <= x < max
      const j = crypto.randomInt(0, i + 1);
      const temp = this.cards[i];
      this.cards[i] = this.cards[j];
      this.cards[j] = temp;
    }
  }

  public draw(): Card {
    const card = this.cards.pop();
    if (!card) {
      throw new Error('Deck is empty; cannot draw card');
    }
    return card;
  }

  public drawMany(count: number): Card[] {
    const drawn: Card[] = [];
    for (let i = 0; i < count; i++) {
      drawn.push(this.draw());
    }
    return drawn;
  }

  public get remainingCount(): number {
    return this.cards.length;
  }

  public getCards(): readonly Card[] {
    return this.cards;
  }

  public static validateDeck(cards: readonly Card[]): boolean {
    if (cards.length !== 52) return false;
    const seen = new Set<string>();
    for (const c of cards) {
      const key = `${c.rank}-${c.suit}`;
      if (seen.has(key)) return false;
      seen.add(key);
    }
    return true;
  }
}
