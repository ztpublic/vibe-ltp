import type {
  CreateSessionRequest,
  CreateSessionResponse,
  GameSessionId,
  GetSessionResponse,
  ListSessionsResponse,
} from '@vibe-ltp/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || `http://localhost:${process.env.NEXT_PUBLIC_BACKEND_PORT || 4000}`;

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text ? `- ${text}` : ''}`.trim());
  }

  return res.json() as Promise<T>;
}

export function listSessions(): Promise<ListSessionsResponse> {
  return fetchJson('/api/sessions');
}

export function createSession(payload: CreateSessionRequest): Promise<CreateSessionResponse> {
  return fetchJson('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function joinSession(sessionId: GameSessionId, nickname?: string): Promise<GetSessionResponse> {
  return fetchJson(`/api/sessions/${sessionId}/join`, {
    method: 'POST',
    body: JSON.stringify({ nickname }),
  });
}

export function getSession(sessionId: GameSessionId): Promise<GetSessionResponse> {
  return fetchJson(`/api/sessions/${sessionId}`);
}
