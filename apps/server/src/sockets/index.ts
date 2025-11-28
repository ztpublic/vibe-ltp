import type { Server } from 'socket.io';
import { SOCKET_EVENTS, type GameState, type PuzzleContent, type GameStateData } from '@vibe-ltp/shared';

// Single global game state (simplified from room-based architecture)
let globalGameState: GameState = 'NotStarted';
let globalPuzzleContent: PuzzleContent | undefined;

export function setupSocketIO(io: Server): void {
  io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Send current game state to the connecting client
    socket.emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
      state: globalGameState,
      puzzleContent: globalPuzzleContent,
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
        globalGameState = 'Started';
        globalPuzzleContent = puzzleContent;
        
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
        globalGameState = 'NotStarted';
        globalPuzzleContent = undefined;
        
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
