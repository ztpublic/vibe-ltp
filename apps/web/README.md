# @vibe-ltp/web (Next.js App)

This is the Next.js frontend for the `vibe-ltp` monorepo. For the full project overview (backend, packages, scripts), see the root `README.md`.

## Prereqs

- Node.js 20+
- pnpm 9+

## Run (recommended from repo root)

```bash
pnpm install
cp .env.example .env
pnpm dev:web
```

Defaults:

- Web: http://localhost:3000 (override with `FRONTEND_PORT`)
- API base URL: `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:4000`)

## Useful commands

```bash
pnpm storybook:web   # Storybook (http://localhost:6006)
pnpm e2e             # Playwright tests (root config)
pnpm lint            # Workspace lint
pnpm typecheck       # Workspace typecheck
```

## UI locations

- Chatbot UI components: `apps/web/src/ui/chatbot`
- Chatbot feature wiring/config: `apps/web/src/features/chatbot`
