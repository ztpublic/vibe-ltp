import { buildQuestionValidatorSystemPrompt } from '@vibe-ltp/llm-client';
import type { AgentVariant } from '../types.js';

const basePrompt = buildQuestionValidatorSystemPrompt();

export const sampleAgents: AgentVariant[] = [
  // {
  //   id: 'default-grok',
  //   label: 'Baseline prompt - Grok fast',
  //   model: 'deepseek/deepseek-chat-v3-0324',
  // },
  {
    id: 'gemini-2.5-flash',
    label: 'Cautious prompt - Gemini flash',
    model: 'x-ai/grok-4-fast',
  },
];
