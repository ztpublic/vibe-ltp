import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ChatHome, ChatHomeProps } from '../src/features/chatbot/ChatHome';
import { MockChatService, ApiChatService } from '../src/features/chatbot/services';
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
    chatService: new MockChatService(),
  } satisfies ChatHomeProps,
};

export const WithRealApi: Story = {
  args: {
    chatService: new ApiChatService(),
  } satisfies ChatHomeProps,
};
