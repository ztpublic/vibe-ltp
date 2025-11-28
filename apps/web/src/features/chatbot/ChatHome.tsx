'use client';

import React, { useState } from 'react';
import { SoupBotChat } from './index';
import type { ChatService } from './services';
import { IdentityProvider } from './identity/useChatIdentity';
import { useGameState } from './hooks/useGameState';
import { PuzzleInputDialog } from './components';

export interface ChatHomeProps {
  roomId?: string;
  chatService: ChatService;
}

export const ChatHome: React.FC<ChatHomeProps> = ({ roomId = 'default', chatService }) => {
  const { gameState, puzzleContent, startGame, resetGame } = useGameState(roomId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const isGameStarted = gameState === 'Started';
  const isGameNotStarted = gameState === 'NotStarted';

  const handleStartGameClick = () => {
    setIsDialogOpen(true);
  };

  const handleDialogConfirm = (soupSurface: string, soupTruth: string) => {
    startGame({ soupSurface, soupTruth });
    setIsDialogOpen(false);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

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
                  {puzzleContent?.soupSurface || '等待开始新汤...'}
                </div>
              </div>
            </div>
            
            {/* Center - Chatbot */}
            <div className="w-[40vw] h-full flex flex-col">
              <SoupBotChat roomId={roomId} chatService={chatService} disabled={isGameNotStarted} />
            </div>
            
            {/* Right side - Action Buttons */}
            <div className="flex flex-col gap-4">
              <button
                className={`px-6 py-3 rounded-lg transition-colors whitespace-nowrap ${
                  isGameNotStarted
                    ? 'bg-[#0e639c] hover:bg-[#1177bb] text-white cursor-pointer'
                    : 'bg-[#3e3e42] text-[#858585] cursor-not-allowed'
                }`}
                onClick={handleStartGameClick}
                disabled={isGameStarted}
              >
                开始新汤
              </button>
              <button
                className={`px-6 py-3 rounded-lg transition-colors border border-[#3e3e42] whitespace-nowrap ${
                  isGameStarted
                    ? 'bg-[#2d2d30] hover:bg-[#3e3e42] text-white cursor-pointer'
                    : 'bg-[#2d2d30] text-[#858585] cursor-not-allowed'
                }`}
                onClick={resetGame}
                disabled={isGameNotStarted}
              >
                公布答案
              </button>
            </div>
          </div>
        </main>
        <PuzzleInputDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          onConfirm={handleDialogConfirm}
        />
      </div>
    </IdentityProvider>
  );
};
