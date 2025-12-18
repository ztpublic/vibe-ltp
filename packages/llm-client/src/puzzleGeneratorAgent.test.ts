import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

import { generateText } from 'ai';
import { generatePuzzle } from './puzzleGeneratorAgent.js';

const mockedGenerateText = vi.mocked(generateText);

describe('puzzleGeneratorAgent', () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    mockedGenerateText.mockReset();
  });

  it('returns puzzleSurface + puzzleTruth from JSON text', async () => {
    mockedGenerateText.mockResolvedValueOnce({
      text: JSON.stringify({
        puzzleSurface: 'xxxxxxxxxx',
        puzzleTruth: 'yyyyyyyyyyyyyyyyyyyyyyyy',
      }),
    } as any);

    const result = await generatePuzzle({}, { model: 'test-model' });
    expect(result).toEqual({
      puzzleSurface: 'xxxxxxxxxx',
      puzzleTruth: 'yyyyyyyyyyyyyyyyyyyyyyyy',
    });
  });

  it('parses JSON inside code fences', async () => {
    mockedGenerateText.mockResolvedValueOnce({
      text: [
        '```json',
        JSON.stringify({
          puzzleSurface: 'aaaaaaaaaa',
          puzzleTruth: 'bbbbbbbbbbbbbbbbbbbbbbbb',
        }),
        '```',
      ].join('\n'),
    } as any);

    const result = await generatePuzzle({}, { model: 'test-model' });
    expect(result.puzzleSurface).toBe('aaaaaaaaaa');
    expect(result.puzzleTruth).toBe('bbbbbbbbbbbbbbbbbbbbbbbb');
  });

  it('retries with fallbackModel when primary response is invalid', async () => {
    mockedGenerateText
      .mockResolvedValueOnce({ text: 'not-json' } as any)
      .mockResolvedValueOnce({
        text: JSON.stringify({
          puzzleSurface: 'surface-surface',
          puzzleTruth: 'truth-truth-truth-truth',
        }),
      } as any);

    const result = await generatePuzzle(
      { prompt: 'constraints' },
      { model: 'primary-model', fallbackModel: 'fallback-model' }
    );

    expect(mockedGenerateText).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      puzzleSurface: 'surface-surface',
      puzzleTruth: 'truth-truth-truth-truth',
    });
  });
});
