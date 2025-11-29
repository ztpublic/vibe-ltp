import { Router, type Router as RouterType } from 'express';
import type { ChatRequest, ChatResponse } from '@vibe-ltp/shared';
import { evaluatePuzzleQuestion, formatEvaluationReply, type PuzzleContext } from '@vibe-ltp/llm-client';
import * as gameState from '../../state/gameState.js';

const router = Router();

router.post('/chat', async (req, res) => {
  const body = req.body as ChatRequest;

  try {
    const userMessage = body.message;
    
    console.log('\n📨 User message:', userMessage);
    console.log('📜 Conversation history length:', body.history.length);

    // Check if game has started and puzzle is loaded
    const currentGameState = gameState.getGameState();
    const puzzleContent = gameState.getPuzzleContent();

    if (currentGameState !== 'Started' || !puzzleContent) {
      console.log('⚠️  Game not started or no puzzle loaded');
      
      const reply: ChatResponse['reply'] = {
        role: 'bot',
        content: '游戏还未开始，请先开始一个谜题。\n\nThe game hasn\'t started yet. Please start a puzzle first.',
        timestamp: new Date().toISOString(),
      };
      
      return res.json({ reply });
    }

    // Build puzzle context for agent
    const puzzleContext: PuzzleContext = {
      surface: puzzleContent.soupSurface,
      truth: puzzleContent.soupTruth,
      historySummary: gameState.getHistorySummary(),
    };

    // Use puzzle agent to evaluate question
    const model = process.env.LLM_MODEL_ID ?? 'x-ai/grok-4.1-fast:free';
    console.log('🤖 Using model:', model);
    
    const evaluation = await evaluatePuzzleQuestion(
      userMessage,
      puzzleContext,
      model
    );

    // Add to question history
    gameState.addQuestionToHistory(
      userMessage,
      evaluation.answer,
      evaluation.tips
    );

    // Format reply for chat UI
    const replyText = formatEvaluationReply(evaluation);

    console.log('\n✅ Final Reply:');
    console.log('─'.repeat(60));
    console.log(replyText);
    console.log('─'.repeat(60));
    console.log(`📊 Question history: ${gameState.getQuestionHistory().length} questions\n`);

    // Format response
    const reply: ChatResponse['reply'] = {
      role: 'bot',
      content: replyText,
      timestamp: new Date().toISOString(),
    };

    const response: ChatResponse = { reply };
    res.json(response);
  } catch (error) {
    console.error('Error in chat route:', error);
    
    // Fallback response on error
    const reply: ChatResponse['reply'] = {
      role: 'bot',
      content: '抱歉，我现在无法回答。请稍后再试。',
      timestamp: new Date().toISOString(),
    };
    
    res.status(500).json({ reply });
  }
});

export const chatRoutes: RouterType = router;
