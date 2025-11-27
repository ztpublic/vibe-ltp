import type { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@vibe-ltp/shared';

export function setupSocketIO(io: Server): void {
  io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle room join
    socket.on(SOCKET_EVENTS.ROOM_JOIN, (data: { roomId: string; userId: string }) => {
      const { roomId, userId } = data;
      socket.join(roomId);
      console.log(`User ${userId} joined room ${roomId}`);
      
      // Notify room members
      io.to(roomId).emit(SOCKET_EVENTS.ROOM_STATE_UPDATED, {
        message: `User ${userId} joined`,
      });
    });

    // Handle room leave
    socket.on(SOCKET_EVENTS.ROOM_LEAVE, (data: { roomId: string; userId: string }) => {
      const { roomId, userId } = data;
      socket.leave(roomId);
      console.log(`User ${userId} left room ${roomId}`);
      
      io.to(roomId).emit(SOCKET_EVENTS.ROOM_STATE_UPDATED, {
        message: `User ${userId} left`,
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

    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
