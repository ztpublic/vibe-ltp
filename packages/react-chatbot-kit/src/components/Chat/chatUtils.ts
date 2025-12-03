import {
  IBaseMessage,
  IMessage,
  IMessageOptions,
} from '../../interfaces/IMessages';

export const uniqueId = () => {
  return Math.round(Date.now() * Math.random());
};

export const botMessage = (message: IMessage) => {
  if (message.type === 'bot') {
    return true;
  }
  return false;
};

export const userMessage = (message: IMessage) => {
  if (message.type === 'user') {
    return true;
  }
  return false;
};

export const customMessage = (message: IMessage, customMessages: any) => {
  const customMessage = customMessages[message.type];

  if (customMessage) {
    return true;
  }
  return false;
};

export const createChatMessage = (message: string, type: string) => {
  return {
    message: message,
    type: type,
    id: uniqueId(),
  };
};

export const createChatBotMessage = (
  message: string,
  options: IMessageOptions
) => {
  return {
    ...createChatMessage(message, 'bot'),
    loading: true,
    // Extract reply metadata from options if provided
    replyToId: options.replyToId,
    replyToPreview: options.replyToPreview,
    replyToNickname: options.replyToNickname,
    // Spread remaining options
    widget: options.widget,
    delay: options.delay,
    payload: options.payload,
    decorators: options.decorators,
    actions: options.actions,
    feedbackOptions: options.feedbackOptions,
    status: options.status,
    timestamp: options.timestamp,
  };
};

export const createCustomMessage = (
  message: string,
  type: string,
  options: IMessageOptions
) => {
  return { ...createChatMessage(message, type), ...options };
};

export const createClientMessage = (
  message: string,
  options: IMessageOptions
) => {
  return { 
    ...createChatMessage(message, 'user'), 
    // Extract nickname from options if provided
    nickname: options.nickname,
    // Spread remaining options
    widget: options.widget,
    delay: options.delay,
    payload: options.payload,
    decorators: options.decorators,
    actions: options.actions,
    feedbackOptions: options.feedbackOptions,
    status: options.status,
    timestamp: options.timestamp,
  };
};

export const callIfExists = (func: any, ...args: any) => {
  if (func) {
    return func(...args);
  }
};
