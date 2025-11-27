'use client';

import { ChatHome } from '@/src/features/chatbot/ChatHome';
import { ApiChatService } from '@/src/features/chatbot/services';

const chatService = new ApiChatService();

export default function Home() {
  return <ChatHome chatService={chatService} />;
}
