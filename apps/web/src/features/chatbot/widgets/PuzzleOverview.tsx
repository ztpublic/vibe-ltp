'use client';

import React from 'react';

type PuzzleOverviewProps = {
  puzzleTitle: string;
  soupSurface: string;
};

export const PuzzleOverview: React.FC<PuzzleOverviewProps> = ({
  puzzleTitle,
  soupSurface,
}) => {
  return (
    <div className="space-y-1 p-3 bg-gray-50 rounded-md border border-gray-200">
      <div className="font-semibold text-sm text-gray-900">{puzzleTitle}</div>
      <p className="text-xs text-gray-600 whitespace-pre-line">
        {soupSurface}
      </p>
    </div>
  );
};
