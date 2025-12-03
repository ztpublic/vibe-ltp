import React, { useEffect, useState } from 'react';
import ConditionallyRender from 'react-conditionally-render';

import ChatbotMessageAvatar from './ChatBotMessageAvatar/ChatbotMessageAvatar';
import Loader from '../Loader/Loader';

import './ChatbotMessage.css';
import { callIfExists } from '../Chat/chatUtils';
import {
  ICustomComponents,
  ICustomStyles,
  IStyleOverride,
} from '../../interfaces/IConfig';
import { scrollToMessage } from '../../utils/messageRegistry';
import { IMessage } from '../../interfaces/IMessages';

const mergeClassNames = (...names: Array<string | undefined | false>) =>
  names.filter(Boolean).join(' ');

const buildStyle = (override?: IStyleOverride) => {
  if (!override) return undefined;
  const style = { ...(override.style || {}) };
  if (override.backgroundColor && !style.backgroundColor) {
    style.backgroundColor = override.backgroundColor;
  }
  return Object.keys(style).length ? style : undefined;
};

interface IChatbotMessageProps {
  /** Plain text message content (no encoding) */
  message: string;
  /** Message type (bot/custom) */
  type?: string;
  
  /** Bot reply metadata */
  replyToId?: string;
  replyToPreview?: string;
  replyToNickname?: string;
  
  withAvatar?: boolean;
  loading?: boolean;
  messages: IMessage[];
  delay?: number;
  id: number;
  setState?: React.Dispatch<React.SetStateAction<any>>;
  customComponents?: ICustomComponents;
  payload?: any;
  messageObject?: IMessage;
  customStyles?: ICustomStyles;
  /** Optional callback from host to capture feedback actions */
  onFeedback?: (feedback: unknown) => void;
  /** Optional callback from host when reply scroll is requested */
  onReplyScroll?: (replyToId?: string) => void;
}

const ChatbotMessage = ({
  message,
  type = 'bot',
  replyToId,
  replyToPreview,
  replyToNickname,
  withAvatar = true,
  loading,
  messages,
  customComponents,
  setState,
  customStyles,
  delay,
  id,
  payload,
  messageObject,
  onFeedback,
  onReplyScroll,
}: IChatbotMessageProps) => {
  const [show, toggleShow] = useState(false);

  const handleReplyClick = () => {
    if (!replyToId) return;
    console.log('Clicking reply label, scrolling to:', replyToId);
    if (onReplyScroll) {
      onReplyScroll(replyToId);
    }
    scrollToMessage(replyToId);
  };

  useEffect(() => {
    // Only auto-disable loading if the message has actual content
    // Empty content messages (loading placeholders) should keep loading state until replaced
    if (!message || message.trim().length === 0 || !setState) {
      return; // Don't set any timeout for empty messages
    }

    let defaultDisableTime = 750;
    if (delay) defaultDisableTime += delay;

    const timeoutId = setTimeout(() => {
      const newMessages = [...messages].map(msg => {
        if (msg.id === id) {
          return {...msg, loading: false, delay: undefined};
        }
        return msg;
      });

      setState((state: any) => ({...state, messages: newMessages}));
    }, defaultDisableTime);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [message, delay, id]);

  useEffect(() => {
    if (delay) {
      setTimeout(() => toggleShow(true), delay);
    } else {
      toggleShow(true);
    }
  }, [delay]);

  const bubbleStyle = buildStyle(customStyles?.botMessageBox);
  const bubbleClassName = mergeClassNames(
    'react-chatbot-kit-chat-bot-message',
    customStyles?.botMessageBox?.className
  );

  const arrowStyle = buildStyle(customStyles?.botMessageArrow) || {};
  if (!arrowStyle.borderRightColor && bubbleStyle?.backgroundColor) {
    arrowStyle.borderRightColor = bubbleStyle.backgroundColor as string;
  }
  const arrowClassName = mergeClassNames(
    'react-chatbot-kit-chat-bot-message-arrow',
    customStyles?.botMessageArrow?.className
  );

  const replyLabelStyle = buildStyle(customStyles?.replyLabel);
  const replyLabelClassName = mergeClassNames(
    'chatbot-reply-label',
    customStyles?.replyLabel?.className
  );

  const loaderStyle = buildStyle(customStyles?.loader);
  const loaderClassName = mergeClassNames(
    'chatbot-loader-container',
    customStyles?.loader?.className
  );

  const fullMessage: IMessage = {
    id,
    type,
    message,
    loading,
    replyToId,
    replyToPreview,
    replyToNickname,
    payload,
    delay,
    decorators: messageObject?.decorators,
    actions: messageObject?.actions,
    feedbackOptions: messageObject?.feedbackOptions,
    status: messageObject?.status,
    timestamp: messageObject?.timestamp,
    ...messageObject,
  };

  const decorationProps = {
    message: fullMessage,
    decorators: fullMessage.decorators,
    actions: fullMessage.actions,
    feedbackOptions: fullMessage.feedbackOptions,
    status: fullMessage.status,
    timestamp: fullMessage.timestamp,
    onFeedback,
  };

  return (
    <ConditionallyRender
      condition={show}
      show={
        <div className="react-chatbot-kit-chat-bot-message-container">
          {/* Reply label if metadata exists */}
          {replyToId && replyToPreview && (
            <button
              type="button"
              className={replyLabelClassName}
              style={replyLabelStyle}
              onClick={handleReplyClick}
              title="点击跳转到问题"
            >
              ↩ 回复 {replyToNickname || 'visitor'}: &quot;{replyToPreview}&quot;
            </button>
          )}
          
          <div className="chatbot-message-wrapper">
            <ConditionallyRender
              condition={withAvatar}
              show={
                <ConditionallyRender
                  condition={!!customComponents?.botAvatar}
                  show={callIfExists(customComponents?.botAvatar, {
                    message: fullMessage,
                  })}
                  elseShow={
                    <ChatbotMessageAvatar
                      className={customStyles?.botAvatar?.className}
                      style={buildStyle(customStyles?.botAvatar)}
                    />
                  }
                />
              }
            />

                <ConditionallyRender
                  condition={!!customComponents?.botChatMessage}
                  show={callIfExists(customComponents?.botChatMessage, {
                    message: fullMessage,
                    defaultLoader: (
                      <div className={loaderClassName} style={loaderStyle}>
                        <Loader />
                      </div>
                    ),
                    onReplyScroll: handleReplyClick,
                    onFeedback,
                  })}
              elseShow={
                <div
                  className={bubbleClassName}
                  style={bubbleStyle}
                >
                  <ConditionallyRender
                    condition={loading}
                    show={
                      <div className={loaderClassName} style={loaderStyle}>
                        <Loader />
                      </div>
                    }
                    elseShow={<span>{message}</span>}
                  />
                <ConditionallyRender
                  condition={withAvatar}
                  show={
                    <div
                      className={arrowClassName}
                      style={arrowStyle}
                    ></div>
                  }
                />
              </div>
              }
            />
            <ConditionallyRender
              condition={!!customComponents?.botMessageAside}
              show={callIfExists(customComponents?.botMessageAside, decorationProps)}
            />
          </div>
          <ConditionallyRender
            condition={!!customComponents?.botMessageFooter}
            show={callIfExists(customComponents?.botMessageFooter, decorationProps)}
          />
        </div>
      }
    />
  );
};

export default ChatbotMessage;
