# Refactor TODOs (vibe-ltp)

This list is based on a quick repo audit plus running:
- `pnpm lint` → **passes** (warnings remain)
- `pnpm typecheck` → **passes**
- `pnpm test` → **passes**

## P0 — Unblockers (make quality gates pass)

- [x] Fix ESLint false-positives for TS type names (`NodeJS`, `RequestInit`) by disabling base `no-undef` for `*.ts/tsx` or adopting `typescript-eslint`’s recommended flat config.
  - Files: `packages/config/eslint.config.mjs`, `eslint.config.mjs`
  - Former errors: `apps/server/src/state/gameState.ts` (`NodeJS`), `apps/web/src/features/sessions/api.ts` (`RequestInit`)
- [x] Decide lint scope for `tools/agent-lab`: ignore it from root lint or add a dedicated lint script/config for it (it’s excluded from pnpm workspaces but included in `pnpm lint`).
- [x] Fix `pnpm typecheck` failures in React element cloning:
  - `apps/web/src/features/chatbot/ActionProvider.tsx` (injecting `actions`)
  - `apps/web/src/features/chatbot/MessageParser.tsx` (injecting `parse` / `answerParse`)
  - Typical fix: narrow with `React.isValidElement`, type the child element props, and only `cloneElement` when compatible.
- [x] Re-enable `typescript.ignoreBuildErrors` in `apps/web/next.config.ts` (currently `true`) after typecheck is clean.
- [x] Add a CI workflow for PRs/pushes to run `pnpm lint`, `pnpm typecheck`, `pnpm test` (deploy workflow currently only builds images).

## P1 — Correctness + multi-session isolation

- [x] Scope Socket.IO broadcasts to the session room instead of `io.emit` to avoid cross-room leaks.
  - Example: `apps/server/src/http/routes/chat.ts` uses `io.emit(SOCKET_EVENTS.CHAT_MESSAGE_ADDED, { sessionId, ... })`.
- [x] Eliminate the “double write” for user chat messages (socket persistence + `/api/chat` persistence/broadcast) to reduce races and dedupe complexity.
  - Candidate directions: make `/api/chat` responsible for persisting/broadcasting the user message (with the supplied `message.id`), or introduce a single socket event that triggers LLM evaluation + decoration.
- [x] Fix `apps/web/src/lib/socketManager.ts` session lookup: `getSharedSocket()` builds keys with `buildKey('', sessionId)` which can’t match keys created by `acquireSocket(baseUrl, sessionId)`.
- [x] Replace hardcoded socket event strings with shared constants (e.g. server uses `'session:join'` directly in `apps/server/src/sockets/index.ts`).

## P2 — Contracts + validation

- [x] Add Zod schemas for HTTP payloads in `packages/shared` (requests + responses) and use them in server routes.
  - Targets: `ChatRequest`, `CreateSessionRequest`, `PuzzleContent`, feedback payloads.
- [x] Remove `as` casts/`any` in server routes and validate input at the boundary.
  - Example: `apps/server/src/http/routes/sessions.ts` (`res: any`, `puzzleContent?: any`).
- [x] Reconcile `ChatRequest.history`: the client sends it (`ApiChatService`), but the server ignores it (`apps/server/src/http/routes/chat.ts`).

## P3 — LLM client refactors (reduce duplication + tighten types)

- [x] Centralize model selection (env var + default) and stop hardcoding `x-ai/grok-4-fast` in `apps/server/src/http/routes/chat.ts`.
- [x] Deduplicate “call primary model, fallback model” logic across agents (`questionValidatorAgent`, `truthValidatorAgent`, etc.) into a shared helper.
- [x] Normalize tool typing: `packages/llm-client/src/tools.ts` produces JSON Schema, but several agents pass Zod directly and cast `as any`; pick one approach and wrap it.
- [x] Reduce `as any` usage for `openRouter(model)` by introducing a typed wrapper that returns `LanguageModel`.

## P4 — Frontend cleanup + UX layering

- [x] Consolidate API base URL resolution into one place and remove the unused `NEXT_PUBLIC_BACKEND_PORT` fallback (not in `.env.example`).
  - Files: `apps/web/src/features/sessions/api.ts`, `apps/web/src/features/chatbot/services/apiChatService.ts`, socket controllers.
- [x] Use TanStack Query (already installed) for session list + room snapshot fetching instead of bespoke `useState/useEffect`.
- [x] Avoid shipping puzzle truth to every client: `apps/web/src/features/puzzles/randomPuzzle.ts` imports JSON containing `soupTruth`; consider moving random selection to the server and sending only `soupSurface` to non-host clients.
- [x] Revisit `apps/web/next.config.ts` `transpilePackages`: `@vibe-ltp/llm-client` looks server-only; ensure it’s not needed in the web bundle.

## P5 — Docs + repo hygiene

- [ ] Update stale docs referencing `packages/react-chatbot-kit` (folder does not exist; UI lives under `apps/web/src/ui/chatbot`).
  - Files: `AGENTS.md`, `README.md`
- [ ] Replace the default Next.js template doc in `apps/web/README.md` with project-specific instructions (root `README.md` is already the canonical guide).

## P6 — Persistence roadmap (optional / future)

- [ ] Implement or remove the placeholder puzzle REST routes (currently Prisma TODOs).
  - File: `apps/server/src/http/routes/puzzles.ts`
- [ ] Decide on a persistence layer for sessions/puzzles (DB vs files) and align with existing `game-exports` session transcript feature.
