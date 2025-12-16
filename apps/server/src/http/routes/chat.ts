import { Router, type Router as RouterType } from 'express';
import {
  SOCKET_EVENTS,
  type ChatResponse,
  type ChatReplyDecoration,
  type GameSessionId,
  type GameSessionSnapshot,
  type SessionChatMessage,
} from '@vibe-ltp/shared';
import { ChatFeedbackRequestSchema, ChatRequestSchema } from '@vibe-ltp/shared/schemas';
import {
  type PuzzleContext,
  getModelSelection,
  validatePuzzleQuestion,
  validateTruthProposal,
  formatTruthValidationReply,
} from '@vibe-ltp/llm-client';
import * as gameState from '../../state/gameState.js';
import { v4 as uuidv4 } from 'uuid';
import { getSocketServer } from '../../sockets/ioReference.js';

const router = Router();
const modelSelection = getModelSelection();

const buildReplyPreview = (text: string, maxLength = 80) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

function requireActiveSession(
  sessionId: GameSessionId,
): { ok: true; session: GameSessionSnapshot } | { ok: false; status: number; message: string } {
  const session = gameState.getSession(sessionId);
  if (!session) return { ok: false, status: 404, message: `Session not found: ${sessionId}` };
  if (session.state === 'Ended') return { ok: false, status: 410, message: `Session ended: ${sessionId}` };
  return { ok: true, session };
}

router.post('/chat', async (req, res) => {
  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid chat request', issues: parsed.error.issues });
  }

  const body = parsed.data;

  try {
    const userMessage = body.message;
    const userText = userMessage.content;
    const userNickname = userMessage.nickname;
    const sessionId = body.sessionId ?? gameState.getDefaultSessionId();

    const sessionCheck = requireActiveSession(sessionId);
    if (!sessionCheck.ok) {
      return res.status(sessionCheck.status).json({ error: sessionCheck.message });
    }

    // Log user identity for analytics
    console.log(`[Chat] User "${userNickname}" asked: ${userText} (session=${sessionId})`);

    // Check if game has started and puzzle is loaded
    const currentGameState = gameState.getGameState(sessionId);
    const puzzleContent = gameState.getPuzzleContent(sessionId);

    if (currentGameState !== 'Started' || !puzzleContent) {
      const reply: ChatResponse['reply'] = {
        id: uuidv4(),
        type: 'bot',
        content: '游戏还未开始，请先开始一个谜题。\n\nThe game hasn\'t started yet. Please start a puzzle first.',
        timestamp: new Date().toISOString(),
      };

      return res.status(409).json({ error: 'Game not started', reply, sessionId });
    }

    const io = getSocketServer();

    // Persist the raw user message immediately so reconnecting clients can restore the question even if validation fails.
    const persistedUserMessage: SessionChatMessage = {
      id: userMessage.id,
      type: 'user',
      content: userText,
      nickname: userNickname,
      timestamp: userMessage.timestamp ?? new Date().toISOString(),
    };

    gameState.addChatMessage(persistedUserMessage, sessionId);
    io?.to(sessionId).emit(SOCKET_EVENTS.CHAT_MESSAGE_ADDED, { sessionId, message: persistedUserMessage });

    // Build puzzle context for agent
    const puzzleContext: PuzzleContext = {
      surface: puzzleContent.soupSurface,
      truth: puzzleContent.soupTruth,
      conversationHistory: gameState.getConversationHistory(sessionId),
    };

    // Use question validator agent to evaluate question
    const evaluation = await validatePuzzleQuestion(
      userText,
      puzzleContext,
      modelSelection
    );

    // Add to question history
    gameState.addQuestionToHistory(userText, evaluation.answer, sessionId, undefined, undefined, false, userMessage.id);

    // Build decoration payload for the originating user message
    const decoration: ChatReplyDecoration = {
      targetMessageId: userMessage.id,
      answer: evaluation.answer,
      tip: evaluation.tip,
    };

    // Persist decorated user message in chat history
    const decoratedUserMessage: SessionChatMessage = {
      id: userMessage.id,
      type: 'user',
      content: userText,
      nickname: userNickname,
      timestamp: userMessage.timestamp ?? new Date().toISOString(),
      answer: evaluation.answer,
      answerTip: evaluation.tip,
    };

    gameState.addChatMessage(decoratedUserMessage, sessionId);

    if (io) {
      io.to(sessionId).emit(SOCKET_EVENTS.CHAT_MESSAGE_ADDED, { sessionId, message: decoratedUserMessage });
    }

    const response: ChatResponse = { decoration };
    res.json(response);
  } catch (error) {
    console.error('Error in chat route:', error);
    
    // Fallback response on error
    const reply: ChatResponse['reply'] = {
      id: uuidv4(),
      type: 'bot',
      content: '抱歉，我现在无法回答。请稍后再试。',
      timestamp: new Date().toISOString(),
    };
    
    res.status(500).json({ reply });
  }
});

router.post('/feedback', (req, res) => {
  const parsed = ChatFeedbackRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid feedback request', issues: parsed.error.issues });
  }

  const body = parsed.data;
  const sessionId = body.sessionId ?? gameState.getDefaultSessionId();
  const { messageId, direction } = body;
  const thumbsDown = direction === 'down';

  try {
    const ok = gameState.updateQuestionFeedback(sessionId, messageId, thumbsDown, body.question);
    if (!ok) {
      return res.status(404).json({ error: 'Question not found for messageId' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Error in feedback route:', error);
    return res.status(500).json({ error: 'Failed to record feedback' });
  }
});

router.post('/solution', async (req, res) => {
  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid solution request', issues: parsed.error.issues });
  }

  const body = parsed.data;

  try {
    const userMessage = body.message;
    const userText = userMessage.content;
    const userNickname = userMessage.nickname;
    const sessionId = body.sessionId ?? gameState.getDefaultSessionId();

    const sessionCheck = requireActiveSession(sessionId);
    if (!sessionCheck.ok) {
      return res.status(sessionCheck.status).json({ error: sessionCheck.message });
    }

    console.log(`[Solution] User "${userNickname}" proposed: ${userText} (session=${sessionId})`);

    const currentGameState = gameState.getGameState(sessionId);
    const puzzleContent = gameState.getPuzzleContent(sessionId);

    if (currentGameState !== 'Started' || !puzzleContent) {
      const reply: ChatResponse['reply'] = {
        id: uuidv4(),
        type: 'bot',
        content: '游戏还未开始，请先开始一个谜题。\n\nThe game hasn\'t started yet. Please start a puzzle first.',
        timestamp: new Date().toISOString(),
      };

      return res.status(409).json({ error: 'Game not started', reply, sessionId });
    }

    const io = getSocketServer();

    const persistedUserMessage: SessionChatMessage = {
      id: userMessage.id,
      type: 'user',
      content: userText,
      nickname: userNickname,
      timestamp: userMessage.timestamp ?? new Date().toISOString(),
    };

    gameState.addChatMessage(persistedUserMessage, sessionId);
    io?.to(sessionId).emit(SOCKET_EVENTS.CHAT_MESSAGE_ADDED, { sessionId, message: persistedUserMessage });

    const evaluation = await validateTruthProposal(
      {
        proposedTruth: userText,
        actualTruth: puzzleContent.soupTruth,
        surface: puzzleContent.soupSurface,
      },
      modelSelection
    );

    const reply: ChatResponse['reply'] = {
      id: uuidv4(),
      type: 'bot',
      content: formatTruthValidationReply(evaluation),
      timestamp: new Date().toISOString(),
      replyMetadata: {
        replyToId: userMessage.id,
        replyToPreview: buildReplyPreview(userText),
        replyToNickname: userNickname,
      },
    };

    gameState.addChatMessage(reply, sessionId);
    io?.to(sessionId).emit(SOCKET_EVENTS.CHAT_MESSAGE_ADDED, { sessionId, message: reply });

    const response: ChatResponse = { reply };
    res.json(response);
  } catch (error) {
    console.error('Error in solution route:', error);
    
    const reply: ChatResponse['reply'] = {
      id: uuidv4(),
      type: 'bot',
      content: '抱歉，暂时无法评估你的解答，请稍后再试。',
      timestamp: new Date().toISOString(),
    };
    
    res.status(500).json({ reply });
  }
});

export const chatRoutes: RouterType = router;
