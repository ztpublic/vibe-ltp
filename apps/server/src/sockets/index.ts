import type { Server } from 'socket.io';
import {
  SESSION_SOCKET_EVENTS,
  SOCKET_EVENTS,
  type GameSessionId,
  type GameStartRequest,
  type PuzzleContent,
  type SessionChatMessage,
} from '@vibe-ltp/shared';
import { createLogger } from '@vibe-ltp/shared';
import * as gameState from '../state/gameState.js';
import { handleSocketError, sendSocketSuccess } from '../utils/errorHandler.js';
import { setSocketServer } from './ioReference.js';
import { pickRandomPuzzle } from '../puzzles/randomPuzzle.js';

const logger = createLogger({ module: 'sockets' });

export function setupSocketIO(io: Server): void {
  setSocketServer(io);
  io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    const requestedSessionId = socket.handshake.query.sessionId as string | undefined;
    const defaultSessionId = gameState.getDefaultSessionId();
    let sessionId: GameSessionId =
      requestedSessionId && gameState.getSession(requestedSessionId)
        ? requestedSessionId
        : defaultSessionId;

    logger.info({ socketId: socket.id, sessionId }, '[Socket] Client connected');

    // Join the session (increment player count)
    const joinedSnapshot = gameState.joinSession(sessionId);
    socket.join(sessionId);

    // Send current game state to the connecting client
    socket.emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
      sessionId,
      state: joinedSnapshot.state,
      puzzleContent: joinedSnapshot.puzzleContent,
    });
    
    // Send chat history to the connecting client
    const chatMessages = gameState.getChatMessages(sessionId);
    socket.emit(SOCKET_EVENTS.CHAT_HISTORY_SYNC, {
      sessionId,
      messages: chatMessages,
    });

    const emitSessionSnapshot = () => {
      const snapshot = gameState.getSession(sessionId);
      if (!snapshot) return;

      socket.emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
        sessionId,
        state: snapshot.state,
        puzzleContent: snapshot.puzzleContent,
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
    socket.on(SOCKET_EVENTS.GAME_STARTED, async (data: GameStartRequest | { puzzleContent: PuzzleContent } | undefined, callback?: (response: { success: boolean; error?: string }) => void) => {
      try {
        const mode = (data as Partial<GameStartRequest> | undefined)?.mode;
        const providedPuzzle = (data as { puzzleContent?: PuzzleContent } | undefined)?.puzzleContent;
        const puzzleContent = mode === 'random' ? await pickRandomPuzzle() : providedPuzzle;

        if (!puzzleContent) {
          throw new Error('Cannot start game without puzzle content.');
        }

        const snapshot = gameState.startSession(sessionId, puzzleContent);
        // After starting a new game, clear any previous chat history for all clients
        const clearedChatHistory = gameState.getChatMessages(sessionId);
        
        // Notify all connected clients
        io.to(sessionId).emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
          sessionId,
          state: 'Started',
          puzzleContent: snapshot.puzzleContent,
        });
        io.to(sessionId).emit(SOCKET_EVENTS.CHAT_HISTORY_SYNC, {
          sessionId,
          messages: clearedChatHistory,
        });
        io.to(sessionId).emit(SESSION_SOCKET_EVENTS.SESSION_UPDATED, { session: snapshot });
        
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

        const snapshot = gameState.getSession(sessionId);
        
        // Notify all connected clients (leave revealed content until next game starts)
        io.to(sessionId).emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
          sessionId,
          state: 'NotStarted',
          puzzleContent: snapshot?.puzzleContent,
        });
        if (snapshot) {
          io.to(sessionId).emit(SESSION_SOCKET_EVENTS.SESSION_UPDATED, { session: snapshot });
        }
        
        sendSocketSuccess(callback);
      } catch (error) {
        handleSocketError(error, 'Error resetting game', callback);
      }
    });

    socket.on(SESSION_SOCKET_EVENTS.SESSION_JOIN, (data: { sessionId: GameSessionId }, callback?: (response: { success: boolean; error?: string }) => void) => {
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
      logger.info({ socketId: socket.id, reason, sessionId }, '[Socket] Client disconnected');
      // Leave the session (decrement player count)
      gameState.leaveSession(sessionId);
    });
  });
}
