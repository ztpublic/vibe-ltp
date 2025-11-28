'use client';

import React from 'react';
import { SoupBotChat } from './index';
import type { ChatService } from './services';
import { IdentityProvider } from './identity/useChatIdentity';

export interface ChatHomeProps {
  roomId?: string;
  chatService: ChatService;
}

export const ChatHome: React.FC<ChatHomeProps> = ({ roomId, chatService }) => {
  return (
    <IdentityProvider>
      <div className="h-screen bg-[#1e1e1e] flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="flex flex-row gap-4 h-full w-full max-w-screen-xl">
            {/* Left side - Puzzle Surface (汤面) */}
            <div className="w-[30vw] h-full flex flex-col">
              <div className="h-full border border-[#3e3e42] rounded-lg bg-[#252526] p-4 flex flex-col">
                <h2 className="text-xl font-semibold text-white mb-4">汤面</h2>
                <div className="text-[#cccccc] whitespace-pre-wrap flex-1 overflow-auto">
                  {/* Placeholder content - this will be replaced with actual puzzle data */}
                  一个男人走进餐厅，点了一碗海龜汤。
                  他尝了一口后，走出餐厅，然后自杀了。
                  为什么？
                </div>
              </div>
            </div>
            
            {/* Center - Chatbot */}
            <div className="w-[40vw] h-full flex flex-col">
              <SoupBotChat roomId={roomId} chatService={chatService} />
            </div>
            
            {/* Right side - Action Buttons */}
            <div className="flex flex-col gap-4">
              <button
                className="px-6 py-3 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded-lg transition-colors whitespace-nowrap"
                onClick={() => {
                  // TODO: Implement start new puzzle logic
                  console.log('开始新汤');
                }}
              >
                开始新汤
              </button>
              <button
                className="px-6 py-3 bg-[#2d2d30] hover:bg-[#3e3e42] text-white rounded-lg transition-colors border border-[#3e3e42] whitespace-nowrap"
                onClick={() => {
                  // TODO: Implement reveal answer logic
                  console.log('公布答案');
                }}
              >
                公布答案
              </button>
            </div>
          </div>
        </main>
      </div>
    </IdentityProvider>
  );
};
