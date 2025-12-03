import {
  ReactElement,
  CSSProperties,
  Dispatch,
  SetStateAction,
} from 'react';

import { IMessage } from './IMessages';
import IWidget from './IWidget';

interface IConfig {
  botName?: string;
  initialMessages: IMessage[];
  state?: any;
  customComponents?: ICustomComponents;
  customStyles?: ICustomStyles;
  customMessages?: ICustomMessage;
  widgets?: IWidget[];
}

export interface IStyleOverride {
  /** Inline style overrides for this slot */
  style?: CSSProperties;
  /**
   * Convenience backgroundColor field for backwards compatibility with older configs
   * (merges into style if provided).
   */
  backgroundColor?: string;
  /** Optional custom className to append to the default slot class */
  className?: string;
}

export interface ICustomComponents {
  header?: (props: IHeaderComponentProps) => ReactElement;
  botAvatar?: (props: IAvatarComponentProps) => ReactElement;
  botChatMessage?: (props: IBotChatMessageProps) => ReactElement;
  userAvatar?: (props: IAvatarComponentProps) => ReactElement;
  userChatMessage?: (props: IUserChatMessageProps) => ReactElement;
}

export interface ICustomMessage {
  [index: string]: (props: any) => ReactElement;
}

export interface ICustomStyles {
  /** Outer chat shell */
  container?: IStyleOverride;
  innerContainer?: IStyleOverride;
  header?: IStyleOverride;
  messageContainer?: IStyleOverride;
  /** Input row */
  inputForm?: IStyleOverride;
  input?: IStyleOverride;
  sendButton?: IStyleOverride;
  sendIcon?: IStyleOverride;
  /** Bot bubble + arrow */
  botMessageBox?: IStyleOverride;
  botMessageArrow?: IStyleOverride;
  botAvatar?: IStyleOverride;
  /** User bubble + arrow */
  userMessageBox?: IStyleOverride;
  userMessageArrow?: IStyleOverride;
  userAvatar?: IStyleOverride;
  /** Reply label + loader wrapper */
  replyLabel?: IStyleOverride;
  loader?: IStyleOverride;
  /**
   * Legacy support (deprecated): use sendButton instead.
   */
  chatButton?: IStyleOverride;
}

export interface IHeaderComponentProps {
  actionProvider: any;
  botName?: string;
  state: any;
  setState: Dispatch<SetStateAction<any>>;
  messageParser: any;
  currentUserNickname?: string;
}

export interface IAvatarComponentProps {
  message?: IMessage;
  index?: number;
}

export interface IBotChatMessageProps {
  message: IMessage;
  defaultLoader: ReactElement;
  onReplyScroll?: (replyToId?: string) => void;
  onFeedback?: (feedback: unknown) => void;
}

export interface IUserChatMessageProps {
  message: IMessage;
  currentUserNickname?: string;
  onFeedback?: (feedback: unknown) => void;
}

export default IConfig;
