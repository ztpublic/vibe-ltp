'use client';

import React, { ReactNode } from 'react';

type Actions = {
  greet: () => void;
  handleUserMessage: (msg: string) => Promise<void> | void;
};

type MessageParserProps = {
  children: ReactNode;
  actions: Actions;
};

const MessageParser: React.FC<MessageParserProps> = ({ children, actions }) => {
  const parse = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    // Route all messages to the backend for now
    actions.handleUserMessage(trimmed);
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
