import Chatbot from './components/Chatbot/Chatbot';
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

export {
  Chatbot,
  createChatBotMessage,
  createClientMessage,
  createCustomMessage,
  useChatbot,
};

export default Chatbot;
