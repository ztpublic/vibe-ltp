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
import { IChatState, IMessage } from '../../interfaces/IMessages';
import { registerMessageElement } from '../../utils/messageRegistry';

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
  setState?: React.Dispatch<React.SetStateAction<IChatState>>;
  customComponents?: ICustomComponents;
  payload?: any;
  messageObject?: IMessage;
  customStyles?: ICustomStyles;
  /** Optional callback from host to capture feedback actions */
  onFeedback?: (feedback: unknown) => void;
  /** Optional callback from host when reply scroll is requested */
  onReplyScroll?: (replyToId?: string) => void;
  /** Disable auto-dismissal of loading for this message */
  disableAutoLoadingDismiss?: boolean;
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
  disableAutoLoadingDismiss,
}: IChatbotMessageProps) => {
  const [show, toggleShow] = useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

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
    if (
      !message ||
      message.trim().length === 0 ||
      !setState ||
      disableAutoLoadingDismiss ||
      messageObject?.disableAutoLoadingDismiss
    ) {
      return; // Don't set any timeout for empty messages
    }

    let defaultDisableTime = 750;
    if (delay) defaultDisableTime += delay;

    const timeoutId = setTimeout(() => {
      const newMessages = [...messages].map((msg) => {
        if (msg.id === id) {
          return { ...msg, loading: false, delay: undefined };
        }
        return msg;
      });

      setState((state) => ({ ...state, messages: newMessages }));
    }, defaultDisableTime);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [message, delay, id]);

  useEffect(() => {
    if (!ref.current) return;
    const messageId = `bot_msg_${id}`;
    registerMessageElement(messageId, ref.current);
    return () => registerMessageElement(messageId, null);
  }, [id]);

  useEffect(() => {
    if (delay) {
      setTimeout(() => toggleShow(true), delay);
    } else {
      toggleShow(true);
    }
  }, [delay]);

  const effectiveDisableAutoLoading =
    disableAutoLoadingDismiss || messageObject?.disableAutoLoadingDismiss;

  const fullMessage: IMessage = {
    // Start with any existing message metadata so it's preserved
    ...messageObject,
    // Then apply explicit props so they always take precedence over messageObject
    id,
    type,
    message,
    loading,
    disableAutoLoadingDismiss: effectiveDisableAutoLoading,
    replyToId,
    replyToPreview,
    replyToNickname,
    payload,
    delay,
  };

  const bubbleStyle = buildStyle(customStyles?.botMessageBox);
  const decorator = fullMessage.decorators?.[0];
  const decoratorColor = decorator?.color;
  const decoratedBubbleStyle = {
    ...bubbleStyle,
    ...(decoratorColor ? { border: `1px solid ${decoratorColor}` } : {}),
  };
  const bubbleClassName = mergeClassNames(
    'react-chatbot-kit-chat-bot-message',
    customStyles?.botMessageBox?.className
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
        <div
          className="react-chatbot-kit-chat-bot-message-container"
          ref={ref}
          data-message-id={`bot_msg_${id}`}
        >
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
                      label="B"
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
                <div className={bubbleClassName} style={decoratedBubbleStyle}>
                  <ConditionallyRender
                    condition={!!loading}
                    show={
                      <div className={loaderClassName} style={loaderStyle}>
                        <Loader />
                      </div>
                    }
                    elseShow={<span>{message}</span>}
                  />
                  <ConditionallyRender
                    condition={!!decorator?.icon}
                    show={
                      <div
                        className="message-decorator-icon"
                        style={{ color: decoratorColor }}
                        aria-label="message decorator"
                      >
                        {decorator?.icon?.startsWith('http') ? (
                          <img
                            src={decorator.icon}
                            alt={decorator.label || 'Decorator icon'}
                            className="message-decorator-icon-image"
                          />
                        ) : (
                          decorator?.icon
                        )}
                      </div>
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
            condition={!!decorator?.text || !!decorator?.label}
            show={
              <div
                className="message-decorator-text"
                style={{ color: decoratorColor || '#9ca3af' }}
              >
                {decorator?.text || decorator?.label}
              </div>
            }
          />
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
