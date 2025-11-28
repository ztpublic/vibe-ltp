import type { Server } from 'socket.io';
import { SOCKET_EVENTS, type PuzzleContent, type GameStateData } from '@vibe-ltp/shared';
import * as gameState from '../state/gameState.js';

export function setupSocketIO(io: Server): void {
  io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Send current game state to the connecting client
    socket.emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
      state: gameState.getGameState(),
      puzzleContent: gameState.getPuzzleContent(),
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

    // Handle game start
    socket.on(SOCKET_EVENTS.GAME_STARTED, (data: { puzzleContent: PuzzleContent }, callback?: (response: { success: boolean; error?: string }) => void) => {
      const { puzzleContent } = data;
      
      try {
        gameState.setGameState('Started');
        gameState.setPuzzleContent(puzzleContent);
        
        // Notify all connected clients
        io.emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
          state: 'Started',
          puzzleContent,
        });
        
        // Send acknowledgment
        if (callback) {
          callback({ success: true });
        }
      } catch (error) {
        console.error('[Socket] Error starting game:', error);
        if (callback) {
          callback({ success: false, error: String(error) });
        }
      }
    });

    // Handle game reset
    socket.on(SOCKET_EVENTS.GAME_RESET, (callback?: (response: { success: boolean; error?: string }) => void) => {
      try {
        gameState.resetGameState();
        
        // Notify all connected clients
        io.emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
          state: 'NotStarted',
        });
        
        // Send acknowledgment
        if (callback) {
          callback({ success: true });
        }
      } catch (error) {
        console.error('[Socket] Error resetting game:', error);
        if (callback) {
          callback({ success: false, error: String(error) });
        }
      }
    });

    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
      console.log(`[Socket] Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });
}
