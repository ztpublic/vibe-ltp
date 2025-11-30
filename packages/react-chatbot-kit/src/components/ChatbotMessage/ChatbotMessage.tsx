import React, { useEffect, useState } from 'react';
import ConditionallyRender from 'react-conditionally-render';

import ChatbotMessageAvatar from './ChatBotMessageAvatar/ChatbotMessageAvatar';
import Loader from '../Loader/Loader';

import './ChatbotMessage.css';
import { callIfExists } from '../Chat/chatUtils';
import { ICustomComponents, ICustomStyles } from '../../interfaces/IConfig';
import { scrollToMessage } from '../../utils/messageRegistry';

interface IChatbotMessageProps {
  /** Plain text message content (no encoding) */
  message: string;
  
  /** Bot reply metadata */
  replyToId?: string;
  replyToPreview?: string;
  replyToNickname?: string;
  
  withAvatar?: boolean;
  loading?: boolean;
  messages: any[];
  delay?: number;
  id: number;
  setState?: React.Dispatch<React.SetStateAction<any>>;
  customComponents?: ICustomComponents;
  customStyles: { backgroundColor: string };
}

const ChatbotMessage = ({
  message,
  replyToId,
  replyToPreview,
  replyToNickname,
  withAvatar = true,
  loading,
  messages,
  customComponents,
  setState,
  customStyles,
  delay,
  id,
}: IChatbotMessageProps) => {
  const [show, toggleShow] = useState(false);

  const handleReplyClick = () => {
    if (!replyToId) return;
    console.log('Clicking reply label, scrolling to:', replyToId);
    scrollToMessage(replyToId);
  };

  useEffect(() => {
    // Only auto-disable loading if the message has actual content
    // Empty content messages (loading placeholders) should keep loading state until replaced
    if (!message || message.trim().length === 0 || !setState) {
      return; // Don't set any timeout for empty messages
    }

    let defaultDisableTime = 750;
    if (delay) defaultDisableTime += delay;

    const timeoutId = setTimeout(() => {
      const newMessages = [...messages].map(msg => {
        if (msg.id === id) {
          return {...msg, loading: false, delay: undefined};
        }
        return msg;
      });

      setState((state: any) => ({...state, messages: newMessages}));
    }, defaultDisableTime);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [message, delay, id]);

  useEffect(() => {
    if (delay) {
      setTimeout(() => toggleShow(true), delay);
    } else {
      toggleShow(true);
    }
  }, [delay]);

  const chatBoxCustomStyles = { backgroundColor: '' };
  const arrowCustomStyles = { borderRightColor: '' };

  if (customStyles) {
    chatBoxCustomStyles.backgroundColor = customStyles.backgroundColor;
    arrowCustomStyles.borderRightColor = customStyles.backgroundColor;
  }

  return (
    <ConditionallyRender
      condition={show}
      show={
        <div className="react-chatbot-kit-chat-bot-message-container">
          {/* Reply label if metadata exists */}
          {replyToId && replyToPreview && (
            <button
              type="button"
              className="chatbot-reply-label"
              onClick={handleReplyClick}
              title="点击跳转到问题"
            >
              ↩ 回复 {replyToNickname || 'visitor'}: &quot;{replyToPreview}&quot;
            </button>
          )}
          
          <div className="chatbot-message-wrapper">
            <ConditionallyRender
              condition={withAvatar}
              show={
                <ConditionallyRender
                  condition={!!customComponents?.botAvatar}
                  show={callIfExists(customComponents?.botAvatar)}
                  elseShow={<ChatbotMessageAvatar />}
                />
              }
            />

            <ConditionallyRender
              condition={!!customComponents?.botChatMessage}
              show={callIfExists(customComponents?.botChatMessage, {
                message,
                loader: <Loader />,
              })}
              elseShow={
                <div
                  className="react-chatbot-kit-chat-bot-message"
                  style={chatBoxCustomStyles}
                >
                  <ConditionallyRender
                    condition={loading}
                    show={<Loader />}
                    elseShow={<span>{message}</span>}
                  />
                  <ConditionallyRender
                    condition={withAvatar}
                    show={
                      <div
                        className="react-chatbot-kit-chat-bot-message-arrow"
                        style={arrowCustomStyles}
                      ></div>
                    }
                  />
                </div>
              }
            />
          </div>
        </div>
      }
    />
  );
};

export default ChatbotMessage;
