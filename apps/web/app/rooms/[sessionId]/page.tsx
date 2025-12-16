'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ChatHome } from '@/src/features/chatbot/ChatHome';
import { ApiChatService } from '@/src/features/chatbot/services';
import { useGameStateController, useChatHistoryController } from '@/src/features/chatbot/controllers';
import { useToastQueue } from '@/src/features/chatbot/utils/notifications';
import { getSession } from '@/src/features/sessions/api';
import type { GameSessionSnapshot, SessionChatMessage, ChatMessage } from '@vibe-ltp/shared';

type RoomPageParams = {
  sessionId: string;
};

export default function RoomPage() {
  const params = useParams<RoomPageParams>();
  const router = useRouter();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const safeSessionId = sessionId || 'default';
  const { toasts, push } = useToastQueue();

  const normalizeHistory = (entries: SessionChatMessage[]): ChatMessage[] =>
    entries.map((entry) => {
      if (entry.type === 'user') {
        return {
          id: entry.id,
          type: 'user' as const,
          content: entry.content,
          nickname: entry.nickname || '玩家',
          timestamp: entry.timestamp,
          answer: entry.answer,
          answerTip: entry.answerTip,
        };
      }

      return {
        id: entry.id,
        type: 'bot' as const,
        content: entry.content,
        timestamp: entry.timestamp,
        replyMetadata: entry.replyToId
          ? {
              replyToId: entry.replyToId,
              replyToPreview: entry.replyToPreview ?? '',
              replyToNickname: entry.replyToNickname ?? '玩家',
            }
          : undefined,
      };
    });

  const sessionQuery = useQuery({
    queryKey: ['session', safeSessionId],
    queryFn: () => getSession(safeSessionId),
    enabled: Boolean(sessionId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!sessionQuery.error) return;
    const msg = sessionQuery.error instanceof Error ? sessionQuery.error.message : String(sessionQuery.error);
    push({ type: 'error', message: msg });
  }, [push, sessionQuery.error]);

  const snapshot: GameSessionSnapshot | null = sessionQuery.data?.session ?? null;
  const chatHistory = useMemo(() => {
    return sessionQuery.data?.chatHistory ? normalizeHistory(sessionQuery.data.chatHistory) : [];
  }, [sessionQuery.data?.chatHistory]);

  const gameStateController = useGameStateController(
    safeSessionId,
    push,
    snapshot
      ? { state: snapshot.state, puzzleContent: snapshot.puzzleContent ?? null }
      : undefined,
  );
  const chatHistoryController = useChatHistoryController(safeSessionId, push, chatHistory);
  const chatService = useMemo(() => new ApiChatService(safeSessionId), [safeSessionId]);

  if (sessionQuery.isPending) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] text-white flex items-center justify-center">
        <p className="text-sm text-[#9cdcfe]">加载房间中...</p>
      </div>
    );
  }

  if (!sessionId || sessionQuery.error || !snapshot) {
    const errorMessage = !sessionId
      ? '缺少房间 ID'
      : sessionQuery.error instanceof Error
        ? sessionQuery.error.message
        : sessionQuery.error
          ? String(sessionQuery.error)
          : '未知错误';

    return (
      <div className="min-h-screen bg-[#1e1e1e] text-white flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-300">房间加载失败：{errorMessage}</p>
        <button
          className="px-4 py-2 rounded bg-[#0e639c] hover:bg-[#1177bb]"
          onClick={() => router.push('/')}
        >
          返回大厅
        </button>
      </div>
    );
  }

  return (
    <ChatHome
      sessionId={safeSessionId}
      gameStateController={gameStateController}
      chatService={chatService}
      chatHistoryController={chatHistoryController}
      toasts={toasts}
      onStartGame={() => push({ type: 'info', message: '已开始新汤' })}
      onLeaveGame={() => router.push('/')}
    />
  );
}
