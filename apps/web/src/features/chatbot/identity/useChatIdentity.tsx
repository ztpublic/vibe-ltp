'use client';

import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';

type Identity = {
  nickname: string;
  setNickname: (name: string) => void;
  isHydrated: boolean;
};

const IdentityContext = createContext<Identity | null>(null);
const STORAGE_KEY = 'puzzle_nickname';
const DEFAULT_NAME = 'visitor';

const isValidNickname = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (trimmed.length > 24) return false;
  // Allow basic letters/numbers/underscore/Chinese characters and spaces
  return /^[\\p{L}\\p{N}_\\s]{1,24}$/u.test(trimmed);
};

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [nickname, setNicknameState] = useState<string>(DEFAULT_NAME);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isValidNickname(stored)) {
      setNicknameState(stored);
    }
    setIsHydrated(true);
  }, []);

  const setNickname = (name: string) => {
    const next = isValidNickname(name) ? name.trim() : DEFAULT_NAME;
    setNicknameState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  };

  // @ts-expect-error React 19 type compatibility issue with Context.Provider
  return (
    <IdentityContext.Provider value={{ nickname, setNickname, isHydrated } as Identity}>
      {children}
    </IdentityContext.Provider>
  );
};

export const useChatIdentity = () => {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useChatIdentity must be used inside IdentityProvider');
  return ctx;
};
