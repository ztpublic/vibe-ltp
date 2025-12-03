import React from 'react';
import { CSSProperties } from 'react';

interface IChatbotMessageAvatarProps {
  className?: string;
  style?: CSSProperties;
  containerClassName?: string;
  containerStyle?: CSSProperties;
  label?: string;
}

const ChatbotMessageAvatar = ({
  className,
  style,
  containerClassName,
  containerStyle,
  label = 'B',
}: IChatbotMessageAvatarProps) => {
  return (
    <div
      className={['react-chatbot-kit-chat-bot-avatar', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <div
        className={[
          'react-chatbot-kit-chat-bot-avatar-container',
          containerClassName,
        ]
          .filter(Boolean)
          .join(' ')}
        style={containerStyle}
      >
        <p className="react-chatbot-kit-chat-bot-avatar-letter">{label}</p>
      </div>
    </div>
  );
};

export default ChatbotMessageAvatar;
