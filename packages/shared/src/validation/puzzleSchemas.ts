import { z } from 'zod';
import { PuzzleDifficulty } from '../types/puzzles';

/**
 * Zod validation schemas for puzzle-related data
 */

export const puzzleDifficultySchema = z.nativeEnum(PuzzleDifficulty);

export const puzzleCreateSchema = z.object({
  soupSurface: z.string().min(10).max(500),
  soupBottom: z.string().min(10).max(2000),
  tags: z.array(z.string()).min(1).max(10),
  difficulty: puzzleDifficultySchema,
  sourceLanguage: z.string().optional(),
});

export const puzzleUpdateSchema = z.object({
  soupSurface: z.string().min(10).max(500).optional(),
  soupBottom: z.string().min(10).max(2000).optional(),
  tags: z.array(z.string()).min(1).max(10).optional(),
  difficulty: puzzleDifficultySchema.optional(),
  sourceLanguage: z.string().optional(),
});

export const puzzleIdSchema = z.string().uuid();
