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
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col w-[40vw]">
        <SoupBotChat roomId={roomId} actionProviderOverride={actionProviderOverride} />
      </main>
    </div>
  );
};
