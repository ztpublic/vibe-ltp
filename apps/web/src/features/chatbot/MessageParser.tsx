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

  type MessageParserChildProps = {
    parse: (message: string) => void;
    answerParse: (message: string) => void;
  };

  return (
    <>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement<MessageParserChildProps>(child)) return child;
        return React.cloneElement(child, { parse, answerParse: parseForSolution });
      })}
    </>
  );
};

export default MessageParser;
