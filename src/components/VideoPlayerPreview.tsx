import React, { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Download, ExternalLink, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { StockMediaItem } from "../types";

interface VideoPlayerPreviewProps {
  item: StockMediaItem;
  isSelected?: boolean;
  onSelect?: () => void;
  sceneNumber: number;
  videoFormat?: 'landscape' | 'portrait';
}

export const VideoPlayerPreview: React.FC<VideoPlayerPreviewProps> = ({
  item,
  isSelected,
  onSelect,
  sceneNumber,
  videoFormat = 'landscape',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current && item.type === 'video' && !isPlaying) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current && item.type === 'video' && isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;

    setIsDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(false);

    const isGif = item.source === 'giphy' && item.type !== 'video';
    const ext = isGif ? 'gif' : item.type === 'video' ? 'mp4' : 'jpg';
    const filename = `scene_${String(sceneNumber).padStart(2, '0')}_${item.source}.${ext}`;
    const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(item.downloadUrl)}&filename=${encodeURIComponent(filename)}`;

    try {
      const res = await fetch(proxyUrl);
      if (!res.ok) {
        let errMessage = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          errMessage = errData.error || errMessage;
        } catch {
          // ignore json parse error
        }
        throw new Error(errMessage);
      }

      const blob = await res.blob();
      if (blob.size < 10000) {
        throw new Error("Downloaded file is unusually small or incomplete. To prevent playback errors, direct CDN link is recommended.");
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        window.URL.revokeObjectURL(blobUrl);
      }, 5000);
    } catch (err: any) {
      console.warn("Proxy download failed, offering direct fallback:", err);
      setDownloadError(err.message || "Failed to download asset");
      
      // Graceful fallback to direct CDN download in new tab
      window.open(item.downloadUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      id={`media-card-${item.id}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect}
      className={`group relative rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer shadow-md ${
        isSelected
          ? "border-amber-500 ring-2 ring-amber-500/40 bg-stone-850"
          : "border-stone-750 bg-stone-850 hover:border-stone-600 hover:shadow-lg hover:shadow-black/40"
      }`}
    >
      {/* Media container */}
      <div className={`relative w-full bg-stone-950 overflow-hidden ${
        videoFormat === 'portrait' ? 'aspect-[9/16] max-h-[380px]' : 'aspect-video'
      }`}>
        {item.type === 'video' && !hasError ? (
          <video
            ref={videoRef}
            src={item.previewUrl}
            poster={item.thumbnailUrl}
            muted={isMuted}
            loop
            playsInline
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src && !target.src.includes("/api/proxy-video")) {
                target.src = `/api/proxy-video?url=${encodeURIComponent(target.src)}`;
                target.play().catch(() => {});
              } else {
                setHasError(true);
              }
            }}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={item.thumbnailUrl || item.previewUrl}
            alt={item.title || "Stock footage"}
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes("/api/proxy-image")) {
                target.src = `/api/proxy-image?url=${encodeURIComponent(item.thumbnailUrl || item.previewUrl)}`;
              }
            }}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}

        {/* Source Provider Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
              item.source === 'pexels'
                ? "bg-emerald-900/90 text-emerald-200 border border-emerald-700/50"
                : item.source === 'giphy'
                ? "bg-purple-900/90 text-purple-200 border border-purple-700/50"
                : item.source === 'nasa'
                ? "bg-blue-900/90 text-blue-200 border border-blue-700/50"
                : item.source === 'archive'
                ? "bg-amber-900/90 text-amber-200 border border-amber-700/50"
                : "bg-sky-900/90 text-sky-200 border border-sky-700/50"
            }`}
          >
            {item.source === 'giphy' ? 'GIPHY' : item.source === 'nasa' ? 'NASA' : item.source === 'archive' ? 'Archive' : item.source}
          </span>
          {videoFormat === 'portrait' && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-stone-950 shadow-xs">
              9:16 Shorts
            </span>
          )}
          {item.duration && (
            <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-black/70 text-stone-300 backdrop-blur-xs">
              {item.duration}s
            </span>
          )}
        </div>

        {/* Resolution / Quality Badge */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          {item.quality && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/70 text-stone-300 border border-stone-700/40">
              {item.source === 'giphy'
                ? item.type === 'video' ? 'MP4 / GIF' : 'GIF'
                : item.source === 'nasa'
                ? 'NASA 1080p'
                : item.source === 'archive'
                ? 'Archive HD'
                : item.width >= 3840 ? "4K UHD" : item.width >= 1920 ? "1080p FHD" : "HD"}
            </span>
          )}
          {/* Direct CDN Link */}
          <a
            href={item.downloadUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded bg-black/70 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700/40 transition-colors"
            title="Open direct original video in new tab (bypasses iframe restrictions)"
          >
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* Video Controls Overlay */}
        {item.type === 'video' && (
          <div
            className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-200 ${
              isHovered || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <button
              onClick={togglePlay}
              className="p-2.5 rounded-full bg-stone-900/80 text-white hover:bg-amber-500 hover:text-stone-950 transition-colors shadow-md"
              title={isPlaying ? "Pause preview" : "Play preview"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
            </button>
          </div>
        )}

        {/* Download notification overlay */}
        {downloadError && (
          <div className="absolute top-10 inset-x-2 z-20 p-1.5 rounded bg-rose-950/90 border border-rose-800 text-[10px] text-rose-200 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="truncate">Opened in new tab to bypass iframe block</span>
          </div>
        )}

        {/* Bottom hover bar */}
        <div
          className={`absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-between transition-opacity duration-200 ${
            isHovered || isSelected ? "opacity-100" : "opacity-0"
          }`}
        >
          {item.type === 'video' && (
            <button
              onClick={toggleMute}
              className="p-1 rounded text-stone-300 hover:text-white"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}

          <div className="flex items-center gap-1 ml-auto">
            <button
              id={`download-media-${item.id}`}
              onClick={handleDownload}
              disabled={isDownloading}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                downloadSuccess
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-800/90 hover:bg-amber-600 text-stone-200 hover:text-stone-950"
              }`}
              title="Download verified MP4 clip for Kdenlive"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Card Info Footer */}
      <div className="p-2.5 flex items-center justify-between text-xs text-stone-400">
        <div className="truncate pr-2">
          {item.authorUrl ? (
            <a
              href={item.authorUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:text-amber-400 truncate flex items-center gap-1 transition-colors"
            >
              <span className="truncate">{item.author}</span>
              <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
            </a>
          ) : (
            <span className="truncate">{item.author}</span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
            isSelected
              ? "bg-amber-500 text-stone-950 font-semibold"
              : "bg-stone-800 text-stone-300 hover:bg-stone-700"
          }`}
        >
          {isSelected ? "Selected" : "Select Clip"}
        </button>
      </div>
    </div>
  );
};
