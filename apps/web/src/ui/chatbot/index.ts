import Chatbot from './components/Chatbot/Chatbot';
import ChatbotMessage from './components/ChatbotMessage/ChatbotMessage';
import UserChatMessage from './components/UserChatMessage/UserChatMessage';
import {
  createChatBotMessage,
  createClientMessage,
  createCustomMessage,
} from './components/Chat/chatUtils';
import useChatbot from './hooks/useChatbot';

// Export utilities
export * from './utils/messageEncoding';
export * from './utils/messageRegistry';
export * from './utils/feedbackRegistry';

// Export interfaces
export type { IMessage, IChatState } from './interfaces/IMessages';

export {
  Chatbot,
  ChatbotMessage,
  UserChatMessage,
  createChatBotMessage,
  createClientMessage,
  createCustomMessage,
  useChatbot,
};

export default Chatbot;
