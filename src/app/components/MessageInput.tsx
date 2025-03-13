'use client';

import React, { useState, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';

export interface MessageInputProps {
  roomId: string;
  userId: string;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ roomId, userId, disabled }) => {
  const [message, setMessage] = useState('');
  const { sendMessage, isConnected, messageQueue } = useSocket({ roomId, userId });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage(message);
      setMessage('');
    } catch (error) {
      // Error handling is managed by useSocket
    }
  }, [message, sendMessage]);

  const getPendingMessageCount = () => {
    return Object.values(messageQueue).filter(msg => msg.status === 'pending').length;
  };

  const getFailedMessageCount = () => {
    return Object.values(messageQueue).filter(msg => msg.status === 'failed').length;
  };

  const getInputPlaceholder = () => {
    if (!isConnected) {
      return 'Currently offline - Messages will be sent when reconnected';
    }
    const pending = getPendingMessageCount();
    const failed = getFailedMessageCount();
    
    if (pending > 0) {
      return `Sending ${pending} message${pending > 1 ? 's' : ''}...`;
    }
    if (failed > 0) {
      return `${failed} message${failed > 1 ? 's' : ''} failed to send`;
    }
    return 'Type a message...';
  };

  const getInputIcon = () => {
    if (!isConnected) return '📡';
    if (getPendingMessageCount() > 0) return '⏳';
    if (getFailedMessageCount() > 0) return '⚠️';
    return '💭';
  };

  return (
    <form onSubmit={handleSubmit} className="message-input-container">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={getInputPlaceholder()}
        className="message-input"
        disabled={disabled}
        style={{
          backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='rgba(255,255,255,0.5)'><text x='0' y='14'>${getInputIcon()}</text></svg>")`
        }}
      />
      <button 
        type="submit" 
        className="send-button"
        disabled={!message.trim() || disabled}
      />
      {(getPendingMessageCount() > 0 || getFailedMessageCount() > 0) && (
        <div className="message-queue-status">
          {getPendingMessageCount() > 0 && (
            <span className="pending-count">
              {getPendingMessageCount()} pending
            </span>
          )}
          {getFailedMessageCount() > 0 && (
            <span className="failed-count">
              {getFailedMessageCount()} failed
            </span>
          )}
        </div>
      )}
    </form>
  );
};

export default MessageInput;
