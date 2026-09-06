import React, { useState } from "react";
import { Copy, Check, Download, FileJson, CheckCircle2 } from "lucide-react";
import { ProjectPlan } from "../types";

interface JsonExportViewProps {
  plan: ProjectPlan;
}

export const JsonExportView: React.FC<JsonExportViewProps> = ({ plan }) => {
  const [copied, setCopied] = useState(false);

  // Clean JSON object matching the exact requested prompt schema
  const cleanPlan = {
    project_name: plan.project_name || "video_project",
    scenes: plan.scenes.map((s) => ({
      scene_number: s.scene_number,
      script_line: s.script_line,
      search_keywords: s.search_keywords,
      media_type: s.media_type,
    })),
    audio_suggestions: plan.audio_suggestions || {
      music_keywords: ["tech ambient synth", "cinematic inspirational"],
      sfx_keywords: ["keyboard typing", "futuristic swoosh", "data server hum"],
    },
  };

  const jsonString = JSON.stringify(cleanPlan, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "script_plan.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="json-export-view" className="flex flex-col gap-4">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-stone-900 border border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileJson className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-stone-100">Structured Script Plan</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                <CheckCircle2 className="w-3 h-3" /> Valid JSON
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Compatible with Gemma / Gemini schema and the local Python downloader script.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="copy-json-btn"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-stone-700/60"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy JSON"}</span>
          </button>

          <button
            id="download-json-file-btn"
            onClick={handleDownload}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download script_plan.json</span>
          </button>
        </div>
      </div>

      {/* JSON Code Viewer */}
      <div className="relative rounded-xl bg-stone-950 border border-stone-800 p-4 font-mono text-xs text-stone-200 overflow-x-auto shadow-inner leading-relaxed">
        <pre>{jsonString}</pre>
      </div>

      {/* Helper Box */}
      <div className="p-3.5 rounded-lg bg-stone-900/60 border border-stone-800/80 text-xs text-stone-400 flex items-start gap-2">
        <span className="font-semibold text-amber-400 shrink-0">Usage:</span>
        <span>
          Save this file as <code className="text-amber-300 font-mono">script_plan.json</code> in your project root, then execute <code className="text-amber-300 font-mono">python download_assets.py</code> to download all matching stock b-roll clips into your Kdenlive media folder.
        </span>
      </div>
    </div>
  );
};
