# AGENTS.md - Guide for AI Code Agents

This document provides context and guidance for AI agents working on the vibe-ltp codebase.

## Project Overview

**vibe-ltp** is a lateral thinking puzzle game built as a pnpm monorepo. Players solve mystery puzzles by asking yes/no questions to uncover hidden solutions.

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 18, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO
- **Real-time**: Socket.IO for live rooms and Q&A
- **Monorepo**: pnpm workspaces with TypeScript project references

---

## Repository Structure

```
vibe-ltp/
├── apps/
│   ├── web/              # Next.js frontend
│   └── server/           # Express + Socket.IO backend
├── packages/
│   ├── puzzle-core/      # Domain logic (framework-free)
│   ├── shared/           # Shared types, DTOs, Zod schemas
│   ├── ui/               # Shared React components
│   └── config/           # Shared configs (ESLint, TS, Tailwind)
├── puzzle-content/       # JSON puzzle library
└── .github/workflows/    # CI/CD
```

### Key Packages

| Package | Purpose | Dependencies |
|---------|---------|--------------|
| `puzzle-core` | Pure domain logic (Puzzle, Session models) | `@vibe-ltp/shared` |
| `shared` | Types, API constants, Zod schemas | `zod` |
| `ui` | Reusable React components | `react`, `@vibe-ltp/shared` |
| `server` | REST API + Socket.IO | `express`, `socket.io` |
| `web` | Next.js UI | `next`, `@vibe-ltp/ui`, `@vibe-ltp/shared` |

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

2. **Start dev servers**
   ```bash
   # Start both frontend and backend
   pnpm dev

   # Or run individually
   pnpm dev:web      # Frontend only (localhost:3000)
   pnpm dev:server   # Backend only (localhost:4000)
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
```

---

## Architecture Principles

### 1. Domain Logic in `puzzle-core`

**ALL business logic** must go in `packages/puzzle-core`. This package is:
- ✅ Pure TypeScript (no React, Express)
- ✅ Framework-agnostic
- ✅ Easy to test

**Examples:**
- Session state machine
- Question/answer validation rules
- Puzzle difficulty scoring

### 2. Shared Types in `shared`

- Define all DTOs, API response types here
- Use Zod for runtime validation
- Import in both `server` and `web`

### 3. UI Components in `ui`

- Reusable React components
- No app-specific logic
- Use Tailwind for styling

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

---

## Testing Guidelines

### Unit Tests (Vitest)

- Focus on `puzzle-core` logic
- Test files: `*.spec.ts` or `*.test.ts`
- Run: `pnpm test`

**Example:**
```ts
// packages/puzzle-core/src/tests/session.spec.ts
import { describe, it, expect } from 'vitest';
import { Session } from '../models/Session';

describe('Session', () => {
  it('should start with WAITING_FOR_PLAYERS', () => {
    const session = new Session('id', mockPuzzle);
    expect(session.status).toBe('WAITING_FOR_PLAYERS');
  });
});
```

### E2E Tests (Playwright)

- Test critical user flows
- Run: `pnpm e2e`
- See `AGENT_TIPS_PLAYWRIGHT.md` for details

---

## Storybook - Component Development

### Overview

Storybook is integrated into `apps/web` for visual component development and testing. It allows developing UI components in isolation without running the full application.

### Configuration

- **Config location**: `apps/web/.storybook/`
  - `main.ts` - Storybook configuration (Next.js + Vite framework)
  - `preview.ts` - Global decorators and parameters (includes Tailwind CSS)
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

## Code Style & Conventions

### TypeScript

- ✅ Enable `strict` mode
- ✅ Use explicit types for function parameters
- ✅ Avoid `any` (use `unknown` if needed)
- ✅ Use `const` over `let`

### Naming

- Files: `camelCase.ts` or `PascalCase.tsx` (components)
- Variables/functions: `camelCase`
- Types/interfaces: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`

### Imports

- Use absolute imports from `@vibe-ltp/*` packages
- Group imports: external → workspace → relative

---

## Troubleshooting

### TypeScript Errors After Adding Dependencies

```bash
pnpm install
```

### Port Already in Use

Change `PORT` in `.env` or kill the process:
```bash
lsof -ti:4000 | xargs kill
```

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

4. **Ask before major architectural changes**
   - This project follows a specific structure
   - Discuss large changes with the team first

---

## Next Steps for Development

See the initialization plan for roadmap phases:
1. ✅ Scaffold monorepo
2. ✅ Add puzzle-core models
3. 🚧 Wire up backend (Prisma, routes, sockets)
4. ⏸ Seed content & DB
5. ⏸ Basic frontend (puzzle list, room UI)
6. ⏸ Full Q&A flow
7. ⏸ Polish & testing

---

## Additional Resources

- [Next.js App Router](https://nextjs.org/docs/app)
- [Socket.IO Docs](https://socket.io/docs/v4)
- [TanStack Query](https://tanstack.com/query/latest)
