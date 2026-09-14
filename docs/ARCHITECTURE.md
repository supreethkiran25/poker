# System Architecture: Friends-Only Real-Time Multiplayer Texas Hold'em

## 1. System Overview
The application is a private, real-time multiplayer Texas Hold'em poker web platform designed for social play using virtual chips only (no real-money gambling).

The architecture is strictly **server-authoritative**:
- The client is treated as an untrusted presentation layer.
- The server owns the deck, cryptographic RNG, hidden hole cards, community cards, turn timers, betting validation, pot calculation, side-pot distribution, and showdown evaluations.
- Hidden information is never transmitted to clients until allowed by poker rules (showdown).

---

## 2. Monorepo Structure

```
poker-monorepo/
├── packages/
│   ├── shared/                # Shared types, Zod schemas, WebSocket events, DTOs
│   │   ├── src/
│   │   │   ├── types.ts       # Domain entity interfaces (Card, Player, Pot, Room)
│   │   │   ├── protocol.ts    # Client-to-Server and Server-to-Client WebSocket contracts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── poker-engine/          # Pure TypeScript Texas Hold'em engine (zero DOM/network dependencies)
│       ├── src/
│       │   ├── card.ts        # Card representation (ranks, suits, parsing)
│       │   ├── deck.ts        # 52-card deck & cryptographic Fisher-Yates shuffle
│       │   ├── evaluator.ts   # 7-card deterministic hand evaluator & kicker resolution
│       │   ├── side-pots.ts   # Arbitrary all-in side pot calculation & payout engine
│       │   ├── betting.ts     # Betting round validation, min-raise & call calculations
│       │   ├── table-positions.ts # Button & blind rotations (heads-up & full table)
│       │   ├── engine.ts      # Complete finite state machine & game controller
│       │   └── index.ts
│       └── tests/             # Comprehensive unit tests (evaluator, side pots, invariants)
│
├── apps/
│   ├── server/                # Node.js + Express + Socket.IO server
│   │   ├── src/
│   │   │   ├── auth/          # Player session tokens and authentication
│   │   │   ├── db/            # Dual-engine persistence (SQLite local / PostgreSQL prod)
│   │   │   ├── rooms/         # Room lifecycle, lobby management, game sessions
│   │   │   ├── websocket/     # Socket.IO handlers, rate limiters, anti-cheat guards
│   │   │   ├── config.ts      # Environment variables and runtime configuration
│   │   │   └── server.ts      # HTTP + WebSocket server bootstrap
│   │   └── tests/             # Integration & security tests
│   │
│   └── web/                   # Vite + React + TypeScript + Tailwind CSS
│       ├── src/
│       │   ├── components/    # PokerTable, PlayerSeat, HoleCards, ActionBar, PotDisplay
│       │   ├── pages/         # LandingPage, LobbyView, TableView, SummaryModal
│       │   ├── audio/         # Web Audio API procedural sound synthesizer
│       │   ├── hooks/         # useSocket, useGameState, usePlayerProfile
│       │   └── index.css      # Luxury dark poker design system
│       └── tests/             # Playwright multi-client E2E tests
│
├── docs/                      # Architectural and technical documentation
├── docker-compose.yml         # Production multi-container orchestrator
└── package.json               # Root workspace manifest
```

---

## 3. High-Level Data Flow

```
[ Browser Client A ]                 [ Node.js Server ]                [ Browser Client B ]
        |                                    |                                  |
        |--- (1) room:create -------------->|                                  |
        |<-- (2) room:state (code: H7K9Q) ---|                                  |
        |                                    |<-- (3) room:join (code: H7K9Q) --|
        |<-- (4) player:joined --------------|--- (4) player:joined ----------->|
        |                                    |                                  |
        |--- (5) player:ready -------------->|                                  |
        |                                    |<-- (5) player:ready -------------|
        |--- (6) game:start (Host only) ---->|                                  |
        |                                    |                                  |
        |                                    | [Server Deals Cards]             |
        |                                    | [Crypto Shuffle: 52 cards]       |
        |                                    | [Store Hole Cards Securely]      |
        |<-- (7) game:state -----------------|--- (7) game:state -------------->|
        |    (HoleCards: [A♠, K♠])           |    (HoleCards: [7♥, 7♦])         |
        |    (Opponent: [hidden, hidden])    |    (Opponent: [hidden, hidden])  |
        |                                    |                                  |
        |--- (8) game:action (Raise 300) --->|                                  |
        |    [actionId: uuid-1]              | [Validate Bet Legality]          |
        |                                    | [Update Pot, Rotate Turn]        |
        |<-- (9) game:actionNotice ----------|--- (9) game:actionNotice ------->|
        |<-- (10) game:state (New Turn) -----|--- (10) game:state (New Turn) -->|
```

---

## 4. Key Architectural Guarantees

1. **State Isolation**: Clients only receive their own private cards. Opponent cards are serialized as masked objects (`{ hidden: true }`) until valid showdown.
2. **Idempotent Actions**: Every game action carries a unique `actionId`. Duplicate network submissions are rejected without reapplying bets.
3. **Turn Timers**: Server maintains authoritative timestamps (`turnExpiresAt`). When expired, the server executes auto-check (if legal) or auto-fold. Client countdowns are visual representations only.
4. **Reconnection**: Sessions are identified by high-entropy UUID session tokens. If a client disconnects, they are marked `DISCONNECTED`, and upon reconnection they receive an immediate full state resynchronization.
5. **Side-Pot Soundness**: Exact calculation of multiple all-in pots and distribution according to hand rankings and eligible player lists.
