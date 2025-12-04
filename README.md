# Vibe LTP - Lateral Thinking Puzzle Game

Multiplayer lateral thinking puzzles with an LLM host, real-time rooms, and a Next.js 16 UI. The monorepo uses pnpm workspaces with shared TypeScript packages.

## Features

- 🧩 Lateral thinking puzzles with yes/no question flow
- 🤖 LLM question validator and reply formatter powered by OpenRouter
- 👥 Real-time rooms via Socket.IO (single-room state for now)
- 💬 Chat-style UI built on a customized chatbot kit
- 🧪 Storybook for components and a CLI agent lab for LLM experiments

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 18, Tailwind CSS v4, TanStack Query
- **Backend**: Node.js, Express, Socket.IO (websocket transport)
- **Shared packages**: `puzzle-core`, `shared`, `llm-client`, vendored `react-chatbot-kit` (UI kit now lives in `apps/web/src/ui`; experimental `agent-lab` lives under `tools/`)
- **Testing**: Vitest (unit), Playwright (e2e)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Setup

```bash
git clone <repo-url>
cd vibe-ltp
pnpm install

# Configure environment variables
cp .env.example .env
# Set OPENROUTER_API_KEY (required for chat replies) and adjust ports if needed

# Start both frontend and backend
pnpm dev
```

Defaults:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

To use custom ports:
```bash
FRONTEND_PORT=8080 BACKEND_PORT=8081 pnpm dev
```

### Environment Variables

Key values from `.env.example`:
- `OPENROUTER_API_KEY` (required) – OpenRouter key for LLM calls
- `BACKEND_PORT`, `FRONTEND_PORT` – ports for server and web
- `CORS_ORIGIN` – comma-separated allowed origins (defaults to frontend origin)
- `NEXT_PUBLIC_API_BASE_URL` – browser-facing API URL
- `OPENROUTER_REFERRER`, `OPENROUTER_APP_TITLE` – optional OpenRouter metadata

## Monorepo Layout

```
vibe-ltp/
├── apps/
│   ├── web/              # Next.js frontend (App Router; local UI kit in src/ui)
│   └── server/           # Express + Socket.IO backend
├── packages/
│   ├── puzzle-core/      # Domain logic (pure TS)
│   ├── shared/           # Shared types, DTOs, Zod schemas
│   ├── llm-client/       # OpenRouter client + question validator agents
│   ├── react-chatbot-kit/ # Vendored chatbot kit used by web UI
│   └── config/           # Shared config (ESLint, TS, Tailwind)
├── tools/
│   └── agent-lab/        # CLI harness for LLM experiments (excluded from workspace)
└── .github/workflows/    # CI/CD
```

## Scripts

```bash
pnpm dev                 # Run web + server in parallel
pnpm dev:web             # Frontend only
pnpm dev:server          # Backend only
pnpm build               # Build packages then apps
pnpm lint                # ESLint across workspace
pnpm typecheck           # TypeScript project references
pnpm test                # Vitest unit tests
pnpm e2e                 # Playwright e2e tests
pnpm storybook:web       # Storybook (apps/web)
pnpm agent-lab:demo      # Run sample LLM agent suite
pnpm format              # Prettier format
```

`tools/agent-lab` is excluded from the workspace; the agent-lab scripts will auto-run `pnpm install` in that folder (or run `pnpm agent-lab:setup` yourself) before demos.

## Testing

- **Unit**: `pnpm test` (puzzle-core models, server game state, error handling)
- **E2E**: `pnpm e2e` (Playwright; see `apps/web/tests/e2e`)
- **Agent experiments**: `pnpm agent-lab:demo` or `pnpm agent-lab:demo:connections` for OpenRouter-backed validator runs (from `tools/agent-lab`)

## Documentation

- `AGENTS.md` – workspace guide and conventions
- `AGENT_TIPS_PLAYWRIGHT.md` – Playwright usage notes

## Development Workflow

- Work in feature branches
- Follow package boundaries in `AGENTS.md`
- Add tests alongside changes
- Run `pnpm lint` and `pnpm typecheck` before PRs

## License

MIT
