import React, { useEffect, useRef } from 'react';
import ConditionallyRender from 'react-conditionally-render';

import { callIfExists } from '../Chat/chatUtils';

import UserIcon from '../../assets/icons/user-alt.svg';

import './UserChatMessage.css';
import { ICustomComponents } from '../../interfaces/IConfig';
import { registerMessageElement } from '../../utils/messageRegistry';

interface IUserChatMessageProps {
  /** Plain text message content (no encoding) */
  message: string;
  
  /** Message ID for scroll-to functionality */
  messageId: string;
  
  /** User's display nickname */
  nickname?: string;
  
  customComponents: ICustomComponents;
  currentUserNickname?: string;
}

const UserChatMessage = ({
  message,
  messageId,
  nickname,
  customComponents,
  currentUserNickname,
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
            <div className="react-chatbot-kit-user-chat-message">
              {message}
              <div className="react-chatbot-kit-user-chat-message-arrow"></div>
            </div>
          }
        />
      </div>
      
      <ConditionallyRender
        condition={!!customComponents.userAvatar}
        show={callIfExists(customComponents.userAvatar)}
        elseShow={
          <div className="react-chatbot-kit-user-avatar">
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
