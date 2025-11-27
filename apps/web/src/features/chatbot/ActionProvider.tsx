'use client';

import React, { ReactNode } from 'react';
import type { ChatRequest, ChatResponse, ChatMessage } from '@vibe-ltp/shared';

type ActionProviderProps = {
  createChatBotMessage: any;
  setState: React.Dispatch<React.SetStateAction<any>>;
  children: ReactNode;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

const ActionProvider: React.FC<ActionProviderProps> = ({
  createChatBotMessage,
  setState,
  children,
}) => {
  const appendBotMessage = (content: string) => {
    const botMessage = createChatBotMessage(content);
    setState((prev: any) => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
  };

  const handleUserMessage = async (userMessage: string) => {
    // Build history from state
    let history: ChatMessage[] = [];

    setState((prev: any) => {
      history = prev.messages ?? [];
      return prev;
    });

    const body: ChatRequest = {
      message: userMessage,
      history,
    };

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as ChatResponse;
      appendBotMessage(data.reply.content);
    } catch (err) {
      console.error(err);
      appendBotMessage('服务器好像出了点问题，请稍后再试。');
    }
  };

  const actions = {
    greet: () => appendBotMessage('欢迎来到海龟汤游戏！'),
    handleUserMessage,
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

export default ActionProvider;
