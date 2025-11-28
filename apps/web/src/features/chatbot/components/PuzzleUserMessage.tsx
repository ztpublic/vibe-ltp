'use client';

import React, { useEffect, useRef } from 'react';
import { registerMessageElement } from '../utils/MessageRegistry';
import { generateMessageId } from '../utils/chatEncoding';

type UserMessageProps = {
  message: string;
  id?: number; // react-chatbot-kit passes this
};

/**
 * Custom user message component that registers itself for scroll-to functionality
 */
export const PuzzleUserMessage: React.FC<UserMessageProps> = ({ message, id }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  // Use a consistent ID generation approach
  // We'll use the message content as the stable identifier since the timestamp varies
  const messageId = React.useMemo(() => {
    // Create a deterministic ID based on message content only (no timestamp)
    // This matches what the story generates
    const contentHash = message.slice(0, 10).replace(/\s/g, '_');
    return `user_${contentHash}_${message.length}`;
  }, [message]);

  useEffect(() => {
    if (!ref.current) return;
    
    // Register the container element
    registerMessageElement(messageId, ref.current);
    
    return () => registerMessageElement(messageId, null);
  }, [messageId]);

  return (
    <div
      ref={ref}
      className="react-chatbot-kit-user-chat-message-container"
      data-message-id={messageId}
    >
      <div className="react-chatbot-kit-user-chat-message">
        {message}
      </div>
    </div>
  );
};
