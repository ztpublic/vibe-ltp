'use client';

import { useState, createContext, useContext } from 'react';

type Identity = {
  nickname: string;
  setNickname: (name: string) => void;
};

const IdentityContext = createContext<Identity | null>(null);
const STORAGE_KEY = 'puzzle_nickname';

export const IdentityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nickname, setNicknameState] = useState(() => {
    // Initialize from localStorage during first render
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(STORAGE_KEY) || 'visitor';
    }
    return 'visitor';
  });

  const setNickname = (name: string) => {
    const trimmed = name.trim() || 'visitor';
    setNicknameState(trimmed);
    window.localStorage.setItem(STORAGE_KEY, trimmed);
  };

  return (
    <IdentityContext.Provider value={{ nickname, setNickname }}>
      {children}
    </IdentityContext.Provider>
  );
};

export const useChatIdentity = () => {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useChatIdentity must be used inside IdentityProvider');
  return ctx;
};
