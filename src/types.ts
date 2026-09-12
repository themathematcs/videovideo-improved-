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

export type ContentPillar = 'tech-ai' | 'unusual-science' | 'african-history';

export interface ShortsTopicIdea {
  id: string;
  pillar: ContentPillar;
  title: string;
  hook: string;
  hookFormat: string;
  payoff: string;
  researchNote: string;
}

export interface ShortsPlanMetadata {
  pillar: ContentPillar;
  hook_format: string;
  opening_hook: string;
  payoff: string;
  retention_strategy: string;
  research_note: string;
}

export interface AutoVideoScene {
  scene_number: number;
  narration: string;
  search_keywords: string;
  secondary_keywords?: string;
  tertiary_keywords?: string;
  quaternary_keywords?: string;
  duration: number; // in seconds
  subtitle: string;
  transition?: 'fade' | 'cut' | 'zoom' | 'splitscreen' | 'slide';
  layout?: 'standard' | 'splitscreen';
  splitLayout?: 'single' | '2-split' | '3-split' | '4-split';
  videoAsset?: StockMediaItem;
  secondaryVideoAsset?: StockMediaItem;
  splitAssets?: StockMediaItem[];
  retention_beat?: string;
  visual_brief?: string;
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
  shorts_metadata?: ShortsPlanMetadata;
  _fallback?: boolean;
}

export interface SearchResultScene {
  scene_number: number;
  loading: boolean;
  error?: string;
  results: StockMediaItem[];
  activeSource: 'all' | 'pexels' | 'pixabay' | 'giphy' | 'archive' | 'nasa';
}

export type VideoFormat = 'landscape' | 'portrait';
