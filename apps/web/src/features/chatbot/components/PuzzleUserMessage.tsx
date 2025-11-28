'use client';

import React, { useEffect, useRef } from 'react';
import { registerMessageElement } from '../utils/MessageRegistry';
import { decodeUserText } from '../utils/chatEncoding';
import { useChatIdentity } from '../identity/useChatIdentity';

type UserMessageProps = {
  message: string;
  id?: number; // react-chatbot-kit passes this
};

/**
 * Custom user message component that registers itself for scroll-to functionality
 * and displays per-message nicknames
 */
export const PuzzleUserMessage: React.FC<UserMessageProps> = ({ message }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { nickname: myNickname } = useChatIdentity();

  // Decode nickname and text from the encoded message
  const { nickname, text } = React.useMemo(() => decodeUserText(message), [message]);
  
  // Use a consistent ID generation approach
  // We'll use the message content as the stable identifier since the timestamp varies
  const messageId = React.useMemo(() => {
    // Create a deterministic ID based on message content only (no timestamp)
    // Use the actual text (not the encoded string) for ID generation
    const actualText = text || message;
    const contentHash = actualText.slice(0, 10).replace(/\s/g, '_');
    return `user_${contentHash}_${actualText.length}`;
  }, [text, message]);

  useEffect(() => {
    if (!ref.current) return;
    
    // Register the container element
    registerMessageElement(messageId, ref.current);
    
    return () => registerMessageElement(messageId, null);
  }, [messageId]);

  const displayName = nickname ?? 'visitor';
  const isMe = nickname === myNickname;

  return (
    <div
      ref={ref}
      className="flex flex-col items-end mb-2"
      data-message-id={messageId}
    >
      <div className="text-[10px] text-slate-400 mb-0.5">
        {displayName}
        {isMe && ' · You'}
      </div>
      <div className="react-chatbot-kit-user-chat-message">
        {text}
      </div>
    </div>
  );
};
