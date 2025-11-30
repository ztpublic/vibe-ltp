'use client';

import { useState, createContext, useContext, type ReactNode } from 'react';

type Identity = {
  nickname: string;
  setNickname: (name: string) => void;
};

const IdentityContext = createContext<Identity | null>(null);
const STORAGE_KEY = 'puzzle_nickname';

export function IdentityProvider({ children }: { children: ReactNode }) {
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

  // @ts-expect-error React 19 type compatibility issue with Context.Provider
  return (
    <IdentityContext.Provider value={{ nickname, setNickname } as Identity}>
      {children}
    </IdentityContext.Provider>
  );
};

export const useChatIdentity = () => {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useChatIdentity must be used inside IdentityProvider');
  return ctx;
};
