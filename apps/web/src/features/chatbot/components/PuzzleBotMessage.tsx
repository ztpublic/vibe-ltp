'use client';

import React from 'react';
import { decodeBotMessage } from '../utils/chatEncoding';
import { scrollToMessage } from '../utils/MessageRegistry';

type BotMessageProps = {
  message: string;
};

/**
 * Custom bot message component with reply label and scroll-to behavior
 */
export const PuzzleBotMessage: React.FC<BotMessageProps> = ({ message }) => {
  const { content, replyToId, replyToPreview } = decodeBotMessage(message);

  const handleReplyClick = () => {
    if (!replyToId) return;
    console.log('Clicking reply label, scrolling to:', replyToId);
    scrollToMessage(replyToId);
  };

  return (
    <div className="puzzle-bot-message-wrapper">
      {replyToId && replyToPreview && (
        <button
          type="button"
          className="puzzle-bot-reply-label"
          onClick={handleReplyClick}
          title="点击跳转到问题"
        >
          ↩ 回复: &quot;{replyToPreview}&quot;
        </button>
      )}
      <div className="react-chatbot-kit-chat-bot-message">
        {content}
      </div>
    </div>
  );
};
