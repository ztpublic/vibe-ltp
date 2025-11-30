import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ChatHome } from '../src/features/chatbot/ChatHome';
import { MockChatService } from '../src/features/chatbot/services';
import { useMockGameStateController, useMockChatHistoryController } from '../src/features/chatbot/controllers';
import { samplePuzzle, longPuzzle, generateMockConversation, generateMessagesWithErrors } from './mockData';
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

// Story 1: Initial state - no game, no messages
export const NotStarted_Empty: Story = {
  render: () => {
    const gameStateController = useMockGameStateController({
      gameState: 'NotStarted',
      puzzleContent: null,
      isConnected: true,
    });
    const chatHistoryController = useMockChatHistoryController([]);
    const chatService = new MockChatService();

    return (
      <ChatHome
        gameStateController={gameStateController}
        chatService={chatService}
        chatHistoryController={chatHistoryController}
      />
    );
  },
};

// Story 2: Game not started but chat history persists
export const NotStarted_WithHistory: Story = {
  render: () => {
    const gameStateController = useMockGameStateController({
      gameState: 'NotStarted',
      puzzleContent: null,
      isConnected: true,
    });
    const chatHistoryController = useMockChatHistoryController(generateMockConversation(10));
    const chatService = new MockChatService();

    return (
      <ChatHome
        gameStateController={gameStateController}
        chatService={chatService}
        chatHistoryController={chatHistoryController}
      />
    );
  },
};

// Story 3: Game just started with initial greeting
export const Started_JustBegun: Story = {
  render: () => {
    const gameStateController = useMockGameStateController({
      gameState: 'Started',
      puzzleContent: samplePuzzle,
      isConnected: true,
    });
    const chatHistoryController = useMockChatHistoryController([
      {
        id: 'bot_welcome',
        type: 'bot',
        content: '游戏开始！请根据汤面提问，我会回答"是"、"不是"或"无关"。',
        timestamp: new Date().toISOString(),
      },
    ]);
    const chatService = new MockChatService();

    return (
      <ChatHome
        gameStateController={gameStateController}
        chatService={chatService}
        chatHistoryController={chatHistoryController}
      />
    );
  },
};

// Story 4: Active game with ongoing conversation
export const Started_ActiveConversation: Story = {
  render: () => {
    const gameStateController = useMockGameStateController({
      gameState: 'Started',
      puzzleContent: samplePuzzle,
      isConnected: true,
    });
    const chatHistoryController = useMockChatHistoryController(generateMockConversation(15));
    const chatService = new MockChatService();

    return (
      <ChatHome
        gameStateController={gameStateController}
        chatService={chatService}
        chatHistoryController={chatHistoryController}
      />
    );
  },
};

// Story 5: Long conversation to test scroll behavior
export const Started_LongConversation: Story = {
  render: () => {
    const gameStateController = useMockGameStateController({
      gameState: 'Started',
      puzzleContent: samplePuzzle,
      isConnected: true,
    });
    const chatHistoryController = useMockChatHistoryController(generateMockConversation(24));
    const chatService = new MockChatService();

    return (
      <ChatHome
        gameStateController={gameStateController}
        chatService={chatService}
        chatHistoryController={chatHistoryController}
      />
    );
  },
};

// Story 6: Conversation with reply chains
export const Started_WithReplies: Story = {
  render: () => {
    const gameStateController = useMockGameStateController({
      gameState: 'Started',
      puzzleContent: samplePuzzle,
      isConnected: true,
    });
    const chatHistoryController = useMockChatHistoryController(generateMockConversation(12));
    const chatService = new MockChatService();

    return (
      <ChatHome
        gameStateController={gameStateController}
        chatService={chatService}
        chatHistoryController={chatHistoryController}
      />
    );
  },
};

// Story 7: Messages with error responses
export const Started_WithErrors: Story = {
  render: () => {
    const gameStateController = useMockGameStateController({
      gameState: 'Started',
      puzzleContent: samplePuzzle,
      isConnected: true,
    });
    const chatHistoryController = useMockChatHistoryController(generateMessagesWithErrors());
    const chatService = new MockChatService();

    return (
      <ChatHome
        gameStateController={gameStateController}
        chatService={chatService}
        chatHistoryController={chatHistoryController}
      />
    );
  },
};

// Story 8: Very long puzzle text
export const Started_LongPuzzleText: Story = {
  render: () => {
    const gameStateController = useMockGameStateController({
      gameState: 'Started',
      puzzleContent: longPuzzle,
      isConnected: true,
    });
    const chatHistoryController = useMockChatHistoryController(generateMockConversation(5));
    const chatService = new MockChatService();

    return (
      <ChatHome
        gameStateController={gameStateController}
        chatService={chatService}
        chatHistoryController={chatHistoryController}
      />
    );
  },
};

// Story 9: Disconnected state
export const Started_Disconnected: Story = {
  render: () => {
    const gameStateController = useMockGameStateController({
      gameState: 'Started',
      puzzleContent: samplePuzzle,
      isConnected: false,
    });
    const chatHistoryController = useMockChatHistoryController(generateMockConversation(10));
    const chatService = new MockChatService();

    return (
      <ChatHome
        gameStateController={gameStateController}
        chatService={chatService}
        chatHistoryController={chatHistoryController}
      />
    );
  },
};

// Story 10: Interactive - can actually send messages
export const Started_Interactive: Story = {
  render: () => {
    const gameStateController = useMockGameStateController({
      gameState: 'Started',
      puzzleContent: samplePuzzle,
      isConnected: true,
    });
    const chatHistoryController = useMockChatHistoryController([
      {
        id: 'bot_welcome',
        type: 'bot',
        content: '游戏开始！请提问，我会回答。（在这个故事中你可以实际发送消息）',
        timestamp: new Date().toISOString(),
      },
    ]);
    const chatService = new MockChatService();

    return (
      <ChatHome
        gameStateController={gameStateController}
        chatService={chatService}
        chatHistoryController={chatHistoryController}
      />
    );
  },
};
