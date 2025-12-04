import React from 'react';
import type { Puzzle, PuzzleDifficulty } from '@vibe-ltp/shared';
import { Card } from './Card';

export interface PuzzleCardProps {
  puzzle: Pick<Puzzle, 'id' | 'soupSurface' | 'tags' | 'difficulty'>;
  onSelect?: (puzzleId: string) => void;
}

export const PuzzleCard: React.FC<PuzzleCardProps> = ({ puzzle, onSelect }) => {
  const difficultyColors: Record<PuzzleDifficulty, string> = {
    EASY: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HARD: 'bg-orange-100 text-orange-800',
    EXPERT: 'bg-red-100 text-red-800',
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
      <div onClick={() => onSelect?.(puzzle.id)}>
        <div className="flex items-start justify-between mb-3">
          <span
            className={`px-2 py-1 text-xs font-semibold rounded ${difficultyColors[puzzle.difficulty]}`}
          >
            {puzzle.difficulty}
          </span>
        </div>
        <p className="text-gray-800 mb-3">{puzzle.soupSurface}</p>
        <div className="flex flex-wrap gap-2">
          {puzzle.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
};
