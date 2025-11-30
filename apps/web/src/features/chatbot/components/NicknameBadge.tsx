'use client';

import React, { useState } from 'react';
import { useChatIdentity } from '../identity/useChatIdentity';

export const NicknameBadge = () => {
  const { nickname, setNickname, isHydrated } = useChatIdentity();
  const [draft, setDraft] = useState(nickname);

  const onChangeNickname = () => {
    const next = draft.trim();
    setNickname(next);
  };

  return (
    <div className="flex items-center gap-2 text-xs text-slate-300">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/20 text-orange-300 text-xs">
        👤
      </span>
      <input
        aria-label="昵称"
        className="w-28 rounded bg-transparent border border-transparent focus:border-orange-400 px-2 py-1 text-slate-200 text-xs outline-none transition-colors"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={onChangeNickname}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onChangeNickname();
            e.currentTarget.blur();
          }
        }}
        placeholder="visitor"
        disabled={!isHydrated}
      />
    </div>
  );
};
