import { Router, type Router as RouterType } from 'express';
import { getPuzzleById, listPuzzles } from '../../puzzles/puzzleCatalog.js';

export const puzzleRoutes: RouterType = Router();

// GET /api/puzzles - List all puzzles
puzzleRoutes.get('/', async (_req, res) => {
  try {
    const puzzles = await listPuzzles();
    res.json({ puzzles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch puzzles' });
  }
});

// GET /api/puzzles/:id - Get single puzzle
puzzleRoutes.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const puzzle = await getPuzzleById(id);
    if (!puzzle) {
      return res.status(404).json({ error: `Puzzle not found: ${id}` });
    }

    // Never expose truth via public REST endpoint.
    return res.json({ puzzle: { id, soupSurface: puzzle.soupSurface } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch puzzle' });
  }
});

// Puzzles are currently file-backed under packages/data/puzzles (no Prisma/DB yet).
puzzleRoutes.post('/', (_req, res) => {
  res.status(405).json({
    error:
      'Creating puzzles via REST is not supported (file-backed dataset). Add puzzles in packages/data/puzzles instead.',
  });
});
