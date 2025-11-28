/**
 * Encoding/decoding utilities for bot message metadata
 * Used to attach replyToId and replyToPreview to bot messages
 */

export type EncodedBotPayload = {
  content: string;
  replyToId?: string;
  replyToPreview?: string;
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
