# Deployment & DevOps Guide

## 1. Environment Configurations
All services read configuration through typed environment variables.
A template file `.env.example` is provided:

```env
# Server
PORT=4000
NODE_ENV=production
CLIENT_ORIGIN=http://localhost:5173
SESSION_SECRET=super-secret-session-key-change-me

# Database
DATABASE_URL=postgres://poker:pokerpassword@localhost:5432/poker_db
# For zero-config local run, defaults to SQLite if DATABASE_URL is not provided:
SQLITE_DB_PATH=./data/poker.sqlite

# Optional Redis for distributed state
REDIS_URL=redis://localhost:6379
```

---

## 2. Docker & Multi-Container Setup
The repository includes a production `docker-compose.yml`:
- **server**: Node.js WebSocket/HTTP server running TypeScript build.
- **web**: Nginx reverse proxy serving optimized Vite React SPA assets and proxying `/socket.io` to the server.
- **postgres**: PostgreSQL 16 database for historical records.
- **redis**: Redis 7 cache for distributed pub-sub (optional scale-out).

---

## 3. Production Hardening
- **HTTPS / WSS**: Terminate TLS at the reverse proxy (Nginx / Caddy / Cloudflare).
- **CORS**: Enforce strict `CLIENT_ORIGIN` matching.
- **CSP**: Content Security Policy disallowing untrusted scripts.
