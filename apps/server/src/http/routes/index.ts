import type { Express } from 'express';
import { puzzleRoutes } from './puzzles.js';
import { chatRoutes } from './chat.js';

export function setupRoutes(app: Express): void {
  app.use('/api/puzzles', puzzleRoutes);
  app.use('/api', chatRoutes);
}
