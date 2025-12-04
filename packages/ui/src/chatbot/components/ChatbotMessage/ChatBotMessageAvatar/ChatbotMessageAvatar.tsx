import React from 'react';
import { CSSProperties } from 'react';

interface IChatbotMessageAvatarProps {
  className?: string;
  style?: CSSProperties;
  containerClassName?: string;
  containerStyle?: CSSProperties;
  label?: string;
  imageSrc?: string;
  imageAlt?: string;
  /** Adjust inner container size (width/height) */
  size?: number;
  /** Override background color on the container */
  backgroundColor?: string;
}

const ChatbotMessageAvatar = ({
  className,
  style,
  containerClassName,
  containerStyle,
  label = 'B',
  imageSrc,
  imageAlt = 'Bot avatar',
  size,
  backgroundColor,
}: IChatbotMessageAvatarProps) => {
  const computedContainerStyle: CSSProperties = {
    ...containerStyle,
  };

  if (size) {
    computedContainerStyle.width = size;
    computedContainerStyle.height = size;
  }

  if (backgroundColor && !computedContainerStyle.backgroundColor) {
    computedContainerStyle.backgroundColor = backgroundColor;
  }

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
        style={computedContainerStyle}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={imageAlt}
            className="react-chatbot-kit-chat-bot-avatar-image"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
            }}
          />
        ) : (
          <p className="react-chatbot-kit-chat-bot-avatar-letter">{label}</p>
        )}
      </div>
    </div>
  );
};

export default ChatbotMessageAvatar;
