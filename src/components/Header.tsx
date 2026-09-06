import React from "react";
import { Film, Video, Download, Terminal, Code2, Music, Sparkles } from "lucide-react";
import { SystemRateLimits } from "../types";
import { RateLimitPill } from "./RateLimitPill";

interface HeaderProps {
  activeTab: "storyboard" | "audio" | "json" | "python" | "auto";
  setActiveTab: (tab: "storyboard" | "audio" | "json" | "python" | "auto") => void;
  rateLimits: SystemRateLimits;
  onRefreshRateLimits: () => void;
  isRefreshingLimits: boolean;
  sceneCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  rateLimits,
  onRefreshRateLimits,
  isRefreshingLimits,
  sceneCount,
}) => {
  return (
    <header className="border-b border-stone-800 bg-stone-900/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-md shadow-amber-500/10 flex items-center justify-center">
            <div className="w-full h-full bg-stone-950 rounded-[10px] flex items-center justify-center text-amber-400">
              <Film className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-stone-100 tracking-tight">
                AI Video B-Roll Assistant
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                Studio
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Script-to-Scene breakdown & Autonomous video creation pipeline
            </p>
          </div>
        </div>

        {/* Rate Limits & Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3">
          {/* Rate limits monitor */}
          <RateLimitPill
            rateLimits={rateLimits}
            onRefresh={onRefreshRateLimits}
            isRefreshing={isRefreshingLimits}
          />

          {/* Navigation Mode Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-stone-950 border border-stone-800 text-xs font-medium">
            <button
              id="tab-auto-btn"
              onClick={() => setActiveTab("auto")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === "auto"
                  ? "bg-amber-500 text-stone-950 font-bold shadow-xs"
                  : "text-amber-400 hover:text-amber-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Auto Creator</span>
            </button>

            <button
              id="tab-storyboard-btn"
              onClick={() => setActiveTab("storyboard")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === "storyboard"
                  ? "bg-amber-500 text-stone-950 font-semibold shadow-xs"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Storyboard ({sceneCount})</span>
            </button>

            <button
              id="tab-audio-btn"
              onClick={() => setActiveTab("audio")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === "audio"
                  ? "bg-amber-500 text-stone-950 font-semibold shadow-xs"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Music className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audio & SFX</span>
            </button>

            <button
              id="tab-json-btn"
              onClick={() => setActiveTab("json")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === "json"
                  ? "bg-amber-500 text-stone-950 font-semibold shadow-xs"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Raw JSON Plan</span>
            </button>

            <button
              id="tab-python-btn"
              onClick={() => setActiveTab("python")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === "python"
                  ? "bg-amber-500 text-stone-950 font-semibold shadow-xs"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Python Downloader</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
