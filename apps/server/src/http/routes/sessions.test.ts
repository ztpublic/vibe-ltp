import express from 'express';
import request from 'supertest';
import { describe, it, beforeEach, expect } from 'vitest';
import { sessionRoutes } from './sessions.js';
import * as gameState from '../../state/gameState.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/sessions', sessionRoutes);
  return app;
}

describe('Session HTTP routes', () => {
  beforeEach(() => {
    gameState.clearAllState();
  });

  it('creates a session and lists it', async () => {
    const app = createTestApp();

    const createRes = await request(app)
      .post('/api/sessions')
      .send({ title: 'Test Room', hostNickname: 'Host A' })
      .expect(201);

    const createdId = createRes.body.session.id as string;
    expect(createRes.body.session.title).toBe('Test Room');

    const listRes = await request(app).get('/api/sessions').expect(200);
    const ids = (listRes.body.sessions as Array<{ id: string }>).map((s) => s.id);
    expect(ids).toContain(createdId);
  });

  it('joins a session and returns snapshot + histories', async () => {
    const app = createTestApp();
    const { body } = await request(app).post('/api/sessions').send({ title: 'Joinable' });
    const sessionId = body.session.id as string;

    const joinRes = await request(app).post(`/api/sessions/${sessionId}/join`).send({ nickname: 'Player' }).expect(200);

    expect(joinRes.body.session.id).toBe(sessionId);
    expect(joinRes.body.chatHistory).toEqual([]);
    expect(joinRes.body.questionHistory).toEqual([]);
  });

  it('requires puzzleContent when starting a session', async () => {
    const app = createTestApp();
    const { body } = await request(app).post('/api/sessions').send({ title: 'Start me' });
    const sessionId = body.session.id as string;

    await request(app).post(`/api/sessions/${sessionId}/start`).send({}).expect(400);

    const startRes = await request(app)
      .post(`/api/sessions/${sessionId}/start`)
      .send({ puzzleContent: { soupSurface: 'Surface', soupTruth: 'Truth' } })
      .expect(200);

    expect(startRes.body.session.state).toBe('Started');
    expect(startRes.body.session.puzzleContent?.soupTruth).toBe('Truth');
  });

  it('resets a started session back to NotStarted', async () => {
    const app = createTestApp();
    const { body } = await request(app).post('/api/sessions').send({ title: 'Reset me' });
    const sessionId = body.session.id as string;

    await request(app)
      .post(`/api/sessions/${sessionId}/start`)
      .send({ puzzleContent: { soupSurface: 'Surface', soupTruth: 'Truth' } })
      .expect(200);

    const resetRes = await request(app).post(`/api/sessions/${sessionId}/reset`).expect(200);
    expect(resetRes.body.session.state).toBe('NotStarted');
  });
});
