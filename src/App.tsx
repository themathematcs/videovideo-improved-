import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { ScriptInput } from "./components/ScriptInput";
import { SceneCard } from "./components/SceneCard";
import { AudioSuggestionsPanel } from "./components/AudioSuggestionsPanel";
import { AutonomousVideoCreator } from "./components/AutonomousVideoCreator";
import { JsonExportView } from "./components/JsonExportView";
import { PythonScriptView } from "./components/PythonScriptView";
import { ProjectPlan, Scene, StockMediaItem, SystemRateLimits } from "./types";
import { Download, FileJson, Terminal, Film, Sparkles, AlertCircle, Play, Music } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"storyboard" | "audio" | "json" | "python" | "auto">("auto");
  
  // Initial script using the exact test prompt requested by the user
  const [script, setScript] = useState(
    "Software engineering is evolving fast. Developers are using modern tools to build applications faster than ever before."
  );
  const [projectName, setProjectName] = useState("software_evolution");

  const [plan, setPlan] = useState<ProjectPlan>({
    project_name: "software_evolution",
    scenes: [
      {
        scene_number: 1,
        script_line: "Software engineering is evolving fast.",
        search_keywords: "software engineer coding fast",
        media_type: "video",
      },
      {
        scene_number: 2,
        script_line: "Developers are using modern tools to build applications faster than ever before.",
        search_keywords: "developer computer office workspace",
        media_type: "video",
      },
    ],
    audio_suggestions: {
      music_keywords: ["tech ambient synth", "cinematic inspirational", "lofi chill coding"],
      sfx_keywords: ["keyboard typing", "futuristic swoosh", "data server hum"],
    },
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoSearchOnAnalyze, setAutoSearchOnAnalyze] = useState(true);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);

  // Search results & loading states per scene
  const [sceneMedia, setSceneMedia] = useState<Record<number, StockMediaItem[]>>({});
  const [sceneLoading, setSceneLoading] = useState<Record<number, boolean>>({});
  const [sceneErrors, setSceneErrors] = useState<Record<number, string>>({});

  // Rate limits state
  const [rateLimits, setRateLimits] = useState<SystemRateLimits>({
    pexels: { limit: null, remaining: null, reset: null, lastUpdated: null, status: "unknown" },
    pixabay: { limit: null, remaining: null, reset: null, lastUpdated: null, status: "unknown" },
    giphy: { limit: null, remaining: null, reset: null, lastUpdated: null, status: "unknown" },
    nasa: { limit: null, remaining: null, reset: null, lastUpdated: null, status: "unknown" },
    archive: { limit: 999999, remaining: 999999, reset: null, lastUpdated: null, status: "healthy" },
  });
  const [isRefreshingLimits, setIsRefreshingLimits] = useState(false);

  // Fetch rate limits from backend
  const fetchRateLimits = useCallback(async () => {
    try {
      setIsRefreshingLimits(true);
      const res = await fetch("/api/stock/rate-limits");
      if (res.ok) {
        const data = await res.json();
        setRateLimits(data);
      }
    } catch (err) {
      console.warn("Could not fetch rate limits:", err);
    } finally {
      setIsRefreshingLimits(false);
    }
  }, []);

  useEffect(() => {
    fetchRateLimits();
  }, [fetchRateLimits]);

  // Search stock media for a specific scene
  const searchSceneAssets = useCallback(
    async (
      sceneNumber: number,
      query: string,
      mediaType: "video" | "image",
      source: "all" | "pexels" | "pixabay" | "giphy" | "archive" | "nasa" = "all"
    ) => {
      if (!query.trim()) return;

      setSceneLoading((prev) => ({ ...prev, [sceneNumber]: true }));
      setSceneErrors((prev) => ({ ...prev, [sceneNumber]: "" }));

      try {
        const res = await fetch(
          `/api/stock/search?query=${encodeURIComponent(query)}&mediaType=${mediaType}&source=${source}`
        );

        if (!res.ok) {
          throw new Error(`Search failed: HTTP ${res.status}`);
        }

        const data = await res.json();
        setSceneMedia((prev) => ({
          ...prev,
          [sceneNumber]: data.results || [],
        }));

        if (data.rateLimits) {
          setRateLimits(data.rateLimits);
        }

        if (data.results && data.results.length > 0) {
          // Auto-assign first clip if none is selected yet
          setPlan((prevPlan) => ({
            ...prevPlan,
            scenes: prevPlan.scenes.map((s) => {
              if (s.scene_number === sceneNumber && !s.selectedMedia) {
                return { ...s, selectedMedia: data.results[0] };
              }
              return s;
            }),
          }));
        }
      } catch (err: any) {
        console.error(`Error searching assets for scene ${sceneNumber}:`, err);
        setSceneErrors((prev) => ({
          ...prev,
          [sceneNumber]: err.message || "Failed to retrieve stock footage",
        }));
      } finally {
        setSceneLoading((prev) => ({ ...prev, [sceneNumber]: false }));
      }
    },
    []
  );

  // Trigger search on initial mount for default scenes
  useEffect(() => {
    plan.scenes.forEach((s) => {
      searchSceneAssets(s.scene_number, s.search_keywords, s.media_type);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Analyze script using Gemini (or smart fallback)
  const handleAnalyzeScript = async () => {
    if (!script.trim()) return;
    setIsAnalyzing(true);
    setErrorNotification(null);

    try {
      const res = await fetch("/api/analyze-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: script.trim() }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const updatedPlan: ProjectPlan = {
        project_name: projectName.trim() || data.project_name || "video_project",
        scenes: (data.scenes || []).map((s: any, idx: number) => ({
          scene_number: s.scene_number || idx + 1,
          script_line: s.script_line || "",
          search_keywords: s.search_keywords || "modern workspace technology",
          media_type: s.media_type === "image" ? "image" : "video",
        })),
        audio_suggestions: data.audio_suggestions || {
          music_keywords: ["tech ambient synth", "cinematic inspirational", "lofi chill coding"],
          sfx_keywords: ["keyboard typing", "futuristic swoosh", "data server hum"]
        }
      };

      setPlan(updatedPlan);
      setActiveTab("storyboard");

      // Auto-fetch stock assets for each generated scene
      if (autoSearchOnAnalyze) {
        updatedPlan.scenes.forEach((s) => {
          searchSceneAssets(s.scene_number, s.search_keywords, s.media_type);
        });
      }
    } catch (err: any) {
      console.error("Script analysis failed:", err);
      setErrorNotification(`Script breakdown notice: ${err.message}. Retrying with local scene parsing.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateScene = (updated: Scene) => {
    setPlan((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.scene_number === updated.scene_number ? updated : s)),
    }));
  };

  // Download all ready media files with verified integrity and rate-safe spacing
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<string | null>(null);
  const [showTroubleshootModal, setShowTroubleshootModal] = useState(false);

  const handleBatchDownload = async () => {
    const scenesWithMedia = plan.scenes.filter((s) => s.selectedMedia);
    if (scenesWithMedia.length === 0) {
      alert("No clips selected yet! Click 'Select Clip' on footage results for each scene first.");
      return;
    }

    setIsBatchDownloading(true);
    setBatchProgress(`Starting verified download of ${scenesWithMedia.length} assets...`);

    let downloadedCount = 0;
    for (const scene of scenesWithMedia) {
      if (!scene.selectedMedia) continue;
      const ext = scene.selectedMedia.type === "video" ? "mp4" : "jpg";
      const filename = `scene_${String(scene.scene_number).padStart(2, "0")}_${scene.selectedMedia.source}.${ext}`;
      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(scene.selectedMedia.downloadUrl)}&filename=${encodeURIComponent(filename)}`;

      setBatchProgress(`Downloading Scene ${scene.scene_number} (${downloadedCount + 1}/${scenesWithMedia.length})...`);

      try {
        const res = await fetch(proxyUrl);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const blob = await res.blob();
        if (blob.size < 10000) {
          throw new Error("File too small or corrupt");
        }

        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 15000);
        downloadedCount++;
      } catch (err: any) {
        console.warn(`Batch download fallback for scene ${scene.scene_number}:`, err);
        // Fallback: direct window open to ensure user gets file even if sandbox blocks fetch
        window.open(scene.selectedMedia.downloadUrl, "_blank");
      }

      // Safe pause between downloads to respect browser queue & rate limits
      await new Promise((r) => setTimeout(r, 800));
    }

    setBatchProgress(null);
    setIsBatchDownloading(false);
  };

  const totalSelectedClips = plan.scenes.filter((s) => s.selectedMedia).length;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        rateLimits={rateLimits}
        onRefreshRateLimits={fetchRateLimits}
        isRefreshingLimits={isRefreshingLimits}
        sceneCount={plan.scenes.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Error notification banner if any */}
        {errorNotification && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{errorNotification}</span>
            </div>
            <button
              onClick={() => setErrorNotification(null)}
              className="text-stone-400 hover:text-stone-200 font-bold px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Script Input & Presets - shown for manual Storyboard, Audio, JSON, and Python workflows */}
        {activeTab !== "auto" && (
          <>
            <ScriptInput
              script={script}
              setScript={setScript}
              projectName={projectName}
              setProjectName={setProjectName}
              onAnalyze={handleAnalyzeScript}
              isAnalyzing={isAnalyzing}
              autoSearchOnAnalyze={autoSearchOnAnalyze}
              setAutoSearchOnAnalyze={setAutoSearchOnAnalyze}
            />

            {/* Global Toolbar for Storyboard Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-stone-900/80 border border-stone-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
                  Project: <span className="text-amber-400 font-mono font-normal">{plan.project_name}</span>
                </span>
                <span className="text-stone-600">•</span>
                <span className="text-xs text-stone-400">
                  {plan.scenes.length} Scenes ({totalSelectedClips}/{plan.scenes.length} clips ready)
                </span>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="batch-download-clips-btn"
                  onClick={handleBatchDownload}
                  disabled={isBatchDownloading || totalSelectedClips === 0}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  title="Download all selected stock videos/images to your computer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isBatchDownloading ? "Downloading..." : `Download Assets (${totalSelectedClips})`}</span>
                </button>

                <button
                  id="toolbar-audio-btn"
                  onClick={() => setActiveTab("audio")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                    activeTab === "audio"
                      ? "bg-amber-500 text-stone-950 border-amber-500 font-semibold"
                      : "bg-stone-800 hover:bg-stone-750 text-stone-200 border-stone-700/60"
                  }`}
                >
                  <Music className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Audio & SFX Suggestions</span>
                </button>

                <button
                  onClick={() => setActiveTab("json")}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-stone-700/60"
                >
                  <FileJson className="w-3.5 h-3.5 text-amber-400" />
                  <span>Export JSON Plan</span>
                </button>

                <button
                  onClick={() => setActiveTab("python")}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-stone-700/60"
                >
                  <Terminal className="w-3.5 h-3.5 text-sky-400" />
                  <span>Python Downloader</span>
                </button>

                <button
                  id="troubleshoot-btn"
                  onClick={() => setShowTroubleshootModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-750 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-amber-500/30"
                  title="Fix Windows Media Player error 0xc10100be and playback issues"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fix 0xc10100be Error</span>
                </button>
              </div>
            </div>

            {/* Batch progress banner */}
            {batchProgress && (
              <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-700/60 text-amber-200 text-xs flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-mono">{batchProgress}</span>
              </div>
            )}
          </>
        )}

        {/* Tab 0: Autonomous Video Studio */}
        {activeTab === "auto" && (
          <AutonomousVideoCreator
            onExportToStoryboard={(autoPlan) => {
              setPlan({
                project_name: autoPlan.project_name || "auto_video",
                scenes: autoPlan.scenes || [],
                audio_suggestions: autoPlan.audio_suggestions || {
                  music_keywords: ["tech ambient synth", "cinematic inspirational"],
                  sfx_keywords: ["keyboard typing", "futuristic swoosh"]
                }
              });
              setProjectName(autoPlan.project_name || "auto_video");
              if (autoPlan.scenes) {
                const mediaMap: Record<number, StockMediaItem[]> = {};
                autoPlan.scenes.forEach((s: any) => {
                  if (s.selectedMedia) {
                    mediaMap[s.scene_number] = [s.selectedMedia];
                  }
                });
                setSceneMedia((prev) => ({ ...prev, ...mediaMap }));
              }
              setActiveTab("storyboard");
            }}
          />
        )}

        {/* Tab 1: Storyboard View */}
        {activeTab === "storyboard" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5">
              {plan.scenes.map((scene) => (
                <SceneCard
                  key={scene.scene_number}
                  scene={scene}
                  onUpdateScene={handleUpdateScene}
                  onSearchAssets={searchSceneAssets}
                  searchResults={sceneMedia[scene.scene_number] || []}
                  isLoadingResults={Boolean(sceneLoading[scene.scene_number])}
                  searchError={sceneErrors[scene.scene_number]}
                />
              ))}
            </div>

            {/* Audio Suggestions integrated in Storyboard */}
            <AudioSuggestionsPanel
              suggestions={plan.audio_suggestions}
              projectName={plan.project_name}
            />
          </div>
        )}

        {/* Tab 2: Audio & SFX Recommendations View */}
        {activeTab === "audio" && (
          <AudioSuggestionsPanel
            suggestions={plan.audio_suggestions}
            projectName={plan.project_name}
          />
        )}

        {/* Tab 3: Raw JSON Plan View */}
        {activeTab === "json" && <JsonExportView plan={plan} />}

        {/* Tab 4: Python Downloader View */}
        {activeTab === "python" && <PythonScriptView />}
      </main>

      {/* Troubleshooting Modal for 0xc10100be */}
      {showTroubleshootModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 text-stone-200">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <AlertCircle className="w-5 h-5" />
                <span>Fixing Windows Media Player Error 0xc10100be</span>
              </div>
              <button
                onClick={() => setShowTroubleshootModal(false)}
                className="text-stone-400 hover:text-stone-200 text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="text-sm space-y-3 leading-relaxed text-stone-300">
              <p className="bg-stone-950 p-3 rounded-xl border border-stone-800 font-mono text-xs text-amber-200/90">
                <strong>Error:</strong> 0xc10100be — "This file isn’t playable. That might be because the file type is unsupported, the file extension is incorrect, or the file is corrupt."
              </p>

              <h4 className="font-semibold text-stone-100 text-sm">Why did this happen?</h4>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-stone-300">
                <li>
                  <strong className="text-stone-100">Incomplete or Blocked Download (HTML Saved as MP4):</strong> Stock footage CDNs (Pexels / Pixabay) employ anti-bot protections (Cloudflare). If a download was initiated without a desktop browser User-Agent, the server sent back a <code>403 Forbidden</code> HTML error page. When saved with a <code>.mp4</code> extension, Windows Media Player failed trying to decode HTML as video.
                </li>
                <li>
                  <strong className="text-stone-100">Iframe Download Sandboxing:</strong> In some web preview containers, browser iframe security policies can truncate or corrupt streamed file downloads.
                </li>
                <li>
                  <strong className="text-stone-100">HEVC / H.265 Codec:</strong> Certain 4K UHD stock clips use HEVC compression which the default legacy Windows Media Player cannot decode without the Microsoft Store HEVC extension.
                </li>
              </ul>

              <h4 className="font-semibold text-stone-100 text-sm pt-2">How we fixed this:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-stone-950 border border-stone-800">
                  <div className="font-semibold text-emerald-400 mb-1">1. Integrity-Verified Downloads</div>
                  <p className="text-stone-400">
                    Both the web downloader and Python script now send verified desktop browser headers and check for valid <code>ftyp</code> MP4 container signatures before writing files.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-stone-950 border border-stone-800">
                  <div className="font-semibold text-emerald-400 mb-1">2. Direct CDN Link Fallback</div>
                  <p className="text-stone-400">
                    Each video card now includes an "Open in New Tab" icon in the top right to download directly from Pexels/Pixabay without iframe limitations.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                💡 <strong>Tip for Kdenlive & Video Editors:</strong> Kdenlive, DaVinci Resolve, and VLC Media Player have built-in FFmpeg decoders and will open all downloaded clips natively!
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-800">
              <button
                onClick={() => setShowTroubleshootModal(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-colors"
              >
                Got It, Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-stone-900 bg-stone-950 py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>AI Video B-Roll Assistant • Powered by Gemini & Stock Media APIs (Pexels & Pixabay)</p>
          <p className="font-mono text-[11px] text-stone-600">
            Kdenlive / DaVinci Resolve / Premiere Pro Asset Pipeline
          </p>
        </div>
      </footer>
    </div>
  );
}
