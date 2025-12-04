import React, { useEffect, useMemo, useState } from 'react';

import { IChatState, IMessage } from '../../interfaces/IMessages';
import {
  ThumbDirection,
  removeMessageFeedback,
  updateMessageFeedback,
} from '../../utils/feedbackRegistry';

import './ThumbControls.css';

interface ThumbControlsProps {
  message: IMessage;
  align: 'left' | 'right';
  showThumbsUp?: boolean;
  showThumbsDown?: boolean;
  setState?: React.Dispatch<React.SetStateAction<IChatState>>;
  onFeedback?: (feedback: any) => void;
}

const ThumbControls = ({
  message,
  align,
  showThumbsUp = true,
  showThumbsDown = true,
  setState,
  onFeedback,
}: ThumbControlsProps) => {
  const initialThumb: ThumbDirection = useMemo(() => {
    if (message.thumbsUp) return 'up';
    if (message.thumbsDown) return 'down';
    return null;
  }, [message.id, message.thumbsUp, message.thumbsDown]);

  const [thumb, setThumb] = useState<ThumbDirection>(initialThumb);

  useEffect(() => {
    setThumb(initialThumb);
    updateMessageFeedback(message, initialThumb);
    return () => removeMessageFeedback(message.id);
  }, [initialThumb, message]);

  const persistThumbState = (next: ThumbDirection) => {
    if (setState) {
      setState((prev) => {
        const prevMessages = prev?.messages ?? [];
        const updatedMessages = prevMessages.map((msg) =>
          msg.id === message.id
            ? {
                ...msg,
                thumbsUp: next === 'up',
                thumbsDown: next === 'down',
              }
            : msg
        );
        return { ...prev, messages: updatedMessages };
      });
    }

    const updatedMessage: IMessage = {
      ...message,
      thumbsUp: next === 'up',
      thumbsDown: next === 'down',
    };

    updateMessageFeedback(updatedMessage, next);
    onFeedback?.({
      messageId: message.id,
      direction: next,
      message: updatedMessage,
    });
  };

  const handleThumbClick = (direction: Exclude<ThumbDirection, null>) => {
    const next = thumb === direction ? null : direction;
    setThumb(next);
    persistThumbState(next);
  };

  if (!showThumbsUp && !showThumbsDown) return null;

  const alignClass =
    align === 'left' ? 'message-feedback-left' : 'message-feedback-right';

  return (
    <div className={`message-feedback ${alignClass}`}>
      {showThumbsUp && (
        <button
          type="button"
          className="feedback-button"
          aria-label="Thumbs up"
          data-active={thumb === 'up'}
          onClick={() => handleThumbClick('up')}
        >
          👍
        </button>
      )}
      {showThumbsDown && (
        <button
          type="button"
          className="feedback-button"
          aria-label="Thumbs down"
          data-active={thumb === 'down'}
          onClick={() => handleThumbClick('down')}
        >
          👎
        </button>
      )}
    </div>
  );
};

export default ThumbControls;
