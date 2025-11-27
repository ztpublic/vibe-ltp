import type { ChatMessage } from '@vibe-ltp/shared';

export interface ChatService {
  sendMessage(message: string, history: ChatMessage[]): Promise<string>;
}
