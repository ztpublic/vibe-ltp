import type { ChatFeedbackRequest, ChatRequest, ChatResponse, UserMessage, ChatMessage } from '@vibe-ltp/shared';
import type { ChatService } from './chatService';

import { API_BASE_URL } from '@/src/lib/apiBaseUrl';

export class ApiChatService implements ChatService {
  constructor(public sessionId?: string) {}

  private async postChat(path: string, body: ChatRequest): Promise<ChatResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}${path}`, {
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

  async sendMessage(userMessage: UserMessage, _history: ChatMessage[] = []): Promise<ChatResponse> {
    const body: ChatRequest = {
      message: userMessage,
      sessionId: this.sessionId,
    };

    return this.postChat('/api/chat', body);
  }

  async requestSolution(userMessage: UserMessage, _history: ChatMessage[] = []): Promise<ChatResponse> {
    const body: ChatRequest = {
      message: userMessage,
      sessionId: this.sessionId,
    };

    return this.postChat('/api/solution', body);
  }

  async setQuestionFeedback(messageId: string, direction: 'up' | 'down' | null, question?: string): Promise<void> {
    const payload: ChatFeedbackRequest = {
      sessionId: this.sessionId,
      messageId,
      direction,
      question,
    };

    const res = await fetch(`${API_BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to record feedback: ${res.status}`);
    }
  }
}
