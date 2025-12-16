# AGENTS.md - Guide for AI Code Agents

This document provides context and guidance for AI agents working on the vibe-ltp codebase.

## Project Overview

**vibe-ltp** is a lateral thinking puzzle game built as a pnpm monorepo. Players solve mystery puzzles by asking yes/no questions to uncover hidden solutions, with an LLM acting as the host/judge for player questions.

### Tech Stack

- **Frontend**: Next.js 16 (App Router), React 18, Tailwind CSS v4, TanStack Query
- **Backend**: Node.js, Express, Socket.IO (websocket transport)
- **Real-time**: Socket.IO for live rooms and Q&A
- **LLM**: OpenRouter + AI SDK in `packages/llm-client`
- **Monorepo**: pnpm workspaces with TypeScript project references

---

## Repository Structure

```
vibe-ltp/
├── apps/
│   ├── web/              # Next.js frontend (local UI kit in src/ui)
│   └── server/           # Express + Socket.IO backend
├── packages/
│   ├── puzzle-core/      # Domain logic (framework-free)
│   ├── shared/           # Shared types, DTOs, Zod schemas
│   ├── llm-client/       # OpenRouter client + puzzle agents
│   └── config/           # Shared configs (ESLint, TS, Tailwind)
├── tools/
│   └── agent-lab/        # CLI harness + fixtures for LLM experiments (excluded from workspace)
└── .github/workflows/    # CI/CD
```

### Key Packages

| Package       | Purpose                                                    | Dependencies                                   |
| ------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| `puzzle-core` | Pure domain logic (Puzzle, Session models)                 | `@vibe-ltp/shared`                             |
| `shared`      | Types, API constants, Zod schemas                          | `zod`                                          |
| `llm-client`  | OpenRouter client + question validator agent helpers       | `ai`, `@openrouter/ai-sdk-provider`, `zod`     |
| `server`      | REST API + Socket.IO + LLM question validator              | `express`, `socket.io`, `@vibe-ltp/llm-client` |
| `web`         | Next.js UI (chatbot UI lives in `apps/web/src/ui/chatbot`) | `next`, `@vibe-ltp/shared`                     |

**Tools (excluded from workspace)**: `tools/agent-lab` – CLI experiments for LLM agents (`@vibe-ltp/llm-client`, `dotenv`)

---

## How to Run

### Prerequisites

- Node.js 20+
- pnpm 9+

### Setup Steps

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure environment variables** (root `.env`, copied from `.env.example`)

   ```bash
   cp .env.example .env
   # Required: OPENROUTER_API_KEY (needed for chat replies)
   # Optional: BACKEND_PORT (default: 4000), FRONTEND_PORT (default: 3000), CORS_ORIGIN
   ```

3. **Start dev servers**

   ```bash
   # Start both frontend and backend
   pnpm dev

   # Or run individually
   pnpm dev:web      # Frontend only (defaults to localhost:3000)
   pnpm dev:server   # Backend only (defaults to localhost:4000)

   # With custom ports
   FRONTEND_PORT=8080 BACKEND_PORT=8081 pnpm dev
   ```

### Other Commands

```bash
pnpm lint          # Lint all packages
pnpm typecheck     # TypeScript type checking
pnpm test          # Run unit tests (Vitest)
pnpm e2e           # Run e2e tests (Playwright)
pnpm format        # Format code with Prettier
pnpm storybook:web # Run Storybook for visual component development
pnpm build-storybook:web # Build Storybook for deployment
pnpm agent-lab:demo # Run sample LLM agent experiments (OpenRouter)
pnpm agent-lab:demo:connections # Connection-puzzle agent demo
```

`tools/agent-lab` is outside the workspace; the agent-lab scripts auto-run `pnpm install` there (or run `pnpm agent-lab:setup` yourself) if dependencies are missing.

---

## Architecture Principles

### 1. Domain Logic in `puzzle-core`

**ALL business logic** must go in `packages/puzzle-core`. This package is:

- ✅ Pure TypeScript (no React, Express)
- ✅ Framework-agnostic
- ✅ Easy to test

**Examples:**

- Puzzle model with tag filtering and sanitization
- Question/answer validation rules (pure functions)

**Note:** This project uses a simplified single-session architecture with global state management in the server instead of Session domain models. This approach better fits the single-page, single-game design.

### 2. LLM Clients in `llm-client`

- Use `packages/llm-client` for all OpenRouter calls (question validator, connection distiller, formatting helpers).
- `validatePuzzleQuestion` is the entry point for judging player questions.
- `formatValidationReply` turns agent output into chat-friendly responses.
- Keep prompts/config centralized here; avoid duplicating prompt strings elsewhere.

### 3. Shared Types in `shared`

- Define all DTOs, API response types here
- Use Zod for runtime validation
- Import in both `server` and `web`

### 4. UI Components in `apps/web/src/ui`

- Reusable React components co-located with the web app
- No app-specific logic beyond the chatbot kit; share styles via Tailwind/CSS imports

### 5. Agent Experiments in `tools/agent-lab`

- Use `tools/agent-lab` to run offline/CLI experiments against OpenRouter (excluded from the pnpm workspace).
- Fixtures live in `tools/agent-lab/src/fixtures`.
- Keep experiments out of runtime packages; they are for evaluation only.

### 6. Server State

- Backend currently runs a single-room, in-memory game state (`apps/server/src/state`).
- Socket.IO uses websocket transport only; keep payloads lean to avoid reconnect thrash.

---

## Common Tasks

### Add a New API Endpoint

1. **Add route** in `apps/server/src/http/routes/`
2. **Import types** from `@vibe-ltp/shared`
3. **Validate request** with Zod schemas
4. **Call from frontend** using fetch/TanStack Query

### Add a Socket.IO Event

1. **Define event constant** in `packages/shared/src/api/endpoints.ts`

   ```ts
   export const SOCKET_EVENTS = {
     // ... existing events
     NEW_EVENT: 'new:event',
   };
   ```

2. **Add handler** in `apps/server/src/sockets/index.ts`
3. **Emit/listen** in `apps/web` components

### Run an LLM Question Evaluation

1. Ensure `.env` has `OPENROUTER_API_KEY`.
2. Call `validatePuzzleQuestion` from `@vibe-ltp/llm-client` with puzzle context (surface, truth, conversation history).
3. Use `formatValidationReply` for UI-friendly responses.
4. Keep agent prompts/settings close to `llm-client`; avoid duplicating prompt text in app code.

---

## Testing Guidelines

### Unit Tests (Vitest)

- Focus on `puzzle-core` logic and server state management
- Test files: `*.spec.ts` or `*.test.ts`
- Run: `pnpm test`

**Key Test Suites:**

- `packages/puzzle-core/src/models/Puzzle.test.ts` - Puzzle domain model
- `apps/server/src/state/gameState.test.ts` - Game state management with validation
- `apps/server/src/utils/errorHandler.test.ts` - Socket error handling utilities
- `packages/llm-client` - Keep pure helpers testable without hitting network (mock AI SDK)

### E2E Tests (Playwright)

- Test critical user flows
- Run: `pnpm e2e`
- See `AGENT_TIPS_PLAYWRIGHT.md` for details

### Agent Lab Experiments

- `pnpm agent-lab:demo` runs the sample question validator suite (auto-installs deps in `tools/agent-lab`).
- `pnpm agent-lab:demo:connections` targets connection puzzles (auto-installs deps in `tools/agent-lab`).
- These hit OpenRouter; expect network/model costs.

---

## Storybook - Component Development

### Overview

Storybook is integrated into `apps/web` for visual component development and testing. It allows developing UI components in isolation without running the full application.

### Configuration

- **Config location**: `apps/web/.storybook/`
  - `main.ts` - Storybook configuration (Next.js + Vite framework)
  - `preview.ts` - Global decorators and parameters (includes Tailwind CSS v4)
  - `vitest.setup.ts` - Vitest integration for component testing

- **Stories location**:
  - `apps/web/stories/` - Page-level stories (e.g., ChatHome)
  - `apps/web/src/**/*.stories.tsx` - Component-level stories

### Running Storybook

```bash
# From project root
pnpm storybook:web

# Or from apps/web
cd apps/web
pnpm storybook
```

Storybook will start at `http://localhost:6006`

### Creating Stories

#### For Small Components

Create stories next to components for quick iterations:

```tsx
// apps/web/src/features/chatbot/widgets/PuzzleCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PuzzleCard } from './PuzzleCard';

const meta: Meta<typeof PuzzleCard> = {
  title: 'Chatbot/Widgets/PuzzleCard',
  component: PuzzleCard,
};

export default meta;
type Story = StoryObj<typeof PuzzleCard>;

export const Default: Story = {
  args: {
    title: 'Sample Puzzle',
    difficulty: 'medium',
  },
};
```

#### For Page-Level Components

Full-page stories go in `apps/web/stories/`:

```tsx
// apps/web/stories/ChatHome.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ChatHome } from '../src/features/chatbot/ChatHome';
import MockActionProvider from '../src/features/chatbot/MockActionProvider';

const meta: Meta<typeof ChatHome> = {
  title: 'Pages/ChatHome',
  component: ChatHome,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

export const Mocked: Story = {
  args: {
    actionProviderOverride: MockActionProvider,
  },
};
```

### Mock Providers

**Important**: Never hit real APIs from Storybook stories. Always use mocks.

- **Chat bot mock**: Use `MockActionProvider` from `src/features/chatbot/MockActionProvider.tsx`
- **Custom mocks**: Create mock providers for any component that needs backend data

#### How to Use Mocks

1. Make components accept optional provider overrides:

   ```tsx
   export interface MyComponentProps {
     dataProvider?: typeof RealProvider;
   }
   ```

2. Pass mock providers in stories:
   ```tsx
   export const Mocked: Story = {
     args: {
       dataProvider: MockProvider,
     },
   };
   ```

### Best Practices

1. **Component-driven development**
   - Build UI components in Storybook first
   - Test different states and props
   - Then integrate into the app

2. **One story per state**
   - Default state
   - Loading state
   - Error state
   - Empty state

3. **Keep stories simple**
   - Focus on visual variations
   - Use args for dynamic props
   - Avoid complex logic in stories

4. **Accessibility testing**
   - Storybook includes `@storybook/addon-a11y`
   - Check the Accessibility tab for violations

### Addons Available

- `@storybook/addon-docs` - Auto-generated documentation
- `@storybook/addon-a11y` - Accessibility testing
- `@storybook/addon-vitest` - Component testing with Vitest
- `@chromatic-com/storybook` - Visual regression testing

---

## Troubleshooting

### TypeScript Errors After Adding Dependencies

```bash
pnpm install
```

### Port Already in Use

Change ports using environment variables:

```bash
# Use custom ports
FRONTEND_PORT=8080 BACKEND_PORT=8081 pnpm dev

# Or kill the process using the port
lsof -ti:4000 | xargs kill
```

### Environment Variables

All environment variables are documented in `.env.example`:

**Required:**

- `OPENROUTER_API_KEY` - OpenRouter API key for LLM features

**Optional:**

- `BACKEND_PORT` - Backend server port (default: 4000)
- `FRONTEND_PORT` - Frontend dev server port (default: 3000)
- `CORS_ORIGIN` - Allowed CORS origins (default: http://localhost:3000)
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL for frontend (default: http://localhost:4000)
- `OPENROUTER_REFERRER` - App referrer for OpenRouter
- `OPENROUTER_APP_TITLE` - App title for OpenRouter

---

## LLM-Specific Tips

1. **Don't refactor everything at once**
   - Make incremental changes
   - Test after each change

2. **Follow existing patterns**
   - Look at similar features before adding new ones
   - Keep consistency across the codebase

3. **Domain logic first**
   - Start with `puzzle-core` when adding features
   - Then wire up server → web
   - Keep LLM agents centralized in `llm-client`

4. **Ask before major architectural changes**
   - This project follows a specific structure
   - Discuss large changes with the team first

---

## Next Steps for Development

See the initialization plan for roadmap phases:

1. ✅ Scaffold monorepo
2. ✅ Add puzzle-core/shared models
3. 🚧 Wire up backend + LLM question validation (Express routes, sockets)
4. 🚧 Frontend chatbot UX and room flow
5. ⏸ Seed content & DB
6. ⏸ Full Q&A flow + persistence
7. ⏸ Polish & testing

---

## Additional Resources

- [Next.js App Router](https://nextjs.org/docs/app)
- [Socket.IO Docs](https://socket.io/docs/v4)
- [TanStack Query](https://tanstack.com/query/latest)
