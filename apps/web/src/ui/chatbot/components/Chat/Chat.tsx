import React, { useState, useEffect, SetStateAction } from 'react';
import ConditionallyRender from 'react-conditionally-render';

import UserChatMessage from '../UserChatMessage/UserChatMessage';
import ChatbotMessage from '../ChatbotMessage/ChatbotMessage';

import {
  botMessage,
  userMessage,
  customMessage,
  createChatMessage,
} from './chatUtils';

import './Chat.css';
import {
  ICustomComponents,
  ICustomMessage,
  ICustomStyles,
} from '../../interfaces/IConfig';
import { IChatState, IMessage } from '../../interfaces/IMessages';

const mergeClassNames = (...names: Array<string | undefined | false>) =>
  names.filter(Boolean).join(' ');

const buildStyle = (override?: ICustomStyles[keyof ICustomStyles]) => {
  if (!override) return undefined;
  const style = { ...(override.style || {}) };
  if (override.backgroundColor && !style.backgroundColor) {
    style.backgroundColor = override.backgroundColor;
  }
  return Object.keys(style).length ? style : undefined;
};

interface IChatProps {
  setState: React.Dispatch<SetStateAction<IChatState>>;
  widgetRegistry: any;
  messageParser: any;
  actionProvider: any;
  customComponents: ICustomComponents;
  botName: string;
  customStyles?: ICustomStyles;
  headerText?: string;
  customMessages: ICustomMessage;
  placeholderText?: string;
  validator?: (input: string) => Boolean;
  state: IChatState;
  disableScrollToBottom?: boolean;
  messageHistory?: IMessage[] | string;
  parse?: (message: string) => void;
  answerParse?: (message: string) => void;
  actions?: object;
  messageContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  currentUserNickname?: string;
  onFeedback?: (feedback: unknown) => void;
}

const Chat = ({
  state,
  setState,
  widgetRegistry,
  messageParser,
  parse,
  customComponents,
  actionProvider,
  botName,
  customStyles,
  headerText,
  customMessages,
  placeholderText,
  validator,
  disableScrollToBottom,
  messageHistory,
  actions,
  messageContainerRef,
  currentUserNickname,
  answerParse,
  onFeedback,
}: IChatProps) => {
  const { messages } = state;

  const [input, setInputValue] = useState('');

  const scrollIntoView = () => {
    setTimeout(() => {
      if (messageContainerRef.current) {
        messageContainerRef.current.scrollTop =
          messageContainerRef?.current?.scrollHeight;
      }
    }, 50);
  };

  useEffect(() => {
    if (disableScrollToBottom) return;
    scrollIntoView();
  });

  const showAvatar = (messages: IMessage[], index: number) => {
    if (index === 0) return true;

    const lastMessage = messages[index - 1];
    if (!lastMessage) return true;

    if (lastMessage.type === 'bot' && !lastMessage.widget) {
      return false;
    }
    return true;
  };

  const renderMessages = () => {
    return messages.map((messageObject: IMessage, index: number) => {
      if (botMessage(messageObject)) {
        return (
          <React.Fragment key={messageObject.id}>
            {renderChatbotMessage(messageObject, index)}
          </React.Fragment>
        );
      }

      if (userMessage(messageObject)) {
        return (
          <React.Fragment key={messageObject.id}>
            {renderUserMessage(messageObject)}
          </React.Fragment>
        );
      }

      if (customMessage(messageObject, customMessages)) {
        return (
          <React.Fragment key={messageObject.id}>
            {renderCustomMessage(messageObject)}
          </React.Fragment>
        );
      }
    });
  };

  const renderCustomMessage = (messageObject: IMessage) => {
    const customMessage = customMessages[messageObject.type];
    if (!customMessage) return null;

    const props = {
      setState,
      state,
      scrollIntoView,
      actionProvider,
      payload: messageObject.payload,
      actions,
    };

    if (messageObject.widget) {
      const widget = widgetRegistry.getWidget(messageObject.widget, {
        ...state,
        scrollIntoView,
        payload: messageObject.payload,
        actions,
      });
      return (
        <>
          {customMessage(props)}
          {widget ? widget : null}
        </>
      );
    }

    return customMessage(props);
  };

  const renderUserMessage = (messageObject: IMessage) => {
    const widget = widgetRegistry.getWidget(messageObject.widget, {
      ...state,
      scrollIntoView,
      payload: messageObject.payload,
      actions,
    });
    
    // Generate message ID for scroll-to functionality
    const messageId = `user_msg_${messageObject.id}`;
    
    return (
      <>
        <UserChatMessage
          message={messageObject.message}
          messageId={messageId}
          nickname={messageObject.nickname}
          key={messageObject.id}
          customComponents={customComponents}
          messageObject={messageObject}
          customStyles={customStyles}
          currentUserNickname={currentUserNickname}
          setState={setState}
          onFeedback={onFeedback}
        />
        {widget ? widget : null}
      </>
    );
  };

  const renderChatbotMessage = (messageObject: IMessage, index: number) => {
    let withAvatar;
    if (messageObject.withAvatar) {
      withAvatar = messageObject.withAvatar;
    } else {
      withAvatar = showAvatar(messages, index);
    }

    const chatbotMessageProps = {
      message: messageObject.message,
      type: messageObject.type,
      payload: messageObject.payload,
      replyToId: messageObject.replyToId,
      replyToPreview: messageObject.replyToPreview,
      replyToNickname: messageObject.replyToNickname,
      loading: messageObject.loading,
      delay: messageObject.delay,
          id: messageObject.id,
          setState,
          customComponents,
          messages,
          messageObject,
          onFeedback,
        };

    if (messageObject.widget) {
      const widget = widgetRegistry.getWidget(messageObject.widget, {
        ...state,
        scrollIntoView,
        payload: messageObject.payload,
        actions,
      });
      return (
        <>
          <ChatbotMessage
            customStyles={customStyles}
            withAvatar={withAvatar}
            {...chatbotMessageProps}
            key={messageObject.id}
          />
          <ConditionallyRender
            condition={!messageObject.loading}
            show={widget ? widget : null}
          />
        </>
      );
    }

    return (
      <ChatbotMessage
        customStyles={customStyles}
        key={messageObject.id}
        withAvatar={withAvatar}
        {...chatbotMessageProps}
      />
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validator && typeof validator === 'function') {
      if (validator(input)) {
        handleValidMessage('question');
      }
      return;
    }

    handleValidMessage('question');
  };

  const handleAnswerRequest = () => {
    if (validator && typeof validator === 'function') {
      if (validator(input)) {
        handleValidMessage('answer');
      }
      return;
    }

    handleValidMessage('answer');
  };

  const handleValidMessage = (mode: 'question' | 'answer') => {
    const nextMessage = input;
    setState((state) => ({
      ...state,
      messages: [...state.messages, createChatMessage(nextMessage, 'user')],
    }));

    scrollIntoView();
    setInputValue('');

    if (mode === 'answer' && answerParse) {
      return answerParse(nextMessage);
    }

    if (parse) {
      return parse(nextMessage);
    }

    if (messageParser?.parse) {
      return messageParser.parse(nextMessage);
    }
  };

  const sendButtonOverrides =
    customStyles?.sendButton ?? customStyles?.chatButton;
  const answerButtonOverrides = customStyles?.answerButton ?? sendButtonOverrides;
  const sendButtonClassName = mergeClassNames(
    'react-chatbot-kit-chat-btn',
    'react-chatbot-kit-chat-btn-send',
    sendButtonOverrides?.className
  );
  const answerButtonClassName = mergeClassNames(
    'react-chatbot-kit-chat-btn',
    'react-chatbot-kit-chat-btn-answer',
    answerButtonOverrides?.className
  );
  const sendButtonStyle = buildStyle(sendButtonOverrides);
  const answerButtonStyle = buildStyle(answerButtonOverrides);

  let header = `Conversation with ${botName}`;
  if (headerText) {
    header = headerText;
  }

  let placeholder = 'Write your message here';
  if (placeholderText) {
    placeholder = placeholderText;
  }

  return (
    <div
      className={mergeClassNames(
        'react-chatbot-kit-chat-container',
        customStyles?.container?.className
      )}
      style={buildStyle(customStyles?.container)}
    >
      <div
        className={mergeClassNames(
          'react-chatbot-kit-chat-inner-container',
          customStyles?.innerContainer?.className
        )}
        style={buildStyle(customStyles?.innerContainer)}
      >
        <ConditionallyRender
          condition={!!customComponents.header}
          show={
            customComponents.header &&
            customComponents.header({
              actionProvider,
              botName,
              state,
              setState,
              messageParser,
              currentUserNickname,
            })
          }
          elseShow={
            <div
              className={mergeClassNames(
                'react-chatbot-kit-chat-header',
                customStyles?.header?.className
              )}
              style={buildStyle(customStyles?.header)}
            >
              {header}
            </div>
          }
        />

        <div
          className={mergeClassNames(
            'react-chatbot-kit-chat-message-container',
            customStyles?.messageContainer?.className
          )}
          style={buildStyle(customStyles?.messageContainer)}
          ref={messageContainerRef}
        >
          <ConditionallyRender
            condition={
              typeof messageHistory === 'string' && Boolean(messageHistory)
            }
            show={
              <div
                dangerouslySetInnerHTML={{ __html: messageHistory as string }}
              />
            }
          />

          {renderMessages()}
          <div style={{ paddingBottom: '15px' }} />
        </div>

        <div className="react-chatbot-kit-chat-input-container">
          <form
            className="react-chatbot-kit-chat-input-form"
            style={buildStyle(customStyles?.inputForm)}
            onSubmit={handleSubmit}
          >
            <input
              className={mergeClassNames(
                'react-chatbot-kit-chat-input',
                customStyles?.input?.className
              )}
              style={buildStyle(customStyles?.input)}
              placeholder={placeholder}
              value={input}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <div className="react-chatbot-kit-chat-actions">
              <button
                type="submit"
                className={sendButtonClassName}
                style={sendButtonStyle}
              >
                <span className="react-chatbot-kit-chat-btn-label">提问</span>
              </button>
              <button
                type="button"
                className={answerButtonClassName}
                style={answerButtonStyle}
                onClick={handleAnswerRequest}
              >
                <span className="react-chatbot-kit-chat-btn-label">解答</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
