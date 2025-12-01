import type { Server } from 'socket.io';
import { SOCKET_EVENTS, type PuzzleContent } from '@vibe-ltp/shared';
import * as gameState from '../state/gameState.js';
import type { PersistedMessage } from '../state/gameState.js';
import { handleSocketError, sendSocketSuccess } from '../utils/errorHandler.js';
import { setSocketServer } from './ioReference.js';

export function setupSocketIO(io: Server): void {
  setSocketServer(io);
  io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Send current game state to the connecting client
    socket.emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
      state: gameState.getGameState(),
      puzzleContent: gameState.getPuzzleContent(),
    });
    
    // Send chat history to the connecting client
    const chatMessages = gameState.getChatMessages();
    socket.emit(SOCKET_EVENTS.CHAT_HISTORY_SYNC, {
      messages: chatMessages,
    });

    // Handle question asked
    socket.on(SOCKET_EVENTS.QUESTION_ASKED, (data: { question: string }) => {
      const { question } = data;
      io.emit(SOCKET_EVENTS.QUESTION_ASKED, { question });
    });

    // Handle host answer
    socket.on(SOCKET_EVENTS.HOST_ANSWER, (data: { answer: unknown }) => {
      const { answer } = data;
      io.emit(SOCKET_EVENTS.HOST_ANSWER, { answer });
    });
    
    // Handle chat message added
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE_ADDED, (data: { message: PersistedMessage }) => {
      const { message } = data;
      gameState.addChatMessage(message);
      // Broadcast to all clients
      io.emit(SOCKET_EVENTS.CHAT_MESSAGE_ADDED, { message });
    });

    // Handle game start
    socket.on(SOCKET_EVENTS.GAME_STARTED, async (data: { puzzleContent: PuzzleContent }, callback?: (response: { success: boolean; error?: string }) => void) => {
      const { puzzleContent } = data;

      try {
        // IMPORTANT: Set puzzle content BEFORE setting state to 'Started'
        // The validateStateTransition function requires puzzle content to exist
        gameState.setPuzzleContent(puzzleContent);
        gameState.setGameState('Started');
        
        // Notify all connected clients
        io.emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
          state: 'Started',
          puzzleContent,
        });
        
        sendSocketSuccess(callback);
      } catch (error) {
        handleSocketError(error, 'Error starting game', callback);
      }
    });

    // Handle game reset
    socket.on(SOCKET_EVENTS.GAME_RESET, (callback?: (response: { success: boolean; error?: string }) => void) => {
      try {
        const existing = gameState.getPuzzleContent();
        const revealedFacts = existing?.facts?.map(fact => ({ ...fact, revealed: true }));

        gameState.resetGameState();

        if (existing) {
          gameState.setPuzzleContent({
            ...existing,
            facts: revealedFacts,
          });
        }
        
        // Notify all connected clients (leave revealed content until next game starts)
        io.emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
          state: 'NotStarted',
          puzzleContent: gameState.getPuzzleContent(),
        });
        
        sendSocketSuccess(callback);
      } catch (error) {
        handleSocketError(error, 'Error resetting game', callback);
      }
    });

    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
      console.log(`[Socket] Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });
}
