/**
 * API endpoint constants and route helpers
 */

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
