import { Router, type Router as RouterType } from 'express';
import type { ChatRequest, ChatResponse } from '@vibe-ltp/shared';
import { chatReply, type ChatMessage as LLMChatMessage } from '@vibe-ltp/llm-client';

const router = Router();

router.post('/chat', async (req, res) => {
  const body = req.body as ChatRequest;

  try {
    // Convert shared ChatMessage format to LLM ChatMessage format
    const llmMessages: LLMChatMessage[] = body.history.map(msg => ({
      role: msg.role === 'bot' ? 'assistant' : msg.role as 'user' | 'system',
      content: msg.content,
    }));

    // Add current user message
    llmMessages.push({
      role: 'user',
      content: body.message,
    });

    console.log('\n📨 User message:', body.message);
    console.log('📜 Conversation history length:', body.history.length);

    // Get LLM response
    const model = process.env.LLM_MODEL_ID ?? 'openai/gpt-4o-mini';
    console.log('🤖 Using model:', model);
    
    // Log the full prompt being sent to LLM
    console.log('\n💬 Conversation Messages:');
    console.log('─'.repeat(60));
    llmMessages.forEach((msg, idx) => {
      console.log(`[${idx + 1}] ${msg.role.toUpperCase()}:`);
      console.log(msg.content);
      console.log('─'.repeat(60));
    });
    console.log(`Total messages: ${llmMessages.length}\n`);
    
    const replyText = await chatReply({
      model,
      systemPrompt: '',
      messages: llmMessages,
    });

    console.log('\n✅ LLM Response:');
    console.log('─'.repeat(60));
    console.log(replyText);
    console.log('─'.repeat(60));
    console.log(`📊 Response length: ${replyText.length} characters\n`);

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
