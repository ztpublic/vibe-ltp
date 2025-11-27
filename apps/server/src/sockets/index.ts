import type { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@vibe-ltp/shared';

export function setupSocketIO(io: Server): void {
  io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle room join
    socket.on(SOCKET_EVENTS.ROOM_JOIN, (data: { roomId: string }) => {
      const { roomId } = data;
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      
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

    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
