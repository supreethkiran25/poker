# Poker Engine Architecture & Specification

## 1. Scope and Design Principles
The `poker-engine` package is a pure TypeScript domain library containing all Texas Hold'em rules. It has **zero dependencies** on network libraries (Socket.IO, HTTP), browser APIs (DOM, Window), or persistence engines (databases). It is 100% deterministic and testable.

---

## 2. Card Representation
- **Suits**: 4 suits: Spades (`♠`, `s`), Hearts (`♥`, `h`), Diamonds (`♦`, `d`), Clubs (`♣`, `c`).
- **Ranks**: 13 ranks: 2 through 14 (where 14 represents the Ace).
- **Format**: Each card is modeled as `{ suit: Suit, rank: Rank, id: string }` where `id` is a 2-character string like `"As"` (Ace of spades) or `"Th"` (10 of hearts).
- **Deck**: A standard 52-card deck with no jokers or duplicates.
- **Shuffle**: Shuffled server-side using the Fisher-Yates algorithm backed by Node's cryptographically secure pseudo-random number generator (`crypto.randomInt`).

---

## 3. Hand Evaluation (7-Card Evaluator)
Given 7 cards (2 hole cards + 5 community cards), the engine selects the best 5-card combination and maps it to a canonical hand rank:

1. **Royal Flush** (Straight Flush: 10, J, Q, K, A of same suit)
2. **Straight Flush** (5 consecutive cards of same suit)
3. **Four of a Kind** (4 cards of same rank + 1 kicker)
4. **Full House** (3 of a kind + pair)
5. **Flush** (5 cards of same suit)
6. **Straight** (5 consecutive ranks; includes Ace-low wheel `A-2-3-4-5` where Ace counts as 1)
7. **Three of a Kind** (3 cards of same rank + 2 kickers)
8. **Two Pair** (2 pairs + 1 kicker)
9. **One Pair** (1 pair + 3 kickers)
10. **High Card** (5 distinct ranks)

### Evaluation Value Tuple
Each evaluated hand produces a comparable numeric score tuple: `[categoryRank, kicker1, kicker2, kicker3, kicker4, kicker5]`. 
This allows exact comparisons, kicker tie-breaks, and split-pot determinations.

---

## 4. Side Pots Algorithm
When one or more players go all-in with different chip amounts:
1. Each player's total contribution across the betting round is recorded.
2. Distinct all-in contribution levels are sorted ascendingly: $c_1 < c_2 < \dots < c_k$.
3. For each level, a pot is created containing the incremental chips contributed by all active players who contributed at least that level.
4. Each pot tracks its list of eligible players (those who contributed to that tier and have not folded).
5. At showdown, each pot is evaluated independently from highest tier to lowest tier. The best hand among eligible players for that specific pot wins it. Ties split that specific pot.

---

## 5. Betting Logic & Round Progression
- **Legal Actions**:
  - `FOLD`: Abandon the hand and forfeit all prior bets.
  - `CHECK`: Pass action when current bet to call is 0.
  - `CALL`: Match the current highest bet (or all remaining chips if fewer).
  - `BET`: Make the first wager in a postflop round. Must be at least 1 Big Blind.
  - `RAISE`: Increase the current bet. Must increase by at least the difference of the previous raise (minimum legal raise rule).
  - `ALL_IN`: Wager all remaining chips.
- **Round Completion**:
  A betting round is complete when every active (non-folded, non-all-in) player has acted at least once and has matched the highest current bet.

---

## 6. Table Positions & Blinds
- **Positions**: Dealer Button (D), Small Blind (SB), Big Blind (BB), Under the Gun (UTG), etc.
- **Heads-up Special Rule (2 Players)**:
  - The Dealer posts the Small Blind and acts first preflop.
  - The other player posts the Big Blind and acts second preflop.
  - Postflop, the Big Blind acts first, and the Dealer acts second.
- **3+ Players**:
  - Small Blind posts to the immediate left of the Dealer.
  - Big Blind posts to the immediate left of the Small Blind.
  - Preflop action starts to the left of the Big Blind (UTG).
  - Postflop action starts with the first active player to the left of the Dealer.
