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

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = (await res.json()) as ChatResponse;
      return data.reply;
    } catch (err) {
      console.error('API Chat Service Error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new Error(errorMessage);
    }
  }
}
