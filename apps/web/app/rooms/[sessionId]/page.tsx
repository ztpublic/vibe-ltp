'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatHome } from '@/src/features/chatbot/ChatHome';
import { ApiChatService } from '@/src/features/chatbot/services';
import { useGameStateController, useChatHistoryController } from '@/src/features/chatbot/controllers';
import { useToastQueue } from '@/src/features/chatbot/utils/notifications';
import { joinSession } from '@/src/features/sessions/api';
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
  const [snapshot, setSnapshot] = useState<GameSessionSnapshot | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!sessionId) {
      setError('缺少房间 ID');
      setLoading(false);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await joinSession(safeSessionId);
        if (!active) return;
        setSnapshot(res.session);
        setChatHistory(res.chatHistory ? normalizeHistory(res.chatHistory) : []);
        setError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        push({ type: 'error', message: msg });
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [safeSessionId, sessionId, push]);

  const gameStateController = useGameStateController(
    safeSessionId,
    push,
    snapshot
      ? { state: snapshot.state, puzzleContent: snapshot.puzzleContent ?? null }
      : undefined,
  );
  const chatHistoryController = useChatHistoryController(safeSessionId, push, chatHistory);
  const chatService = useMemo(() => new ApiChatService(safeSessionId), [safeSessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] text-white flex items-center justify-center">
        <p className="text-sm text-[#9cdcfe]">加载房间中...</p>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] text-white flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-300">房间加载失败：{error || '未知错误'}</p>
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
    />
  );
}
