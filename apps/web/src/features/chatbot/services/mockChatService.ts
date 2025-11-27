import type { ChatMessage } from '@vibe-ltp/shared';
import type { ChatService } from './chatService';

export class MockChatService implements ChatService {
  async sendMessage(message: string, _history: ChatMessage[]): Promise<string> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    return `(Mock) You asked: "${message}". This is a simulated response from the mock service.`;
  }
}
