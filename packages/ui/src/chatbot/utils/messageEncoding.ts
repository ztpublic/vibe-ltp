/**
 * Utility functions for message processing
 * Encoding/decoding functions have been removed - messages now use structured types
 */

/**
 * Truncates text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number = 40): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}
