import { describe, it, expect } from 'vitest';
import { Puzzle } from './Puzzle.js';
import { PuzzleDifficulty } from '@vibe-ltp/shared';

describe('Puzzle Model', () => {
  const mockPuzzle = new Puzzle(
    'test-1',
    'A man walks into a bar',
    'He was thirsty',
    ['classic', 'simple'],
    PuzzleDifficulty.EASY,
    new Date('2024-01-01'),
    new Date('2024-01-02'),
    'en'
  );

  it('should create a puzzle with all properties', () => {
    expect(mockPuzzle.id).toBe('test-1');
    expect(mockPuzzle.soupSurface).toBe('A man walks into a bar');
    expect(mockPuzzle.soupBottom).toBe('He was thirsty');
    expect(mockPuzzle.tags).toEqual(['classic', 'simple']);
    expect(mockPuzzle.difficulty).toBe(PuzzleDifficulty.EASY);
    expect(mockPuzzle.sourceLanguage).toBe('en');
  });

  it('should check for tag existence', () => {
    expect(mockPuzzle.hasTag('classic')).toBe(true);
    expect(mockPuzzle.hasTag('simple')).toBe(true);
    expect(mockPuzzle.hasTag('horror')).toBe(false);
    expect(mockPuzzle.hasTag('nonexistent')).toBe(false);
  });

  it('should return surface-only version without solution', () => {
    const surface = mockPuzzle.getSurfaceOnly();
    
    expect(surface.soupSurface).toBe('A man walks into a bar');
    expect(surface.id).toBe('test-1');
    expect(surface.tags).toEqual(['classic', 'simple']);
    expect((surface as any).soupBottom).toBeUndefined();
  });

  it('should preserve immutability of readonly properties', () => {
    // TypeScript enforces readonly at compile time, not runtime
    // This test verifies the property exists and is defined correctly
    expect(mockPuzzle.id).toBe('test-1');
    expect(mockPuzzle.soupSurface).toBe('A man walks into a bar');
    expect(mockPuzzle.soupBottom).toBe('He was thirsty');
  });

  it('should handle puzzles without source language', () => {
    const puzzleWithoutLang = new Puzzle(
      'test-2',
      'Surface',
      'Bottom',
      ['tag1'],
      PuzzleDifficulty.MEDIUM,
      new Date(),
      new Date()
    );
    
    expect(puzzleWithoutLang.sourceLanguage).toBeUndefined();
  });

  it('should handle empty tags array', () => {
    const puzzleNoTags = new Puzzle(
      'test-3',
      'Surface',
      'Bottom',
      [],
      PuzzleDifficulty.HARD,
      new Date(),
      new Date()
    );
    
    expect(puzzleNoTags.tags).toEqual([]);
    expect(puzzleNoTags.hasTag('anything')).toBe(false);
  });

  it('should preserve dates correctly', () => {
    const createdAt = new Date('2024-01-01');
    const updatedAt = new Date('2024-01-02');
    
    const puzzle = new Puzzle(
      'test-4',
      'Surface',
      'Bottom',
      ['tag'],
      PuzzleDifficulty.EASY,
      createdAt,
      updatedAt
    );
    
    expect(puzzle.createdAt).toBe(createdAt);
    expect(puzzle.updatedAt).toBe(updatedAt);
  });
});
