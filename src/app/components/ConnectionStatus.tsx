import React from 'react';
import { useSocket } from '../hooks/useSocket';

interface ConnectionStatusProps {
  roomId: string;
  userId: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ roomId, userId }) => {
  const { isConnected, isReconnecting, messageQueue } = useSocket({ roomId, userId });

  const getConnectionStatus = () => {
    if (isReconnecting) return 'reconnecting';
    if (!isConnected) return 'offline';
    if (Object.values(messageQueue).some(msg => msg.status === 'failed')) return 'error';
    return 'connected';
  };

  const getStatusMessage = () => {
    const status = getConnectionStatus();
    const pendingCount = Object.values(messageQueue).filter(msg => msg.status === 'pending').length;
    const failedCount = Object.values(messageQueue).filter(msg => msg.status === 'failed').length;

    switch (status) {
      case 'reconnecting':
        return 'Attempting to reconnect...';
      case 'offline':
        return 'You are currently offline';
      case 'error':
        return `${failedCount} message${failedCount > 1 ? 's' : ''} failed to send`;
      case 'connected':
        if (pendingCount > 0) {
          return `Sending ${pendingCount} message${pendingCount > 1 ? 's' : ''}...`;
        }
        return 'Connected';
    }
  };

  const getStatusIcon = () => {
    switch (getConnectionStatus()) {
      case 'reconnecting': return '🔄';
      case 'offline': return '📡';
      case 'error': return '⚠️';
      case 'connected': return '✓';
    }
  };

  if (isConnected && !isReconnecting && !Object.values(messageQueue).length) {
    return null;
  }

  return (
    <div className="connection-status-wrapper">
      <div className={`connection-status-badge ${getConnectionStatus()}`}>
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusMessage()}</span>
      </div>
      {getConnectionStatus() === 'error' && (
        <button
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;
