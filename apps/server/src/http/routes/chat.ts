import { Router, type Router as RouterType } from 'express';
import { SOCKET_EVENTS, type ChatRequest, type ChatResponse, type PuzzleContent } from '@vibe-ltp/shared';
import {
  formatValidationReply,
  type PuzzleContext,
  validatePuzzleQuestion,
  matchKeyPoints,
} from '@vibe-ltp/llm-client';
import * as gameState from '../../state/gameState.js';
import { v4 as uuidv4 } from 'uuid';
import { getSocketServer } from '../../sockets/ioReference.js';

const router = Router();
const model = 'x-ai/grok-4-fast';

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

    const updatedConversationHistory = gameState.getConversationHistory();

    // Attempt to match any key points revealed by current knowledge (only check unrevealed)
    const currentPuzzleContent = gameState.getPuzzleContent();
    const unrevealedFacts =
      currentPuzzleContent?.facts?.map((fact, idx) => ({ fact, idx })).filter(item => !item.fact.revealed) ?? [];
    const keyPoints = unrevealedFacts.map(item => item.fact.text);
    let matchedIndexes: number[] = [];

    if (keyPoints.length > 0) {
      try {
        const latestTurn = updatedConversationHistory.at(-1);
        if (latestTurn) {
          const matchResult = await matchKeyPoints(
            {
              question: latestTurn.question,
              answer: latestTurn.answer,
              keyPoints,
            },
            model
          );

          matchedIndexes = (matchResult.matchedIndexes || []).filter(
            (idx) => Number.isInteger(idx) && idx >= 0 && idx < keyPoints.length
          );
        }
      } catch (matcherError) {
        console.error('Key points matcher failed; continuing without revealing facts', matcherError);
      }
    }

    if (matchedIndexes.length > 0 && currentPuzzleContent?.facts) {
      const globalMatchedIndexes = matchedIndexes.map(localIdx => unrevealedFacts[localIdx]?.idx).filter(
        (idx): idx is number => typeof idx === 'number'
      );

      const updatedFacts = currentPuzzleContent.facts.map((fact, idx) => {
        if (globalMatchedIndexes.includes(idx)) {
          return { ...fact, revealed: true };
        }
        return fact;
      });

      const updatedPuzzleContent: PuzzleContent = {
        ...currentPuzzleContent,
        facts: updatedFacts,
      };

      gameState.setPuzzleContent(updatedPuzzleContent);

      const io = getSocketServer();
      if (io) {
        io.emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
          state: gameState.getGameState(),
          puzzleContent: updatedPuzzleContent,
        });
      }

      const allRevealed = updatedFacts.length > 0 && updatedFacts.every(f => f.revealed);
      if (allRevealed) {
        gameState.resetGameState();

        // Preserve revealed puzzle content for clients until a new game starts
        gameState.setPuzzleContent(updatedPuzzleContent);

        const ioReset = getSocketServer();
        if (ioReset) {
          ioReset.emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
            state: 'NotStarted',
            puzzleContent: updatedPuzzleContent,
          });
        }
      }
    }

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
