import { Router, type Router as RouterType } from 'express';
import { SOCKET_EVENTS, type ChatRequest, type ChatResponse, type ChatReplyDecoration } from '@vibe-ltp/shared';
import {
  type PuzzleContext,
  validatePuzzleQuestion,
  validateTruthProposal,
  formatTruthValidationReply,
} from '@vibe-ltp/llm-client';
import * as gameState from '../../state/gameState.js';
import { v4 as uuidv4 } from 'uuid';
import { getSocketServer } from '../../sockets/ioReference.js';

const router = Router();
const model = 'x-ai/grok-4-fast';

const buildReplyPreview = (text: string, maxLength = 80) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

router.post('/chat', async (req, res) => {
  const body = req.body as ChatRequest;

  try {
    const userMessage = body.message;
    const userText = userMessage.content;
    const userNickname = userMessage.nickname;

    // Log user identity for analytics
    console.log(`[Chat] User "${userNickname}" asked: ${userText}`);

    // Check if game has started and puzzle is loaded
    const currentGameState = gameState.getGameState();
    const puzzleContent = gameState.getPuzzleContent();

    if (currentGameState !== 'Started' || !puzzleContent) {
      const reply: ChatResponse['reply'] = {
        id: uuidv4(),
        type: 'bot',
        content: '游戏还未开始，请先开始一个谜题。\n\nThe game hasn\'t started yet. Please start a puzzle first.',
        timestamp: new Date().toISOString(),
      };
      
      return res.json({ reply });
    }

    // Build puzzle context for agent
    const puzzleContext: PuzzleContext = {
      surface: puzzleContent.soupSurface,
      truth: puzzleContent.soupTruth,
      conversationHistory: gameState.getConversationHistory(),
    };

    // Use question validator agent to evaluate question
    const evaluation = await validatePuzzleQuestion(
      userText,
      puzzleContext,
      model
    );

    // Add to question history
    gameState.addQuestionToHistory(
      userText,
      evaluation.answer
    );

    // Build decoration payload for the originating user message
    const decoration: ChatReplyDecoration = {
      targetMessageId: userMessage.id,
      answer: evaluation.answer,
      tip: evaluation.tip,
    };

    // Persist decorated user message in chat history
    const decoratedUserMessage = {
      id: userMessage.id,
      type: 'user' as const,
      content: userText,
      nickname: userNickname,
      timestamp: userMessage.timestamp ?? new Date().toISOString(),
      answer: evaluation.answer,
      answerTip: evaluation.tip,
    };

    gameState.addChatMessage(decoratedUserMessage);

    const io = getSocketServer();
    if (io) {
      io.emit(SOCKET_EVENTS.CHAT_MESSAGE_ADDED, { message: decoratedUserMessage });
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

router.post('/solution', async (req, res) => {
  const body = req.body as ChatRequest;

  try {
    const userMessage = body.message;
    const userText = userMessage.content;
    const userNickname = userMessage.nickname;

    console.log(`[Solution] User "${userNickname}" proposed: ${userText}`);

    const currentGameState = gameState.getGameState();
    const puzzleContent = gameState.getPuzzleContent();

    if (currentGameState !== 'Started' || !puzzleContent) {
      const reply: ChatResponse['reply'] = {
        id: uuidv4(),
        type: 'bot',
        content: '游戏还未开始，请先开始一个谜题。\n\nThe game hasn\'t started yet. Please start a puzzle first.',
        timestamp: new Date().toISOString(),
      };
      
      return res.json({ reply });
    }

    const evaluation = await validateTruthProposal(
      {
        proposedTruth: userText,
        actualTruth: puzzleContent.soupTruth,
        surface: puzzleContent.soupSurface,
      },
      model
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

    // Persist messages for history sync
    const persistedUserMessage = {
      id: userMessage.id,
      type: 'user' as const,
      content: userText,
      nickname: userNickname,
      timestamp: userMessage.timestamp ?? new Date().toISOString(),
    };

    const botMessage = {
      id: reply.id!,
      type: 'bot' as const,
      content: reply.content,
      replyToId: reply.replyMetadata?.replyToId,
      replyToPreview: reply.replyMetadata?.replyToPreview,
      replyToNickname: reply.replyMetadata?.replyToNickname,
      timestamp: reply.timestamp ?? new Date().toISOString(),
    };

    gameState.addChatMessage(persistedUserMessage);
    gameState.addChatMessage(botMessage);

    const io = getSocketServer();
    if (io) {
      io.emit(SOCKET_EVENTS.CHAT_MESSAGE_ADDED, { message: persistedUserMessage });
      io.emit(SOCKET_EVENTS.CHAT_MESSAGE_ADDED, { message: botMessage });
    }

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
