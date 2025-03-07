"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { YouTubeStream } from '../types/youtube';

interface RadioContextType {
  currentStream: YouTubeStream | null;
  player: YT.Player | null;
  playerReady: boolean;
  isLoading: boolean;
  error: string | null;
  setPlayer: (player: YT.Player | null) => void;
  setPlayerReady: (ready: boolean) => void;
  setCurrentStream: (stream: YouTubeStream | null) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const [currentStream, setCurrentStream] = useState<YouTubeStream | null>(null);
  const [player, setPlayer] = useState<YT.Player | null>(null);
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

export function useRadio() {
  const context = useContext(RadioContext);
  if (context === undefined) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
}
