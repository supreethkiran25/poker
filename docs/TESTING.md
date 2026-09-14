# Testing Strategy & Quality Assurance

## 1. Testing Pyramid

```
           [ Multi-Client E2E (Playwright) ]
              - 3 browser contexts
              - Full gameplay cycle
              - Reconnect simulation

        [ Server Integration & Anti-Cheat ]
           - Socket.IO client simulations
           - Action forgery rejections
           - Information leakage checks

     [ Poker Engine Pure Domain Unit Tests ]
        - Evaluator (all 9 hands, kickers, wheel)
        - Side pots (arbitrary stack distributions)
        - Betting rules & min-raise validation
        - State machine transitions & invariants
```

---

## 2. Test Execution Commands
- `npm run test:engine`: Runs all unit tests in `packages/poker-engine` using Vitest.
- `npm run test:server`: Runs all WebSocket and database integration tests in `apps/server`.
- `npm run test:e2e`: Runs multi-context browser tests via Playwright.
- `npm test`: Runs all unit and integration test suites.
