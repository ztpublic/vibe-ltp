import { Router, type Router as RouterType } from 'express';
import type { ChatRequest, ChatResponse } from '@vibe-ltp/shared';
import { formatValidationReply, type PuzzleContext, validatePuzzleQuestion } from '@vibe-ltp/llm-client';
import * as gameState from '../../state/gameState.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

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
    const model = process.env.LLM_MODEL_ID ?? 'x-ai/grok-4.1-fast:free';
    
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

    // Format reply for chat UI
    const replyText = formatValidationReply(evaluation);

    // Format response with full structured message
    const reply: ChatResponse['reply'] = {
      id: uuidv4(),
      type: 'bot',
      content: replyText,
      timestamp: new Date().toISOString(),
      // Include reply metadata linking to user's question
      replyMetadata: {
        replyToId: userMessage.id,
        replyToPreview: userText.slice(0, 40) + (userText.length > 40 ? '…' : ''),
        replyToNickname: userNickname,
      },
    };

    const response: ChatResponse = { reply };
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

export const chatRoutes: RouterType = router;
