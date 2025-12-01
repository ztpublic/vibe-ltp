import { Router, type Router as RouterType } from 'express';
import { SOCKET_EVENTS, type ChatRequest, type ChatResponse, type PuzzleKeyword } from '@vibe-ltp/shared';
import {
  formatValidationReply,
  type PuzzleContext,
  validatePuzzleQuestion,
  extractQuestionKeywords,
  findMostSimilarEmbedding,
} from '@vibe-ltp/llm-client';
import * as gameState from '../../state/gameState.js';
import { v4 as uuidv4 } from 'uuid';
import { getSocketServer } from '../../sockets/ioReference.js';

const router = Router();
const model = 'x-ai/grok-4-fast';
const KEYWORD_REVEAL_THRESHOLD = 0.85;

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

    // Attempt to reveal keywords based on question similarity
    const currentPuzzleContent = gameState.getPuzzleContent();
    const puzzleKeywords: PuzzleKeyword[] = currentPuzzleContent?.keywords ?? [];
    const storedEmbeddings = gameState.getKeywordEmbeddings();

    if (
      puzzleKeywords.length > 0 &&
      storedEmbeddings.length === puzzleKeywords.length &&
      puzzleKeywords.some((item) => !item.revealed)
    ) {
      try {
        const { keywords: questionKeywords } = await extractQuestionKeywords(userText, model);
        const unrevealed = puzzleKeywords
          .map((keyword, idx): { keyword: PuzzleKeyword; idx: number; embedding: number[] | undefined } => ({
            keyword,
            idx,
            embedding: storedEmbeddings[idx],
          }))
          .filter(
            (item): item is { keyword: PuzzleKeyword; idx: number; embedding: number[] } =>
              !item.keyword.revealed && Array.isArray(item.embedding)
          );

        const matchedIndexes = new Set<number>();

        for (const questionKeyword of questionKeywords) {
          if (unrevealed.length === 0) break;

          const embeddingList = unrevealed.map((item) => item.embedding);
          const { similarity, index } = await findMostSimilarEmbedding(questionKeyword, embeddingList);

          if (similarity >= KEYWORD_REVEAL_THRESHOLD) {
            const matched = unrevealed.splice(index, 1)[0];
            if (matched) {
              matchedIndexes.add(matched.idx);
            }
          }
        }

        if (matchedIndexes.size > 0 && currentPuzzleContent) {
          const updatedKeywords = puzzleKeywords.map((keyword, idx) =>
            matchedIndexes.has(idx) ? { ...keyword, revealed: true } : keyword
          );

          const updatedPuzzleContent = {
            ...currentPuzzleContent,
            keywords: updatedKeywords,
          };

          gameState.setPuzzleContent(updatedPuzzleContent);

          const io = getSocketServer();
          if (io) {
            io.emit(SOCKET_EVENTS.GAME_STATE_UPDATED, {
              state: gameState.getGameState(),
              puzzleContent: updatedPuzzleContent,
            });
          }
        }
      } catch (keywordsError) {
        console.error('[Chat] Keyword matching failed; continuing without reveal', keywordsError);
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
