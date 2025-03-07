import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Message } from '../types/message';
import Radio from './Radio';
import ConnectionStatus from './ConnectionStatus';

interface ChatBoxProps {
  messages: Message[];
  roomName?: string;
  isLoading?: boolean;
  isConnected?: boolean;
  isReconnecting?: boolean;
  onOpenRooms?: () => void;
  isSidePanelOpen?: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({ 
  messages, 
  roomName, 
  isLoading = false,
  isConnected = false,
  isReconnecting = false,
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
        <button 
          className={`room-select-toggle ${isSidePanelOpen ? 'open' : ''}`}
          onClick={onOpenRooms}
          aria-label={`${isSidePanelOpen ? 'Close' : 'Open'} room selection`}
        >
          {isSidePanelOpen ? '×' : '≡'}<p>FIND NESTS</p>
        </button>
        <Radio mode="fullscreen" />
      </div>
    );
  }

  return (
    <div className={`chat-box ${isExiting ? 'exiting' : ''}`}>
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
        <Radio mode="minimal" roomName={roomName} />
      </div>
      <div className="messages-wrapper">
        <div className="messages-container">
          {isReconnecting ? (
            <div className="reconnecting-message">RECONNECTING TO HIVE...</div>
          ) : isLoading ? (
            <div className="loading-message">INITIALIZING NECTAR STREAMS...</div>
          ) : messages.length === 0 ? (
            <p className="no-messages">VACANT NESTING ZONE</p>
          ) : (
            <>
              {messages.map((message) => (
                <div 
                  key={getMessageKey(message)}
                  className={`message ${message.userId === session?.user?.id ? 'message-own' : ''}`}
                >
                  <span className="message-user">{message.userName || 'User'}&nbsp;&nbsp;| </span>
                  <span className="message-content">{message.content}</span>
                  <span className="message-timestamp">{formatMessageTime(message.timestamp)}</span>
                </div>
              ))}
              <div ref={messagesEndRef} /> 
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBox;