import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ChatbotMessage from '../../../packages/react-chatbot-kit/src/components/ChatbotMessage/ChatbotMessage';
import UserChatMessage from '../../../packages/react-chatbot-kit/src/components/UserChatMessage/UserChatMessage';
import type { IChatState, IMessage } from '../../../packages/react-chatbot-kit/src/interfaces/IMessages';
import { getFeedbackSnapshot } from '../../../packages/react-chatbot-kit/src/utils/feedbackRegistry';

// Import styles from the package so the bubble renders correctly in Storybook
import '../../../packages/react-chatbot-kit/src/components/ChatbotMessage/ChatbotMessage.css';
import '../../../packages/react-chatbot-kit/src/components/UserChatMessage/UserChatMessage.css';

const sampleDecorator = {
  id: 'warning',
  label: 'Flagged content',
  text: 'This message needs moderator review.',
  icon: '⚠️',
  color: '#f59e0b',
};

const message: IMessage = {
  id: 1,
  type: 'bot',
  message: 'This riddle includes spoilers. Proceed with caution.',
  decorators: [sampleDecorator],
  showThumbsUp: false,
  showThumbsDown: false,
};

const messages: IMessage[] = [message];

const meta: Meta<typeof ChatbotMessage> = {
  title: 'Chatbot/Messages/Decorators',
  component: ChatbotMessage,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ChatbotMessage>;

export const WithDecorator: Story = {
  args: {
    message: message.message,
    id: message.id,
    messages,
    messageObject: message,
    customStyles: {},
    withAvatar: true,
    loading: false,
  },
};

export const WithImageIcon: Story = {
  args: {
    message: 'Investigation marked with attached evidence.',
    id: 2,
    messages: [
      ...messages,
      {
        id: 2,
        type: 'bot',
        message: 'Investigation marked with attached evidence.',
        decorators: [
          {
            id: 'evidence',
            label: 'Evidence attached',
            text: 'Click the evidence icon for details.',
            icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f50d.png',
            color: '#3b82f6',
          },
        ],
        showThumbsUp: false,
        showThumbsDown: false,
      },
    ],
    messageObject: {
      id: 2,
      type: 'bot',
      message: 'Investigation marked with attached evidence.',
      decorators: [
        {
          id: 'evidence',
          label: 'Evidence attached',
          text: 'Click the evidence icon for details.',
          icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f50d.png',
          color: '#3b82f6',
        },
      ],
      showThumbsUp: false,
      showThumbsDown: false,
    },
    customStyles: {},
    withAvatar: true,
    loading: false,
  },
};

const ThumbFeedbackPreview = () => {
  const [state, setState] = React.useState<IChatState>(() => ({
    messages: [
      {
        id: 101,
        type: 'bot',
        message: 'Rate this hint so we can tune the puzzle difficulty.',
        showThumbsUp: true,
        showThumbsDown: true,
      },
      {
        id: 102,
        type: 'user',
        message: 'This clue helped a lot!',
        nickname: 'Casey',
        showThumbsUp: true,
        showThumbsDown: false,
      },
    ],
  }));
  const [snapshot, setSnapshot] = React.useState(() => getFeedbackSnapshot());

  React.useEffect(() => {
    setSnapshot(getFeedbackSnapshot());
  }, [state.messages]);

  const botMessage = state.messages[0];
  const userMessage = state.messages[1];

  if (!botMessage || !userMessage) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <ChatbotMessage
        message={botMessage.message}
        id={botMessage.id}
        messages={state.messages}
        messageObject={botMessage}
        customStyles={{}}
        withAvatar={true}
        loading={false}
        setState={setState}
      />
      <UserChatMessage
        message={userMessage.message}
        messageId={`user_msg_${userMessage.id}`}
        nickname={userMessage.nickname}
        customComponents={{}}
        customStyles={{}}
        messageObject={userMessage}
        setState={setState}
      />
      <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>
        <strong>Feedback snapshot:</strong>
        <pre
          style={{
            margin: '6px 0 0',
            padding: '8px',
            background: '#f8fafc',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            maxWidth: '420px',
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
          }}
        >
          {JSON.stringify(snapshot, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const WithThumbFeedback: Story = {
  render: () => <ThumbFeedbackPreview />,
};
