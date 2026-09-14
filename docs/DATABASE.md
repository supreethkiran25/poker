# Database & Persistence Architecture

## 1. Dual-Tier Storage Design
To achieve sub-millisecond real-time game latency while preserving auditing and history:
- **Live Game State Tier**: In-memory state store (with pluggable Redis adapter) on the Node.js server. Live betting actions, card states, and timers operate in memory without database blocking.
- **Persistent History Tier**: Relational database (SQLite for local zero-dependency development/testing; PostgreSQL for production container deployment).

---

## 2. Relational Schema Definition

### `rooms`
- `id` (UUID, Primary Key)
- `code` (VARCHAR(10), Unique, Indexed)
- `host_player_id` (UUID)
- `config` (JSONB / TEXT)
- `status` (VARCHAR(20) - LOBBY, PLAYING, CLOSED)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `players` / `sessions`
- `id` (UUID, Primary Key)
- `session_token` (VARCHAR(64), Unique, Indexed)
- `display_name` (VARCHAR(50))
- `avatar_id` (VARCHAR(50))
- `created_at` (TIMESTAMP)

### `hands`
- `id` (UUID, Primary Key)
- `room_id` (UUID, Foreign Key)
- `hand_number` (INTEGER)
- `dealer_seat` (INTEGER)
- `community_cards` (VARCHAR(20))
- `total_pot` (INTEGER)
- `winners` (JSONB / TEXT)
- `started_at` (TIMESTAMP)
- `ended_at` (TIMESTAMP)

### `hand_actions`
- `id` (UUID, Primary Key)
- `hand_id` (UUID, Foreign Key)
- `player_id` (UUID)
- `street` (VARCHAR(20) - PREFLOP, FLOP, TURN, RIVER)
- `action_type` (VARCHAR(20))
- `amount` (INTEGER)
- `pot_after` (INTEGER)
- `created_at` (TIMESTAMP)

### `player_stats`
- `player_id` (UUID, Primary Key)
- `hands_played` (INTEGER)
- `hands_won` (INTEGER)
- `biggest_pot_won` (INTEGER)
- `total_chips_won` (INTEGER)
