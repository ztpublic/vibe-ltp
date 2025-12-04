import React, { useRef, useState, useEffect } from 'react';
import {
  createClientMessage,
  createChatBotMessage,
  createCustomMessage,
} from '../components/Chat/chatUtils';
import {
  getInitialState,
  getWidgets,
  isConstructor,
  validateProps,
} from '../components/Chatbot/utils';
import WidgetRegistry from '../components/WidgetRegistry/WidgetRegistry';
import IConfig from '../interfaces/IConfig';
import { IChatState, IMessage } from '../interfaces/IMessages';
import IWidget from '../interfaces/IWidget';

interface IUseChatbotParams {
  config: IConfig | null;
  actionProvider: any;
  messageParser: any;
  messageHistory?: IMessage[] | string;
  saveMessages?: (messages: IMessage[], html: string) => any | null;
  runInitialMessagesWithHistory?: boolean;
}

const useChatbot = ({
  config,
  actionProvider,
  messageParser,
  messageHistory,
  runInitialMessagesWithHistory,
  saveMessages,
  ...rest
}: IUseChatbotParams) => {
  let configurationError = '';
  let invalidPropsError = '';

  if (!config || !actionProvider || !messageParser) {
    configurationError =
      'I think you forgot to feed me some props. Did you remember to pass a config, a messageparser and an actionprovider?';

    return { configurationError, invalidPropsError };
  }

  const propsErrors = validateProps(config, messageParser);

  if (propsErrors.length) {
    invalidPropsError = propsErrors.reduce((prev, cur) => {
      prev += cur;
      return prev;
    }, '');

    return { configurationError, invalidPropsError };
  }

  const initialState = getInitialState(config);

  if (messageHistory && Array.isArray(messageHistory)) {
    config.initialMessages = [...messageHistory];
  } else if (typeof messageHistory === 'string' && Boolean(messageHistory)) {
    if (!runInitialMessagesWithHistory) {
      config.initialMessages = [];
    }
  }

  const [state, setState] = React.useState<IChatState>({
    messages: [...config.initialMessages],
    ...initialState,
  });
  const messagesRef = React.useRef<IMessage[]>(state.messages);
  const stateRef = React.useRef<IChatState | undefined>(undefined);
  const messageContainerRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesRef.current = state.messages;
  });

  useEffect(() => {
    if (messageHistory && Array.isArray(messageHistory)) {
      setState((prevState) => ({
        ...prevState,
        messages: messageHistory,
      }));
    }
  }, []);

  useEffect(() => {
    const refValue = messageContainerRef.current;

    return () => {
      if (refValue && saveMessages && typeof saveMessages === 'function') {
        const HTML = refValue.innerHTML.toString();

        saveMessages(messagesRef.current, HTML);
      }
    };
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  let actionProv;
  let widgetRegistry: WidgetRegistry;
  let messagePars;
  let widgets;

  const ActionProvider = actionProvider;
  const MessageParser = messageParser;

  if (isConstructor(ActionProvider) && isConstructor(MessageParser)) {
    actionProv = new actionProvider(
      createChatBotMessage,
      setState,
      createClientMessage,
      stateRef.current,
      createCustomMessage,
      rest
    );

    widgetRegistry = new WidgetRegistry(setState, actionProv);
    messagePars = new messageParser(actionProv, stateRef.current);

    widgets = getWidgets(config);
    widgets.forEach((widget: IWidget) =>
      widgetRegistry?.addWidget(widget, rest)
    );
  } else {
    actionProv = actionProvider;
    messagePars = messageParser;
    widgetRegistry = new WidgetRegistry(setState, null);

    widgets = getWidgets(config);
    widgets.forEach((widget: IWidget) =>
      widgetRegistry?.addWidget(widget, rest)
    );
  }

  return {
    widgetRegistry,
    actionProv,
    messagePars,
    configurationError,
    invalidPropsError,
    state,
    setState,
    messageContainerRef,
    ActionProvider,
    MessageParser,
  };
};

export default useChatbot;
