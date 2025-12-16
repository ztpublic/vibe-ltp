'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SoupBotChat, type SoupBotChatRef } from './index';
import type { ChatService } from './services';
import type { GameStateController, ChatHistoryController } from './controllers';
import { IdentityProvider } from './identity/useChatIdentity';
import { PuzzleInputDialog } from './components';
import { getSessionTruth } from '@/src/features/sessions/api';
import type { BotMessage } from '@vibe-ltp/shared';
import type { Toast } from './utils/notifications';

export interface ChatHomeProps {
  sessionId: string;
  gameStateController: GameStateController;
  chatService: ChatService;
  chatHistoryController?: ChatHistoryController;
  onStartGame?: () => void;
  onResetGame?: () => void;
  onLeaveGame?: () => void;
  truthLoader?: (sessionId: string) => Promise<string>;
  toasts?: Toast[];
}

export const ChatHome = ({ 
  sessionId,
  gameStateController,
  chatService, 
  chatHistoryController,
  onStartGame,
  onResetGame,
  onLeaveGame,
  truthLoader = getSessionTruth,
  toasts = [],
}: ChatHomeProps) => {
  const { gameState, puzzleContent, startGame, resetGame } = gameStateController;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRandomLoading, setIsRandomLoading] = useState(false);
  const [randomError, setRandomError] = useState<string | null>(null);
  const chatbotRef = useRef<SoupBotChatRef>(null);
  
  const isGameNotStarted = gameState === 'NotStarted';
  const isGameStarted = gameState === 'Started';
  const isGameEnded = gameState === 'Ended';
  const hasPuzzleSurface = Boolean(puzzleContent?.soupSurface);
  const isChatDisabled = gameState !== 'Started' || !hasPuzzleSurface;

  useEffect(() => {
    if (!isRandomLoading) return;
    if (hasPuzzleSurface || gameState !== 'Started') {
      setIsRandomLoading(false);
    }
  }, [gameState, hasPuzzleSurface, isRandomLoading]);

  const handleStartGameClick = () => {
    setRandomError(null);
    setIsDialogOpen(true);
  };

  const handleRandomStart = async () => {
    if (isGameStarted) return;

    try {
      setRandomError(null);
      setIsRandomLoading(true);
      startGame({ mode: 'random' });
      onStartGame?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : '无法加载随机谜题';
      setRandomError(`随机开局失败：${message}`);
      console.error('[ChatHome] Failed to start random puzzle', error);
    } finally {
      // Loading state is cleared once puzzle content arrives via socket update.
    }
  };

  const handleDialogConfirm = (soupSurface: string, soupTruth: string) => {
    startGame({ mode: 'custom', puzzleContent: { soupSurface, soupTruth } });
    setIsDialogOpen(false);
    onStartGame?.();
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleRevealTruth = async () => {
    try {
      const soupTruth = await truthLoader(sessionId);
      if (!chatbotRef.current) return;

      const truthMessage: BotMessage = {
        id: `bot-truth-${Date.now()}`,
        type: 'bot',
        content: `💡 谜题真相：\n\n${soupTruth}`,
        timestamp: new Date().toISOString(),
      };
      chatbotRef.current.addBotMessage(truthMessage, {
        showThumbsUp: false,
        showThumbsDown: false,
      });
      chatbotRef.current.showUserThumbsDown();
      
      // Wait a bit to ensure message is sent to server before resetting
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Reset game state (chat history is preserved on server)
      resetGame();
      onResetGame?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : '无法获取谜题真相';
      setRandomError(`公布答案失败：${message}`);
      console.error('[ChatHome] Failed to reveal truth', error);
    }
  };

  return (
    <IdentityProvider>
      <div className="h-screen bg-[#1e1e1e] flex flex-col">
        <main className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
          <div className="absolute top-4 right-4 flex flex-col items-end space-y-2">
            <button
              className="px-3 py-1.5 rounded bg-[#2d2d30] hover:bg-[#3e3e42] text-[#e5e5e5] border border-[#3e3e42] text-xs transition-colors"
              type="button"
              onClick={() => onLeaveGame?.()}
            >
              离开房间
            </button>
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
                  {isGameEnded && (
                    <div className="mt-3 text-sm text-red-200">
                      房间已结束，点击“开始新汤”重新开局。
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Center - Chatbot */}
            <div className="w-[40vw] h-full flex flex-col">
              <SoupBotChat
                ref={chatbotRef}
                chatService={chatService}
                chatHistoryController={chatHistoryController}
                disabled={isChatDisabled}
                gameState={gameState}
              />
              {isChatDisabled && (
                <div className="mt-2 text-xs text-[#aaaaaa]">
                  {isGameNotStarted
                    ? '游戏未开始，先点击“开始新汤”开启本局。'
                    : isGameEnded
                      ? '本局已结束，重新开始后再继续聊天。'
                      : '谜题载入中，请稍候...'}
                </div>
              )}
            </div>
            
            {/* Right side - Action Buttons */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <button
                  className={`px-6 py-3 rounded-lg transition-colors whitespace-nowrap ${
                    !isGameStarted && !isRandomLoading
                      ? 'bg-[#0e639c] hover:bg-[#1177bb] text-white cursor-pointer'
                      : 'bg-[#3e3e42] text-[#858585] cursor-not-allowed'
                  }`}
                  onClick={handleRandomStart}
                  disabled={isGameStarted || isRandomLoading}
                >
                  {isRandomLoading
                    ? '载入随机汤...'
                    : isGameEnded
                      ? '随机重新开始'
                      : '随机开汤'}
                </button>
                <button
                  className={`px-6 py-3 rounded-lg transition-colors whitespace-nowrap border border-[#3e3e42] ${
                    !isGameStarted && !isRandomLoading
                      ? 'bg-[#2d2d30] hover:bg-[#3e3e42] text-white cursor-pointer'
                      : 'bg-[#2d2d30] text-[#858585] cursor-not-allowed'
                  }`}
                  onClick={handleStartGameClick}
                  disabled={isGameStarted || isRandomLoading}
                >
                  {isGameEnded ? '自定义重新开始' : '自定义开汤'}
                </button>
                {randomError && (
                  <div className="text-xs text-red-200 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                    {randomError}
                  </div>
                )}
              </div>
              <button
                className={`px-6 py-3 rounded-lg transition-colors border border-[#3e3e42] whitespace-nowrap ${
                  isGameStarted && hasPuzzleSurface
                    ? 'bg-[#2d2d30] hover:bg-[#3e3e42] text-white cursor-pointer'
                    : 'bg-[#2d2d30] text-[#858585] cursor-not-allowed'
                }`}
                onClick={handleRevealTruth}
                disabled={!isGameStarted || !hasPuzzleSurface}
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
