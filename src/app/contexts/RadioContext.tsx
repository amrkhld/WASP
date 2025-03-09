'use client';

import React, { createContext, useContext, useState } from 'react';
import type { YouTubeStream, YouTubePlayer } from '../types/youtube';

interface RadioContextType {
  currentStream: YouTubeStream | null;
  player: YouTubePlayer | null;
  playerReady: boolean;
  isLoading: boolean;
  error: string | null;
  setPlayer: (player: YouTubePlayer | null) => void;
  setPlayerReady: (ready: boolean) => void;
  setCurrentStream: (stream: YouTubeStream | null) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export const RadioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStream, setCurrentStream] = useState<YouTubeStream | null>(null);
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <RadioContext.Provider value={{
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
    }}>
      {children}
    </RadioContext.Provider>
  );
}

export const useRadio = () => {
  const context = useContext(RadioContext);
  if (context === undefined) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
}
