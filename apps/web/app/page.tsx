'use client';

import { ChatHome } from '@/src/features/chatbot/ChatHome';
import { ApiChatService } from '@/src/features/chatbot/services';
import { useGameStateController, useChatHistoryController } from '@/src/features/chatbot/controllers';
import { useToastQueue } from '@/src/features/chatbot/utils/notifications';

const chatService = new ApiChatService();

export default function Home() {
  const { toasts, push } = useToastQueue();
  const gameStateController = useGameStateController(push);
  const chatHistoryController = useChatHistoryController(push);
  
  return (
    <ChatHome 
      gameStateController={gameStateController}
      chatService={chatService}
      chatHistoryController={chatHistoryController}
      toasts={toasts}
    />
  );
}
