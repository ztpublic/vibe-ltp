'use client';

import React from 'react';
import { useChatIdentity } from '../identity/useChatIdentity';

export const NicknameBadge: React.FC = () => {
  const { nickname, setNickname } = useChatIdentity();

  const onClick = () => {
    const newName = window.prompt('请输入你的昵称：', nickname) ?? nickname;
    setNickname(newName);
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-xs text-slate-300 hover:text-orange-400 transition-colors"
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/20 text-orange-300 text-xs">
        👤
      </span>
      <span>{nickname}</span>
    </button>
  );
};
