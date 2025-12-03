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

  async requestSolution(_userMessage: UserMessage, _history?: ChatMessage[]): Promise<ChatResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const verdicts = [
      { label: '✅ 完全命中', feedback: '解答很到位，可以直接公布啦。' },
      { label: '🟢 很接近', feedback: '核心思路正确，还差一两个细节。' },
      { label: '🟡 部分正确', feedback: '方向对了一半，尝试补充动机或时间线。' },
      { label: '🔴 偏离', feedback: '与真相差距较大，重新聚焦关键人物和原因。' },
    ];

    const selected = verdicts[Math.floor(Math.random() * verdicts.length)]!;

    return {
      reply: {
        id: uuidv4(),
        type: 'bot',
        content: `${selected.label}\n${selected.feedback}`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
