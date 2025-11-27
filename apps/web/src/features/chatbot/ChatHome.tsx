'use client';

import React from 'react';
import { SoupBotChat } from './index';
import type { ChatService } from './services';

export interface ChatHomeProps {
  roomId?: string;
  chatService: ChatService;
}

export const ChatHome: React.FC<ChatHomeProps> = ({ roomId, chatService }) => {
  return (
    <div className="h-screen bg-[#1e1e1e] flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col w-[40vw]">
        <SoupBotChat roomId={roomId} chatService={chatService} />
      </main>
    </div>
  );
};
