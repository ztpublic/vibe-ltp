# Project Improvement TODOs

This list tracks architectural improvements, refactoring opportunities, and code quality enhancements identified during codebase analysis.

## Architecture & Scalability

- [ ] **[Server] Abstract Session Storage**: Currently, `apps/server/src/state/gameState.ts` uses an in-memory `Map` (`sessionStore`). This prevents horizontal scaling and causes data loss on restart.
    - *Action*: Create a `SessionRepository` interface. Implement the current in-memory store as `MemorySessionRepository` and plan for `RedisSessionRepository`.
- [ ] **[Server] Session ID Generation**: `nextSessionId` is a global variable in memory. This will cause collisions if scaled.
    - *Action*: Use UUIDs or a distributed ID generator (e.g., `nanoid` or `uuid`).
- [ ] **[LLM Client] Standardize Agent Execution**: `FactDistillerAgent` implements its own "generate -> check tool" loop, while `agent.ts` exports a generic `runAgent`.
    - *Action*: Refactor specific agents to use the shared `runAgent` utility or a specialized "SingleStepAgent" wrapper to reduce duplication and unify error handling.

## Code Quality & Best Practices

- [x] **[Global] Structured Logging**: `console.log` and `console.error` are used extensively (e.g., `packages/llm-client`, `apps/server`).
    - *Action*: Introduced `pino` in `packages/shared`. Migrated `apps/server` and `packages/llm-client` to use the new logger.
- [ ] **[Web] Socket Configuration**: `SOCKET_OPTIONS` in `apps/web/src/lib/socketManager.ts` has hardcoded values.
    - *Action*: Move critical socket configuration (timeouts, reconnection attempts) to environment variables or a centralized config object.
- [ ] **[Shared] Type Safety**: Ensure request/response schemas in `packages/shared` are strictly typed (e.g., using `zod`) to validate data at runtime between the client and server.

## Testing & CI

- [ ] **[Server] State Management Tests**: `apps/server/src/state/gameState.ts` contains complex state transition logic mixed with storage.
    - *Action*: Once the storage is abstracted (see above), add dedicated unit tests for the state transitions independent of the storage mechanism.
- [ ] **[E2E] Critical Path Coverage**: Ensure `tests/e2e` covers the full "User joins -> Game starts -> User guesses -> Game ends" flow.

## Documentation

- [ ] **[Docs] Update Architecture Diagrams**: If moving to a Repository pattern or adding Redis, ensure `README.md` or `AGENTS.md` reflects the system design.
