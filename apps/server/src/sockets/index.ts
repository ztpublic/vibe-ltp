import type { Server } from 'socket.io';
import { SOCKET_EVENTS, type PuzzleContent, type GameStateData, type PuzzleFact } from '@vibe-ltp/shared';
import { distillPuzzleKeyPoints } from '@vibe-ltp/llm-client';
import { randomUUID } from 'node:crypto';
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
        const model = process.env.LLM_MODEL_ID ?? 'x-ai/grok-4.1-fast:free';

        let enrichedPuzzleContent: PuzzleContent = puzzleContent;

        try {
          const keyPointsResult = await distillPuzzleKeyPoints(
            {
              surface: puzzleContent.soupSurface,
              truth: puzzleContent.soupTruth,
              conversationHistory: [],
            },
            model
          );

          const facts: PuzzleFact[] = keyPointsResult.keyPoints.map((text) => ({
            id: randomUUID(),
            text,
            revealed: false,
          }));

          enrichedPuzzleContent = {
            ...puzzleContent,
            facts,
          };
        } catch (agentError) {
          console.error('[Socket] Key points distillation failed; starting without facts', agentError);
        }

        // IMPORTANT: Set puzzle content BEFORE setting state to 'Started'
        // The validateStateTransition function requires puzzle content to exist
        gameState.setPuzzleContent(enrichedPuzzleContent);
        gameState.setGameState('Started');
        
        // Notify all connected clients
        io.emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
          state: 'Started',
          puzzleContent: enrichedPuzzleContent,
        });
        
        sendSocketSuccess(callback);
      } catch (error) {
        handleSocketError(error, 'Error starting game', callback);
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
