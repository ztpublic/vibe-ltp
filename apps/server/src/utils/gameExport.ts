import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import type { PuzzleContent, SessionQuestionHistoryEntry } from '@vibe-ltp/shared';

const EXPORT_ENABLED = process.env.GAME_EXPORT_ENABLED !== 'false' && process.env.NODE_ENV !== 'test';
const DEFAULT_EXPORT_DIR = path.resolve(process.cwd(), '../../game-exports');

const EXPORT_DIR = process.env.GAME_EXPORT_DIR
  ? path.resolve(process.env.GAME_EXPORT_DIR)
  : DEFAULT_EXPORT_DIR;

export type ExportReason = 'reset' | 'idle-timeout' | 'empty-room-timeout';

interface ExportPayload {
  sessionId: string;
  title?: string;
  hostNickname?: string;
  createdAt?: string;
  updatedAt?: string;
  exportedAt: string;
  reason: ExportReason;
  puzzle: {
    surface: string;
    truth: string;
  };
  messages: Array<{
    question: string;
    answer: SessionQuestionHistoryEntry['answer'];
    thumbsDown: boolean;
    timestamp: string;
  }>;
}

interface ExportInput {
  sessionId: string;
  title?: string;
  hostNickname?: string;
  createdAt?: string;
  updatedAt?: string;
  puzzleContent?: PuzzleContent;
  questions: readonly SessionQuestionHistoryEntry[];
  reason: ExportReason;
}

function ensureExportDir(): string {
  mkdirSync(EXPORT_DIR, { recursive: true });
  return EXPORT_DIR;
}

function formatFilename(sessionId: string, exportedAt: string, reason: ExportReason): string {
  const safeTimestamp = exportedAt.replace(/[:.]/g, '-');
  return `game-${safeTimestamp}-session-${sessionId}-${reason}.json`;
}

export function exportGameSession(input: ExportInput): string | undefined {
  if (!EXPORT_ENABLED) return undefined;

  const { puzzleContent, questions, sessionId, title, hostNickname, createdAt, updatedAt, reason } = input;
  if (!puzzleContent?.soupSurface || !puzzleContent?.soupTruth) return undefined;

  const exportedAt = new Date().toISOString();
  const payload: ExportPayload = {
    sessionId,
    title,
    hostNickname,
    createdAt,
    updatedAt,
    exportedAt,
    reason,
    puzzle: {
      surface: puzzleContent.soupSurface,
      truth: puzzleContent.soupTruth,
    },
    messages: questions.map((entry) => ({
      question: entry.question,
      answer: entry.answer,
      thumbsDown: Boolean(entry.thumbsDown),
      timestamp: entry.timestamp,
    })),
  };

  try {
    const dir = ensureExportDir();
    const filename = formatFilename(sessionId, exportedAt, reason);
    const filePath = path.join(dir, filename);
    writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    console.log(`[GameExport] Saved session ${sessionId} (${reason}) -> ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('[GameExport] Failed to export session', sessionId, error);
    return undefined;
  }
}
