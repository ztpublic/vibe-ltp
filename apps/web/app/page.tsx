'use client';

import { ChatHome } from '@/src/features/chatbot/ChatHome';
import { ApiChatService } from '@/src/features/chatbot/services';
import { useSocketGameStateController, useSocketChatHistoryController } from '@/src/features/chatbot/controllers';

const chatService = new ApiChatService();

export default function Home() {
  const gameStateController = useSocketGameStateController();
  const chatHistoryController = useSocketChatHistoryController();
  
  return (
    <ChatHome 
      gameStateController={gameStateController}
      chatService={chatService}
      chatHistoryController={chatHistoryController}
    />
  );
}
