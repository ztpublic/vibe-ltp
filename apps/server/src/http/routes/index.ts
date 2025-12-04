import type { Express } from 'express';
import { puzzleRoutes } from './puzzles.js';
import { chatRoutes } from './chat.js';
import { sessionRoutes } from './sessions.js';

export function setupRoutes(app: Express): void {
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/puzzles', puzzleRoutes);
  app.use('/api', chatRoutes);
}
