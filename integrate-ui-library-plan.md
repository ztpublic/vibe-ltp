Here’s a concrete, code-agent-oriented plan to integrate **react-chatbot-kit** as your main chat UI.

I’ll assume:

* Your React/Next.js frontend lives in `apps/web`.
* You’re using TypeScript + pnpm.
* You want the chatbot to be the **primary interaction UI** for lateral thinking puzzles (not just a tiny “support” bubble).

I’ll phrase this as a sequence of tasks your agent can execute.

---

## 0. Library understanding (for the agent)

**Key concepts from react-chatbot-kit**

From the official docs: you always provide **three things**: `config`, `ActionProvider`, and `MessageParser`.([fredrikoseberg.github.io][1])

* **`config`**

  * Defines initial messages, bot name, styles, widgets, and “state” injected into the internal chatbot state.([fredrikoseberg.github.io][2])
* **`ActionProvider`**

  * A component/class that receives helper functions like `createChatBotMessage` and `setState`, and exposes an `actions` object to the rest of the bot tree. It creates bot messages and triggers side-effects (like calling your backend).([fredrikoseberg.github.io][1])
* **`MessageParser`**

  * Gets user messages and decides **which actions** to call on the `ActionProvider` (e.g., route to “ask puzzle question”, “request hint”, etc.).([fredrikoseberg.github.io][1])
* **Widgets / custom components**

  * Registered in `config.widgets`; they let you render **custom React components** (e.g., puzzle overview, suggestion chips) directly inside the chat window.([fredrikoseberg.github.io][3])
* **Persistent history**

  * You can pass `saveMessages` and `messageHistory` props to the `<Chatbot>` component to persist dialogue (e.g. to `localStorage`).([fredrikoseberg.github.io][4])

Latest published version is `2.2.2`, MIT licensed.([npmjs.com][5])

---

## Task 1 – Add dependency & basic wiring

**Goal:** Install `react-chatbot-kit` and confirm a simple bot renders in your Next.js app.

**Steps for the agent**

1. **Install package in `apps/web`:**

   ```bash
   pnpm -C apps/web add react-chatbot-kit
   ```

2. **Import global CSS once** (important for Next.js):

   * In `apps/web/app/layout.tsx` (App Router) or `pages/_app.tsx` (Pages Router), add:

   ```ts
   import 'react-chatbot-kit/build/main.css';
   ```

   This follows the official “Getting Started” docs that require importing `Chatbot` and its CSS globally.([fredrikoseberg.github.io][1])

3. **Create chatbot folder structure** in `apps/web`:

   ```txt
   apps/web/
     src/
       features/
         chatbot/
           config.ts
           ActionProvider.tsx
           MessageParser.tsx
           widgets/
             PuzzleOverview.tsx
             SuggestionChips.tsx
           index.tsx
   ```

4. **Create a simple initial config** (`config.ts`):

   ```ts
   // apps/web/src/features/chatbot/config.ts
   'use client';

   import { createChatBotMessage } from 'react-chatbot-kit';

   export const BOT_NAME = 'SoupBot';

   const config = {
     botName: BOT_NAME,
     initialMessages: [
       createChatBotMessage(
         `你好，我是 ${BOT_NAME}。我们来玩海龟汤吧，随便问任何“是/否”问题来探索真相。`
       ),
     ],
   } as const;

   export default config;
   ```

5. **Create minimal `ActionProvider`** (`ActionProvider.tsx`):

   ```tsx
   // apps/web/src/features/chatbot/ActionProvider.tsx
   'use client';

   import React, { ReactNode } from 'react';
   import type {
     createChatBotMessage as createChatBotMessageType,
   } from 'react-chatbot-kit';

   type ActionProviderProps = {
     createChatBotMessage: typeof createChatBotMessageType;
     setState: React.Dispatch<React.SetStateAction<any>>;
     children: ReactNode;
   };

   const ActionProvider: React.FC<ActionProviderProps> = ({
     createChatBotMessage,
     setState,
     children,
   }) => {
     const greet = () => {
       const botMessage = createChatBotMessage('欢迎来到海龟汤游戏！');

       setState((prev: any) => ({
         ...prev,
         messages: [...prev.messages, botMessage],
       }));
     };

     const actions = {
       greet,
       // later: askQuestion, requestHint, revealSolution, etc.
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

   export default ActionProvider;
   ```

6. **Create minimal `MessageParser`** (`MessageParser.tsx`):

   ```tsx
   // apps/web/src/features/chatbot/MessageParser.tsx
   'use client';

   import React, { ReactNode } from 'react';

   type MessageParserProps = {
     children: ReactNode;
     actions: {
       greet: () => void;
       // later: askQuestion, requestHint, revealSolution, etc.
     };
   };

   const MessageParser: React.FC<MessageParserProps> = ({ children, actions }) => {
     const parse = (message: string) => {
       const lower = message.toLowerCase();
       if (lower.includes('hi') || lower.includes('你好')) {
         actions.greet();
         return;
       }

       // TODO: later route to game logic (ask question, ask hint, etc.)
       actions.greet();
     };

     return (
       <>
         {React.Children.map(children, (child) =>
           React.cloneElement(child as React.ReactElement, {
             parse,
           })
         )}
       </>
     );
   };

   export default MessageParser;
   ```

7. **Wrap `<Chatbot>` in a reusable component** (`index.tsx`):

   ```tsx
   // apps/web/src/features/chatbot/index.tsx
   'use client';

   import Chatbot from 'react-chatbot-kit';
   import config from './config';
   import ActionProvider from './ActionProvider';
   import MessageParser from './MessageParser';

   export const SoupBotChat: React.FC = () => {
     return (
       <div className="max-w-md">
         <Chatbot
           config={config}
           messageParser={MessageParser}
           actionProvider={ActionProvider}
         />
       </div>
     );
   };
   ```

8. **Render the bot somewhere visible** (e.g. `app/page.tsx` or a `Room` page):

   ```tsx
   // apps/web/app/page.tsx
   import { SoupBotChat } from '@/src/features/chatbot';

   export default function HomePage() {
     return (
       <main className="p-4 flex justify-center">
         <SoupBotChat />
       </main>
     );
   }
   ```

**Acceptance criteria**

* `pnpm -C apps/web dev` runs.
* The homepage shows a basic chatbot with an initial greeting and a simple “hi/你好” response.

---

## Task 2 – Integrate with your puzzle backend

**Goal:** When the user types a message, the bot calls your backend (or `puzzle-core` in the frontend) and shows a meaningful response.

There are two main strategies:

1. **Frontend-only, using `puzzle-core`** for deterministic logic.
2. **Backend-driven**: ActionProvider calls `POST /api/chat` and displays the response.

Given your architecture (Express/Socket.IO) and lateral puzzles, you’ll likely do both (some local rules + server state). For now, use **HTTP** in the ActionProvider; you can add Socket.IO later.

### 2.1 Define a typed chat API contract

In `packages/shared`:

```ts
// packages/shared/src/api/chat.ts
export type ChatRole = 'user' | 'bot' | 'system';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  timestamp: string; // ISO
}

export interface ChatRequest {
  roomId?: string;
  puzzleId?: string;
  message: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  reply: ChatMessage;
  newState?: Record<string, unknown>; // optional puzzle/session data
}
```

This mirrors how example projects use both static and **dynamic API-backed bot responses**.([GitHub][6])

### 2.2 Implement `/api/chat` in your backend

* In `apps/server`, add a simple controller:

  ```ts
  // apps/server/src/http/routes/chat.ts
  import { Router } from 'express';
  import type { ChatRequest, ChatResponse } from '@vibe-soups/shared/api/chat';

  const router = Router();

  router.post('/chat', async (req, res) => {
    const body = req.body as ChatRequest;

    // TODO: integrate with puzzle-core: analyze question, update session state.
    const reply: ChatResponse['reply'] = {
      role: 'bot',
      content: '这是占位回答：后面会根据海龟汤规则来生成答案。',
      timestamp: new Date().toISOString(),
    };

    const response: ChatResponse = { reply };

    res.json(response);
  });

  export default router;
  ```

* Register route in your server bootstrapping file (e.g., `index.ts`).

**Acceptance criteria**

* `curl -X POST /api/chat` with test payload returns JSON.

---

## Task 3 – Wire ActionProvider to call your API

**Goal:** Make `ActionProvider` actually call `/api/chat` and push the response into the chatbot.

Update `ActionProvider.tsx`:

```tsx
// apps/web/src/features/chatbot/ActionProvider.tsx
'use client';

import React, { ReactNode } from 'react';
import { ChatRequest, ChatResponse, ChatMessage } from '@vibe-soups/shared/api/chat';
import type {
  createChatBotMessage as createChatBotMessageType,
} from 'react-chatbot-kit';

type ActionProviderProps = {
  createChatBotMessage: typeof createChatBotMessageType;
  setState: React.Dispatch<React.SetStateAction<any>>;
  children: ReactNode;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

const ActionProvider: React.FC<ActionProviderProps> = ({
  createChatBotMessage,
  setState,
  children,
}) => {
  const appendBotMessage = (content: string) => {
    const botMessage = createChatBotMessage(content);
    setState((prev: any) => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
  };

  const askBackend = async (userMessage: string) => {
    // Build history from state if needed later
    let history: ChatMessage[] = [];

    setState((prev: any) => {
      history = prev.messages ?? [];
      return prev;
    });

    const body: ChatRequest = {
      message: userMessage,
      history,
    };

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as ChatResponse;
      appendBotMessage(data.reply.content);
    } catch (err) {
      console.error(err);
      appendBotMessage('服务器好像出了点问题，请稍后再试。');
    }
  };

  const actions = {
    greet: () => appendBotMessage('欢迎来到海龟汤游戏！'),
    handleUserMessage: askBackend,
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

export default ActionProvider;
```

Update `MessageParser` to use `handleUserMessage`:

```tsx
// apps/web/src/features/chatbot/MessageParser.tsx
'use client';

import React, { ReactNode } from 'react';

type Actions = {
  greet: () => void;
  handleUserMessage: (msg: string) => Promise<void> | void;
};

type MessageParserProps = {
  children: ReactNode;
  actions: Actions;
};

const MessageParser: React.FC<MessageParserProps> = ({ children, actions }) => {
  const parse = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    actions.handleUserMessage(trimmed);
  };

  return (
    <>
      {React.Children.map(children, (child) =>
        React.cloneElement(child as React.ReactElement, {
          parse,
        })
      )}
    </>
  );
};

export default MessageParser;
```

**Acceptance criteria**

* Typing any non-empty message in the chat sends a request to `/api/chat` and displays the backend’s reply in the chat.

---

## Task 4 – Add game-specific widgets (puzzle overview, suggestion chips)

Leverage **widgets** and **customComponents** from the config to make the UI feel like a puzzle game, not just a generic chat.([fredrikoseberg.github.io][2])

### 4.1 Puzzle overview widget

1. Implement `PuzzleOverview`:

   ```tsx
   // apps/web/src/features/chatbot/widgets/PuzzleOverview.tsx
   'use client';

   import React from 'react';

   type PuzzleOverviewProps = {
     puzzleTitle: string;
     soupSurface: string;
   };

   export const PuzzleOverview: React.FC<PuzzleOverviewProps> = ({
     puzzleTitle,
     soupSurface,
   }) => {
     return (
       <div className="space-y-1">
         <div className="font-semibold text-sm">{puzzleTitle}</div>
         <p className="text-xs text-muted-foreground whitespace-pre-line">
           {soupSurface}
         </p>
       </div>
     );
   };
   ```

2. Register it in `config.ts` as a widget:

   ```ts
   // apps/web/src/features/chatbot/config.ts
   'use client';

   import { createChatBotMessage } from 'react-chatbot-kit';
   import { PuzzleOverview } from './widgets/PuzzleOverview';

   const botName = 'SoupBot';

   const config = {
     botName,
     initialMessages: [
       createChatBotMessage(
         `Hi, I'm ${botName}. 选一题海龟汤开始游戏吧！`,
         {
           widget: 'puzzleOverview', // first message renders overview once you have puzzle data
         }
       ),
     ],
     state: {
       puzzleTitle: '',
       soupSurface: '',
     },
     widgets: [
       {
         widgetName: 'puzzleOverview',
         widgetFunc: (props: any) => <PuzzleOverview {...props} />,
         mapStateToProps: ['puzzleTitle', 'soupSurface'],
       },
     ],
   } as const;

   export default config;
   ```

3. When you know the current puzzle (e.g. from URL query or room state), update the chatbot state (via `setState` in `ActionProvider`) to set `puzzleTitle` and `soupSurface`.

### 4.2 Suggestion chips widget

* Implement a widget that renders **preset question suggestions** (e.g. “这个故事发生在室内吗？”, “有人死了吗？”), and on click calls an action that sends the question.

* This is directly supported by the widget design: widgets get `actionProvider` and `setState` to trigger actions.([fredrikoseberg.github.io][3])

**Acceptance criteria**

* The first chatbot messages include a puzzle overview card.
* Clicking suggestion chips sends the question as if the user typed it.

---

## Task 5 – Customize styles & layout

Use `customStyles` and `customComponents` in `config` to re-skin the bot into your game’s style (colors, avatars, header).([fredrikoseberg.github.io][2])

Example:

```ts
// in config.ts
customStyles: {
  botMessageBox: {
    backgroundColor: '#111827', // tailwind slate-900
  },
  chatButton: {
    backgroundColor: '#f97316', // accent color
  },
},
customComponents: {
  header: () => (
    <div className="bg-slate-900 text-orange-400 px-3 py-2 rounded-t-md text-xs">
      海龟汤房间 · Chat
    </div>
  ),
  // optional: custom avatars & message bubbles
},
```

You can further tweak CSS by overriding `.react-chatbot-kit-*` classes as described in the “Customizing CSS” section of the docs.([fredrikoseberg.github.io][2])

**Acceptance criteria**

* Chat header and bubbles match your game brand (colors, typography).
* Chat bubble styles don’t conflict with the rest of your Tailwind design.

---

## Task 6 – Persist conversations per room / user

Use the built-in **`saveMessages`** / **`messageHistory`** props to persist conversation, optionally keyed by `roomId`.([fredrikoseberg.github.io][4])

Update `SoupBotChat`:

```tsx
// apps/web/src/features/chatbot/index.tsx
'use client';

import { useState } from 'react';
import Chatbot from 'react-chatbot-kit';
import config from './config';
import ActionProvider from './ActionProvider';
import MessageParser from './MessageParser';

type SoupBotChatProps = {
  roomId?: string;
};

export const SoupBotChat: React.FC<SoupBotChatProps> = ({ roomId }) => {
  const storageKey = roomId ? `soup_chat_${roomId}` : 'soup_chat_default';

  const loadMessages = () => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveMessages = (messages: any[]) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, JSON.stringify(messages));
  };

  return (
    <Chatbot
      config={config}
      messageParser={MessageParser}
      actionProvider={ActionProvider}
      messageHistory={loadMessages()}
      saveMessages={saveMessages}
    />
  );
};
```

**Acceptance criteria**

* Refreshing the page keeps the chat history for a room.
* Starting a new room uses a fresh history.

---

## Task 7 – Tests (unit + basic UI)

**Goal:** Give your agent a safety net for refactors.

1. **Unit tests for MessageParser and ActionProvider** (Vitest):

   * Test that `MessageParser` calls `handleUserMessage` for non-empty input.
   * Test that `ActionProvider.appendBotMessage` adds a new message to state.

2. **UI test (Playwright or RTL)**:

   * Render the home/room page.
   * Type a message and assert that:

     * The user message appears.
     * A bot message appears (from stubbed backend or mocked fetch).

3. Document how to run tests in `AGENT_TIPS_PLAYWRIGHT.md` and `AGENTS.md` (e.g. `pnpm test:web`, `pnpm e2e:web`).

**Acceptance criteria**

* `pnpm test` passes.
* At least one e2e test verifies basic chat flow.

---

## Task 8 – Document for code agents

Update `AGENTS.md` with a **“Chatbot integration” section**:

* **Directory map**:

  * `apps/web/src/features/chatbot/*` – Chatbot UI using react-chatbot-kit.
  * `apps/server/src/http/routes/chat.ts` – Backend chat endpoint.
  * `packages/shared/src/api/chat.ts` – shared types.

* **How to change responses**:

  * For simple logic tweaks: modify `ActionProvider` and `MessageParser`.
  * For puzzle/game logic: implement in `puzzle-core` and call from `/api/chat`.

* **How to run**:

  * `pnpm -C apps/server dev` and `pnpm -C apps/web dev`.
  * For e2e chat tests: `pnpm e2e`.

* **Do / Don’t**:

  * *Do* keep generic chat UI behavior inside `react-chatbot-kit` config.
  * *Do* keep puzzle logic in `puzzle-core` or backend.
  * *Don’t* directly mutate chatbot internals from random components; always go through `ActionProvider` actions.

---

If you’d like, next step I can write:

* A concrete `MessageParser` that interprets Chinese question categories (“时间相关/地点相关/人物相关”) and calls different `ActionProvider` methods, or
* A more detailed `chat.ts` backend stub that uses your future `puzzle-core` API (e.g. `evaluateQuestion(session, questionText)`).

[1]: https://fredrikoseberg.github.io/react-chatbot-kit-docs/docs/getting-started/ "Getting Started | React-chatbot-kit"
[2]: https://fredrikoseberg.github.io/react-chatbot-kit-docs/docs/advanced/configuration/ "Configuration | React-chatbot-kit"
[3]: https://fredrikoseberg.github.io/react-chatbot-kit-docs/docs/advanced/widgets/ "Widgets | React-chatbot-kit"
[4]: https://fredrikoseberg.github.io/react-chatbot-kit-docs/docs/advanced/saving-dialogue/ "Saving dialogue | React-chatbot-kit"
[5]: https://www.npmjs.com/package/react-chatbot-kit?utm_source=chatgpt.com "react-chatbot-kit"
[6]: https://github.com/topics/react-chatbot-kit-npm?utm_source=chatgpt.com "react-chatbot-kit-npm"
