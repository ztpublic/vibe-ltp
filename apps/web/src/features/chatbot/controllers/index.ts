/**
 * Controllers export index
 */

// Interfaces
export type { GameStateController } from './GameStateController';
export type { ChatHistoryController, ChatHistoryMessage } from './ChatHistoryController';

// Default socket-based implementations (also re-exported below)
import { useSocketGameStateController } from './SocketGameStateController';
import { useSocketChatHistoryController } from './SocketChatHistoryController';

// Mock implementations
export { useMockGameStateController } from './MockGameStateController';
export type { MockGameStateControllerOptions } from './MockGameStateController';
export { useMockChatHistoryController } from './MockChatHistoryController';

// Socket implementations (default entry points)
export { useSocketGameStateController } from './SocketGameStateController';
export { useSocketChatHistoryController } from './SocketChatHistoryController';

// Canonical hooks for production usage
export const useGameStateController = useSocketGameStateController;
export const useChatHistoryController = useSocketChatHistoryController;
