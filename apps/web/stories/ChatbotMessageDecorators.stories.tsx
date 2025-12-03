import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ChatbotMessage from '../../../packages/react-chatbot-kit/src/components/ChatbotMessage/ChatbotMessage';
import type { IMessage } from '../../../packages/react-chatbot-kit/src/interfaces/IMessages';

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
    },
    customStyles: {},
    withAvatar: true,
    loading: false,
  },
};
