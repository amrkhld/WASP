'use client';

import React, { useState } from 'react';

export interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="message-input-container">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={disabled ? "SELECT A NEST TO START" : "NECTAR..."}
        disabled={disabled}
        className="message-input"
      />
      <button 
        type="submit" 
        disabled={disabled || !message.trim()}
        className="send-button"
      />
    </form>
  );
};

export default MessageInput;
