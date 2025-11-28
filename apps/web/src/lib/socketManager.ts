'use client';

import { io, Socket } from 'socket.io-client';

const SOCKET_OPTIONS = {
  transports: ['websocket'] as string[],
  withCredentials: true,
  reconnection: true,
  reconnectionDelayMax: 2_000,
};

type SocketInstance = {
  socket: Socket;
  refCount: number;
  roomId: string | null;
};

let sharedInstance: SocketInstance | null = null;

export type SocketLifecycleCallbacks = {
  onConnect?: () => void;
  onReconnect?: () => void;
  onConnectError?: (error: Error) => void;
  onDisconnect?: (reason: string) => void;
};

/**
 * Acquire a socket connection with ref counting to prevent duplicate connections
 * in React Strict Mode and support multiple component usage
 */
export function acquireSocket(baseUrl: string, roomId: string): Socket {
  if (sharedInstance && sharedInstance.socket.connected) {
    sharedInstance.refCount += 1;
    console.info('[socketManager] acquired existing socket', {
      refCount: sharedInstance.refCount,
      socketId: sharedInstance.socket.id,
      roomId,
    });
    return sharedInstance.socket;
  }

  // Create new socket instance
  const socket = io(baseUrl, SOCKET_OPTIONS);
  sharedInstance = {
    socket,
    refCount: 1,
    roomId,
  };

  console.info('[socketManager] created new socket', {
    refCount: 1,
    baseUrl,
    roomId,
  });

  return socket;
}

/**
 * Release a socket connection, decrements ref count and disconnects when count reaches 0
 */
export function releaseSocket(socket: Socket): void {
  if (!sharedInstance || sharedInstance.socket !== socket) {
    console.warn('[socketManager] attempted to release unknown socket');
    return;
  }

  sharedInstance.refCount = Math.max(0, sharedInstance.refCount - 1);
  console.info('[socketManager] released socket', {
    refCount: sharedInstance.refCount,
    socketId: socket.id,
  });

  if (sharedInstance.refCount === 0) {
    console.info('[socketManager] disconnecting socket (ref count = 0)', {
      socketId: socket.id,
    });
    socket.disconnect();
    sharedInstance = null;
  }
}

/**
 * Get the current shared socket instance (if any)
 */
export function getSharedSocket(): Socket | null {
  return sharedInstance?.socket || null;
}

/**
 * Attach lifecycle event handlers to socket
 */
export function attachSocketLifecycle(
  socket: Socket,
  roomId: string,
  callbacks: SocketLifecycleCallbacks = {}
): () => void {
  const handleConnect = () => {
    console.info('[socketManager] socket connected', {
      socketId: socket.id,
      roomId,
    });
    callbacks.onConnect?.();
  };

  const handleReconnect = () => {
    console.info('[socketManager] socket reconnected', {
      socketId: socket.id,
      roomId,
    });
    callbacks.onReconnect?.();
  };

  const handleConnectError = (error: Error) => {
    console.error('[socketManager] socket connect_error', {
      roomId,
      error: error.message,
    });
    callbacks.onConnectError?.(error);
  };

  const handleDisconnect = (reason: string) => {
    console.warn('[socketManager] socket disconnected', {
      socketId: socket.id,
      roomId,
      reason,
    });
    callbacks.onDisconnect?.(reason);
  };

  // Attach event listeners
  socket.on('connect', handleConnect);
  socket.on('reconnect', handleReconnect);
  socket.on('connect_error', handleConnectError);
  socket.on('disconnect', handleDisconnect);

  // Return cleanup function
  return () => {
    socket.off('connect', handleConnect);
    socket.off('reconnect', handleReconnect);
    socket.off('connect_error', handleConnectError);
    socket.off('disconnect', handleDisconnect);
  };
}

/**
 * Check if socket is currently connected
 */
export function isSocketConnected(socket: Socket | null): boolean {
  return socket?.connected ?? false;
}
