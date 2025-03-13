"use client";

import { createContext, useContext, useState, useCallback } from 'react';
import { logger } from '../utils/logger';

interface AudioContextType {
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  error: string | null;
  clearError: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(100);
  const [error, setError] = useState<string | null>(null);

  const handleVolumeChange = useCallback((newVolume: number) => {
    try {
      if (newVolume < 0 || newVolume > 100) {
        throw new Error('Volume must be between 0 and 100');
      }
      setVolume(newVolume);
      logger.debug('Volume changed', { newVolume });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change volume';
      setError(errorMessage);
      logger.error('Volume change error', { error: errorMessage });
    }
  }, []);

  const handleMuteToggle = useCallback((muted: boolean) => {
    try {
      setIsMuted(muted);
      logger.debug('Mute state changed', { muted });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle mute';
      setError(errorMessage);
      logger.error('Mute toggle error', { error: errorMessage });
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AudioContext.Provider 
      value={{
        isMuted,
        setIsMuted: handleMuteToggle,
        volume,
        setVolume: handleVolumeChange,
        error,
        clearError
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
