Here’s a Storybook integration plan phrased as tasks for your code agent, assuming:

* Frontend: `apps/web` (Next.js + TS + Tailwind).
* Chat UI: `SoupBotChat` from `apps/web/src/features/chatbot`.
* Monorepo: pnpm workspaces.

I’ll make Storybook live in **`apps/web`** (simplest), with a Story that renders your **chat bot front page**.

---

## Task 1 – Install Storybook in `apps/web`

**Goal:** Add Storybook (Next.js framework) to the web app.

1. From repo root, run (agent):

   ```bash
   cd apps/web
   pnpm dlx storybook@latest init --type nextjs
   ```

   * The official docs recommend `npx storybook@latest init` / `npm create storybook@latest`; using `pnpm dlx` is the pnpm equivalent.([Storybook][1])

2. Confirm Storybook generated:

   ```txt
   apps/web/
     .storybook/
       main.ts
       preview.ts
     stories/
       Button.stories.tsx
       ...
   ```

3. Check `.storybook/main.ts` has:

   ```ts
   const config: StorybookConfig = {
     framework: {
       name: '@storybook/nextjs',
       options: {},
     },
     // ...
   };
   ```

   per the official Next.js framework docs.([Storybook][1])

**Acceptance criteria**

* `pnpm -C apps/web storybook` (or `pnpm storybook` if script is present) starts Storybook at `http://localhost:6006` and shows the default example stories.

---

## Task 2 – Wire Storybook with Tailwind and global styles

**Goal:** Make Storybook render components with the same Tailwind styles as your app.

1. Open `apps/web/.storybook/preview.ts` and add an import for your global CSS (which includes the Tailwind directives like `@tailwind base;` etc.).

   For App Router default structure:

   ```ts
   import type { Preview } from '@storybook/react';
   import '../app/globals.css'; // adjust path if you keep styles elsewhere

   const preview: Preview = {
     parameters: {
       // keep what init created
     },
   };

   export default preview;
   ```

   This is exactly what the Storybook Tailwind recipe and Next.js+Tailwind guides recommend—import your app’s globals into `preview.ts`.([Storybook][2])

2. If you’re using any CSS variables or font setup (e.g. shadcn/ui), make sure they’re also in `globals.css` so Storybook picks them up.

**Acceptance criteria**

* Storybook’s default stories now render with Tailwind styling (e.g., utility classes on example components look correct).

---

## Task 3 – Scripts & monorepo integration

**Goal:** Make it easy (and agent-friendly) to run Storybook from root.

1. In `apps/web/package.json`, ensure these scripts exist (Storybook init usually adds them):

   ```jsonc
   {
     "scripts": {
       "storybook": "storybook dev -p 6006",
       "build-storybook": "storybook build"
     }
   }
   ```

2. In root `package.json`, add convenience scripts:

   ```jsonc
   {
     "scripts": {
       "storybook:web": "pnpm -C apps/web storybook",
       "build-storybook:web": "pnpm -C apps/web build-storybook"
     }
   }
   ```

3. Mention these in `AGENTS.md` so agents know how to launch the UI catalog.

**Acceptance criteria**

* From repo root: `pnpm storybook:web` starts the Storybook instance for `apps/web`.

Monorepo/Storybook with pnpm is a common setup; blogs show this pattern of per-app Storybook plus root scripts.([Zenn][3])

---

## Task 4 – Refactor chat front page into a reusable component

**Goal:** Have a single “chat front page” React component we can render both in Next.js pages and in Storybook.

1. Create a client-side component for the chat front page, e.g.:

   ```tsx
   // apps/web/src/features/chatbot/ChatHome.tsx
   'use client';

   import React from 'react';
   import { SoupBotChat } from './index'; // your Chatbot wrapper

   export interface ChatHomeProps {
     roomId?: string;
   }

   export const ChatHome: React.FC<ChatHomeProps> = ({ roomId }) => {
     return (
       <main className="min-h-screen flex items-center justify-center bg-slate-950">
         <div className="w-full max-w-md p-4">
           <h1 className="mb-3 text-center text-lg font-semibold text-orange-400">
             海龟汤聊天室
           </h1>
           <p className="mb-4 text-xs text-slate-300 text-center">
             向 SoupBot 提问任何“是/否”问题，一步步推理出真相。
           </p>
           <SoupBotChat roomId={roomId} />
         </div>
       </main>
     );
   };
   ```

2. Update your Next.js front page to reuse it:

   ```tsx
   // apps/web/app/page.tsx
   import { ChatHome } from '@/src/features/chatbot/ChatHome';

   export default function HomePage() {
     return <ChatHome />;
   }
   ```

**Acceptance criteria**

* Visiting `/` still shows the same chat UI as before, but now it’s powered by `ChatHome`, which can be reused in Storybook.

---

## Task 5 – Create a Storybook story for the chat bot front page

**Goal:** Add a Story that renders the full chat front page (`ChatHome`) so you can iterate on layout & styling quickly.

1. Create `apps/web/stories/ChatHome.stories.tsx` (or under `src/features/chatbot/__stories__` if you prefer):

   ```tsx
   // apps/web/stories/ChatHome.stories.tsx
   import type { Meta, StoryObj } from '@storybook/react';
   import { ChatHome, ChatHomeProps } from '../src/features/chatbot/ChatHome';

   const meta: Meta<typeof ChatHome> = {
     title: 'Pages/ChatHome',
     component: ChatHome,
     parameters: {
       layout: 'fullscreen',
     },
   };

   export default meta;

   type Story = StoryObj<typeof ChatHome>;

   export const Default: Story = {
     args: {
       roomId: 'storybook-room',
     } satisfies ChatHomeProps,
   };
   ```

2. Run Storybook and open “Pages / ChatHome”:

   ```bash
   pnpm storybook:web
   ```

3. Verify the chat page renders inside Storybook and responds to typing (see Task 6 for network mocking).

**Acceptance criteria**

* The Story “Pages/ChatHome” appears in Storybook and shows the full chat front page with your chatbot UI.

---

## Task 6 – Make the story fast & deterministic (mock backend)

**Goal:** In Storybook, the chat should not depend on your real backend; instead, it should use a simple mock so the UI is always interactive and fast.

There are a few ways to do this; for now, use the simplest: **inject a mock ActionProvider**.

### 6.1 Refactor `SoupBotChat` to allow ActionProvider override

1. Update `apps/web/src/features/chatbot/index.tsx`:

   ```tsx
   'use client';

   import Chatbot from 'react-chatbot-kit';
   import config from './config';
   import ActionProvider from './ActionProvider';
   import MessageParser from './MessageParser';

   export type SoupBotChatProps = {
     roomId?: string;
     actionProviderOverride?: typeof ActionProvider;
   };

   export const SoupBotChat: React.FC<SoupBotChatProps> = ({
     roomId,
     actionProviderOverride,
   }) => {
     const ActionProviderComponent = actionProviderOverride ?? ActionProvider;

     // you might also keep your localStorage persistence here

     return (
       <Chatbot
         config={config}
         messageParser={MessageParser}
         actionProvider={ActionProviderComponent}
       />
     );
   };
   ```

### 6.2 Create a `MockActionProvider` for Storybook

2. Add `apps/web/src/features/chatbot/MockActionProvider.tsx`:

   ```tsx
   'use client';

   import React, { ReactNode } from 'react';
   import type {
     createChatBotMessage as createChatBotMessageType,
   } from 'react-chatbot-kit';

   type MockActionProviderProps = {
     createChatBotMessage: typeof createChatBotMessageType;
     setState: React.Dispatch<React.SetStateAction<any>>;
     children: ReactNode;
   };

   const MockActionProvider: React.FC<MockActionProviderProps> = ({
     createChatBotMessage,
     setState,
     children,
   }) => {
     const reply = (content: string) => {
       const botMessage = createChatBotMessage(content);
       setState((prev: any) => ({
         ...prev,
         messages: [...prev.messages, botMessage],
       }));
     };

     const actions = {
       greet: () => reply('欢迎来到 Storybook 模式的海龟汤！'),
       handleUserMessage: (msg: string) =>
         reply(`(Mock) 你刚才问的是：${msg}`),
     };

     return (
       <>
         {React.Children.map(children, (child) =>
           React.cloneElement(child as React.ReactElement, {
             actions,
           })
         )}
       </>
     );
   };

   export default MockActionProvider;
   ```

3. Update the story to use `MockActionProvider` via args:

   ```tsx
   // apps/web/stories/ChatHome.stories.tsx
   import type { Meta, StoryObj } from '@storybook/react';
   import { ChatHome } from '../src/features/chatbot/ChatHome';
   import MockActionProvider from '../src/features/chatbot/MockActionProvider';

   const meta: Meta<typeof ChatHome> = {
     title: 'Pages/ChatHome',
     component: ChatHome,
     parameters: {
       layout: 'fullscreen',
     },
     decorators: [
       (Story) => (
         <div className="h-screen">
           <Story />
         </div>
       ),
     ],
   };

   export default meta;
   type Story = StoryObj<typeof ChatHome>;

   export const Mocked: Story = {
     args: {
       roomId: 'storybook-room',
     },
     render: (args) => (
       <ChatHome
         {...args}
         // pass down to SoupBotChat (make ChatHome forward it)
       />
     ),
   };
   ```

4. To make this work, adjust `ChatHome` to pass `actionProviderOverride` through to `SoupBotChat` when it exists (e.g., add `actionProviderOverride` to `ChatHomeProps` and forward it).

This pattern (passing mocks via props into components from stories) is a standard way to keep Storybook UI **decoupled from real network calls**.([DEV Community][4])

**Acceptance criteria**

* In Storybook, you can type in the chat and get instant mock responses, with no backend running.
* In the real app (`/`), the original `ActionProvider` is used and still calls your real backend.

---

## Task 7 – Document Storybook usage for agents

Update `AGENTS.md` with a **Storybook section**:

* **Where config lives:**

  * `apps/web/.storybook/` – Storybook config.
  * `apps/web/stories/ChatHome.stories.tsx` – Chat front page story.

* **How to run:**

  * `pnpm storybook:web` – starts Storybook for the web app.

* **How to add/modify stories:**

  * For new or changed chat UI components (message bubbles, widgets, puzzle cards), create stories under `apps/web/stories/` or next to the component in `__stories__`.

* **Guidelines:**

  * Use mock providers instead of hitting real APIs.
  * Prefer small, focused stories for sub-components (e.g., `PuzzleOverview`) plus one “full page” story (`ChatHome`) for layout.

This aligns with the “component-driven” workflow Storybook promotes: build and test UI elements in isolation to speed up development.([microCMSブログ][5])

---

If you want, I can next:

* Generate a concrete `ChatHome.stories.tsx` that fully wires `MockActionProvider` through `ChatHome`, or
* Add stories for lower-level components (e.g., the bot’s message bubble, puzzle overview widget) so you can tweak them visually in isolation.

[1]: https://storybook.js.org/docs/get-started/frameworks/nextjs?utm_source=chatgpt.com "Storybook for Next.js | Storybook docs"
[2]: https://storybook.js.org/recipes/tailwindcss?utm_source=chatgpt.com "Tailwind CSS | Storybook recipes"
[3]: https://zenn.dev/wakamsha/articles/setup-storybook7-with-pnpm-workspaces?utm_source=chatgpt.com "pnpm workspaces (monorepo) 上に Storybook 7 or 8 を導入 ..."
[4]: https://dev.to/layssadev/doing-integrating-storybook-into-an-existing-nextjs-project-34g8?utm_source=chatgpt.com "Integrating Storybook into an existing next.js project"
[5]: https://blog.microcms.io/storybook-react-use/?utm_source=chatgpt.com "Storybookを使ってReactの開発をX倍早くしよう！！便利な ..."
