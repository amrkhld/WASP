export interface YouTubeStreamId {
  kind: string;
  videoId: string;
}

export interface YouTubeStreamSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default: YouTubeThumbnail;
    medium: YouTubeThumbnail;
    high: YouTubeThumbnail;
  };
  channelTitle: string;
  liveBroadcastContent: string;
  publishTime: string;
}

export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeStream {
  kind: string;
  etag: string;
  id: YouTubeStreamId;
  snippet: YouTubeStreamSnippet;
}

export interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  items: YouTubeStream[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

declare global {
  namespace YT {
    interface Player {
      playVideo(): void;
      pauseVideo(): void;
      mute(): void;
      unMute(): void;
      isMuted(): boolean;
      setVolume(volume: number): void;
      getVolume(): number;
      getPlayerState(): number;
      destroy(): void;
    }

    interface PlayerEvent {
      target: Player;
      data: number;
    }

    interface PlayerOptions {
      videoId: string;
      playerVars?: {
        autoplay?: 0 | 1;
        controls?: 0 | 1;
        disablekb?: 0 | 1;
        fs?: 0 | 1;
        modestbranding?: 0 | 1;
        playsinline?: 0 | 1;
        rel?: 0 | 1;
        mute?: 0 | 1;
        [key: string]: any;
      };
      events?: {
        onReady?: (event: PlayerEvent) => void;
        onStateChange?: (event: PlayerEvent) => void;
        onError?: (event: PlayerEvent) => void;
        [key: string]: ((event: PlayerEvent) => void) | undefined;
      };
    }

    const Player: {
      new (elementId: string, options: PlayerOptions): Player;
    };

    enum PlayerState {
      UNSTARTED = -1,
      ENDED = 0,
      PLAYING = 1,
      PAUSED = 2,
      BUFFERING = 3,
      CUED = 5
    }
  }

  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }
}
