import React, { useEffect, useRef, useMemo } from 'react';
import ConditionallyRender from 'react-conditionally-render';

import { callIfExists } from '../Chat/chatUtils';

import UserIcon from '../../assets/icons/user-alt.svg';

import './UserChatMessage.css';
import { ICustomComponents } from '../../interfaces/IConfig';
import { decodeUserText } from '../../utils/messageEncoding';
import { registerMessageElement } from '../../utils/messageRegistry';

interface IUserChatMessageProps {
  message: string;
  customComponents: ICustomComponents;
  currentUserNickname?: string;
}

const UserChatMessage = ({
  message,
  customComponents,
  currentUserNickname,
}: IUserChatMessageProps) => {
  const ref = useRef<HTMLDivElement | null>(null);

  // Decode nickname and text from the encoded message
  const { nickname, text } = useMemo(() => decodeUserText(message), [message]);
  
  // Use a consistent ID generation approach
  const messageId = useMemo(() => {
    // Create a deterministic ID based on message content only (no timestamp)
    const actualText = text || message;
    const contentHash = actualText.slice(0, 10).replace(/\s/g, '_');
    return `user_${contentHash}_${actualText.length}`;
  }, [text, message]);

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
            message: text,
          })}
          elseShow={
            <div className="react-chatbot-kit-user-chat-message">
              {text}
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
