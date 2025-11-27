import type { Express } from 'express';
import { puzzleRoutes } from './puzzles.js';
import { roomRoutes } from './rooms.js';

export function setupRoutes(app: Express): void {
  app.use('/api/puzzles', puzzleRoutes);
  app.use('/api/rooms', roomRoutes);
}
