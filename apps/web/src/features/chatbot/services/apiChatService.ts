import type { ChatRequest, ChatResponse, UserMessage, ChatMessage } from '@vibe-ltp/shared';
import type { ChatService } from './chatService';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || `http://localhost:${process.env.NEXT_PUBLIC_BACKEND_PORT || 4000}`;

export class ApiChatService implements ChatService {
  private async postChat(path: string, body: ChatRequest): Promise<ChatResponse> {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // Clone so we can safely read body in error scenarios
      const clonedRes = res.clone();

      let parsedJson: unknown = null;
      let rawText: string | null = null;

      try {
        parsedJson = await res.json();
      } catch {
        try {
          rawText = await clonedRes.text();
        } catch {
          rawText = null;
        }
      }

      if (!res.ok) {
        const serverMessage =
          (parsedJson as Partial<ChatResponse>)?.reply?.content ||
          (parsedJson as Partial<ChatResponse>)?.decoration?.answer ||
          (rawText && rawText.trim()) ||
          null;

        const statusText = res.statusText || 'Request failed';
        const details = serverMessage ? ` - ${serverMessage}` : '';

        throw new Error(`HTTP ${res.status}: ${statusText}${details}`);
      }

      if (!parsedJson) {
        throw new Error('Empty response from server');
      }

      const data = parsedJson as ChatResponse;
      if (!data.reply && !data.decoration) {
        throw new Error('Empty response from server');
      }

      return data;
    } catch (err) {
      console.error('API Chat Service Error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new Error(errorMessage);
    }
  }

  async sendMessage(userMessage: UserMessage, history: ChatMessage[] = []): Promise<ChatResponse> {
    const body: ChatRequest = {
      message: userMessage,
      history,
    };

    return this.postChat('/api/chat', body);
  }

  async requestSolution(userMessage: UserMessage, history: ChatMessage[] = []): Promise<ChatResponse> {
    const body: ChatRequest = {
      message: userMessage,
      history,
    };

    return this.postChat('/api/solution', body);
  }
}
