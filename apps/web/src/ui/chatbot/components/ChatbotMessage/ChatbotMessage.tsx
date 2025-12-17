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
import ThumbControls from '../ThumbControls/ThumbControls';

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

  /** Default bot name (used when message.botName is unset) */
  defaultBotName?: string;
  
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
  defaultBotName,
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

  const effectiveReplyToId = replyToId ?? messageObject?.replyToId;
  const effectiveReplyToPreview =
    replyToPreview ?? messageObject?.replyToPreview;
  const effectiveReplyToNickname =
    replyToNickname ?? messageObject?.replyToNickname;

  const handleReplyClick = () => {
    if (!effectiveReplyToId) return;
    console.log('Clicking reply label, scrolling to:', effectiveReplyToId);
    if (onReplyScroll) {
      onReplyScroll(effectiveReplyToId);
    }
    scrollToMessage(effectiveReplyToId);
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
    disableAutoLoadingDismiss ?? messageObject?.disableAutoLoadingDismiss;

  const fullMessage: IMessage = {
    // Start with any existing message metadata so it's preserved
    ...messageObject,
    // Then apply explicit props so they always take precedence over messageObject
    id,
    type,
    message,
    ...(loading !== undefined ? { loading } : {}),
    ...(effectiveDisableAutoLoading !== undefined
      ? { disableAutoLoadingDismiss: effectiveDisableAutoLoading }
      : {}),
    ...(replyToId !== undefined ? { replyToId } : {}),
    ...(replyToPreview !== undefined ? { replyToPreview } : {}),
    ...(replyToNickname !== undefined ? { replyToNickname } : {}),
    ...(payload !== undefined ? { payload } : {}),
    ...(delay !== undefined ? { delay } : {}),
  };

  const resolvedMessage: IMessage = {
    ...fullMessage,
    botName: fullMessage.botName ?? defaultBotName,
  };

  const botDisplayName = resolvedMessage.botName;
  const botAvatar = resolvedMessage.botAvatar;
  const derivedAvatarLabel =
    botDisplayName && botDisplayName.trim().length > 0
      ? Array.from(botDisplayName.trim())[0]
      : 'B';
  const avatarLabel = botAvatar?.label ?? derivedAvatarLabel;

  const bubbleStyle = buildStyle(customStyles?.botMessageBox);
  const decorator = resolvedMessage.decorators?.[0];
  const decoratorColor = decorator?.color;
  const decoratedBubbleStyle = {
    ...bubbleStyle,
    ...(decoratorColor ? { border: `1px solid ${decoratorColor}` } : {}),
  };
  const showThumbsUp = resolvedMessage.showThumbsUp ?? true;
  const showThumbsDown = resolvedMessage.showThumbsDown ?? true;
  const feedbackShellClass = mergeClassNames(
    'message-bubble-shell',
    showThumbsUp || showThumbsDown
      ? 'message-bubble-with-feedback-right'
      : undefined
  );
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
    message: resolvedMessage,
    decorators: resolvedMessage.decorators,
    actions: resolvedMessage.actions,
    feedbackOptions: resolvedMessage.feedbackOptions,
    status: resolvedMessage.status,
    timestamp: resolvedMessage.timestamp,
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
          {effectiveReplyToId && effectiveReplyToPreview && (
            <button
              type="button"
              className={replyLabelClassName}
              style={replyLabelStyle}
              onClick={handleReplyClick}
              title="点击跳转到问题"
            >
              ↩ 回复 {effectiveReplyToNickname || 'visitor'}: &quot;
              {effectiveReplyToPreview}&quot;
            </button>
          )}
          
          <div className="chatbot-message-wrapper">
            <ConditionallyRender
              condition={withAvatar}
              show={
                <ConditionallyRender
                  condition={!!customComponents?.botAvatar}
                  show={callIfExists(customComponents?.botAvatar, {
                    message: resolvedMessage,
                  })}
                  elseShow={
                    <ChatbotMessageAvatar
                      className={customStyles?.botAvatar?.className}
                      style={buildStyle(customStyles?.botAvatar)}
                      label={avatarLabel}
                      imageSrc={botAvatar?.imageSrc}
                      imageAlt={botAvatar?.imageAlt}
                      size={botAvatar?.size}
                      backgroundColor={botAvatar?.backgroundColor}
                    />
                  }
                />
              }
            />

            <div className="chatbot-message-content">
              {botDisplayName && withAvatar && (
                <div className="bot-name-label">{botDisplayName}</div>
              )}
              <div className="chatbot-message-row">
                <div className={feedbackShellClass}>
                  <ConditionallyRender
                    condition={!!customComponents?.botChatMessage}
                    show={callIfExists(customComponents?.botChatMessage, {
                      message: resolvedMessage,
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
                        style={decoratedBubbleStyle}
                      >
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
                  <ThumbControls
                    message={resolvedMessage}
                    align="right"
                    showThumbsUp={showThumbsUp}
                    showThumbsDown={showThumbsDown}
                    setState={setState}
                    onFeedback={onFeedback}
                  />
                </div>
                <ConditionallyRender
                  condition={!!customComponents?.botMessageAside}
                  show={callIfExists(
                    customComponents?.botMessageAside,
                    decorationProps
                  )}
                />
              </div>
            </div>
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
