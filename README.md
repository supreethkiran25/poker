# Royal Poker Club ♠

A production-grade, real-time multiplayer Texas Hold'em web application built with a pure domain poker engine, server-authoritative anti-cheat architecture, and an in-game virtual Rupee (₹) chip economy.

---

> [!IMPORTANT]
> **Virtual Game Credits Only**  
> All chip values in this application are denominated in virtual Indian Rupees (`₹`) purely as in-game game credits.  
> There are **no real-money deposits, withdrawals, payments, UPI integrations, or gambling mechanics**. The game is designed strictly for private social entertainment among friends.

---

## Features

- **Real-Time Multiplayer**: Low-latency WebSocket synchronization via Socket.IO.
- **Server-Authoritative Anti-Cheat**: Opponents' hole cards are strictly masked on the server until showdown. Turns, min-raise bounds, and betting actions are verified server-side.
- **Pure Domain Poker Engine (`@poker/poker-engine`)**:
  - Cryptographically secure 52-card deck shuffling using `crypto.randomInt`.
  - 7-card deterministic evaluator supporting all 9 hand categories, kickers, and Ace-low wheel straights.
  - Full side-pot engine supporting arbitrary all-ins, split pots, and uncalled bet refunds.
  - Complete finite state machine (`WAITING` → `PREFLOP` → `FLOP` → `TURN` → `RIVER` → `SHOWDOWN`).
- **Rupee (₹) Virtual Chip Economy**:
  - Indian numbering system formatting (`₹1,000`, `₹10,000`, `₹1,00,000`, `₹10,00,000`).
  - Starting stack presets (₹1,000 to ₹1,00,000) and custom stacks up to ₹1,00,00,000.
  - Blind presets (₹5/₹10 to ₹250/₹500) and custom blinds.
- **Authentic Poker Club UI**:
  - Leather padded rail, woven emerald felt surface with racetrack betting line.
  - Player pods with active countdown rings, chip stacks, and dealer/blind badges.
  - Procedural Web Audio API sound synthesizer (card deals, chips, checks, folds, turn alerts, fanfare).
  - Table chat drawer and floating emoji reactions.
  - Hand history auditing modal.
- **Dual-Tier Persistence**:
  - Zero-config built-in synchronous SQLite (`node:sqlite`) for local development and test runs.
  - PostgreSQL schema and migrations for production deployment.

---

## Monorepo Layout

```
poker-monorepo/
├── packages/
│   ├── shared/                # Types, Zod schemas, Rupee currency formatting
│   └── poker-engine/          # Pure Texas Hold'em domain engine (evaluator, side pots, betting)
├── apps/
│   ├── server/                # Node.js + Express + Socket.IO + SQLite/PostgreSQL
│   └── web/                   # Vite + React + TypeScript + Tailwind CSS
├── docs/                      # Comprehensive technical architecture & rule documentation
├── docker-compose.yml         # Production multi-container setup (Server, Web, Postgres, Redis)
└── package.json
```

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run All Tests
```bash
npm test
```

### 3. Start Development Servers
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

---

## Production Deployment (Docker)

```bash
docker-compose up --build
```
Spins up:
- Web service (Nginx reverse proxy on port 80)
- Server service (Node.js WebSocket backend on port 4000)
- PostgreSQL 16
- Redis 7
