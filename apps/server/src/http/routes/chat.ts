import { Router, type Router as RouterType } from 'express';
import type { ChatRequest, ChatResponse } from '@vibe-ltp/shared';

const router = Router();

router.post('/chat', async (req, res) => {
  const body = req.body as ChatRequest;

  // TODO: integrate with puzzle-core: analyze question, update session state.
  // For now, return a placeholder response
  const reply: ChatResponse['reply'] = {
    role: 'bot',
    content: 'This is a placeholder response. Later this will be generated based on lateral thinking puzzle rules.',
    timestamp: new Date().toISOString(),
  };

  const response: ChatResponse = { reply };

  res.json(response);
});

export const chatRoutes: RouterType = router;
