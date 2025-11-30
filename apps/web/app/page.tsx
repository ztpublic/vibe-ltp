'use client';

import { ChatHome } from '@/src/features/chatbot/ChatHome';
import { ApiChatService } from '@/src/features/chatbot/services';
import { useGameStateController, useChatHistoryController } from '@/src/features/chatbot/controllers';

const chatService = new ApiChatService();

export default function Home() {
  const gameStateController = useGameStateController();
  const chatHistoryController = useChatHistoryController();
  
  return (
    <ChatHome 
      gameStateController={gameStateController}
      chatService={chatService}
      chatHistoryController={chatHistoryController}
    />
  );
}
