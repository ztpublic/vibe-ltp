import type {
  CreateSessionRequest,
  CreateSessionResponse,
  GameSessionId,
  GetSessionResponse,
  GetSessionTruthResponse,
  ListSessionsResponse,
} from '@vibe-ltp/shared';

import { API_BASE_URL } from '@/src/lib/apiBaseUrl';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
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

export function leaveSession(sessionId: GameSessionId): Promise<void> {
  return fetchJson(`/api/sessions/${sessionId}/leave`, {
    method: 'POST',
  });
}

export function getSession(sessionId: GameSessionId): Promise<GetSessionResponse> {
  return fetchJson(`/api/sessions/${sessionId}`);
}

export async function getSessionTruth(sessionId: GameSessionId): Promise<string> {
  const payload = await fetchJson<GetSessionTruthResponse>(`/api/sessions/${sessionId}/truth`);
  return payload.soupTruth;
}
