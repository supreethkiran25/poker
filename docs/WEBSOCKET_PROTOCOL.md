# WebSocket Protocol Specification

## 1. Protocol Conventions
- **Transport**: Socket.IO over WebSocket (with fallback to long polling if strict firewall prevents WS upgrade).
- **Serialization**: JSON.
- **Validation**: All incoming client payloads are validated against Zod schemas. Invalid payloads are immediately rejected with an `error:notification` response.
- **Idempotency**: All state-mutating actions (bets, folds, calls, room starts) require a client-generated UUID `actionId`.

---

## 2. Client → Server Events

| Event | Payload Type | Description |
|---|---|---|
| `room:create` | `{ hostName: string, config?: RoomConfig }` | Creates a new private room and returns room code |
| `room:join` | `{ roomCode: string, playerName: string, sessionToken?: string }` | Joins a private room |
| `room:leave` | `{ roomCode: string }` | Leaves a room |
| `player:ready` | `{ roomCode: string, ready: boolean }` | Toggles player ready state |
| `game:start` | `{ roomCode: string }` | Host starts the game when requirements are met |
| `game:action` | `{ roomCode: string, actionId: string, type: ActionType, amount?: number }` | Executes a betting action (fold/check/call/bet/raise/all-in) |
| `game:chat` | `{ roomCode: string, message: string }` | Sends a sanitized text message |
| `game:reaction` | `{ roomCode: string, reaction: string }` | Sends an emoji reaction (😂, 🔥, 😮, 👏, GG) |
| `game:rematch` | `{ roomCode: string }` | Host triggers a rematch hand/session |

---

## 3. Server → Client Events

| Event | Payload Type | Description |
|---|---|---|
| `room:state` | `RoomPublicState` | Full lobby details (players, host, settings, ready states) |
| `player:joined` | `{ playerId: string, name: string, seatIndex: number }` | Broadcast when new player enters |
| `player:left` | `{ playerId: string, reason: string }` | Broadcast when player leaves or disconnects |
| `game:state` | `GamePublicState` | Authorized game snapshot (contains user's hole cards only) |
| `game:actionNotice` | `ActionNotice` | Announcement of an action taken by a player |
| `game:phaseChanged` | `{ phase: GamePhase, communityCards: Card[] }` | Notifies change of street (Flop, Turn, River) |
| `game:handStarted` | `{ handNumber: number, dealerSeat: number }` | Begins a new hand |
| `game:handFinished` | `HandResult` | Showdown outcome, winners, winning hands, pot splits |
| `timer:updated` | `{ activePlayerId: string, expiresAt: number, duration: number }` | Broadcast of turn countdown timestamp |
| `chat:message` | `ChatMessage` | Sanitized chat message or system log item |
| `reaction:received` | `{ playerId: string, reaction: string, id: string }` | Floating emoji trigger |
| `error:notification`| `{ code: string, message: string }` | Contextual error message to client |

---

## 4. State Privacy Guarantees
The server runs `sanitizeGameState(state, recipientPlayerId)` on every emit.
- The `recipientPlayerId` sees their own cards: `holeCards: [Card, Card]`.
- Other players' cards are masked as: `holeCards: [{ hidden: true }, { hidden: true }]` until showdown.
- Once showdown occurs, all cards that reached showdown are made visible in `HandResult`.
