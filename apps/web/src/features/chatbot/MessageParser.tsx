'use client';

import React, { ReactNode } from 'react';
import { encodeUserText } from '@vibe-ltp/react-chatbot-kit';
import { useChatIdentity } from './identity/useChatIdentity';

type Actions = {
  greet: () => void;
  handleUserMessage: (msg: string) => Promise<void> | void;
};

type MessageParserProps = {
  children: ReactNode;
  actions: Actions;
};

const MessageParser: React.FC<MessageParserProps> = ({ children, actions }) => {
  const { nickname } = useChatIdentity();
  
  const parse = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    console.log('[MessageParser] Received message:', trimmed);
    console.log('[MessageParser] Current nickname:', nickname);
    
    // Encode the nickname into the message before it gets added to state
    // This ensures the user message component can decode and display it
    const encodedMessage = encodeUserText(nickname, trimmed);
    console.log('[MessageParser] Encoded message:', encodedMessage.substring(0, 100));
    
    // Route all messages to the backend for now
    actions.handleUserMessage(encodedMessage);
  };

  return (
    <>
      {React.Children.map(children, (child) =>
        React.cloneElement(child as React.ReactElement, {
          parse,
        })
      )}
    </>
  );
};

export default MessageParser;
