export interface BaseMessage {
  content: string;
  roomId: string;
  userId: string;
  userName: string;
  timestamp: string;
  messageId: string;
}

export interface Message extends BaseMessage {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageInput {
  content: string;
  roomId: string;
}

export type MessageStatus = 'pending' | 'sent' | 'failed';

export interface MessageError {
  messageId?: string;
  error: string;
  timestamp: string;
}

export interface OutgoingMessage extends BaseMessage {
  id?: string;
  status?: MessageStatus;
  error?: string;
}
