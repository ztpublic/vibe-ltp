'use client';

import { io, Socket } from 'socket.io-client';

const SOCKET_OPTIONS = {
  transports: ['websocket'] as string[],
  withCredentials: true,
  reconnection: true,
  // Exponential backoff-ish: start small, cap at 4s
  reconnectionDelay: 250,
  reconnectionDelayMax: 4_000,
  randomizationFactor: 0.5,
};

type SocketInstance = {
  socket: Socket;
  refCount: number;
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
export function acquireSocket(baseUrl: string): Socket {
  if (sharedInstance) {
    sharedInstance.refCount += 1;
    return sharedInstance.socket;
  }

  // Create new socket instance
  const socket = io(baseUrl, SOCKET_OPTIONS);
  sharedInstance = {
    socket,
    refCount: 1,
  };

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

  if (sharedInstance.refCount <= 0) {
    console.warn('[socketManager] release called with non-positive refCount');
    return;
  }

  sharedInstance.refCount -= 1;

  if (sharedInstance.refCount === 0) {
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
  callbacks: SocketLifecycleCallbacks = {}
): () => void {
  const handleConnect = () => callbacks.onConnect?.();
  const handleReconnect = () => callbacks.onReconnect?.();
  const handleConnectError = (error: Error) => callbacks.onConnectError?.(error);
  const handleDisconnect = (reason: string) => callbacks.onDisconnect?.(reason);

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
