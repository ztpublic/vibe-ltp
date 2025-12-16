import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { puzzleRoutes } from './puzzles.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/puzzles', puzzleRoutes);
  return app;
}

describe('Puzzle HTTP routes', () => {
  beforeEach(() => {
    // No global server state to reset; catalog is file-backed + cached.
  });

  it('lists puzzles (public content only)', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/puzzles').expect(200);

    expect(Array.isArray(res.body.puzzles)).toBe(true);
    expect(res.body.puzzles.length).toBeGreaterThan(0);

    const first = res.body.puzzles[0] as {
      id: string;
      puzzleContent: { soupSurface?: unknown; soupTruth?: unknown };
    };
    expect(typeof first.id).toBe('string');
    expect(typeof first.puzzleContent?.soupSurface).toBe('string');
    expect(first.puzzleContent?.soupTruth).toBeUndefined();
  });

  it('fetches a single puzzle by id (no truth)', async () => {
    const app = createTestApp();
    const listRes = await request(app).get('/api/puzzles').expect(200);
    const firstId = (listRes.body.puzzles[0] as { id: string }).id;

    const res = await request(app)
      .get(`/api/puzzles/${encodeURIComponent(firstId)}`)
      .expect(200);
    expect(res.body.puzzle.id).toBe(firstId);
    expect(typeof res.body.puzzle.soupSurface).toBe('string');
    expect(res.body.puzzle.soupTruth).toBeUndefined();
  });

  it('rejects puzzle creation (file-backed dataset)', async () => {
    const app = createTestApp();
    await request(app).post('/api/puzzles').send({}).expect(405);
  });
});
