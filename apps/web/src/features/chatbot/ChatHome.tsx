'use client';

import React from 'react';
import { SoupBotChat } from './index';

export interface ChatHomeProps {
  roomId?: string;
  actionProviderOverride?: any;
}

export const ChatHome: React.FC<ChatHomeProps> = ({ roomId, actionProviderOverride }) => {
  return (
    <div className="h-screen bg-[#1e1e1e] flex flex-col">
      <header className="bg-[#2d2d30] border-b border-[#3e3e42]">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-[#cccccc]">Vibe LTP</h1>
          <p className="text-sm text-[#858585]">Lateral Thinking Puzzle Game</p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col w-[40vw]">
        <SoupBotChat roomId={roomId} actionProviderOverride={actionProviderOverride} />
      </main>
    </div>
  );
};
