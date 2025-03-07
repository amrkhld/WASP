import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting: boolean;
  connectionHealth: {
    status: 'healthy' | 'degraded' | 'error';
    lastPing?: number;
    lastError?: string;
  };
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isReconnecting,
  connectionHealth
}) => {
  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500';
    if (isReconnecting) return 'bg-yellow-500';
    switch (connectionHealth.status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (isReconnecting) return 'Reconnecting...';
    return `Connected (${connectionHealth.status})`;
  };

  const getLastPingText = () => {
    if (!connectionHealth.lastPing) return '';
    const seconds = Math.floor((Date.now() - connectionHealth.lastPing) / 1000);
    return `Last ping: ${seconds}s ago`;
  };

  return (
    <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-opacity-10 backdrop-blur-sm">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-sm text-gray-200">
        {getStatusText()}
      </span>
      {connectionHealth.lastPing && (
        <span className="text-xs text-gray-400">
          {getLastPingText()}
        </span>
      )}
      {connectionHealth.lastError && (
        <span className="text-xs text-red-400">
          Error: {connectionHealth.lastError}
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus;
