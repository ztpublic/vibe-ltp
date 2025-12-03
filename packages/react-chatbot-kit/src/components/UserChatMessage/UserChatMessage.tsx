import React, { useEffect, useRef } from 'react';
import ConditionallyRender from 'react-conditionally-render';

import { callIfExists } from '../Chat/chatUtils';

import UserIcon from '../../assets/icons/user-alt.svg';

import './UserChatMessage.css';
import { ICustomComponents, ICustomStyles, IStyleOverride } from '../../interfaces/IConfig';
import { IMessage } from '../../interfaces/IMessages';
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

interface IUserChatMessageProps {
  /** Plain text message content (no encoding) */
  message: string;
  
  /** Message ID for scroll-to functionality */
  messageId: string;
  
  /** User's display nickname */
  nickname?: string;
  
  customComponents: ICustomComponents;
  currentUserNickname?: string;
  customStyles?: ICustomStyles;
  messageObject?: IMessage;
}

const UserChatMessage = ({
  message,
  messageId,
  nickname,
  customComponents,
  currentUserNickname,
  customStyles,
  messageObject,
}: IUserChatMessageProps) => {
  const ref = useRef<HTMLDivElement | null>(null);

  // Register the message element for scroll-to functionality
  useEffect(() => {
    if (!ref.current) return;
    registerMessageElement(messageId, ref.current);
    return () => registerMessageElement(messageId, null);
  }, [messageId]);

  const displayName = nickname ?? 'visitor';
  const isMe = currentUserNickname && nickname === currentUserNickname;

  const fullMessage: IMessage =
    messageObject ?? {
      id: Number(messageId.replace(/\D/g, '')),
      type: 'user',
      message,
      nickname,
    };

  const decorationProps = {
    message: fullMessage,
    decorators: fullMessage.decorators,
    actions: fullMessage.actions,
    feedbackOptions: fullMessage.feedbackOptions,
    status: fullMessage.status,
    timestamp: fullMessage.timestamp,
  };

  const messageClassName = mergeClassNames(
    'react-chatbot-kit-user-chat-message',
    customStyles?.userMessageBox?.className
  );
  const messageStyle = buildStyle(customStyles?.userMessageBox);
  const decorator = fullMessage.decorators?.[0];
  const decoratorColor = decorator?.color;
  const decoratedMessageStyle = {
    ...messageStyle,
    ...(decoratorColor ? { border: `1px solid ${decoratorColor}` } : {}),
  };

  const avatarWrapperClassName = mergeClassNames(
    'react-chatbot-kit-user-avatar',
    customStyles?.userAvatar?.className
  );
  const avatarWrapperStyle = buildStyle(customStyles?.userAvatar);

  return (
    <div 
      ref={ref}
      className="react-chatbot-kit-user-chat-message-container"
      data-message-id={messageId}
    >
      <div className="user-message-content">
        {/* Nickname label */}
        {nickname && (
          <div className="user-nickname-label">
            {displayName}
            {isMe && ' · You'}
          </div>
        )}
        
        <ConditionallyRender
          condition={!!customComponents.userChatMessage}
          show={callIfExists(customComponents.userChatMessage, {
            message: fullMessage,
            currentUserNickname,
          })}
          elseShow={
            <div className={messageClassName} style={decoratedMessageStyle}>
              {message}
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
      </div>
      
      <ConditionallyRender
        condition={!!customComponents.userAvatar}
        show={callIfExists(customComponents.userAvatar, {
          message: fullMessage,
        })}
        elseShow={
          <div
            className={avatarWrapperClassName}
            style={avatarWrapperStyle}
          >
            <div className="react-chatbot-kit-user-avatar-container">
              <UserIcon className="react-chatbot-kit-user-avatar-icon" />
            </div>
          </div>
        }
      />
      <ConditionallyRender
        condition={!!customComponents.userMessageAside}
        show={callIfExists(customComponents.userMessageAside, decorationProps)}
      />
      <ConditionallyRender
        condition={!!customComponents.userMessageFooter}
        show={callIfExists(customComponents.userMessageFooter, decorationProps)}
      />
    </div>
  );
};

export default UserChatMessage;
