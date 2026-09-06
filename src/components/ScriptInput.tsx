import React from "react";
import { Sparkles, Wand2, FileText, ArrowRight } from "lucide-react";

interface ScriptInputProps {
  script: string;
  setScript: (val: string) => void;
  projectName: string;
  setProjectName: (val: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  autoSearchOnAnalyze: boolean;
  setAutoSearchOnAnalyze: (val: boolean) => void;
}

const PRESETS = [
  {
    title: "Software Evolution (Prompt Test)",
    projectName: "software_evolution",
    text: "Software engineering is evolving fast. Developers are using modern tools to build applications faster than ever before.",
  },
  {
    title: "Cybersecurity & Cloud",
    projectName: "cybersecurity_briefing",
    text: "Cyber threats are becoming increasingly sophisticated. Cloud security engineers monitor distributed networks around the clock. Automated intrusion detection safeguards critical enterprise infrastructure.",
  },
  {
    title: "Artisan Coffee Roasting",
    projectName: "artisan_coffee_journey",
    text: "Every morning begins with freshly harvested green coffee beans. The roasting drum spins under carefully monitored heat. Steam rises as rich espresso pours into a ceramic cup.",
  },
  {
    title: "Renewable Energy Future",
    projectName: "clean_energy_revolution",
    text: "Wind turbines turn gently across the morning horizon. Solar panel farms capture clean renewable sunlight. Engineers collaborate on modern power grids to power tomorrow's cities.",
  },
];

export const ScriptInput: React.FC<ScriptInputProps> = ({
  script,
  setScript,
  projectName,
  setProjectName,
  onAnalyze,
  isAnalyzing,
  autoSearchOnAnalyze,
  setAutoSearchOnAnalyze,
}) => {
  const lineCount = script.trim() ? script.trim().split(/\n+/).length : 0;
  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setScript(preset.text);
    setProjectName(preset.projectName);
  };

  return (
    <div id="script-input-section" className="bg-stone-900 border border-stone-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
      {/* Header and Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-stone-200 font-semibold text-sm">
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Video Script Input</span>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-stone-400 font-medium">Try Preset:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(p)}
              className="px-2.5 py-1 rounded-md bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-300 text-xs transition-colors"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Script Textarea */}
      <div className="relative">
        <textarea
          id="script-input-textarea"
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Paste or write your video script here line by line... (e.g., 'Software engineering is evolving fast. Developers are using modern tools to build applications faster than ever before.')"
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm font-sans placeholder:text-stone-600 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all leading-relaxed resize-y"
        />
        
        {/* Counter badges */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 text-[11px] font-mono text-stone-500 bg-stone-950/80 px-2 py-0.5 rounded border border-stone-800/80">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{lineCount} lines</span>
        </div>
      </div>

      {/* Settings & Analyze Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-stone-800/60">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="project-name-input" className="text-xs text-stone-400 font-medium">
              Project Name:
            </label>
            <input
              id="project-name-input"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. software_evolution"
              className="px-2.5 py-1 rounded-md bg-stone-950 border border-stone-800 text-xs font-mono text-amber-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 w-44"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-stone-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSearchOnAnalyze}
              onChange={(e) => setAutoSearchOnAnalyze(e.target.checked)}
              className="rounded bg-stone-950 border-stone-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-stone-900"
            />
            <span>Auto-fetch stock footage previews from Pexels & Pixabay</span>
          </label>
        </div>

        <button
          id="analyze-script-btn"
          onClick={onAnalyze}
          disabled={isAnalyzing || !script.trim()}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <Wand2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Script with AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate B-Roll Plan</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
