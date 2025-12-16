import { Router, type Router as RouterType, type Response } from 'express';
import {
  SESSION_SOCKET_EVENTS,
  SOCKET_EVENTS,
  type CreateSessionResponse,
  type GameSessionId,
  type GetSessionResponse,
  type ListSessionsResponse,
  type SessionStateUpdate,
} from '@vibe-ltp/shared';
import {
  CreateSessionRequestSchema,
  EndSessionRequestSchema,
  JoinSessionRequestSchema,
  StartSessionRequestSchema,
} from '@vibe-ltp/shared/schemas';
import * as gameState from '../../state/gameState.js';
import { getSocketServer } from '../../sockets/ioReference.js';

const router = Router();

const notFound = (res: Response, sessionId: GameSessionId) =>
  res.status(404).json({ error: `Session not found: ${sessionId}` });

router.get('/', (_req, res) => {
  const payload: ListSessionsResponse = {
    sessions: gameState.listSessions(),
  };
  res.json(payload);
});

router.post('/', (req, res) => {
  const parsed = CreateSessionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid create session request', issues: parsed.error.issues });
  }

  const body = parsed.data;
  try {
    const snapshot = gameState.createSession({
      title: body.title,
      hostNickname: body.hostNickname,
      puzzleContent: body.puzzleContent,
    });

    const { puzzleContent: _puzzleContent, ...session } = snapshot;
    const payload: CreateSessionResponse = { session };
    res.status(201).json(payload);

    const io = getSocketServer();
    if (io) {
      io.emit(SESSION_SOCKET_EVENTS.SESSION_CREATED, { session });
      io.emit(SESSION_SOCKET_EVENTS.SESSION_LIST_UPDATED, { sessions: gameState.listSessions() });
    }
  } catch (error) {
    console.error('[Sessions] Create failed', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

router.get('/:sessionId', (req, res) => {
  const sessionId: GameSessionId = req.params.sessionId;
  const session = gameState.getSession(sessionId);
  if (!session) return notFound(res, sessionId);

  const payload: GetSessionResponse = {
    session,
    chatHistory: [...gameState.getChatMessages(sessionId)],
    questionHistory: [...gameState.getQuestionHistory(sessionId)],
  };

  res.json(payload);
});

router.post('/:sessionId/join', (req, res) => {
  const sessionId: GameSessionId = req.params.sessionId;
  const parsed = JoinSessionRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid join session request', issues: parsed.error.issues });
  }
  try {
    const session = gameState.joinSession(sessionId);
    const payload: GetSessionResponse = {
      session,
      chatHistory: [...gameState.getChatMessages(sessionId)],
      questionHistory: [...gameState.getQuestionHistory(sessionId)],
    };
    res.json(payload);

    const io = getSocketServer();
    if (io) {
      io.to(sessionId).emit(SESSION_SOCKET_EVENTS.SESSION_UPDATED, { session });
      io.emit(SESSION_SOCKET_EVENTS.SESSION_LIST_UPDATED, { sessions: gameState.listSessions() });
    }
  } catch (error) {
    return notFound(res, sessionId);
  }
});

router.post('/:sessionId/leave', (req, res) => {
  const sessionId: GameSessionId = req.params.sessionId;
  try {
    const session = gameState.leaveSession(sessionId);
    if (!session) return notFound(res, sessionId);

    res.json({ session });

    const io = getSocketServer();
    if (io) {
      io.to(sessionId).emit(SESSION_SOCKET_EVENTS.SESSION_UPDATED, { session });
      io.emit(SESSION_SOCKET_EVENTS.SESSION_LIST_UPDATED, { sessions: gameState.listSessions() });
    }
  } catch (error) {
    return notFound(res, sessionId);
  }
});

router.post('/:sessionId/start', (req, res) => {
  const sessionId: GameSessionId = req.params.sessionId;
  const parsed = StartSessionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid start session request', issues: parsed.error.issues });
  }

  const { puzzleContent } = parsed.data;

  try {
    const snapshot = gameState.startSession(sessionId, puzzleContent);
    const update: SessionStateUpdate = {
      sessionId,
      state: snapshot.state,
      puzzleContent: snapshot.puzzleContent,
      updatedAt: snapshot.updatedAt,
    };

    res.json({ session: snapshot });

    const io = getSocketServer();
    if (io) {
      io.to(sessionId).emit(SOCKET_EVENTS.GAME_STATE_UPDATED, update);
      io.to(sessionId).emit(SESSION_SOCKET_EVENTS.SESSION_UPDATED, { session: snapshot });
      io.emit(SESSION_SOCKET_EVENTS.SESSION_LIST_UPDATED, { sessions: gameState.listSessions() });
    }
  } catch (error) {
    console.error('[Sessions] Start failed', error);
    return notFound(res, sessionId);
  }
});

router.post('/:sessionId/reset', (req, res) => {
  const sessionId: GameSessionId = req.params.sessionId;

  try {
    gameState.resetGameState(sessionId);
    const snapshot = gameState.getSession(sessionId)!;
    const update: SessionStateUpdate = {
      sessionId,
      state: snapshot.state,
      puzzleContent: snapshot.puzzleContent,
      updatedAt: snapshot.updatedAt,
    };

    res.json({ session: snapshot });

    const io = getSocketServer();
    if (io) {
      io.to(sessionId).emit(SOCKET_EVENTS.GAME_STATE_UPDATED, update);
      io.to(sessionId).emit(SESSION_SOCKET_EVENTS.SESSION_UPDATED, { session: snapshot });
      io.emit(SESSION_SOCKET_EVENTS.SESSION_LIST_UPDATED, { sessions: gameState.listSessions() });
    }
  } catch (error) {
    console.error('[Sessions] Reset failed', error);
    return notFound(res, sessionId);
  }
});

router.post('/:sessionId/end', (req, res) => {
  const sessionId: GameSessionId = req.params.sessionId;
  const parsed = EndSessionRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid end session request', issues: parsed.error.issues });
  }

  const { revealContent = true, preserveChat = true } = parsed.data;

  try {
    const snapshot = gameState.endSession(sessionId, { revealContent, preserveChat });
    const update: SessionStateUpdate = {
      sessionId,
      state: snapshot.state,
      puzzleContent: snapshot.puzzleContent,
      updatedAt: snapshot.updatedAt,
    };

    res.json({ session: snapshot });

    const io = getSocketServer();
    if (io) {
      io.to(sessionId).emit(SOCKET_EVENTS.GAME_STATE_UPDATED, update);
      io.to(sessionId).emit(SESSION_SOCKET_EVENTS.SESSION_UPDATED, { session: snapshot });
      io.emit(SESSION_SOCKET_EVENTS.SESSION_LIST_UPDATED, { sessions: gameState.listSessions() });
    }
  } catch (error) {
    console.error('[Sessions] End failed', error);
    return notFound(res, sessionId);
  }
});

export const sessionRoutes: RouterType = router;
