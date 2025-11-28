'use client';

import React, { useState } from 'react';

export interface PuzzleInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (soupSurface: string, soupTruth: string) => void;
}

export const PuzzleInputDialog: React.FC<PuzzleInputDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [soupSurface, setSoupSurface] = useState('');
  const [soupTruth, setSoupTruth] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (soupSurface.trim() && soupTruth.trim()) {
      onConfirm(soupSurface.trim(), soupTruth.trim());
      setSoupSurface('');
      setSoupTruth('');
    }
  };

  const handleCancel = () => {
    setSoupSurface('');
    setSoupTruth('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#252526] border border-[#3e3e42] rounded-lg p-6 w-full max-w-2xl mx-4">
        <h2 className="text-xl font-semibold text-white mb-4">输入谜题内容</h2>
        
        <div className="space-y-4">
          {/* Soup Surface Input */}
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">
              汤面 (Puzzle Surface)
            </label>
            <textarea
              className="w-full h-32 px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-white focus:outline-none focus:border-[#0e639c] resize-none"
              placeholder="输入谜题的表面描述..."
              value={soupSurface}
              onChange={(e) => setSoupSurface(e.target.value)}
            />
          </div>

          {/* Soup Truth Input */}
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">
              汤底 (Puzzle Truth)
            </label>
            <textarea
              className="w-full h-32 px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-white focus:outline-none focus:border-[#0e639c] resize-none"
              placeholder="输入谜题的真相答案..."
              value={soupTruth}
              onChange={(e) => setSoupTruth(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            className="px-4 py-2 rounded bg-[#3e3e42] hover:bg-[#4e4e52] text-white transition-colors"
            onClick={handleCancel}
          >
            取消
          </button>
          <button
            className={`px-4 py-2 rounded transition-colors ${
              soupSurface.trim() && soupTruth.trim()
                ? 'bg-[#0e639c] hover:bg-[#1177bb] text-white cursor-pointer'
                : 'bg-[#3e3e42] text-[#858585] cursor-not-allowed'
            }`}
            onClick={handleConfirm}
            disabled={!soupSurface.trim() || !soupTruth.trim()}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};
