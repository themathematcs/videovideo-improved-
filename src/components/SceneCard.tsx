import React, { useState } from "react";
import { Search, Film, Image as ImageIcon, Check, Edit2, RotateCw, Sparkles, Download } from "lucide-react";
import { Scene, StockMediaItem } from "../types";
import { VideoPlayerPreview } from "./VideoPlayerPreview";

interface SceneCardProps {
  scene: Scene;
  onUpdateScene: (updated: Scene) => void;
  onSearchAssets: (sceneNumber: number, query: string, mediaType: 'video' | 'image', source: 'all' | 'pexels' | 'pixabay') => void;
  searchResults?: StockMediaItem[];
  isLoadingResults?: boolean;
  searchError?: string;
  videoFormat?: 'landscape' | 'portrait';
}

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  onUpdateScene,
  onSearchAssets,
  searchResults = [],
  isLoadingResults = false,
  searchError,
  videoFormat = 'landscape',
}) => {
  const [isEditingKeywords, setIsEditingKeywords] = useState(false);
  const [keywordInput, setKeywordInput] = useState(scene.search_keywords);
  const [selectedSource, setSelectedSource] = useState<'all' | 'pexels' | 'pixabay'>('all');

  const handleSaveKeywords = () => {
    setIsEditingKeywords(false);
    if (keywordInput.trim() !== scene.search_keywords) {
      const updated = { ...scene, search_keywords: keywordInput.trim() };
      onUpdateScene(updated);
      onSearchAssets(scene.scene_number, keywordInput.trim(), scene.media_type, selectedSource);
    }
  };

  const handleMediaTypeChange = (type: 'video' | 'image') => {
    if (scene.media_type !== type) {
      const updated = { ...scene, media_type: type };
      onUpdateScene(updated);
      onSearchAssets(scene.scene_number, scene.search_keywords, type, selectedSource);
    }
  };

  const handleSourceChange = (source: 'all' | 'pexels' | 'pixabay') => {
    setSelectedSource(source);
    onSearchAssets(scene.scene_number, scene.search_keywords, scene.media_type, source);
  };

  const handleSelectMedia = (item: StockMediaItem) => {
    onUpdateScene({ ...scene, selectedMedia: item });
  };

  const handleDownloadSelected = () => {
    if (!scene.selectedMedia) return;
    const ext = scene.selectedMedia.type === 'video' ? 'mp4' : 'jpg';
    const filename = `scene_${String(scene.scene_number).padStart(2, '0')}_${scene.selectedMedia.source}.${ext}`;
    const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(scene.selectedMedia.downloadUrl)}&filename=${encodeURIComponent(filename)}`;
    
    const a = document.createElement('a');
    a.href = proxyUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      id={`scene-card-${scene.scene_number}`}
      className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-sm hover:border-stone-700 transition-colors flex flex-col gap-4"
    >
      {/* Top row: Scene number, type toggle, and actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 font-mono font-bold text-sm border border-amber-500/20">
            {String(scene.scene_number).padStart(2, '0')}
          </span>
          <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
            Scene {scene.scene_number}
          </span>
        </div>

        {/* Media type switch: Video / Image */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-0.5 rounded-lg bg-stone-950 border border-stone-800 text-xs font-medium">
            <button
              onClick={() => handleMediaTypeChange('video')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                scene.media_type === 'video'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
            <button
              onClick={() => handleMediaTypeChange('image')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                scene.media_type === 'image'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photo</span>
            </button>
          </div>

          {scene.selectedMedia && (
            <button
              onClick={handleDownloadSelected}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              title="Download selected clip"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Clip Ready</span>
            </button>
          )}
        </div>
      </div>

      {/* Script Line */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Script Line (Voiceover / Dialogue)
        </div>
        <div className="p-3 rounded-lg bg-stone-950/60 border border-stone-800/60 text-stone-100 text-sm font-medium leading-relaxed">
          "{scene.script_line}"
        </div>
      </div>

      {/* Search Keywords Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex-1 min-w-[240px]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1 flex items-center justify-between">
            <span>Stock Search Keywords</span>
            {!isEditingKeywords && (
              <button
                onClick={() => setIsEditingKeywords(true)}
                className="text-amber-400/80 hover:text-amber-300 text-[11px] flex items-center gap-1 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Keywords</span>
              </button>
            )}
          </div>

          {isEditingKeywords ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveKeywords();
                  if (e.key === 'Escape') setIsEditingKeywords(false);
                }}
                className="flex-1 px-3 py-1.5 rounded-lg bg-stone-950 border border-amber-500/50 text-stone-100 text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                placeholder="e.g. software engineer coding fast"
                autoFocus
              />
              <button
                onClick={handleSaveKeywords}
                className="p-1.5 rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors"
                title="Apply keywords"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {scene.search_keywords.split(/\s+/).map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-stone-800/90 border border-stone-700/50 text-amber-200/90 text-xs font-mono font-medium"
                >
                  #{kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Source Provider Filter and Re-search */}
        <div className="flex items-center gap-1.5 self-end">
          <div className="inline-flex p-0.5 rounded-md bg-stone-950 border border-stone-800 text-[11px]">
            {(['all', 'pexels', 'pixabay'] as const).map((src) => (
              <button
                key={src}
                onClick={() => handleSourceChange(src)}
                className={`px-2 py-0.5 rounded capitalize transition-colors ${
                  selectedSource === src
                    ? 'bg-stone-800 text-amber-300 font-semibold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {src}
              </button>
            ))}
          </div>

          <button
            onClick={() => onSearchAssets(scene.scene_number, scene.search_keywords, scene.media_type, selectedSource)}
            disabled={isLoadingResults}
            className="px-2.5 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1 transition-colors border border-stone-700/60"
            title="Search stock providers now"
          >
            <RotateCw className={`w-3 h-3 ${isLoadingResults ? 'animate-spin text-amber-400' : ''}`} />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Media Results Grid */}
      <div className="mt-1">
        {isLoadingResults ? (
          <div className="p-8 rounded-lg bg-stone-950/40 border border-stone-800/50 flex flex-col items-center justify-center gap-2 text-stone-400 text-xs">
            <RotateCw className="w-5 h-5 animate-spin text-amber-400" />
            <span>Searching stock media matching "{scene.search_keywords}"...</span>
          </div>
        ) : searchError ? (
          <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-800/40 text-rose-300 text-xs flex items-center justify-between">
            <span>{searchError}</span>
            <button
              onClick={() => onSearchAssets(scene.scene_number, scene.search_keywords, scene.media_type, selectedSource)}
              className="underline hover:text-rose-200"
            >
              Retry
            </button>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="p-6 rounded-lg bg-stone-950/30 border border-stone-800/40 flex flex-col items-center justify-center gap-2 text-stone-500 text-xs">
            <Sparkles className="w-4 h-4 text-stone-600" />
            <span>Click "Search" above to preview available footage from Pexels & Pixabay</span>
          </div>
        ) : (
          <div className={
            videoFormat === 'portrait'
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          }>
            {searchResults.map((item) => (
              <VideoPlayerPreview
                key={item.id}
                item={item}
                sceneNumber={scene.scene_number}
                isSelected={scene.selectedMedia?.id === item.id}
                onSelect={() => handleSelectMedia(item)}
                videoFormat={videoFormat}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
