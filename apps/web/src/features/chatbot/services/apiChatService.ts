import type { ChatRequest, ChatResponse, UserMessage, BotMessage, ChatMessage } from '@vibe-ltp/shared';
import type { ChatService } from './chatService';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || `http://localhost:${process.env.NEXT_PUBLIC_BACKEND_PORT || 4000}`;

export class ApiChatService implements ChatService {
  async sendMessage(userMessage: UserMessage, history: ChatMessage[] = []): Promise<BotMessage> {
    const body: ChatRequest = {
      message: userMessage,
      history,
    };

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
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
      return data.reply;
    } catch (err) {
      console.error('API Chat Service Error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new Error(errorMessage);
    }
  }
}
