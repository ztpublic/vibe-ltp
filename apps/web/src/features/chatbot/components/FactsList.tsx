import React from 'react';
import type { PuzzleFact } from '@vibe-ltp/shared';

interface FactsListProps {
  facts?: PuzzleFact[] | null;
  isGameStarted: boolean;
}

export const FactsList: React.FC<FactsListProps> = ({ facts, isGameStarted }) => {
  const factsToRender = facts ?? [];
  const totalFacts = factsToRender.length;
  const revealedFacts = factsToRender.filter((fact) => fact.revealed).length;
  const hasFacts = isGameStarted && totalFacts > 0;

  return (
    <div className="border border-[#3e3e42] rounded-lg bg-[#252526] p-3 flex flex-col min-h-[160px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-white">事实列表</h3>
        <span className="text-xs px-2 py-1 rounded bg-[#1e1e1e] border border-[#3e3e42] text-[#9cdcfe]">
          {revealedFacts}/{totalFacts}
        </span>
      </div>

      <div className="space-y-1 overflow-auto pr-1 max-h-[32vh]">
        {!isGameStarted ? (
          <p className="text-[#7f7f7f] text-sm">开始新汤后会显示事实。</p>
        ) : !hasFacts ? (
          <p className="text-[#7f7f7f] text-sm">暂无事实，继续提问以获取更多线索。</p>
        ) : (
          factsToRender.map((fact, index) => {
            const isRevealed = fact.revealed;
            const containerClass = isRevealed
              ? 'border-[#2f80ed]/50 bg-[#1f272e] text-[#e5e5e5]'
              : 'border-[#323233] bg-[#1c1c1c] text-[#5f5f63]';

            return (
              <div
                key={fact.id || index}
                className={`border rounded-md px-3 py-2 flex items-center gap-2 text-sm ${containerClass}`}
              >
                <div
                  className={`h-2 w-2 rounded-full ${isRevealed ? 'bg-[#8ad8ff]' : 'bg-[#4b4b4f]'}`}
                  aria-hidden
                />
                <span className="truncate" title={isRevealed ? fact.text : '尚未揭示'}>
                  {isRevealed ? fact.text : '尚未揭示'}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
