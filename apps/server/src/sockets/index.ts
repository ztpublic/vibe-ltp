import type { Server } from 'socket.io';
import { SOCKET_EVENTS, type GameState, type PuzzleContent, type GameStateData } from '@vibe-ltp/shared';

// In-memory store for room game states (in production, use Redis or DB)
const roomGameStates = new Map<string, GameState>();
const roomPuzzleContent = new Map<string, PuzzleContent>();

export function setupSocketIO(io: Server): void {
  io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle room join
    socket.on(SOCKET_EVENTS.ROOM_JOIN, (data: { roomId: string }) => {
      const { roomId } = data;
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      
      // Initialize room game state if not exists
      if (!roomGameStates.has(roomId)) {
        roomGameStates.set(roomId, 'NotStarted');
      }
      
      // Send current game state to the joining client
      const currentState = roomGameStates.get(roomId)!;
      const puzzleContent = roomPuzzleContent.get(roomId);
      socket.emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
        state: currentState,
        roomId,
        puzzleContent,
      });
      
      // Notify room members
      io.to(roomId).emit(SOCKET_EVENTS.ROOM_STATE_UPDATED, {
        message: `Participant ${socket.id} joined`,
      });
    });

    // Handle room leave
    socket.on(SOCKET_EVENTS.ROOM_LEAVE, (data: { roomId: string }) => {
      const { roomId } = data;
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
      
      io.to(roomId).emit(SOCKET_EVENTS.ROOM_STATE_UPDATED, {
        message: `Participant ${socket.id} left`,
      });
    });

    // Handle question asked
    socket.on(SOCKET_EVENTS.QUESTION_ASKED, (data: { roomId: string; question: string }) => {
      const { roomId, question } = data;
      io.to(roomId).emit(SOCKET_EVENTS.QUESTION_ASKED, { question });
    });

    // Handle host answer
    socket.on(SOCKET_EVENTS.HOST_ANSWER, (data: { roomId: string; answer: unknown }) => {
      const { roomId, answer } = data;
      io.to(roomId).emit(SOCKET_EVENTS.HOST_ANSWER, { answer });
    });

    // Handle game start
    socket.on(SOCKET_EVENTS.GAME_STARTED, (data: { roomId: string; puzzleContent: PuzzleContent }) => {
      const { roomId, puzzleContent } = data;
      roomGameStates.set(roomId, 'Started');
      roomPuzzleContent.set(roomId, puzzleContent);
      console.log(`Game started in room ${roomId} with puzzle:`, puzzleContent);
      
      // Notify all clients in the room
      io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
        state: 'Started',
        roomId,
        puzzleContent,
      });
    });

    // Handle game reset
    socket.on(SOCKET_EVENTS.GAME_RESET, (data: { roomId: string }) => {
      const { roomId } = data;
      roomGameStates.set(roomId, 'NotStarted');
      roomPuzzleContent.delete(roomId);
      console.log(`Game reset in room ${roomId}`);
      
      // Notify all clients in the room
      io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
        state: 'NotStarted',
        roomId,
      });
    });

    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
