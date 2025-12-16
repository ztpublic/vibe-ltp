'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  GameSession,
  ListSessionsResponse,
} from '@vibe-ltp/shared';
import { createSession, listSessions } from './api';

type SessionLobbyProps = {
  onCreate?: (sessionId: string) => void;
  onJoin?: (sessionId: string) => void;
  sessionLoader?: () => Promise<ListSessionsResponse>;
  sessionCreator?: (payload: CreateSessionRequest) => Promise<CreateSessionResponse>;
};

export function SessionLobby({
  onCreate,
  onJoin,
  sessionLoader = listSessions,
  sessionCreator = createSession,
}: SessionLobbyProps) {
  const router = useRouter();

  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionLoader,
  });

  const createMutation = useMutation({
    mutationFn: sessionCreator,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] }).catch(() => {});
      const nextId = res.session.id;
      onCreate?.(nextId);
      router.push(`/rooms/${nextId}`);
    },
  });

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({});
    } catch (err) {
      console.warn('[SessionLobby] Failed to create session', err);
    } finally {
      // noop - mutation state handled by TanStack Query
    }
  };

  const handleJoin = (id: string) => {
    const nextId = id.trim();
    if (!nextId) return;
    onJoin?.(nextId);
    router.push(`/rooms/${nextId}`);
  };

  const sessions: GameSession[] = sessionsQuery.data?.sessions ?? [];
  const loading = sessionsQuery.isPending;
  const creating = createMutation.isPending;

  const error =
    (sessionsQuery.error instanceof Error ? sessionsQuery.error.message : sessionsQuery.error ? String(sessionsQuery.error) : null) ??
    (createMutation.error instanceof Error ? createMutation.error.message : createMutation.error ? String(createMutation.error) : null);


  return (
    <div className="h-screen bg-[#1e1e1e] text-white flex flex-col overflow-hidden">
      <main className="flex-1 min-h-0 px-6 py-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 overflow-hidden">
        <section className="border border-[#3e3e42] bg-[#252526] rounded-lg p-4 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
          <div className="flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-semibold">房间列表</h2>
            {loading && <span className="text-xs text-[#9cdcfe]">加载中...</span>}
          </div>
          {error && (
            <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded p-2 flex-shrink-0">
              {error}
            </div>
          )}
          <div className="space-y-3 overflow-auto flex-1 min-h-0">
            {sessions.length === 0 && !loading && (
              <div className="text-sm text-[#aaaaaa]">暂无房间，创建一个新的吧。</div>
            )}
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border border-[#3e3e42] rounded-md p-3 flex items-center justify-between bg-[#2d2d30]"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium font-mono">{session.id}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      session.state === 'Started'
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : session.state === 'Ended'
                          ? 'bg-slate-500/20 text-slate-200'
                          : 'bg-amber-500/20 text-amber-200'
                    }`}>
                      {session.state}
                    </span>
                  </div>
                  <p className="text-xs text-[#cccccc]">
                    玩家数：{session.playerCount} · 主持：{session.hostNickname || '未设置'}
                  </p>
                </div>
                <button
                  className="px-4 py-2 text-sm rounded bg-[#0e639c] hover:bg-[#1177bb] text-white"
                  onClick={() => handleJoin(session.id)}
                >
                  加入
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-[#3e3e42] bg-[#252526] rounded-lg p-4">
          <button
            className="w-full px-4 py-2 rounded bg-[#0e639c] hover:bg-[#1177bb] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? '创建中...' : '创建新房间'}
          </button>
        </section>
      </main>
    </div>
  );
}
