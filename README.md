# Vibe LTP - Lateral Thinking Puzzle Game

A multiplayer lateral thinking puzzle game built with Next.js, Express, and Socket.IO.

## Features

- 🧩 Browse and solve lateral thinking puzzles
- 👥 Real-time multiplayer rooms
- 💡 Interactive Q&A system (yes/no questions)
- 🎯 Host and player roles
- 📊 Multiple difficulty levels
- 🏷️ Puzzle categorization with tags

## Tech Stack

- **Frontend**: Next.js 16, React 18, Tailwind CSS, TanStack Query
- **Backend**: Node.js, Express, Socket.IO
- **Database**: PostgreSQL with Prisma
- **Monorepo**: pnpm workspaces
- **Testing**: Vitest (unit), Playwright (e2e)
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd vibe-ltp

# Install dependencies
pnpm install

# Start database
docker compose up -d

# Setup environment
cp .env.example .env

# Run database migrations
cd apps/server
pnpm prisma migrate dev

# Start development servers
cd ../..
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

### Available Commands

```bash
pnpm dev          # Start both frontend and backend
pnpm dev:web      # Start frontend only
pnpm dev:server   # Start backend only
pnpm lint         # Lint all packages
pnpm typecheck    # TypeScript type checking
pnpm test         # Run unit tests
pnpm e2e          # Run e2e tests
pnpm format       # Format code
```

## Project Structure

```
vibe-ltp/
├── apps/
│   ├── web/              # Next.js frontend
│   └── server/           # Express + Socket.IO backend
├── packages/
│   ├── puzzle-core/      # Domain logic
│   ├── shared/           # Shared types & utils
│   ├── ui/               # React components
│   └── config/           # Shared configurations
├── puzzle-content/       # Puzzle data (JSON)
└── .github/workflows/    # CI/CD
```

## Documentation

- [AGENTS.md](./AGENTS.md) - Guide for AI code agents
- [AGENT_TIPS_PLAYWRIGHT.md](./AGENT_TIPS_PLAYWRIGHT.md) - E2E testing guide

## Development Workflow

1. Create a feature branch
2. Make changes following the architecture in `AGENTS.md`
3. Add tests
4. Run `pnpm lint` and `pnpm typecheck`
5. Create a pull request

## License

MIT
