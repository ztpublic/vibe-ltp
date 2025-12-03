import type { ChatMessage, ChatResponse, UserMessage } from '@vibe-ltp/shared';
import type { ChatService } from './chatService';
import { v4 as uuidv4 } from 'uuid';

export class MockChatService implements ChatService {
  async sendMessage(userMessage: UserMessage, _history?: ChatMessage[]): Promise<ChatResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const mockAnswers: ChatResponse['decoration'][] = [
      { targetMessageId: userMessage.id, answer: 'yes' },
      { targetMessageId: userMessage.id, answer: 'no' },
      { targetMessageId: userMessage.id, answer: 'unknown' },
      { targetMessageId: userMessage.id, answer: 'both' },
      { targetMessageId: userMessage.id, answer: 'irrelevant' },
    ];

    const decoration = mockAnswers[Math.floor(Math.random() * mockAnswers.length)]!;

    return {
      decoration,
    };
  }
}
