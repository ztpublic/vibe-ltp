import type { Server } from 'socket.io';
import {
  SESSION_SOCKET_EVENTS,
  SOCKET_EVENTS,
  type PuzzleContent,
  type GameSessionId,
  type SessionChatMessage,
} from '@vibe-ltp/shared';
import * as gameState from '../state/gameState.js';
import { handleSocketError, sendSocketSuccess } from '../utils/errorHandler.js';
import { setSocketServer } from './ioReference.js';

export function setupSocketIO(io: Server): void {
  setSocketServer(io);
  io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    const requestedSessionId = socket.handshake.query.sessionId as string | undefined;
    const defaultSessionId = gameState.getDefaultSessionId();
    let sessionId: GameSessionId =
      requestedSessionId && gameState.getSession(requestedSessionId)
        ? requestedSessionId
        : defaultSessionId;

    console.log(`[Socket] Client connected: ${socket.id} (session=${sessionId})`);

    socket.join(sessionId);

    // Send current game state to the connecting client
    socket.emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
      sessionId,
      state: gameState.getGameState(sessionId),
      puzzleContent: gameState.getPuzzleContent(sessionId),
    });
    
    // Send chat history to the connecting client
    const chatMessages = gameState.getChatMessages(sessionId);
    socket.emit(SOCKET_EVENTS.CHAT_HISTORY_SYNC, {
      sessionId,
      messages: chatMessages,
    });

    const emitSessionSnapshot = () => {
      socket.emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
        sessionId,
        state: gameState.getGameState(sessionId),
        puzzleContent: gameState.getPuzzleContent(sessionId),
      });

      socket.emit(SOCKET_EVENTS.CHAT_HISTORY_SYNC, {
        sessionId,
        messages: gameState.getChatMessages(sessionId),
      });
    };

    // Handle question asked
    socket.on(SOCKET_EVENTS.QUESTION_ASKED, (data: { question: string }) => {
      const { question } = data;
      io.to(sessionId).emit(SOCKET_EVENTS.QUESTION_ASKED, { sessionId, question });
    });

    // Handle host answer
    socket.on(SOCKET_EVENTS.HOST_ANSWER, (data: { answer: unknown }) => {
      const { answer } = data;
      io.to(sessionId).emit(SOCKET_EVENTS.HOST_ANSWER, { sessionId, answer });
    });
    
    // Handle chat message added
    socket.on(
      SOCKET_EVENTS.CHAT_MESSAGE_ADDED,
      (data: { message: SessionChatMessage; sessionId?: GameSessionId }) => {
        const targetSessionId = data.sessionId ?? sessionId;
        const { message } = data;
        gameState.addChatMessage(message, targetSessionId);
        // Broadcast to all clients in session
        io.to(targetSessionId).emit(SOCKET_EVENTS.CHAT_MESSAGE_ADDED, { sessionId: targetSessionId, message });
      },
    );

    // Handle game start
    socket.on(SOCKET_EVENTS.GAME_STARTED, async (data: { puzzleContent: PuzzleContent }, callback?: (response: { success: boolean; error?: string }) => void) => {
      const { puzzleContent } = data;

      try {
        gameState.startSession(sessionId, puzzleContent);
        
        // Notify all connected clients
        io.to(sessionId).emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
          sessionId,
          state: 'Started',
          puzzleContent,
        });
        io.emit(SESSION_SOCKET_EVENTS.SESSION_UPDATED, { session: gameState.getSession(sessionId) });
        
        sendSocketSuccess(callback);
      } catch (error) {
        handleSocketError(error, 'Error starting game', callback);
      }
    });

    // Handle game reset
    socket.on(SOCKET_EVENTS.GAME_RESET, (callback?: (response: { success: boolean; error?: string }) => void) => {
      try {
        const existing = gameState.getPuzzleContent(sessionId);
        const revealedFacts = existing?.facts?.map(fact => ({ ...fact, revealed: true }));
        const revealedKeywords = existing?.keywords?.map(keyword => ({ ...keyword, revealed: true }));

        gameState.resetGameState(sessionId);

        if (existing) {
          gameState.setPuzzleContent({
            ...existing,
            facts: revealedFacts,
            keywords: revealedKeywords,
          }, sessionId);
        }
        
        // Notify all connected clients (leave revealed content until next game starts)
        io.to(sessionId).emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
          sessionId,
          state: 'NotStarted',
          puzzleContent: gameState.getPuzzleContent(sessionId),
        });
        io.emit(SESSION_SOCKET_EVENTS.SESSION_UPDATED, { session: gameState.getSession(sessionId) });
        
        sendSocketSuccess(callback);
      } catch (error) {
        handleSocketError(error, 'Error resetting game', callback);
      }
    });

    socket.on('session:join', (data: { sessionId: GameSessionId }, callback?: (response: { success: boolean; error?: string }) => void) => {
      try {
        const nextSessionId = data.sessionId;
        const session = gameState.getSession(nextSessionId);
        if (!session) throw new Error(`Session not found: ${nextSessionId}`);

        socket.leave(sessionId);
        sessionId = nextSessionId;
        socket.join(sessionId);
        emitSessionSnapshot();
        sendSocketSuccess(callback);
      } catch (error) {
        handleSocketError(error, 'Error joining session room', callback);
      }
    });

    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
      console.log(`[Socket] Client disconnected: ${socket.id}, reason: ${reason}, session=${sessionId}`);
    });
  });
}
