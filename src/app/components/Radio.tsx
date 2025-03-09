"use client";

import { useEffect, useCallback } from "react";
import { useRadio } from "../contexts/RadioContext";
import { useAudio } from "../contexts/AudioContext";
import { RadioMode } from "../types/radio";

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

const CHANNEL_IDS = [
  "UClB4Qjqka4uZrSaysagUa5Q",
  "UCtwa2s4DB_D8fXniEv0rExw", 
  "UCHwyUZ5O4by-pcE-6j01miA",
  "UC7cUbKTcWtuEaLua-o6HSzw",
];

interface RadioProps {
  mode: RadioMode;
  roomName?: string;
}

export default function Radio({ mode, roomName }: RadioProps) {
  const {
    currentStream,
    player,
    playerReady,
    isLoading,
    error,
    setPlayer,
    setPlayerReady,
    setCurrentStream,
    setError,
    setIsLoading
  } = useRadio();
  const { isMuted, setIsMuted } = useAudio();

  const fetchRandomStream = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/youtube/random');
      if (!response.ok) throw new Error('Failed to fetch stream');
      const data = await response.json();
      setCurrentStream(data);
    } catch (error) {
      console.error('Error fetching stream:', error);
      setError('Failed to fetch stream');
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentStream, setError, setIsLoading]);

  useEffect(() => {
    if (!currentStream) {
      fetchRandomStream();
    }
  }, [currentStream, fetchRandomStream]);

  const initializePlayer = useCallback(async () => {
    if (!currentStream) return;
    
    try {
      await loadYouTubeAPI();
      
      if (!window.YT) {
        throw new Error('YouTube API not available');
      }

      const containerId = `youtube-player-${currentStream.id.videoId}`;
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error('Player container not found');
      }

      // Clean up existing player if any
      if (player) {
        player.destroy();
        setPlayer(null);
        setPlayerReady(false);
      }

      // Create player with explicit origin
      const newPlayer = new window.YT.Player(containerId, {
        videoId: currentStream.id.videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          mute: isMuted ? 1 : 0,
          origin: window.location.origin,
          enablejsapi: 1,
          widget_referrer: window.location.origin
        },
        events: {
          onReady: (event) => {
            const player = event.target;
            // Set volume and mute state after player is ready
            if (isMuted) {
              player.mute();
            } else {
              player.unMute();
              player.setVolume(100);
            }
            setPlayer(player);
            setPlayerReady(true);
            setIsLoading(false);
          },
          onStateChange: (event) => {
            // Handle state changes only when player is ready
            if (playerReady && event.data === YT.PlayerState.ENDED) {
              fetchRandomStream();
            }
          },
          onError: (event) => {
            console.error('YouTube player error:', event);
            // Only fetch new stream if player is ready
            if (playerReady) {
              fetchRandomStream();
            }
          }
        }
      });
    } catch (err) {
      console.error('Player initialization error:', err);
      setError('Failed to initialize YouTube player');
      throw err;
    }
  }, [isMuted, setPlayer, setPlayerReady, setIsLoading]);

  useEffect(() => {
    if (currentStream?.id.videoId) {
      initializePlayer();
    }
  }, [currentStream?.id.videoId, initializePlayer]);

  const loadYouTubeAPI = () => {
    return new Promise<void>((resolve) => {
      if (window.YT) {
        resolve();
        return;
      }

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // Set onYouTubeIframeAPIReady before adding script
      window.onYouTubeIframeAPIReady = () => {
        window.onYouTubeIframeAPIReady = undefined; // Clean up
        resolve();
      };
    });
  };

  const fetchVideos = async (channelId: string) => {
    try {

      const now = new Date();
      const randomMonths = Math.floor(Math.random() * 60);
      const randomDate = new Date(now.setMonth(now.getMonth() - randomMonths));
      const publishedAfter = randomDate.toISOString();

  
      const orders = ['date', 'rating', 'viewCount'];
      const randomOrder = orders[Math.floor(Math.random() * orders.length)];

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&key=${API_KEY}&maxResults=50&order=${randomOrder}&publishedAfter=${publishedAfter}`
      );
      
      const data = await res.json();
      
 
      const shuffledItems = data.items ? [...data.items].sort(() => Math.random() - 0.5) : [];
      
      return shuffledItems;
    } catch (error) {
      console.error(`Error fetching channel ${channelId}:`, error);
      return [];
    }
  };

  const toggleMute = () => {
    if (!player || !playerReady) {
      console.log('Player not ready yet');
      return;
    }

    try {
      const newMuteState = !isMuted;
      // Only attempt to change mute state if player is ready
      if (playerReady) {
        if (newMuteState) {
          player.mute();
        } else {
          player.unMute();
          player.setVolume(100);
        }
      }
      setIsMuted(newMuteState);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };


  const isMinimal = mode === ("minimal" as RadioMode);

  if (error) {
    return (
      <div className={`radio-container ${mode}`}>
        <div className="station-loading error">
          {error} - Retrying...
          <button onClick={() => {
            setError(null);
            fetchRandomStream();
          }}>
            Retry Now
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !currentStream) {
    return (
      <div className={`radio-container ${mode}`}>
        <div className="station-loading">Tuning in to the frequencies...</div>
      </div>
    );
  }

  if (isMinimal) {
    return (
      <div className="radio-container minimal">
        <div className="radio-minimal-content">
          <div className="minimal-stream-info">
            <span className="minimal-channel">
              {currentStream.snippet.channelTitle}
            </span>
            <span className="minimal-title">{currentStream.snippet.title}</span>
          </div>
          <div className="audio-control">
            <label className="custom-checkbox">
              <span
                key={isMuted ? "muted" : "unmuted"}
                className="checkbox-label"
              >
                {isMuted ? "AUDIO DISENGAGED" : "AUDIO STREAM ENGAGED"}
              </span>
              <span onClick={toggleMute} className="checkbox-symbol">
                {isMuted ? "⬡" : "⬣"}
              </span>
            </label>
          </div>
        </div>
        <div
          id={`youtube-player-${currentStream?.id.videoId}`}
          className={isMinimal ? "minimal-player" : "fullscreen-player"}
        />
      </div>
    );
  }

  return (
    <div className={`radio-container ${mode}`}>
      <div className="stream-player">
        <div className="video-overlay"></div>
        <div
          id={`youtube-player-${currentStream?.id.videoId}`}
          className={isMinimal ? "minimal-player" : "fullscreen-player"}
        />
      </div>

      <div className={`stream-info ${mode}`}>
        {mode === "fullscreen" && (
          <div className="stream-channel-container">
            <span className="now-streaming">NOW STREAMING</span>
            <span className="stream-channel">
              {currentStream.snippet.channelTitle}
            </span>
          </div>
        )}
        <div className="audio-control">
          <label className="custom-checkbox">
            <span onClick={toggleMute} className="checkbox-symbol">
              {isMuted ? "⬡" : "⬣"}
            </span>
            {mode === "fullscreen" && (
              <span
                key={isMuted ? "muted" : "unmuted"}
                className="checkbox-label"
              >
                {isMuted ? "AUDIO DISENGAGED" : "AUDIO STREAM ENGAGED"}
              </span>
            )}
          </label>
        </div>
      </div>
    </div>
  );
}
