export type VideoFormat = 'landscape' | 'portrait';

export interface Scene {
  scene_number: number;
  script_line: string;
  search_keywords: string;
  media_type: 'video' | 'image';
  selectedMedia?: StockMediaItem;
}

export interface AudioSuggestions {
  music_keywords: string[];
  sfx_keywords: string[];
}

export interface AudioTrackItem {
  id: string;
  type: 'music' | 'sfx';
  title: string;
  duration?: number;
  download_url: string;
  preview_url?: string;
  tags?: string;
  genre?: string;
  artist?: string;
  license?: string;
}

export interface ProjectPlan {
  project_name: string;
  video_format?: VideoFormat;
  scenes: Scene[];
  audio_suggestions?: AudioSuggestions;
}

export interface StockMediaItem {
  id: string;
  source: 'pexels' | 'pixabay' | 'giphy' | 'archive' | 'nasa';
  type: 'video' | 'image';
  title?: string;
  previewUrl: string;
  thumbnailUrl: string;
  downloadUrl: string;
  width: number;
  height: number;
  duration?: number;
  author: string;
  authorUrl?: string;
  quality?: string;
}

export interface RateLimitInfo {
  limit: number | null;
  remaining: number | null;
  reset: number | null;
  lastUpdated: string | null;
  status: 'healthy' | 'warning' | 'throttled' | 'unknown';
}

export interface SystemRateLimits {
  pexels: RateLimitInfo;
  pixabay: RateLimitInfo;
  giphy?: RateLimitInfo;
  nasa?: RateLimitInfo;
  archive?: RateLimitInfo;
}

export interface AutoVideoScene {
  scene_number: number;
  narration: string;
  search_keywords: string;
  secondary_keywords?: string;
  duration: number; // in seconds
  subtitle: string;
  transition?: 'fade' | 'cut' | 'zoom' | 'splitscreen' | 'slide';
  layout?: 'standard' | 'splitscreen';
  videoAsset?: StockMediaItem;
  secondaryVideoAsset?: StockMediaItem;
  is_outro?: boolean;
}

export interface AutoVideoPlan {
  title: string;
  prompt: string;
  full_script: string;
  aspect_ratio: '16:9' | '9:16';
  music_keyword: string;
  music_track?: AudioTrackItem;
  scenes: AutoVideoScene[];
  total_duration: number;
  voiceover_enabled: boolean;
  subtitles_style: 'highlight' | 'classic' | 'minimal' | 'none';
  _fallback?: boolean;
}

export interface SearchResultScene {
  scene_number: number;
  loading: boolean;
  error?: string;
  results: StockMediaItem[];
  activeSource: 'all' | 'pexels' | 'pixabay' | 'giphy' | 'archive' | 'nasa';
}
