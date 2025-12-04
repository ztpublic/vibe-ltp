'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GameSession } from '@vibe-ltp/shared';
import { createSession, listSessions } from './api';

type SessionLobbyProps = {
  onCreate?: (sessionId: string) => void;
  onJoin?: (sessionId: string) => void;
};

export function SessionLobby({ onCreate, onJoin }: SessionLobbyProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [hostNickname, setHostNickname] = useState('');
  const [joinId, setJoinId] = useState('');

  const refresh = async () => {
    try {
      setLoading(true);
      const res = await listSessions();
      setSessions(res.sessions);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreate = async () => {
    try {
      setCreating(true);
      const res = await createSession({
        title: title || undefined,
        hostNickname: hostNickname || undefined,
      });
      const nextId = res.session.id;
      onCreate?.(nextId);
      router.push(`/rooms/${nextId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = (id: string) => {
    const nextId = id.trim();
    if (!nextId) return;
    onJoin?.(nextId);
    router.push(`/rooms/${nextId}`);
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white flex flex-col">
      <header className="px-6 py-4 border-b border-[#3e3e42] bg-[#252526] flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">海龟汤 Lobby</h1>
          <p className="text-sm text-[#cccccc]">浏览现有房间或创建新的游戏。</p>
        </div>
        <button
          className="text-sm text-[#9cdcfe] underline underline-offset-2"
          onClick={refresh}
          disabled={loading}
        >
          刷新
        </button>
      </header>

      <main className="flex-1 px-6 py-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <section className="border border-[#3e3e42] bg-[#252526] rounded-lg p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">房间列表</h2>
            {loading && <span className="text-xs text-[#9cdcfe]">加载中...</span>}
          </div>
          {error && (
            <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded p-2">
              {error}
            </div>
          )}
          <div className="space-y-3 overflow-auto">
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
                    <p className="font-medium">{session.title || '未命名房间'}</p>
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
                  <p className="text-xs text-[#9cdcfe] font-mono break-all">{session.id}</p>
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

        <section className="border border-[#3e3e42] bg-[#252526] rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold">创建房间</h2>
          <div className="space-y-2">
            <label className="text-sm text-[#cccccc]">房间名</label>
            <input
              className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0e639c]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：晚间谜题局"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[#cccccc]">昵称（可选，主持人）</label>
            <input
              className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0e639c]"
              value={hostNickname}
              onChange={(e) => setHostNickname(e.target.value)}
              placeholder="主持人昵称"
            />
          </div>
          <button
            className="w-full px-4 py-2 rounded bg-[#0e639c] hover:bg-[#1177bb] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? '创建中...' : '创建新房间'}
          </button>

          <div className="pt-4 border-t border-[#3e3e42] space-y-2">
            <label className="text-sm text-[#cccccc]">加入房间</label>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-[#1e1e1e] border border-[#3e3e42] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0e639c]"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                placeholder="输入房间 ID"
              />
              <button
                className="px-4 py-2 rounded bg-[#2d2d30] hover:bg-[#3e3e42] text-white border border-[#3e3e42]"
                onClick={() => handleJoin(joinId)}
              >
                加入
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
