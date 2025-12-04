import React from 'react';

import Chat from '../Chat/Chat';

import ChatbotError from '../ChatbotError/ChatbotError';

import IConfig from '../../interfaces/IConfig';

import {
  getCustomStyles,
  getCustomComponents,
  getBotName,
  getCustomMessages,
  isConstructor,
} from './utils';

import useChatbot from '../../hooks/useChatbot';
import { IMessage } from '../../interfaces/IMessages';
import { createChatBotMessage } from '../Chat/chatUtils';

interface IChatbotProps {
  actionProvider: any;
  messageParser: any;
  config: IConfig;
  headerText?: string;
  placeholderText?: string;
  saveMessages?: (ref: any) => any;
  messageHistory?: IMessage[] | string;
  validator?: (input: string) => boolean;
  runInitialMessagesWithHistory?: boolean;
  disableScrollToBottom?: boolean;
  currentUserNickname?: string;
}

const Chatbot = ({
  actionProvider,
  messageParser,
  config,
  headerText,
  placeholderText,
  saveMessages,
  messageHistory,
  runInitialMessagesWithHistory,
  disableScrollToBottom,
  validator,
  currentUserNickname,
  ...rest
}: IChatbotProps) => {
  const chatbotContext = useChatbot({
    config,
    actionProvider,
    messageParser,
    messageHistory,
    saveMessages,
    runInitialMessagesWithHistory,
    ...rest,
  });

  if (chatbotContext.configurationError) {
    return <ChatbotError message={chatbotContext.configurationError} />;
  }

  if (chatbotContext.invalidPropsError?.length) {
    return <ChatbotError message={chatbotContext.invalidPropsError} />;
  }

  if (
    !chatbotContext.state ||
    !chatbotContext.setState ||
    !chatbotContext.widgetRegistry ||
    !chatbotContext.messageContainerRef ||
    !chatbotContext.ActionProvider ||
    !chatbotContext.MessageParser ||
    !chatbotContext.actionProv ||
    !chatbotContext.messagePars
  ) {
    return <ChatbotError message="Chatbot failed to initialize." />;
  }

  const {
    ActionProvider,
    MessageParser,
    widgetRegistry,
    messageContainerRef,
    actionProv,
    messagePars,
    state,
    setState,
  } = chatbotContext;

  const customStyles = getCustomStyles(config);
  const customComponents = getCustomComponents(config);
  const botName = getBotName(config);
  const customMessages = getCustomMessages(config);

  if (isConstructor(ActionProvider) && isConstructor(MessageParser)) {
    return (
      <Chat
        state={state}
        setState={setState}
        widgetRegistry={widgetRegistry}
        actionProvider={actionProv}
        messageParser={messagePars}
        customMessages={customMessages}
        customComponents={{ ...customComponents }}
        botName={botName}
        customStyles={{ ...customStyles }}
        headerText={headerText}
        placeholderText={placeholderText}
        validator={validator}
        messageHistory={messageHistory}
        disableScrollToBottom={disableScrollToBottom}
        messageContainerRef={messageContainerRef}
        currentUserNickname={currentUserNickname}
      />
    );
  } else {
    return (
      <ActionProvider
        state={state}
        setState={setState}
        createChatBotMessage={createChatBotMessage}
      >
        <MessageParser>
          <Chat
            state={state}
            setState={setState}
            widgetRegistry={widgetRegistry}
            actionProvider={ActionProvider}
            messageParser={MessageParser}
            customMessages={customMessages}
            customComponents={{ ...customComponents }}
            botName={botName}
            customStyles={{ ...customStyles }}
            headerText={headerText}
            placeholderText={placeholderText}
            validator={validator}
            messageHistory={messageHistory}
            disableScrollToBottom={disableScrollToBottom}
            messageContainerRef={messageContainerRef}
            currentUserNickname={currentUserNickname}
          />
        </MessageParser>
      </ActionProvider>
    );
  }
};

export default Chatbot;
