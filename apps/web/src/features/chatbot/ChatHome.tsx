'use client';

import React, { useState, useRef } from 'react';
import { SoupBotChat, type SoupBotChatRef } from './index';
import type { ChatService } from './services';
import type { GameStateController, ChatHistoryController } from './controllers';
import { IdentityProvider } from './identity/useChatIdentity';
import { FactsList, PuzzleInputDialog } from './components';
import type { BotMessage } from '@vibe-ltp/shared';
import type { Toast } from './utils/notifications';

export interface ChatHomeProps {
  gameStateController: GameStateController;
  chatService: ChatService;
  chatHistoryController?: ChatHistoryController;
  onStartGame?: (content: { soupSurface: string; soupTruth: string }) => void;
  onResetGame?: () => void;
  toasts?: Toast[];
}

export const ChatHome = ({ 
  gameStateController,
  chatService, 
  chatHistoryController,
  onStartGame,
  onResetGame,
  toasts = [],
}: ChatHomeProps) => {
  const { gameState, puzzleContent, startGame, resetGame } = gameStateController;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const chatbotRef = useRef<SoupBotChatRef>(null);
  
  const isGameStarted = gameState === 'Started';
  const isGameNotStarted = gameState === 'NotStarted';

  const handleStartGameClick = () => {
    setIsDialogOpen(true);
  };

  const handleDialogConfirm = (soupSurface: string, soupTruth: string) => {
    startGame({ soupSurface, soupTruth });
    setIsDialogOpen(false);
    onStartGame?.({ soupSurface, soupTruth });
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleRevealTruth = async () => {
    // Send truth to chatbot
    if (puzzleContent?.soupTruth && chatbotRef.current) {
      const truthMessage: BotMessage = {
        id: `bot-truth-${Date.now()}`,
        type: 'bot',
        content: `💡 谜题真相：\n\n${puzzleContent.soupTruth}`,
        timestamp: new Date().toISOString(),
      };
      chatbotRef.current.addBotMessage(truthMessage);
      
      // Wait a bit to ensure message is sent to server before resetting
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    // Reset game state (chat history is preserved on server)
    resetGame();
    onResetGame?.();
  };

  return (
    <IdentityProvider>
      <div className="h-screen bg-[#1e1e1e] flex flex-col">
        <main className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
          <div className="absolute top-4 right-4 space-y-2">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`px-3 py-2 rounded text-xs shadow transition ${
                  toast.type === 'error'
                    ? 'bg-red-500/20 text-red-200 border border-red-500/40'
                    : toast.type === 'warning'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                      : 'bg-sky-500/20 text-sky-200 border border-sky-500/40'
                }`}
              >
                {toast.message}
              </div>
            ))}
          </div>
          <div className="flex flex-row gap-4 h-full w-full max-w-screen-xl">
            {/* Left side - Puzzle Surface (汤面) */}
            <div className="w-[30vw] h-full flex flex-col gap-4">
              <div className="flex-1 min-h-0 border border-[#3e3e42] rounded-lg bg-[#252526] p-4 flex flex-col">
                <h2 className="text-xl font-semibold text-white mb-4">汤面</h2>
                <div className="text-[#cccccc] whitespace-pre-wrap flex-1 overflow-auto">
                  {puzzleContent?.soupSurface || '等待开始新汤...'}
                </div>
              </div>

              <FactsList facts={puzzleContent?.facts} isGameStarted={isGameStarted} />
            </div>
            
            {/* Center - Chatbot */}
            <div className="w-[40vw] h-full flex flex-col">
              <SoupBotChat 
                ref={chatbotRef} 
                chatService={chatService} 
                chatHistoryController={chatHistoryController}
                disabled={isGameNotStarted} 
              />
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
                onClick={handleRevealTruth}
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
