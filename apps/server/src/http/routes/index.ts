import type { Express } from 'express';
import { puzzleRoutes } from './puzzles.js';

export function setupRoutes(app: Express): void {
  app.use('/api/puzzles', puzzleRoutes);
}
