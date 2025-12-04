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
  key: string;
};

const socketInstances = new Map<string, SocketInstance>();

function buildKey(baseUrl: string, sessionId?: string): string {
  return `${baseUrl}::${sessionId ?? 'default'}`;
}

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
export function acquireSocket(baseUrl: string, sessionId?: string): Socket {
  const key = buildKey(baseUrl, sessionId);
  const existing = socketInstances.get(key);
  if (existing) {
    existing.refCount += 1;
    return existing.socket;
  }

  const socket = io(baseUrl, {
    ...SOCKET_OPTIONS,
    query: sessionId ? { sessionId } : undefined,
  });

  socketInstances.set(key, {
    socket,
    refCount: 1,
    key,
  });

  return socket;
}

/**
 * Release a socket connection, decrements ref count and disconnects when count reaches 0
 */
export function releaseSocket(socket: Socket): void {
  let entryKey: string | null = null;
  for (const [key, instance] of socketInstances.entries()) {
    if (instance.socket === socket) {
      entryKey = key;
      if (instance.refCount <= 0) {
        console.warn('[socketManager] release called with non-positive refCount');
        break;
      }
      instance.refCount -= 1;
      if (instance.refCount === 0) {
        socket.disconnect();
        socketInstances.delete(key);
      }
      break;
    }
  }

  if (!entryKey) {
    console.warn('[socketManager] attempted to release unknown socket');
  }
}

/**
 * Get the current shared socket instance (if any)
 */
export function getSharedSocket(sessionId?: string): Socket | null {
  const key = sessionId ? buildKey('', sessionId) : null;
  if (key && socketInstances.has(key)) {
    return socketInstances.get(key)?.socket ?? null;
  }
  // Fallback: return first socket if any
  const first = socketInstances.values().next();
  return first.done ? null : first.value.socket;
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
