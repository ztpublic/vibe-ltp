import React, { useEffect, useRef } from 'react';
import ConditionallyRender from 'react-conditionally-render';

import { callIfExists } from '../Chat/chatUtils';

import UserIcon from '../../assets/icons/user-alt.svg';

import './UserChatMessage.css';
import { ICustomComponents, ICustomStyles, IStyleOverride } from '../../interfaces/IConfig';
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
}

const UserChatMessage = ({
  message,
  messageId,
  nickname,
  customComponents,
  currentUserNickname,
  customStyles,
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

  const messageClassName = mergeClassNames(
    'react-chatbot-kit-user-chat-message',
    customStyles?.userMessageBox?.className
  );
  const messageStyle = buildStyle(customStyles?.userMessageBox);

  const arrowClassName = mergeClassNames(
    'react-chatbot-kit-user-chat-message-arrow',
    customStyles?.userMessageArrow?.className
  );
  const arrowStyle = buildStyle(customStyles?.userMessageArrow) || {};
  if (!arrowStyle.borderLeftColor && messageStyle?.backgroundColor) {
    arrowStyle.borderLeftColor = messageStyle.backgroundColor as string;
  }

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
            message,
          })}
          elseShow={
            <div className={messageClassName} style={messageStyle}>
              {message}
              <div
                className={arrowClassName}
                style={arrowStyle}
              ></div>
            </div>
          }
        />
      </div>
      
      <ConditionallyRender
        condition={!!customComponents.userAvatar}
        show={callIfExists(customComponents.userAvatar)}
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
    </div>
  );
};

export default UserChatMessage;
