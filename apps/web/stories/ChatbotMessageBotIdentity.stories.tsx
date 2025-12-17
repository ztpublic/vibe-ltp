import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ChatbotMessage, UserChatMessage } from '../src/ui/chatbot';
import type { IMessage } from '../src/ui/chatbot';

import '../src/ui/chatbot/main.css';

const svgAvatarDataUri = (options: { background: string; text: string }) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <circle cx="32" cy="32" r="32" fill="${options.background}" />
  <text x="32" y="40" text-anchor="middle" font-size="28" font-family="system-ui, -apple-system, Segoe UI, Roboto" fill="#ffffff">${options.text}</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const meta: Meta<typeof ChatbotMessage> = {
  title: 'Chatbot/Messages/BotIdentity',
  component: ChatbotMessage,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ChatbotMessage>;

const MultiBotPreview = () => {
  const hostMessage: IMessage = {
    id: 1,
    type: 'bot',
    message: 'I am the host. Ask me yes/no questions.',
    botId: 'host',
    botName: '主持人',
    botAvatar: {
      imageSrc: svgAvatarDataUri({ background: '#4f46e5', text: '主' }),
      imageAlt: 'Host avatar',
    },
    showThumbsUp: false,
    showThumbsDown: false,
  };

  const hostFollowup: IMessage = {
    id: 2,
    type: 'bot',
    message: 'Hint: focus on what the man could not see.',
    botId: 'host',
    botName: '主持人',
    botAvatar: {
      imageSrc: svgAvatarDataUri({ background: '#4f46e5', text: '主' }),
      imageAlt: 'Host avatar',
    },
    showThumbsUp: false,
    showThumbsDown: false,
  };

  const judgeMessage: IMessage = {
    id: 3,
    type: 'bot',
    message: 'Judge bot here: that question is irrelevant.',
    botId: 'judge',
    botName: '裁判',
    botAvatar: {
      imageSrc: svgAvatarDataUri({ background: '#059669', text: '裁' }),
      imageAlt: 'Judge avatar',
    },
    showThumbsUp: false,
    showThumbsDown: false,
  };

  const messages: IMessage[] = [hostMessage, hostFollowup, judgeMessage];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <ChatbotMessage
        message={hostMessage.message}
        id={hostMessage.id}
        messages={messages}
        messageObject={hostMessage}
        customStyles={{}}
        withAvatar={true}
        loading={false}
        defaultBotName="主持人"
      />
      <ChatbotMessage
        message={hostFollowup.message}
        id={hostFollowup.id}
        messages={messages}
        messageObject={hostFollowup}
        customStyles={{}}
        withAvatar={false}
        loading={false}
        defaultBotName="主持人"
      />
      <ChatbotMessage
        message={judgeMessage.message}
        id={judgeMessage.id}
        messages={messages}
        messageObject={judgeMessage}
        customStyles={{}}
        withAvatar={true}
        loading={false}
        defaultBotName="主持人"
      />
    </div>
  );
};

export const MultipleBots: Story = {
  render: () => <MultiBotPreview />,
};

const BotIdentityReplyPreview = () => {
  const userMessageId = 'user_msg_42';

  const userMessage: IMessage = {
    id: 42,
    type: 'user',
    message: 'Did the man die because of what he saw?',
    nickname: 'Casey',
    showThumbsUp: false,
    showThumbsDown: false,
  };

  const botReply: IMessage = {
    id: 43,
    type: 'bot',
    message: 'Yes.',
    botId: 'judge',
    botName: '裁判',
    botAvatar: {
      imageSrc: svgAvatarDataUri({ background: '#059669', text: '裁' }),
      imageAlt: 'Judge avatar',
    },
    replyToId: userMessageId,
    replyToPreview: 'Did the man die because of what he saw?',
    replyToNickname: 'Casey',
    showThumbsUp: false,
    showThumbsDown: false,
  };

  const messages: IMessage[] = [userMessage, botReply];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <UserChatMessage
        message={userMessage.message}
        messageId={userMessageId}
        nickname={userMessage.nickname}
        customComponents={{}}
        customStyles={{}}
        messageObject={userMessage}
      />
      <ChatbotMessage
        message={botReply.message}
        id={botReply.id}
        messages={messages}
        messageObject={botReply}
        customStyles={{}}
        withAvatar={true}
        loading={false}
        defaultBotName="主持人"
      />
    </div>
  );
};

export const WithReply: Story = {
  render: () => <BotIdentityReplyPreview />,
};
