/**
 * API endpoint constants and route helpers
 */

export const API_ROUTES = {
  SESSIONS: '/api/sessions',
  SESSION_DETAIL: (sessionId: string) => `/api/sessions/${sessionId}`,
  SESSION_JOIN: (sessionId: string) => `/api/sessions/${sessionId}/join`,
  SESSION_START: (sessionId: string) => `/api/sessions/${sessionId}/start`,
  SESSION_RESET: (sessionId: string) => `/api/sessions/${sessionId}/reset`,
  SESSION_END: (sessionId: string) => `/api/sessions/${sessionId}/end`,
  SESSION_TRUTH: (sessionId: string) => `/api/sessions/${sessionId}/truth`,
} as const;

export const SOCKET_EVENTS = {
  // Question/Answer events
  QUESTION_ASKED: 'question:asked',
  HOST_ANSWER: 'host:answer',

  // Hint/Solution events
  HINT_REVEALED: 'hint:revealed',
  SOLUTION_REVEALED: 'solution:revealed',

  // Game state events
  GAME_STARTED: 'game:started',
  GAME_RESET: 'game:reset',
  GAME_STATE_UPDATED: 'game:stateUpdated',
  
  // Chat history events
  CHAT_HISTORY_SYNC: 'chat:historySync',
  CHAT_MESSAGE_ADDED: 'chat:messageAdded',

  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
} as const;

/**
 * Session-aware Socket.IO events (payloads should always include sessionId)
 */
export const SESSION_SOCKET_EVENTS = {
  // Lobby events
  SESSION_CREATED: 'session:created',
  SESSION_JOIN: 'session:join',
  SESSION_UPDATED: 'session:updated',
  SESSION_REMOVED: 'session:removed',
  SESSION_LIST_UPDATED: 'session:listUpdated',

  // Session-scoped chat/game events
  GAME_STARTED: 'session:gameStarted',
  GAME_RESET: 'session:gameReset',
  GAME_ENDED: 'session:gameEnded',
  GAME_STATE_UPDATED: 'session:gameStateUpdated',
  CHAT_HISTORY_SYNC: 'session:chatHistorySync',
  CHAT_MESSAGE_ADDED: 'session:chatMessageAdded',
} as const;
