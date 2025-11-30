import { buildSystemPrompt } from '@vibe-ltp/llm-client';
import type { AgentVariant } from '../types.js';

const basePrompt = buildSystemPrompt();

export const sampleAgents: AgentVariant[] = [
  // {
  //   id: 'default-grok',
  //   label: 'Baseline prompt - Grok fast',
  //   model: 'x-ai/grok-4.1-fast:free',
  // },
  {
    id: 'gemini-2.5-flash',
    label: 'Cautious prompt - Gemini flash',
    model: 'google/gemini-2.5-flash',
  },
];
