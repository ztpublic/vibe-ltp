import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { GameSession } from '@vibe-ltp/shared';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { SessionLobby } from '../src/features/sessions/SessionLobby';

const log = (label: string) => (...args: unknown[]) => {
  // Storybook 9+ removes addon-actions; simple logger for story interactions
  // eslint-disable-next-line no-console
  console.log(label, ...args);
};

const mockRouter = {
  push: log('router.push'),
  replace: log('router.replace'),
  refresh: log('router.refresh'),
  prefetch: async () => {},
  back: log('router.back'),
  forward: log('router.forward'),
};

const baseTime = new Date('2024-02-10T12:00:00Z').getTime();
let timeCursor = 0;

const nextTimestamp = () => new Date(baseTime + timeCursor++ * 60000).toISOString();

function makeSession(id: string, overrides?: Partial<GameSession>): GameSession {
  const createdAt = overrides?.createdAt ?? nextTimestamp();

  return {
    id,
    title: overrides?.title ?? `房间 ${id}`,
    state: overrides?.state ?? 'NotStarted',
    hostNickname: overrides?.hostNickname ?? '主持人',
    createdAt,
    updatedAt: overrides?.updatedAt ?? createdAt,
    playerCount: overrides?.playerCount ?? 1,
    isActive: overrides?.isActive ?? true,
    puzzleSummary: overrides?.puzzleSummary,
  };
}

const createSessionLoader = (sessions: GameSession[]) => async () => ({ sessions });

const mockCreateSession = async () => ({
  session: makeSession('storybook-created', {
    title: '新建房间',
    playerCount: 1,
  }),
});

const populatedSessions: GameSession[] = [
  makeSession('room-1', { title: '午夜谜题', hostNickname: '阿月', playerCount: 2, state: 'NotStarted' }),
  makeSession('room-2', { title: '极速猜想', hostNickname: 'Leo', playerCount: 5, state: 'Started' }),
  makeSession('room-3', { title: '黄昏之局', hostNickname: 'Mina', playerCount: 3, state: 'Started' }),
  makeSession('room-4', { title: '周末小聚', hostNickname: '陈诚', playerCount: 4, state: 'NotStarted' }),
  makeSession('room-5', { title: '深夜速答', hostNickname: 'Rui', playerCount: 6, state: 'Started' }),
  makeSession('room-6', { title: '谜团终章', hostNickname: 'Ken', playerCount: 2, state: 'Ended', isActive: true }),
  makeSession('room-7', { title: '轻松练习', hostNickname: '露西', playerCount: 1, state: 'NotStarted' }),
  makeSession('room-8', { title: '午后推理', hostNickname: '阿斌', playerCount: 3, state: 'Started' }),
];

const meta: Meta<typeof SessionLobby> = {
  title: 'Pages/SessionLobby',
  component: SessionLobby,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <AppRouterContext.Provider value={mockRouter as any}>
        <Story />
      </AppRouterContext.Provider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof SessionLobby>;

export const EmptyLobby: Story = {
  render: () => (
    <SessionLobby
      onCreate={log('create')}
      onJoin={log('join')}
      sessionLoader={createSessionLoader([])}
      sessionCreator={mockCreateSession}
    />
  ),
};

export const ManyGames: Story = {
  render: () => (
    <SessionLobby
      onCreate={log('create')}
      onJoin={log('join')}
      sessionLoader={createSessionLoader(populatedSessions)}
      sessionCreator={mockCreateSession}
    />
  ),
};
