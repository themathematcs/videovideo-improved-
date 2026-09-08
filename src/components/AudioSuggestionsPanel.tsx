import React, { useState, useEffect, useRef } from "react";
import { Music, Volume2, Play, Pause, Download, Sparkles, Loader2, Disc, Waves, CheckCircle2, AlertCircle, Info, ExternalLink } from "lucide-react";
import { AudioSuggestions, AudioTrackItem } from "../types";

interface AudioSuggestionsPanelProps {
  suggestions?: AudioSuggestions;
  projectName: string;
}

export const AudioSuggestionsPanel: React.FC<AudioSuggestionsPanelProps> = ({
  suggestions,
  projectName,
}) => {
  const [selectedMusicKeyword, setSelectedMusicKeyword] = useState<string>("");
  const [selectedSfxKeyword, setSelectedSfxKeyword] = useState<string>("");

  const [musicTracks, setMusicTracks] = useState<AudioTrackItem[]>([]);
  const [sfxTracks, setSfxTracks] = useState<AudioTrackItem[]>([]);
  const [loadingMusic, setLoadingMusic] = useState(false);
  const [loadingSfx, setLoadingSfx] = useState(false);
  const [musicStatus, setMusicStatus] = useState<string>("connected");
  const [sfxStatus, setSfxStatus] = useState<string>("connected");

  // Audio player state
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Default suggestions if none provided
  const musicKeywords = suggestions?.music_keywords?.length
    ? suggestions.music_keywords
    : ["tech ambient synth", "cinematic inspirational", "lofi chill coding"];

  const sfxKeywords = suggestions?.sfx_keywords?.length
    ? suggestions.sfx_keywords
    : ["keyboard typing", "futuristic swoosh", "data server hum"];

  // Initialize selected keywords
  useEffect(() => {
    if (musicKeywords.length > 0 && !selectedMusicKeyword) {
      setSelectedMusicKeyword(musicKeywords[0]);
    }
    if (sfxKeywords.length > 0 && !selectedSfxKeyword) {
      setSelectedSfxKeyword(sfxKeywords[0]);
    }
  }, [musicKeywords, sfxKeywords]);

  // Fetch Music
  useEffect(() => {
    if (!selectedMusicKeyword) return;
    let isCancelled = false;
    setLoadingMusic(true);

    fetch(`/api/stock/audio?query=${encodeURIComponent(selectedMusicKeyword)}&type=music&per_page=8`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled) {
          setMusicTracks(data.results || []);
          setMusicStatus(data.providerStatus || "connected");
        }
      })
      .catch((err) => {
        console.warn("Failed to load music tracks:", err);
      })
      .finally(() => {
        if (!isCancelled) setLoadingMusic(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedMusicKeyword]);

  // Fetch SFX
  useEffect(() => {
    if (!selectedSfxKeyword) return;
    let isCancelled = false;
    setLoadingSfx(true);

    fetch(`/api/stock/audio?query=${encodeURIComponent(selectedSfxKeyword)}&type=sfx&per_page=8`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled) {
          setSfxTracks(data.results || []);
          setSfxStatus(data.providerStatus || "connected");
        }
      })
      .catch((err) => {
        console.warn("Failed to load SFX tracks:", err);
      })
      .finally(() => {
        if (!isCancelled) setLoadingSfx(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedSfxKeyword]);

  // Toggle Track Play
  const handlePlayToggle = (track: AudioTrackItem) => {
    if (playingTrackId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingTrackId(null);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setPlayingTrackId(null);
      audioRef.current.onerror = () => {
        setPlayingTrackId(null);
        handleSynthesizeAudio(track.title || track.type);
      };
    }

    const audioUrl = track.preview_url || track.download_url;
    audioRef.current.src = audioUrl;
    audioRef.current.play()
      .then(() => setPlayingTrackId(track.id))
      .catch(() => {
        if (audioRef.current) {
          audioRef.current.src = `/api/audio/proxy?url=${encodeURIComponent(audioUrl)}`;
          audioRef.current.play()
            .then(() => setPlayingTrackId(track.id))
            .catch(() => {
              setPlayingTrackId(null);
              handleSynthesizeAudio(track.title || track.type);
            });
        }
      });
  };

  // Synthesize realistic audio in-browser using Web Audio API
  const handleSynthesizeAudio = (typeOrKeyword: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const lower = typeOrKeyword.toLowerCase();
      setIsSynthesizing(typeOrKeyword);

      if (lower.includes("keyboard") || lower.includes("typing") || lower.includes("click")) {
        // Procedural mechanical keyboard typing burst (6 clicks)
        const now = ctx.currentTime;
        for (let i = 0; i < 7; i++) {
          const t = now + i * 0.12 + Math.random() * 0.05;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(800 + Math.random() * 400, t);
          osc.frequency.exponentialRampToValueAtTime(120, t + 0.04);

          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.05);
        }
        setTimeout(() => setIsSynthesizing(null), 1200);
      } else if (lower.includes("swoosh") || lower.includes("whoosh") || lower.includes("transition")) {
        // Resonant white noise bandpass filter sweep
        const bufferSize = ctx.sampleRate * 1.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.Q.value = 4.0;
        filter.frequency.setValueAtTime(300, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.4);
        filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 1.2);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + 1.3);
        setTimeout(() => setIsSynthesizing(null), 1400);
      } else if (lower.includes("server") || lower.includes("hum") || lower.includes("drone")) {
        // Server room 60Hz hum with air fan pink noise
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.value = 60;
        osc2.frequency.value = 120;

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 3.1);
        osc2.stop(now + 3.1);
        setTimeout(() => setIsSynthesizing(null), 3200);
      } else {
        // Ambient Synth chord progression (Am9 chord: A2, C3, E3, G3, B3)
        const notes = [110, 130.81, 164.81, 196.0, 246.94];
        const now = ctx.currentTime;
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = idx % 2 === 0 ? "sine" : "triangle";
          osc.frequency.value = freq;

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.06, now + 0.8);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 3.6);
        });
        setTimeout(() => setIsSynthesizing(null), 3600);
      }
    } catch (e) {
      console.warn("Web Audio synthesis error:", e);
      setIsSynthesizing(null);
    }
  };

  // Download Audio Track via verified proxy
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const handleDownloadAudio = async (track: AudioTrackItem) => {
    setDownloadingId(track.id);
    const filename = `${track.type}_${track.title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase().slice(0, 30)}.mp3`;
    const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(track.download_url)}&filename=${encodeURIComponent(filename)}`;

    try {
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 15000);
    } catch (err) {
      console.warn("Direct download proxy fallback, opening CDN link:", err);
      window.open(track.download_url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Music className="w-4 h-4" />
            </span>
            <h3 className="text-base font-semibold text-stone-100">
              AI Audio & Sound Effects Recommendations
            </h3>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Mood-matched soundtrack and Foley SFX tailored to your script narrative. Integrated with Pixabay Audio API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-stone-800 text-stone-300 border border-stone-700 flex items-center gap-1.5">
            <Disc className="w-3 h-3 text-amber-400 animate-spin-slow" />
            <span>Kdenlive Audio Ready</span>
          </span>
        </div>
      </div>

      {/* Section 1: Background Music Suggestions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-200">
            <Music className="w-4 h-4 text-emerald-400" />
            <span>Recommended Background Music Keywords</span>
          </div>
          <span className="text-[11px] text-stone-400">Click a keyword to search Pixabay audio</span>
        </div>

        {/* Music Keywords Pills */}
        <div className="flex flex-wrap gap-2">
          {musicKeywords.map((kw, i) => {
            const isSelected = selectedMusicKeyword === kw;
            return (
              <button
                key={i}
                onClick={() => setSelectedMusicKeyword(kw)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border ${
                  isSelected
                    ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm"
                    : "bg-stone-850 border-stone-750 text-stone-300 hover:bg-stone-800 hover:text-white"
                }`}
              >
                <span>🎵 {kw}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
            );
          })}
        </div>

        {/* Music Results Grid */}
        <div className="pt-2">
          {loadingMusic ? (
            <div className="p-8 rounded-xl bg-stone-950 border border-stone-800/80 flex items-center justify-center gap-3 text-stone-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Searching Pixabay Audio for "{selectedMusicKeyword}"...</span>
            </div>
          ) : musicTracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {musicTracks.map((track) => {
                const isPlaying = playingTrackId === track.id;
                const isDownloading = downloadingId === track.id;
                return (
                  <div
                    key={track.id}
                    className="p-3.5 rounded-xl bg-stone-950 border border-stone-800/90 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-stone-200 text-xs truncate group-hover:text-emerald-300 transition-colors">
                          {track.title}
                        </div>
                        <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                          <span>{track.artist}</span>
                          {track.duration && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/40 shrink-0">
                        Music
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-850">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePlayToggle(track)}
                          className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                            isPlaying
                              ? "bg-emerald-500 text-stone-950 font-bold"
                              : "bg-stone-800 hover:bg-emerald-600 text-stone-200"
                          }`}
                          title={isPlaying ? "Pause track" : "Listen preview"}
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                          <span>{isPlaying ? "Pause" : "Preview"}</span>
                        </button>

                        <button
                          onClick={() => handleSynthesizeAudio(track.title)}
                          disabled={isSynthesizing !== null}
                          className="px-2 py-1 rounded text-[11px] bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 flex items-center gap-1 transition-colors"
                          title="Generate instant procedural Web Audio synth demo"
                        >
                          <Waves className="w-3 h-3 text-cyan-400" />
                          <span>Synth</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={track.download_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded text-stone-400 hover:text-stone-200 hover:bg-stone-850"
                          title="Open direct MP3 source link"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          onClick={() => handleDownloadAudio(track)}
                          disabled={isDownloading}
                          className="px-2.5 py-1 rounded text-xs font-medium bg-stone-800 hover:bg-amber-600 text-stone-200 hover:text-stone-950 flex items-center gap-1.5 transition-colors"
                        >
                          {isDownloading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          <span>MP3</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-400 text-center">
              No tracks found. Try selecting another music keyword above.
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Sound Effects (SFX) Suggestions */}
      <div className="space-y-3 pt-2 border-t border-stone-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-200">
            <Volume2 className="w-4 h-4 text-sky-400" />
            <span>Recommended Sound Effects (SFX)</span>
          </div>
          <span className="text-[11px] text-stone-400">Key visual Foley moments for video editor</span>
        </div>

        {/* SFX Keywords Pills */}
        <div className="flex flex-wrap gap-2">
          {sfxKeywords.map((kw, i) => {
            const isSelected = selectedSfxKeyword === kw;
            return (
              <button
                key={i}
                onClick={() => setSelectedSfxKeyword(kw)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border ${
                  isSelected
                    ? "bg-sky-500/20 border-sky-500/60 text-sky-300 shadow-sm"
                    : "bg-stone-850 border-stone-750 text-stone-300 hover:bg-stone-800 hover:text-white"
                }`}
              >
                <span>⚡ {kw}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
              </button>
            );
          })}
        </div>

        {/* SFX Results Grid */}
        <div className="pt-2">
          {loadingSfx ? (
            <div className="p-8 rounded-xl bg-stone-950 border border-stone-800/80 flex items-center justify-center gap-3 text-stone-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              <span>Searching SFX for "{selectedSfxKeyword}"...</span>
            </div>
          ) : sfxTracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sfxTracks.map((track) => {
                const isPlaying = playingTrackId === track.id;
                const isDownloading = downloadingId === track.id;
                return (
                  <div
                    key={track.id}
                    className="p-3.5 rounded-xl bg-stone-950 border border-stone-800/90 hover:border-sky-500/40 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-stone-200 text-xs truncate group-hover:text-sky-300 transition-colors">
                          {track.title}
                        </div>
                        <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                          <span>{track.artist}</span>
                          {track.duration && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{track.duration}s</span>
                            </>
                          )}
                        </div>
                      </div>

                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-800/40 shrink-0">
                        SFX
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-850">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePlayToggle(track)}
                          className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                            isPlaying
                              ? "bg-sky-500 text-stone-950 font-bold"
                              : "bg-stone-800 hover:bg-sky-600 text-stone-200"
                          }`}
                          title={isPlaying ? "Pause SFX" : "Listen preview"}
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                          <span>{isPlaying ? "Pause" : "Preview"}</span>
                        </button>

                        <button
                          onClick={() => handleSynthesizeAudio(track.title || selectedSfxKeyword)}
                          disabled={isSynthesizing !== null}
                          className="px-2 py-1 rounded text-[11px] bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 flex items-center gap-1 transition-colors"
                          title="Instant procedural Web Audio sound effect generator"
                        >
                          <Waves className="w-3 h-3 text-amber-400" />
                          <span>Synth FX</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={track.download_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded text-stone-400 hover:text-stone-200 hover:bg-stone-850"
                          title="Open direct MP3 source link"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          onClick={() => handleDownloadAudio(track)}
                          disabled={isDownloading}
                          className="px-2.5 py-1 rounded text-xs font-medium bg-stone-800 hover:bg-amber-600 text-stone-200 hover:text-stone-950 flex items-center gap-1.5 transition-colors"
                        >
                          {isDownloading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          <span>MP3</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-400 text-center">
              No SFX found. Try selecting another keyword above.
            </div>
          )}
        </div>
      </div>

      {/* Info footer & integration note */}
      <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-start gap-2.5 text-xs text-stone-400">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p>
            <strong className="text-stone-300">Pixabay Audio Integration:</strong> Powered by the Pixabay Audio API endpoint (<code>https://pixabay.com/api/audio/</code>).
          </p>
          <p className="text-[11px] text-stone-400">
            Export to the Python Downloader to batch-download all background music and sound effects automatically into your <code>./kdenlive_media_assets/audio/</code> timeline directory.
          </p>
        </div>
      </div>
    </div>
  );
};
