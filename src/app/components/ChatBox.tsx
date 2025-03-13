import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Message } from '../types/message';
import type { MessageQueue } from '../types/message';
import Radio from './Radio';
import ConnectionStatus from './ConnectionStatus';
import { ErrorBoundary } from './ErrorBoundary';
import { logger } from '../utils/logger';

interface ChatBoxProps {
  messages: Message[];
  roomName?: string;
  isLoading?: boolean;
  isConnected?: boolean;
  isReconnecting?: boolean;
  messageQueue: MessageQueue;
  onOpenRooms?: () => void;
  isSidePanelOpen?: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({ 
  messages, 
  roomName, 
  isLoading = false,
  isConnected = false,
  isReconnecting = false,
  messageQueue,
  onOpenRooms,
  isSidePanelOpen = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const [isExiting, setIsExiting] = useState(false);
  const [prevRoomName, setPrevRoomName] = useState(roomName);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); 

  useEffect(() => {
    if (prevRoomName !== roomName) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setIsExiting(false);
        setPrevRoomName(roomName);
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [roomName, prevRoomName]);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date instanceof Date && !isNaN(date.getTime())
      ? date.toLocaleTimeString()
      : 'Invalid time';
  };

  const getMessageKey = (message: Message): string => {
    return `${message.messageId}-${message.timestamp}`;
  };

  if (!roomName) {
    return (
      <div className={`chat-box-empty ${isExiting ? 'exiting' : ''}`}>
        <ErrorBoundary>
          <button 
            className={`room-select-toggle ${isSidePanelOpen ? 'open' : ''}`}
            onClick={onOpenRooms}
            aria-label={`${isSidePanelOpen ? 'Close' : 'Open'} room selection`}
          >
            {isSidePanelOpen ? '×' : '≡'}<p>FIND NESTS</p>
          </button>
        </ErrorBoundary>
        <ErrorBoundary>
          <Radio mode="fullscreen" />
        </ErrorBoundary>
      </div>
    );
  }

  const renderConnectionStatus = () => {
    if (isReconnecting) {
      return (
        <div className="reconnecting-overlay">
          <div className="reconnecting-content">
            <div className="spinner"></div>
            <p>RECONNECTING TO HIVE...</p>
            <button 
              onClick={() => window.location.reload()}
              className="retry-button"
            >
              Retry Now
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderMessages = () => {
    if (isLoading) {
      return <div className="loading-message">INITIALIZING NECTAR STREAMS...</div>;
    }

    if (messages.length === 0) {
      return <p className="no-messages">VACANT NESTING ZONE</p>;
    }

    return messages.map((message) => {
      const queuedMessage = messageQueue[message.messageId];
      const messageStatus = queuedMessage?.status;
      
      return (
        <div 
          key={getMessageKey(message)}
          className={`message ${message.userId === session?.user?.id ? 'message-own' : ''}`}
        >
          <span className="message-user">{message.userName || 'User'}&nbsp;&nbsp;| </span>
          <span className="message-content">{message.content}</span>
          <span className="message-meta">
            <span className="message-timestamp">{formatMessageTime(message.timestamp)}</span>
            {messageStatus && (
              <span className={`message-status ${messageStatus}`}>
                {messageStatus === 'pending' ? '⌛' : messageStatus === 'delivered' ? '✓' : '⚠️'}
              </span>
            )}
          </span>
        </div>
      );
    });
  };

  return (
    <div className={`chat-box ${isExiting ? 'exiting' : ''}`}>
      <ErrorBoundary>
        <div className="chat-box-header">
          <div className="header-content">
            <h2 className="room-name">
              <button 
                className={`room-select-toggle ${isSidePanelOpen ? 'open' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenRooms?.();
                }}
                aria-label={`${isSidePanelOpen ? 'Close' : 'Open'} room selection`}
              >
                {isSidePanelOpen ? '×' : '≡'}
              </button>
              {roomName}
            </h2>
            <ConnectionStatus isConnected={isConnected} />
          </div>
          <ErrorBoundary>
            <Radio mode="minimal" roomName={roomName} />
          </ErrorBoundary>
        </div>
      </ErrorBoundary>

      <ErrorBoundary>
        <div className="messages-wrapper">
          <div className="messages-container">
            {renderConnectionStatus()}
            {renderMessages()}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default ChatBox;