"use client";

import { createContext, useContext, useState, useRef, useCallback } from 'react';
import { logger } from '../utils/logger';
import type { YouTubePlayer, YouTubeStream } from '../types/youtube';

interface RadioContextType {
  currentStream: YouTubeStream | null;
  player: YouTubePlayer | null;
  playerReady: boolean;
  isLoading: boolean;
  error: string | null;
  setPlayer: (player: YouTubePlayer | null) => void;
  setPlayerReady: (ready: boolean) => void;
  setCurrentStream: (video: YouTubeStream) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  retryPlayback: () => void;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000;

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const [currentStream, setCurrentStream] = useState<YouTubeStream | null>(null);
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const retryAttempts = useRef(0);
  const retryTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleError = useCallback((error: Error, context: string) => {
    logger.error(`Radio ${context} error`, { 
      error: error.message,
      videoId: currentStream?.id.videoId,
      attempts: retryAttempts.current
    });
    setError(error.message);
  }, [currentStream?.id.videoId]);

  const retryPlayback = useCallback(async () => {
    if (retryAttempts.current >= MAX_RETRY_ATTEMPTS) {
      handleError(new Error('Max retry attempts reached'), 'retry');
      retryAttempts.current = 0;
      return;
    }

    try {
      retryAttempts.current++;
      setIsLoading(true);
      setError(null);

      // Attempt to reload the current video
      if (player && currentStream) {
        await player.loadVideoById(currentStream.id.videoId);
        logger.info('Playback retry attempt', { 
          attempt: retryAttempts.current,
          videoId: currentStream.id.videoId 
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      handleError(error, 'retry');
      
      // Schedule another retry with exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, retryAttempts.current - 1);
      retryTimeout.current = setTimeout(retryPlayback, delay);
    } finally {
      setIsLoading(false);
    }
  }, [player, currentStream, handleError]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
    }
    if (player) {
      try {
        player.destroy();
      } catch (err) {
        logger.error('Player cleanup error', {
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
  }, [player]);

  return (
    <RadioContext.Provider
      value={{
        currentStream,
        player,
        playerReady,
        isLoading,
        error,
        setPlayer,
        setPlayerReady,
        setCurrentStream,
        setError,
        setIsLoading,
        retryPlayback
      }}
    >
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const context = useContext(RadioContext);
  if (context === undefined) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
}
