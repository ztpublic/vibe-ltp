Here’s a project infrastructure plan modeled after **vibe-baodatui**’s style (pnpm monorepo, Next.js + Express + Socket.IO, shared TS packages, AGENTS docs).([GitHub][1])

I’ll call your game `vibe-soups` below just as a placeholder name.

---

## 1. High-level architecture

**Goals**

* Code-agent-friendly:

  * Strong typing everywhere (TypeScript, Prisma, Zod).
  * Clear boundaries: UI / API / domain logic / shared types in separate packages.
  * Simple commands (`pnpm dev`, `pnpm test`, `pnpm e2e`) and good AGENTS docs.
* Similar structure to `vibe-baodatui`:

  * `apps/web` – Next.js UI.
  * `apps/server` – Express + Socket.IO API + session state.
  * `packages/*` – domain logic, shared types, utilities.([GitHub][1])

**Key components**

* **Frontend**: Next.js (App Router), React, Tailwind, shadcn/ui.
* **Backend**: Node + Express + Socket.IO (for live rooms / Q&A), REST/JSON endpoints.
* **DB**: Postgres + Prisma.
* **Monorepo tooling**: pnpm workspace, TypeScript project references, ESLint, Prettier.
* **Tests**: Vitest (units), Playwright (e2e), maybe React Testing Library.
* **Infra**: Docker Compose (Postgres, maybe Redis later), GitHub Actions CI.

---

## 2. Monorepo layout

Mirror the overall shape of `vibe-baodatui` (apps + packages + rules).([GitHub][1])

```txt
vibe-soups/
  apps/
    web/              # Next.js app router frontend
    server/           # Express + Socket.IO backend
  packages/
    puzzle-core/      # Domain logic for lateral puzzles
    shared/           # Shared types, DTOs, utils
    ui/               # Shared React UI components
    config/           # ESLint, TS, Tailwind configs, etc.
  puzzle-content/     # JSON/YAML puzzle library (soupSurface / soupBottom)
  .github/
    workflows/        # CI configs
  .vscode/
    launch.json
    tasks.json
  AGENTS.md
  AGENT_TIPS_PLAYWRIGHT.md
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  eslint.config.mjs
  docker-compose.yml
  .env.example
  README.md
```

### `pnpm-workspace.yaml`

Keep it simple and agent-friendly:

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "puzzle-content"
```

---

## 3. Root tooling & conventions

**Root `package.json`**

* Scripts (single entry points for agents):

  ```jsonc
  {
    "scripts": {
      "dev": "pnpm -C apps/server dev & pnpm -C apps/web dev",
      "dev:web": "pnpm -C apps/web dev",
      "dev:server": "pnpm -C apps/server dev",
      "lint": "eslint .",
      "typecheck": "tsc -p tsconfig.base.json --noEmit",
      "test": "vitest --runInBand",
      "e2e": "playwright test",
      "format": "prettier --write ."
    }
  }
  ```

* Depend on:

  * `typescript`, `ts-node`, `tsx`
  * `eslint`, `@typescript-eslint/*`
  * `prettier`
  * `vitest`, `playwright`
  * `pnpm` used via workspace (like vibe-baodatui).([GitHub][1])

**Config package (`packages/config`)**

* Export shared config:

  * `eslint.config.mjs`
  * `tsconfig` base
  * shared `tailwind.config` if needed.
* All apps and packages import from here for consistency.

---

## 4. Backend (`apps/server`)

**Tech stack**

* Node 20+
* Express
* Socket.IO (for real-time puzzle rooms, question/answer flow).
* Prisma (Postgres).
* Zod for validation of API payloads.

**Responsibilities**

* User & session management (simple auth first: anonymous or magic-link; real auth later).
* Puzzle CRUD & listing (pull from DB + `puzzle-content/` seed).
* Room management:

  * Create room, join room.
  * Assign roles: host / players / spectators.
  * Keep room state (current puzzle, asked questions, status).
* Real-time events over Socket.IO:

  * `question:asked`, `host:answer`, `hint:revealed`, `solution:revealed`, `room:stateUpdated`.

**Directory structure**

```txt
apps/server/
  src/
    index.ts              # HTTP + Socket.IO bootstrap
    config/               # env, constants
    db/                   # Prisma client
    http/
      routes/             # REST endpoints (e.g. /api/puzzles, /api/rooms)
      middleware/
    sockets/
      index.ts            # socket setup
      handlers/           # room-related handlers
    services/             # orchestrating domain logic
    adapters/             # map HTTP/WS <-> puzzle-core
    tests/
      unit/
      integration/
  prisma/
    schema.prisma
  package.json
  tsconfig.json
```

**Prisma schema sketch**

* `User`, `Puzzle`, `PuzzleTag`, `Room`, `RoomParticipant`, `Question`, `Answer`, etc.
* Keep each table simple and well-commented so agents can map features to DB.

**API style**

* REST JSON endpoints + Socket.IO events.
* Request/response types imported from `packages/shared` for strong typing.

---

## 5. Frontend (`apps/web`)

**Tech stack**

* Next.js (latest, App Router).
* React (with React Server Components where useful).
* Tailwind CSS, shadcn/ui for consistent UI primitives.
* Socket.IO client.
* TanStack Query (React Query) for HTTP data fetching & caching.

**Responsibilities**

* Lobby, puzzle browser, filters, tags.
* Room UI (live Q&A stream, yes/no/maybe answers, hints, reveal solution).
* Single-player mode (auto-host by server).
* Admin tool (internal page) to add/edit puzzles.

**Structure**

```txt
apps/web/
  app/
    layout.tsx
    page.tsx             # Landing / lobby
    puzzles/
      page.tsx           # Browse puzzles
      [id]/
        page.tsx         # Puzzle detail / practice mode
    rooms/
      [roomId]/
        page.tsx         # Live soup session UI
    admin/
      puzzles/
        page.tsx         # Simple CMS for puzzles
  components/
    layout/
    puzzle/
    room/
    common/
  lib/
    api/                 # thin wrappers over REST
    sockets/             # socket client setup
    hooks/
  tests/
    unit/
    e2e/                 # Playwright tests (or centralized at root)
  package.json
  tsconfig.json
  next.config.mjs
  tailwind.config.ts
```

---

## 6. Domain packages

### `packages/puzzle-core`

Pure domain logic, no framework imports. This is where code agents should spend most of their reasoning time.

**Contents**

* Puzzle model:

  * `Puzzle` with `soupSurface`, `soupBottom`, `tags`, `difficulty`, `sourceLanguage`, etc.
* Session state machine:

  * States: `WAITING_FOR_PLAYERS`, `IN_PROGRESS`, `SOLVED`, `ABANDONED`.
* Question/answer rules:

  * Limit number of questions?
  * How to record yes/no/maybe/irrelevant.
  * Scoring / hint logic (optional).
* Helper functions:

  * `createSession(puzzle: Puzzle): Session`
  * `askQuestion(session, questionText)`
  * `answerQuestion(session, answerType, explanation?)`
  * `revealSolution(session)`
* Types are exported to `packages/shared`.

**Structure**

```txt
packages/puzzle-core/
  src/
    models/
    session/
    rules/
    index.ts
  tests/
    session.spec.ts
  package.json
  tsconfig.json
```

This package should have **100% framework-free, pure TypeScript** to be super agent-friendly.

### `packages/shared`

Shared types & utilities for both server and web.

* DTOs, API response types, enums, etc.
* Zod schemas mirroring types for validation.

```txt
packages/shared/
  src/
    types/
      puzzles.ts
      rooms.ts
      users.ts
    api/
      endpoints.ts  # e.g. route constants, typed clients
    validation/
      puzzleSchemas.ts
  package.json
```

### `packages/ui`

Optional but nice for reuse + agent clarity.

* Reusable React components: buttons, cards, modals, layout primitives.
* Maybe specialized components like `PuzzleCard`, `QuestionList`, etc.

---

## 7. Puzzle content module

Use a lightweight, agent-editable format for your soup library.

```txt
puzzle-content/
  src/
    index.ts          # loader utilities
    data/
      classic.json    # [{ soupSurface, soupBottom, tags, ... }]
      horror.json
      sci-fi.json
  package.json
```

* For initial bootstrap, you can place the JSON you’re already collecting (`soupSurface`, `soupBottom`) here.
* Add simple import script in `apps/server` to seed DB from these files (idempotent).

---

## 8. Dev & infra setup

### Docker & local services

`docker-compose.yml` at root:

* `db`: Postgres.
* (Optional later) `redis`: for pub/sub or caching room events.

Example services:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: soup
      POSTGRES_PASSWORD: soup
      POSTGRES_DB: soupdb
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
volumes:
  db_data:
```

Then in `AGENTS.md`, clearly instruct:

* `docker compose up -d db`
* `pnpm install`
* `pnpm prisma migrate dev`
* `pnpm dev`

### CI (GitHub Actions)

Workflow: `.github/workflows/ci.yml`

Jobs:

1. Install pnpm.
2. `pnpm install --frozen-lockfile`.
3. `pnpm lint`.
4. `pnpm typecheck`.
5. `pnpm test`.
6. (Optional) `pnpm e2e` in headless mode.

Keep the workflow linear and well-named so agents can map failures to commands.

---

## 9. Code-agent-friendly practices

This is the part to really lean into, inspired by `vibe-baodatui`’s AGENTS note about environment/setup/Playwright workflows.([GitHub][1])

### `AGENTS.md` at root

Outline:

1. **Project map**

   * Short description of each app/package.
   * High-level data flow: web → server → puzzle-core → DB.
2. **How to run things**

   * Dev: `pnpm dev`.
   * Backend only: `pnpm dev:server`.
   * Frontend only: `pnpm dev:web`.
   * Tests: `pnpm test`, `pnpm e2e`.
3. **Conventions**

   * Always put domain logic in `puzzle-core`.
   * Shared types in `packages/shared`.
   * Don’t access Prisma directly from web.
4. **Typical tasks**

   * “Add a new field to puzzles and show it in the UI.”
   * “Add a new question filter in the room page.”
   * “Implement scoring for questions asked.”
   * For each, list **files to touch** & **commands to run**.
5. **LLM-specific tips**

   * Don’t refactor everything at once.
   * Prefer adding tests before deep refactors.
   * Use existing patterns in `puzzle-core` instead of inventing new ones.

### `AGENT_TIPS_PLAYWRIGHT.md`

* Describe how to run e2e tests for key flows:

  * “Create a room, join as second player, ask questions, reveal solution.”
* Show exact commands & where tests live.
* Suggest that agents add new tests when they change flows.

### Testing focus

* Keep tests small and clear, especially around `puzzle-core`:

  * Example: `session.spec.ts` with many short test cases.
* Playwright scenarios use human-readable test names like `"host and player can complete a puzzle"` so agents understand the flow.

---

## 10. Implementation phases (for you / your agents)

You can phrase this as a backlog in your repo, but roughly:

1. **Scaffold monorepo**

   * pnpm workspace.
   * `apps/web`, `apps/server`, basic `packages/config`, `packages/shared`.
2. **Add `puzzle-core` and basic models**

   * Implement `Puzzle` model and simple `Session` with tests.
3. **Wire up backend**

   * Prisma schema.
   * Basic REST: `GET /api/puzzles`.
   * Socket.IO skeleton: join room, broadcast “joined”.
4. **Seed content & DB**

   * Move your JSON soups into `puzzle-content` and write a seed script.
5. **Basic frontend**

   * Puzzle list page.
   * Single puzzle page (surface text, “start solo session”).
   * Very simple room page with question/answer log.
6. **Improve UX + real-time**

   * Full question/answer interactions.
   * Room lobby, host controls, solution reveal.
7. **Harden for agents**

   * Polish `AGENTS.md` & `AGENT_TIPS_PLAYWRIGHT.md`.
   * Add more tests around key flows.
   * Add comments in domain code where non-obvious.

---

If you like, next step I can:

* Draft concrete `AGENTS.md` content tailored to this layout, or
* Give you a ready-to-copy initial `pnpm-workspace.yaml`, root `package.json`, and skeleton file trees so your first code agent can just start filling them in.

[1]: https://github.com/zt1106/vibe-baodatui "GitHub - zt1106/vibe-baodatui: a vibe-coded multiplayer poker game"
