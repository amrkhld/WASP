import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  messageCount?: number;
  lastMessageId?: string | null;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  messageCount = 0,
  lastMessageId 
}) => {
  return (
    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
      <span className="status-indicator"></span>
      <span className="status-text">
        {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
        {messageCount > 0 && ` (${messageCount} msgs)`}
      </span>
    </div>
  );
};

export default ConnectionStatus;
