/**
 * Encoding/decoding utilities for bot message metadata
 * Used to attach replyToId and replyToPreview to bot messages
 */

export type EncodedBotPayload = {
  content: string;
  replyToId?: string;
  replyToPreview?: string;
  replyToNickname?: string;
};

const PREFIX = '__JSON_META__:';

/**
 * Encodes bot message content with metadata
 * Format: __JSON_META__:{metadata}__\n{content}
 */
export function encodeBotMessage(payload: EncodedBotPayload): string {
  const meta = JSON.stringify({
    replyToId: payload.replyToId,
    replyToPreview: payload.replyToPreview,
    replyToNickname: payload.replyToNickname,
  });
  return `${PREFIX}${meta}__\n${payload.content}`;
}

/**
 * Decodes bot message to extract content and metadata
 * If no prefix found, treats entire string as plain content
 */
export function decodeBotMessage(raw: string): EncodedBotPayload {
  if (!raw.startsWith(PREFIX)) {
    return { content: raw };
  }
  const parts = raw.split(PREFIX);
  const rest = parts[1];
  if (!rest) {
    return { content: raw };
  }
  const [metaJson, content] = rest.split('__\n');
  const meta = JSON.parse(metaJson || '{}');
  return {
    content: content ?? '',
    replyToId: meta.replyToId,
    replyToPreview: meta.replyToPreview,
    replyToNickname: meta.replyToNickname,
  };
}

/**
 * Truncates text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number = 40): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

/**
 * Generates a simple message ID based on content and timestamp
 */
export function generateMessageId(content: string): string {
  const timestamp = Date.now();
  const hash = content.slice(0, 10).replace(/\s/g, '_');
  return `msg_${timestamp}_${hash}`;
}

/**
 * Encoding/decoding utilities for user message nicknames
 */
const USER_PREFIX = '__NICK__';

/**
 * Encodes nickname into user message text
 * Format: __NICK__{nickname}::{text}
 */
export function encodeUserText(nickname: string, text: string): string {
  const safeNick = nickname.replace(/\n/g, ' ');
  return `${USER_PREFIX}${safeNick}::${text}`;
}

/**
 * Decodes user message to extract nickname and text
 * Returns { nickname, text }
 */
export function decodeUserText(encoded: string): { nickname?: string; text: string } {
  if (!encoded.startsWith(USER_PREFIX)) return { nickname: undefined, text: encoded };
  const without = encoded.slice(USER_PREFIX.length);
  const idx = without.indexOf('::');
  if (idx === -1) return { nickname: undefined, text: encoded };

  const nickname = without.slice(0, idx);
  const text = without.slice(idx + 2);

  return { nickname, text };
}
