/**
 * API endpoint constants and route helpers
 */

export const API_ROUTES = {
  PUZZLES: '/api/puzzles',
  PUZZLE_BY_ID: (id: string) => `/api/puzzles/${id}`,
  ROOMS: '/api/rooms',
  ROOM_BY_ID: (id: string) => `/api/rooms/${id}`,
} as const;

export const SOCKET_EVENTS = {
  // Room events
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_STATE_UPDATED: 'room:stateUpdated',

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

  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
} as const;
