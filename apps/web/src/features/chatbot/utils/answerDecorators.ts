import type { AnswerType } from '@vibe-ltp/shared';

type DecoratorConfig = {
  color: string;
  icon: string;
  label: string;
};

const ANSWER_DECORATORS: Record<AnswerType, DecoratorConfig> = {
  yes: { color: '#22c55e', icon: '✔', label: 'YES' },
  no: { color: '#ef4444', icon: '✖', label: 'NO' },
  unknown: { color: '#9ca3af', icon: '?', label: 'UNKNOWN' },
  both: { color: '#2563eb', icon: '⇄', label: 'BOTH' },
  irrelevant: { color: '#eab308', icon: '⚠', label: 'IRRELEVANT' },
};

/**
 * Build a chat message decorator for a validator answer
 */
export function buildAnswerDecorator(answer: AnswerType, tip?: string) {
  const base = ANSWER_DECORATORS[answer] ?? ANSWER_DECORATORS.unknown;

  return {
    id: `answer-${answer}`,
    color: base.color,
    icon: base.icon,
    label: base.label,
    text: tip?.trim() || base.label,
  };
}
