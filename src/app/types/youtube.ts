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

export interface YouTubePlayerVars {
  autoplay?: 0 | 1;
  controls?: 0 | 1;
  disablekb?: 0 | 1;
  fs?: 0 | 1;
  modestbranding?: 0 | 1;
  playsinline?: 0 | 1;
  rel?: 0 | 1;
  mute?: 0 | 1;
  origin?: string;
  enablejsapi?: 0 | 1;
  widget_referrer?: string;
  iv_load_policy?: 1 | 3;
}

export interface YouTubePlayer {
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

export interface YouTubePlayerEvent {
  target: YouTubePlayer;
  data: number;
}

export interface YouTubePlayerOptions {
  videoId: string;
  playerVars?: YouTubePlayerVars;
  events?: {
    onReady?: (event: YouTubePlayerEvent) => void;
    onStateChange?: (event: YouTubePlayerEvent) => void;
    onError?: (event: YouTubePlayerEvent) => void;
  };
}

export enum YouTubePlayerState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5
}

declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: YouTubePlayerOptions) => YouTubePlayer;
      PlayerState: typeof YouTubePlayerState;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
