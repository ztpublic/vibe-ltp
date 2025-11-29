import type { ChatRequest, ChatResponse, ChatMessage } from '@vibe-ltp/shared';
import type { ChatService } from './chatService';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

console.log('🌐 [ApiChatService] Using API_BASE:', API_BASE);
console.log('🔍 [ApiChatService] NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);

export class ApiChatService implements ChatService {
  async sendMessage(message: string, history: ChatMessage[]): Promise<string> {
    const body: ChatRequest = {
      message,
      history,
    };

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as ChatResponse;
      return data.reply.content;
    } catch (err) {
      console.error(err);
      return '服务器好像出了点问题，请稍后再试。';
    }
  }
}
