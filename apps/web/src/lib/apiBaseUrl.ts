const DEFAULT_API_BASE_URL = 'http://localhost:4000';

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) return DEFAULT_API_BASE_URL;
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

export function getApiBaseUrl(): string {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL);
}

export const API_BASE_URL = getApiBaseUrl();
export const SOCKET_BASE_URL = API_BASE_URL;
