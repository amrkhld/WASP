'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ChatBox from './components/ChatBox';
import ChatRooms from './components/ChatRooms';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoadingState from './components/LoadingState';
import { useSocket } from './hooks/useSocket';
import { retryOperation } from './utils/retryOperation';
import { api } from './utils/apiClient';
import { logger } from './utils/logger';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { isConnected, messages, sendMessage, messageQueue } = useSocket({
    roomId: selectedRoom || '',
    userId: session?.user?.id || ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      setIsLoading(false);
    }
  }, [status, router]);

  const handleRoomSelect = async (roomId: string) => {
    try {
      await retryOperation(async () => {
        // Attempt to join room with retry logic
        await api.post(`/api/rooms/join/${roomId}`, {
          userId: session?.user?.id
        });
        
        setSelectedRoom(roomId);
        setIsSidePanelOpen(false);
      }, {
        maxAttempts: 3,
        baseDelay: 1000
      });
    } catch (error) {
      logger.error('Failed to join room', {
        roomId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setError(error instanceof Error ? error : new Error('Failed to join room'));
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (error) {
      logger.error('Failed to send message', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Show error state in message queue
    }
  };

  if (status === 'loading' || isLoading) {
    return <LoadingState type="fullscreen" message="INITIALIZING HIVE..." />;
  }

  if (error) {
    return (
      <div className="error-state">
        <h2>Connection Error</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`page-container ${isSidePanelOpen ? 'panel-open' : ''}`}>
        <div className="main-content">
          <ChatBox
            messages={messages}
            roomName={selectedRoom || undefined}
            isLoading={isLoading}
            isConnected={isConnected}
            messageQueue={messageQueue}
            onOpenRooms={() => setIsSidePanelOpen(!isSidePanelOpen)}
            isSidePanelOpen={isSidePanelOpen}
            onSendMessage={handleSendMessage}
          />
        </div>
        <ErrorBoundary>
          <ChatRooms
            isOpen={isSidePanelOpen}
            onClose={() => setIsSidePanelOpen(false)}
            selectedRoom={selectedRoom || undefined}
            onRoomSelect={handleRoomSelect}
          />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}