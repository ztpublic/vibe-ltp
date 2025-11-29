import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import Chatbot from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import '../src/features/chatbot/chatbot.css';
import config from '../src/features/chatbot/config';
import ActionProvider from '../src/features/chatbot/ActionProvider';
import MessageParser from '../src/features/chatbot/MessageParser';
import { MockChatService } from '../src/features/chatbot/services';
import { encodeBotMessage, encodeUserText, generateMessageId, truncateText } from '../src/features/chatbot/utils/chatEncoding';
import { createChatBotMessage, createClientMessage } from 'react-chatbot-kit';
import { IdentityProvider } from '../src/features/chatbot/identity';

// Q&A pairs for the story
const conversationPairs = [
  { question: '他在海上吗？', answer: '是的，他确实在海上。' },
  { question: '他是一个人吗？', answer: '不，他不是独自一人。' },
  { question: '这件事发生在很久以前吗？', answer: '是的，这件事发生在很多年前。' },
  { question: '他当时很饿吗？', answer: '不，他当时并不饿。' },
  { question: '海龟汤很重要吗？', answer: '是的，海龟汤对这个故事很重要。' },
  { question: '他中毒了吗？', answer: '不，他没有中毒。' },
  { question: '他以前吃过海龟汤吗？', answer: '是的，他之前吃过海龟汤。' },
  { question: '这是他第一次来这家餐厅吗？', answer: '不，这不是他第一次来这家餐厅。' },
  { question: '他认识老板吗？', answer: '是的，他认识餐厅的老板。' },
  { question: '老板欺骗了他吗？', answer: '不，老板没有欺骗他。' },
  { question: '他的妻子在场吗？', answer: '是的，他的妻子也在场。' },
  { question: '妻子吃了海龟汤吗？', answer: '不，妻子没有吃海龟汤。' },
  { question: '他们遇到过海难吗？', answer: '是的，他们曾经遇到过海难。' },
  { question: '所有人都活下来了吗？', answer: '不，不是所有人都活了下来。' },
  { question: '他们在海难中挨饿了吗？', answer: '是的，在海难中他们挨饿了很久。' },
  { question: '当时有真正的海龟汤吗？', answer: '不，当时没有真正的海龟汤。' },
  { question: '有人对他撒谎了吗？', answer: '是的，有人对他撒了谎。' },
  { question: '那是真的海龟肉吗？', answer: '不，那不是真的海龟肉。' },
  { question: '他明白了真相吗？', answer: '是的，他终于明白了真相。' },
  { question: '真相和他的自杀有关吗？', answer: '是的，真相太残酷了，所以他选择了自杀。' },
];

const meta: Meta = {
  title: 'Features/Chatbot/WithReplyLabels',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Chatbot with reply label feature. Each bot response shows a "↩ 回复" label that links back to the original question. Click the labels to scroll to the question.',
      },
    },
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: '600px', height: '700px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj;

/**
 * Component that renders chatbot with pre-populated messages
 */
const ChatbotWithMessages: React.FC = () => {
  const chatServiceRef = React.useRef(new MockChatService());
  
  // Create ActionProvider wrapper with chatService
  const ActionProviderWithService = React.useMemo(
    () => (props: any) => <ActionProvider {...props} chatService={chatServiceRef.current} />,
    []
  );

  // Build initial messages array with all Q&A pairs
  const initialMessages = React.useMemo(() => {
    const messages = [];

    // Create all question-answer pairs with metadata
    const qaPairs = conversationPairs.map((pair, index) => {
      // Generate a nickname for variety (some visitors, some with custom names)
      const nicknames = ['visitor', 'Alice', 'Bob', 'Charlie', 'visitor', 'Diana', 'visitor'];
      const nickname = nicknames[index % nicknames.length] ?? 'visitor';
      
      // Encode nickname into the question
      const encodedQuestion = encodeUserText(nickname, pair.question);
      
      // Use deterministic ID generation (content-based, no timestamp)
      const contentHash = pair.question.slice(0, 10).replace(/\s/g, '_');
      const questionId = `user_${contentHash}_${pair.question.length}`;
      const questionPreview = truncateText(pair.question, 40);
      const userMessage = createClientMessage(encodedQuestion, { loading: false }) as any;
      
      const encodedAnswer = encodeBotMessage({
        content: pair.answer,
        replyToId: questionId,
        replyToPreview: questionPreview,
        replyToNickname: nickname,
      });
      const botMessage = createChatBotMessage(encodedAnswer, {}) as any;
      
      return { userMessage, botMessage, questionId };
    });

    // Strategy: First half Q&A pairs appear together, second half are separated
    const halfPoint = Math.floor(qaPairs.length / 2);
    
    // Add first half with questions and answers together
    for (let i = 0; i < halfPoint; i++) {
      const pair = qaPairs[i];
      if (!pair) continue;
      messages.push(pair.userMessage);
      messages.push(pair.botMessage);
    }
    
    // Add second half questions only
    for (let i = halfPoint; i < qaPairs.length; i++) {
      const pair = qaPairs[i];
      if (!pair) continue;
      messages.push(pair.userMessage);
    }
    
    // Add second half answers in reverse order (creating distance)
    for (let i = qaPairs.length - 1; i >= halfPoint; i--) {
      const pair = qaPairs[i];
      if (!pair) continue;
      messages.push(pair.botMessage);
    }

    return messages;
  }, []);

  // Create config with pre-populated messages
  const configWithMessages = React.useMemo(
    () => ({
      ...config,
      initialMessages,
    }),
    [initialMessages]
  );

  return (
    <IdentityProvider>
      <div className="w-full h-full flex flex-col border border-[#3e3e42] rounded-lg overflow-hidden">
        <Chatbot
          config={configWithMessages}
          messageParser={MessageParser}
          actionProvider={ActionProviderWithService}
          placeholderText="向主持人提问"
        />
      </div>
    </IdentityProvider>
  );
};

/**
 * Story with pre-loaded conversation showing all 20 Q&A pairs
 * Demonstrates the reply label feature with multiple messages
 */
export const PreloadedConversation: Story = {
  render: () => <ChatbotWithMessages />,
  parameters: {
    docs: {
      description: {
        story:
          'Pre-loaded with 20 Q&A pairs. Scroll through the conversation and click any "↩ 回复" label to jump back to the original question. Each bot response shows a clickable reply label that scrolls to the original question with a highlight effect.',
      },
    },
  },
};
