import React from 'react';

interface LoadingStateProps {
  type?: 'fullscreen' | 'inline' | 'overlay';
  message?: string;
  showSpinner?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  type = 'inline', 
  message = 'Loading...', 
  showSpinner = true 
}) => {
  const getLoadingContent = () => (
    <div className={`loading-content ${type}`}>
      {showSpinner && <div className="spinner" />}
      <p className="loading-message">{message}</p>
    </div>
  );

  if (type === 'overlay') {
    return (
      <div className="loading-overlay">
        {getLoadingContent()}
      </div>
    );
  }

  if (type === 'fullscreen') {
    return (
      <div className="loading-fullscreen">
        {getLoadingContent()}
      </div>
    );
  }

  return getLoadingContent();
};

export default LoadingState;