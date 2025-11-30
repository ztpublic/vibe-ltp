import type { UserMessage, BotMessage, ChatMessage } from '@vibe-ltp/shared';
import type { ChatService } from './chatService';
import { v4 as uuidv4 } from 'uuid';

export class MockChatService implements ChatService {
  async sendMessage(userMessage: UserMessage, _history?: ChatMessage[]): Promise<BotMessage> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    return {
      id: uuidv4(),
      type: 'bot' as const,
      content: `(Mock) You asked: "${userMessage.content}". This is a simulated response from the mock service.`,
      timestamp: new Date().toISOString(),
    };
  }
}
