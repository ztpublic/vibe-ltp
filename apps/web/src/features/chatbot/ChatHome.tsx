'use client';

import React from 'react';
import { SoupBotChat } from './index';

export interface ChatHomeProps {
  roomId?: string;
  actionProviderOverride?: any;
}

export const ChatHome: React.FC<ChatHomeProps> = ({ roomId, actionProviderOverride }) => {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Vibe LTP</h1>
          <p className="text-sm text-gray-600">Lateral Thinking Puzzle Game</p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col w-[40vw]">
        <SoupBotChat roomId={roomId} actionProviderOverride={actionProviderOverride} />
      </main>
    </div>
  );
};
