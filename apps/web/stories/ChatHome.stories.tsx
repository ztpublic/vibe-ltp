import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ChatHome, ChatHomeProps } from '../src/features/chatbot/ChatHome';
import MockActionProvider from '../src/features/chatbot/MockActionProvider';
import React from 'react';

const meta: Meta<typeof ChatHome> = {
  title: 'Pages/ChatHome',
  component: ChatHome,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ChatHome>;

export const Default: Story = {
  args: {
    roomId: 'storybook-room',
  } satisfies ChatHomeProps,
};

export const Mocked: Story = {
  args: {
    roomId: 'storybook-room',
    actionProviderOverride: MockActionProvider,
  } satisfies ChatHomeProps,
};
