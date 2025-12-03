'use client';

import React, { ReactNode } from 'react';
import { useChatIdentity } from './identity/useChatIdentity';

type Actions = {
  greet: () => void;
  handleUserMessage: (text: string, nickname: string) => Promise<void> | void;
  handleSolutionRequest: (text: string, nickname: string) => Promise<void> | void;
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
    
    // Pass plain text and nickname separately (no encoding)
    actions.handleUserMessage(trimmed, nickname);
  };

  const parseForSolution = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    actions.handleSolutionRequest(trimmed, nickname);
  };

  return (
    <>
      {React.Children.map(children, (child) =>
        React.cloneElement(child as React.ReactElement, {
          parse,
          answerParse: parseForSolution,
        })
      )}
    </>
  );
};

export default MessageParser;
