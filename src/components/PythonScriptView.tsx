import React, { useState } from "react";
import { Copy, Check, Download, Terminal, Shield, RefreshCw, Layers } from "lucide-react";
import { generatePythonScript } from "../pythonTemplate";

export const PythonScriptView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const scriptContent = generatePythonScript();

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([scriptContent], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "download_assets.py";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="python-script-view" className="flex flex-col gap-5">
      {/* Top Banner & Quick Download */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-stone-900 border border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-100">
              Kdenlive Media Pipeline Downloader (<code className="text-amber-400 font-mono">download_assets.py</code>)
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Includes automated HTTP 429 exponential backoff, rate-limit header inspection, and Pexels ➔ Pixabay fallback.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="copy-python-code-btn"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-stone-700/60"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied Script" : "Copy Python Code"}</span>
          </button>

          <button
            id="download-python-file-btn"
            onClick={handleDownload}
            className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-stone-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download download_assets.py</span>
          </button>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg bg-stone-900/60 border border-stone-800/80 flex items-start gap-3">
          <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-stone-200">Rate Limit Safe</div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              Detects HTTP 429, reads <code className="text-amber-300">Retry-After</code> and applies exponential backoff with jitter.
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-stone-900/60 border border-stone-800/80 flex items-start gap-3">
          <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-stone-200">Dual Provider Fallback</div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              Queries Pexels HD first. If rate-limited or no match found, automatically queries Pixabay.
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-stone-900/60 border border-stone-800/80 flex items-start gap-3">
          <Layers className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-stone-200">Ready for Kdenlive</div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              Outputs sequentially named files (<code className="text-amber-300">scene_01_pexels.mp4</code>) straight into <code className="text-stone-300">./kdenlive_media_assets</code>.
            </div>
          </div>
        </div>
      </div>

      {/* Quick Terminal Guide */}
      <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-col gap-2.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-amber-400" />
          <span>Local Execution Steps</span>
        </div>
        <div className="flex flex-col gap-2 font-mono text-xs">
          <div className="flex items-center justify-between bg-stone-900/80 px-3 py-2 rounded-md border border-stone-800">
            <span className="text-stone-300">
              <span className="text-amber-400"># 1. Install dependencies</span>
              <br />
              pip install requests
            </span>
          </div>
          <div className="flex items-center justify-between bg-stone-900/80 px-3 py-2 rounded-md border border-stone-800">
            <span className="text-stone-300">
              <span className="text-amber-400"># 2. Run the downloader (ensure script_plan.json is in same folder)</span>
              <br />
              python download_assets.py
            </span>
          </div>
        </div>
      </div>

      {/* Code viewer */}
      <div className="relative rounded-xl bg-stone-950 border border-stone-800 p-4 font-mono text-xs text-stone-200 overflow-x-auto shadow-inner max-h-[500px] overflow-y-auto leading-relaxed">
        <pre>{scriptContent}</pre>
      </div>
    </div>
  );
};
