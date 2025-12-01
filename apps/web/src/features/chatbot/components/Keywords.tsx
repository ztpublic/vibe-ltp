import React from 'react';
import type { PuzzleKeyword } from '@vibe-ltp/shared';

interface KeywordsProps {
  keywords?: PuzzleKeyword[] | null;
  isGameStarted: boolean;
}

/**
 * Displays puzzle keywords with reveal status and a simple progress indicator.
 * Hidden keywords are rendered as placeholders until revealed.
 */
export const Keywords: React.FC<KeywordsProps> = ({ keywords, isGameStarted }) => {
  const items = keywords ?? [];
  const total = items.length;
  const revealedCount = items.filter((item) => item.revealed).length;
  const hasKeywords = total > 0;

  return (
    <div className="border border-[#3e3e42] rounded-lg bg-[#252526] p-3 flex flex-col min-h-[160px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-white">关键词</h3>
        <span className="text-xs px-2 py-1 rounded bg-[#1e1e1e] border border-[#3e3e42] text-[#9cdcfe]">
          {revealedCount}/{total}
        </span>
      </div>

      <div className="space-y-1 overflow-auto pr-1 max-h-[32vh]">
        {!isGameStarted && !hasKeywords ? (
          <p className="text-[#7f7f7f] text-sm">开始新汤后会生成关键词。</p>
        ) : !hasKeywords ? (
          <p className="text-[#7f7f7f] text-sm">暂无关键词。</p>
        ) : (
          items.map((keyword) => {
            const isRevealed = keyword.revealed;
            const containerClass = isRevealed
              ? 'border-[#2f80ed]/50 bg-[#1f272e] text-[#e5e5e5]'
              : 'border-[#323233] bg-[#1c1c1c] text-[#5f5f63]';

            return (
              <div
                key={keyword.id}
                className={`border rounded-md px-3 py-2 flex items-center gap-2 text-sm ${containerClass}`}
              >
                <div
                  className={`h-2 w-2 rounded-full ${isRevealed ? 'bg-[#8ad8ff]' : 'bg-[#4b4b4f]'}`}
                  aria-hidden
                />
                <span className="truncate" title={isRevealed ? keyword.text : '尚未揭示'}>
                  {isRevealed ? keyword.text : '隐藏关键词'}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
