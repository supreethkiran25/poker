# Security Model & Anti-Cheat Specifications

## 1. Threat Model & Core Assumptions
- **Hostile Client**: Any client payload may be forged, modified, replayed, or spoofed.
- **No Client Trust**: The browser only renders state provided by the server. It has zero authority over cards, chips, turns, or calculations.
- **Information Leakage**: The most critical vulnerability in multiplayer card games is premature hole card disclosure.

---

## 2. Server-Authoritative Defenses

### A. Hole Card Masking
Hole cards are stored exclusively on the server in the authoritative state. When constructing the JSON snapshot for a specific socket, the server strips all opponents' hole cards, replacing them with metadata (`{ cardCount: 2, hidden: true }`). Only at official showdown are non-mucked cards included in public broadcasts.

### B. Action Legality Validation
Before processing any action, the server verifies:
1. Is this socket's authenticated `playerId` equal to the `activePlayerId`?
2. Is the game state currently in a playable betting street?
3. Does the action type exist in the player's legal actions array (`getLegalActions()`)?
4. Is the bet amount $\ge$ `minRaise` and $\le$ the player's available chip stack?
5. Has this specific `actionId` already been applied (idempotency)?

### C. Cryptographic Shuffling
Deck generation and shuffling employ Node.js `crypto.randomInt(min, max)` within a Fisher-Yates shuffle algorithm. `Math.random()` is strictly prohibited for deck randomization.

### D. Rate Limiting & Denial of Service Protection
- **Socket Connection Limits**: Max connections per IP per minute.
- **Message Rate Limiting**: Max 10 messages per second per socket.
- **Chat & Reaction Rate Limiting**: Max 3 chat messages per 2 seconds; max 5 reactions per 3 seconds.
- **Room Code Entropy**: Room codes use 5-character high-entropy alphanumeric strings excluding ambiguous characters (`0`, `O`, `1`, `I`, `l`), yielding over 24 million possible combinations.

### E. Session Protection & Hijacking Prevention
Players receive a high-entropy UUID session token upon joining. This token is retained in local storage and sent during reconnect handshakes. Even if a user knows another player's display name or seat index, they cannot act on their behalf without the session token.
