'use client';

import React, { ReactNode } from 'react';

type MockActionProviderProps = {
  createChatBotMessage: any;
  setState: React.Dispatch<React.SetStateAction<any>>;
  children: ReactNode;
};

const MockActionProvider: React.FC<MockActionProviderProps> = ({
  createChatBotMessage,
  setState,
  children,
}) => {
  const reply = (content: string) => {
    const botMessage = createChatBotMessage(content);
    setState((prev: any) => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
  };

  const actions = {
    greet: () => reply('Welcome to Storybook mode! This is a mock chat bot.'),
    handleUserMessage: (msg: string) =>
      reply(`(Mock) You asked: "${msg}". This is a simulated response.`),
  };

  return (
    <>
      {React.Children.map(children, (child) =>
        React.cloneElement(child as React.ReactElement, {
          actions,
        })
      )}
    </>
  );
};

export default MockActionProvider;
