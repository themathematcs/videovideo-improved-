import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  GraduationCap,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Code,
  Calculator,
  Atom,
  Layers,
  Volume2,
  VolumeX,
  Download,
  Copy,
  Check,
  Film,
  Zap,
  Sliders,
  Maximize2,
  Tv,
  CheckCircle2,
  Clock,
  Video,
  FileCode,
  Layout,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  Settings
} from "lucide-react";
import { EXPANDED_CURATED_VIDEO_CATALOG } from "../data/videoCatalog";

export interface RemotionLessonChapter {
  id: string;
  chapterNumber: number;
  title: string;
  durationSeconds: number;
  narration: string;
  overlayType: "math_formula" | "code_block" | "diagram_flow" | "whiteboard_notes" | "concept_card";
  overlayData: {
    heading?: string;
    subheading?: string;
    mathFormula?: string;
    mathSteps?: string[];
    codeLanguage?: string;
    codeSnippet?: string;
    codeOutput?: string;
    diagramNodes?: { id: string; label: string; sub?: string }[];
    bulletPoints?: string[];
    accentColor?: string;
  };
  backgroundVideoUrl: string;
  backgroundVideoTitle: string;
}

export interface LessonPreset {
  id: string;
  title: string;
  subject: "math" | "computer_science" | "physics" | "biology" | "economics";
  durationLabel: string;
  description: string;
  chapters: RemotionLessonChapter[];
}

const SAMPLE_LESSON_PRESETS: LessonPreset[] = [
  {
    id: "cs_python_async",
    title: "Understanding Async & Await in Python",
    subject: "computer_science",
    durationLabel: "4:30 mins (Long-Form Lesson)",
    description: "Deep dive into non-blocking event loops, coroutines, and real-world API concurrency with Remotion code animations.",
    chapters: [
      {
        id: "ch_1",
        chapterNumber: 1,
        title: "Introduction: Why Concurrency Matters",
        durationSeconds: 12,
        narration: "Traditional synchronous code blocks execution. When waiting for database queries or API requests, CPU time is wasted. Async programming solves this.",
        overlayType: "whiteboard_notes",
        overlayData: {
          heading: "Sync vs Async Execution",
          subheading: "Maximizing CPU & IO Throughput",
          bulletPoints: [
            "Synchronous: Halts execution line-by-line during I/O",
            "Asynchronous: Yields control back to the Event Loop",
            "Ideal for Web Servers, Web Scraping, & Distributed Systems"
          ],
          accentColor: "#3b82f6"
        },
        backgroundVideoUrl: "https://videos.pexels.com/video-files/3129671/3129671-sd_640_360_30fps.mp4",
        backgroundVideoTitle: "Server Rack Datacenter"
      },
      {
        id: "ch_2",
        chapterNumber: 2,
        title: "The Python Event Loop & Coroutines",
        durationSeconds: 15,
        narration: "In Python, async functions are defined with async def and called with await. Here is how a non-blocking fetch function executes.",
        overlayType: "code_block",
        overlayData: {
          heading: "Python asyncio Syntax",
          codeLanguage: "python",
          codeSnippet: `import asyncio\nimport aiohttp\n\nasync function fetch_data(url):\n    async with aiohttp.ClientSession() as session:\n        async with session.get(url) as response:\n            return await response.json()\n\nasyncio.run(fetch_data("https://api.dev"))`,
          codeOutput: "[200 OK] Received 1024 bytes in 12ms",
          accentColor: "#10b981"
        },
        backgroundVideoUrl: "https://videos.pexels.com/video-files/853889/853889-sd_640_360_25fps.mp4",
        backgroundVideoTitle: "Matrix Code Flow"
      },
      {
        id: "ch_3",
        chapterNumber: 3,
        title: "Event Loop Task Scheduler Flowchart",
        durationSeconds: 15,
        narration: "The Event Loop continuously checks task queues. When an awaited I/O task completes, its callback resumes execution instantly.",
        overlayType: "diagram_flow",
        overlayData: {
          heading: "Async Event Loop Architecture",
          diagramNodes: [
            { id: "1", label: "Task Created", sub: "asyncio.create_task()" },
            { id: "2", label: "Event Loop Queue", sub: "Ready Stack" },
            { id: "3", label: "I/O Execution", sub: "Non-blocking Socket" },
            { id: "4", label: "Resume Callback", sub: "Return Value" }
          ],
          accentColor: "#8b5cf6"
        },
        backgroundVideoUrl: "https://videos.pexels.com/video-files/18069828/18069828-sd_640_360_30fps.mp4",
        backgroundVideoTitle: "Abstract Digital Neural Network"
      }
    ]
  },
  {
    id: "math_derivatives",
    title: "Calculus: Understanding Derivatives & Rate of Change",
    subject: "math",
    durationLabel: "5:00 mins (Long-Form Lesson)",
    description: "Visual step-by-step mathematical proof of secant lines transitioning into tangent derivatives with animated formulas.",
    chapters: [
      {
        id: "math_1",
        chapterNumber: 1,
        title: "The Definition of the Derivative Limit",
        durationSeconds: 14,
        narration: "The derivative measures instantaneous rate of change. As delta x approaches zero, the slope of the secant line becomes the exact tangent slope.",
        overlayType: "math_formula",
        overlayData: {
          heading: "Formal Limit Definition",
          mathFormula: "f'(x) = \\lim_{\\Delta x \\to 0} \\frac{f(x + \\Delta x) - f(x)}{\\Delta x}",
          mathSteps: [
            "Step 1: Calculate slope between two points (x) and (x + Δx)",
            "Step 2: Shrink the interval Δx towards zero",
            "Step 3: Evaluate instantaneous tangent slope f'(x)"
          ],
          accentColor: "#f59e0b"
        },
        backgroundVideoUrl: "https://videos.pexels.com/video-files/3129671/3129671-sd_640_360_30fps.mp4",
        backgroundVideoTitle: "Abstract Geometry Motion"
      },
      {
        id: "math_2",
        chapterNumber: 2,
        title: "Power Rule Proof & Application",
        durationSeconds: 15,
        narration: "For any polynomial term x to the n, the derivative is calculated by multiplying by exponent n and subtracting 1 from the power.",
        overlayType: "math_formula",
        overlayData: {
          heading: "The Power Rule Formula",
          mathFormula: "\\frac{d}{dx}[x^n] = n \\cdot x^{n-1}",
          mathSteps: [
            "Example: f(x) = x³ + 5x² - 4",
            "Derivative: f'(x) = 3x² + 10x",
            "Slope at x=2: f'(2) = 3(4) + 20 = 32"
          ],
          accentColor: "#ec4899"
        },
        backgroundVideoUrl: "https://videos.pexels.com/video-files/853889/853889-sd_640_360_25fps.mp4",
        backgroundVideoTitle: "Math Calculations Backdrop"
      }
    ]
  },
  {
    id: "physics_relativity",
    title: "Einstein's Special Relativity & Time Dilation",
    subject: "physics",
    durationLabel: "6:00 mins (Long-Form Lesson)",
    description: "Explore spacetime curvature, light clocks, and speed-of-light constancy using animated Remotion Lorentz transformation overlays.",
    chapters: [
      {
        id: "phys_1",
        chapterNumber: 1,
        title: "Constancy of the Speed of Light",
        durationSeconds: 15,
        narration: "Einstein postulated that light moves at constant speed c in all inertial reference frames, regardless of the relative motion of the emitter.",
        overlayType: "concept_card",
        overlayData: {
          heading: "Postulates of Special Relativity",
          subheading: "c = 299,792,458 m/s (Universal Constant)",
          bulletPoints: [
            "1. Laws of physics are identical in all inertial frames",
            "2. Speed of light c is invariant for all observers",
            "3. Simultaneity is relative to observer motion"
          ],
          accentColor: "#06b6d4"
        },
        backgroundVideoUrl: "https://videos.pexels.com/video-files/853889/853889-sd_640_360_25fps.mp4",
        backgroundVideoTitle: "Cosmos Deep Space Starfield"
      },
      {
        id: "phys_2",
        chapterNumber: 2,
        title: "The Lorentz Factor Formula",
        durationSeconds: 14,
        narration: "As velocity v approaches speed of light c, time dilates according to the gamma factor. Clocks in fast-moving reference frames tick slower.",
        overlayType: "math_formula",
        overlayData: {
          heading: "Time Dilation Formula",
          mathFormula: "\\Delta t' = \\frac{\\Delta t}{\\sqrt{1 - \\frac{v^2}{c^2}}} = \\gamma \\cdot \\Delta t",
          mathSteps: [
            "At v = 0.8c: γ = 1.67x time dilation",
            "At v = 0.99c: γ = 7.09x time dilation",
            "At v = c: γ approaches infinity"
          ],
          accentColor: "#a855f7"
        },
        backgroundVideoUrl: "https://videos.pexels.com/video-files/18069828/18069828-sd_640_360_30fps.mp4",
        backgroundVideoTitle: "Space Time Warp Grid"
      }
    ]
  }
];

export const LongFormatAnimatedStudio: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<LessonPreset>(SAMPLE_LESSON_PRESETS[0]);
  const [chapters, setChapters] = useState<RemotionLessonChapter[]>(SAMPLE_LESSON_PRESETS[0].chapters);
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);

  // Lesson Script Generator Inputs
  const [lessonTopic, setLessonTopic] = useState("Machine Learning Fundamentals & Gradient Descent");
  const [selectedSubject, setSelectedSubject] = useState<LessonPreset["subject"]>("computer_science");
  const [targetDurationMins, setTargetDurationMins] = useState<number>(5);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);

  // Remotion Animation Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [fps] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female");
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  // Export Modal State
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isRenderingFullVideo, setIsRenderingFullVideo] = useState(false);
  const [renderingProgress, setRenderingProgress] = useState<string | null>(null);
  const [renderedDownloadUrl, setRenderedDownloadUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<number | null>(null);

  const currentChapter = chapters[activeChapterIdx] || chapters[0];
  const totalDurationFrames = (currentChapter?.durationSeconds || 12) * fps;

  // Generate Voiceover TTS Audio for active chapter
  const generateChapterVoiceover = useCallback(async (narrationText: string) => {
    if (!narrationText.trim()) return;
    setIsGeneratingAudio(true);
    try {
      const voice = voiceGender === "female" ? "en-US-AriaNeural" : "en-US-GuyNeural";
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: narrationText, voice })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setAudioBlobUrl(url);
      }
    } catch (e) {
      console.warn("TTS generation note:", e);
    } finally {
      setIsGeneratingAudio(false);
    }
  }, [voiceGender]);

  useEffect(() => {
    if (currentChapter) {
      generateChapterVoiceover(currentChapter.narration);
      setCurrentFrame(0);
      setIsPlaying(false);
    }
  }, [activeChapterIdx, currentChapter?.id, voiceGender, generateChapterVoiceover]);

  // Frame Ticker Animation Loop
  useEffect(() => {
    if (isPlaying) {
      if (audioRef.current && audioBlobUrl && !isMuted) {
        audioRef.current.play().catch(() => {});
      }
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }

      const animate = () => {
        setCurrentFrame((prev) => {
          if (prev >= totalDurationFrames) {
            // Auto advance to next chapter if available
            if (activeChapterIdx < chapters.length - 1) {
              setActiveChapterIdx((idx) => idx + 1);
              return 0;
            } else {
              setIsPlaying(false);
              return totalDurationFrames;
            }
          }
          return prev + 1;
        });
        requestRef.current = requestAnimationFrame(animate);
      };

      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (audioRef.current) audioRef.current.pause();
      if (videoRef.current) videoRef.current.pause();
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, totalDurationFrames, activeChapterIdx, chapters.length, audioBlobUrl, isMuted]);

  // Remotion interpolation helper
  const interpolate = (frame: number, inputRange: [number, number], outputRange: [number, number]) => {
    const [inMin, inMax] = inputRange;
    const [outMin, outMax] = outputRange;
    if (frame <= inMin) return outMin;
    if (frame >= inMax) return outMax;
    const ratio = (frame - inMin) / (inMax - inMin);
    return outMin + ratio * (outMax - outMin);
  };

  // Generate AI Long-Form Animated Lesson
  const handleGenerateAILesson = async () => {
    if (!lessonTopic.trim()) return;
    setIsGeneratingLesson(true);
    try {
      const prompt = `Create a structured long-form animated study lesson on: "${lessonTopic}".
Subject area: ${selectedSubject}.
Target duration: ${targetDurationMins} minutes.

Generate 3 to 4 detailed chapter modules. For each chapter include:
1. Title
2. Duration in seconds (12-18s)
3. Clear educational narration text
4. Overlay type: one of "math_formula", "code_block", "diagram_flow", "whiteboard_notes", or "concept_card"
5. Visual overlay content (heading, mathFormula, mathSteps, codeSnippet, diagramNodes, or bulletPoints)
6. Stock video background search keywords.`;

      const res = await fetch("/api/analyze-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: prompt })
      });

      if (res.ok) {
        const data = await res.json();
        const generatedChapters: RemotionLessonChapter[] = (data.scenes || []).slice(0, 4).map((sc: any, idx: number) => {
          const bgVideo = EXPANDED_CURATED_VIDEO_CATALOG[(idx * 3 + 2) % EXPANDED_CURATED_VIDEO_CATALOG.length];
          const overlayTypes: RemotionLessonChapter["overlayType"][] = [
            "whiteboard_notes",
            "code_block",
            "math_formula",
            "diagram_flow",
            "concept_card"
          ];
          const overlayType = overlayTypes[idx % overlayTypes.length];

          return {
            id: `gen_ch_${idx + 1}`,
            chapterNumber: idx + 1,
            title: sc.script_line ? sc.script_line.slice(0, 45) + "..." : `Chapter ${idx + 1}: ${lessonTopic}`,
            durationSeconds: 14,
            narration: sc.script_line || `In this chapter, we explore the core mechanics of ${lessonTopic}.`,
            overlayType,
            overlayData: {
              heading: `Key Concept: Chapter ${idx + 1}`,
              subheading: lessonTopic,
              mathFormula: overlayType === "math_formula" ? "f(x) = \\sum_{i=1}^n w_i x_i + b" : undefined,
              mathSteps: overlayType === "math_formula" ? [
                "1. Multiply weights by feature inputs",
                "2. Add bias term offset",
                "3. Apply non-linear activation function"
              ] : undefined,
              codeLanguage: "python",
              codeSnippet: overlayType === "code_block" ? `def compute_loss(y_true, y_pred):\n    return np.mean((y_true - y_pred) ** 2)\n\n# Gradient descent step\nw = w - learning_rate * grad` : undefined,
              codeOutput: "Loss decreased from 0.842 to 0.019",
              bulletPoints: [
                `Understand core principles of ${lessonTopic}`,
                "Analyze mathematical and computational foundations",
                "Apply step-by-step problem solving strategies"
              ],
              diagramNodes: [
                { id: "1", label: "Input Data", sub: "Features" },
                { id: "2", label: "Model Layer", sub: "Transform" },
                { id: "3", label: "Loss Function", sub: "Evaluation" },
                { id: "4", label: "Optimization", sub: "Update" }
              ],
              accentColor: idx === 0 ? "#3b82f6" : idx === 1 ? "#10b981" : idx === 2 ? "#f59e0b" : "#8b5cf6"
            },
            backgroundVideoUrl: bgVideo.downloadUrl,
            backgroundVideoTitle: bgVideo.title || "Curated B-Roll Footage"
          };
        });

        if (generatedChapters.length > 0) {
          setChapters(generatedChapters);
          setActiveChapterIdx(0);
        }
      }
    } catch (e) {
      console.warn("AI Lesson generation error:", e);
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  // Generate Remotion React JSX Code Bundle String
  const generateRemotionCode = () => {
    return `import { Composition, registerRoot } from 'remotion';
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Video } from 'remotion';

// Remotion Educational Lesson Component
export const LessonComposition: React.FC<{ chapter: any }> = ({ chapter }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Remotion Spring Entrance Animation
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, 25], [30, 0], { extrapolateRight: 'clamp' });
  const scale = spring({ frame, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ backgroundColor: '#09090b', fontFamily: 'sans-serif' }}>
      {/* Layer 1: Background Video */}
      <Video
        src={chapter.backgroundVideoUrl}
        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}
      />

      {/* Layer 2: Remotion Animated Study Overlay */}
      <AbsoluteFill style={{ padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          opacity,
          transform: \`translateY(\${translateY}px) scale(\${scale})\`,
          backgroundColor: 'rgba(24, 24, 27, 0.92)',
          border: \`2px solid \${chapter.overlayData.accentColor || '#3b82f6'}\`,
          borderRadius: 24,
          padding: 36,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}>
          <h2 style={{ color: '#f4f4f5', fontSize: 32, margin: 0, fontWeight: 800 }}>
            {chapter.overlayData.heading}
          </h2>
          <p style={{ color: chapter.overlayData.accentColor || '#3b82f6', fontSize: 18, marginTop: 8 }}>
            {chapter.title}
          </p>

          {/* Animated Math / Code / Diagram content rendered here */}
          <div style={{ marginTop: 24, fontSize: 16, color: '#d4d4d8' }}>
            {chapter.narration}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="StudyLesson"
      component={LessonComposition}
      durationInFrames={450}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        chapter: ${JSON.stringify(currentChapter, null, 2)}
      }}
    />
  );
};

registerRoot(RemotionRoot);`;
  };

  // Synthesize & Render Full MP4 Video
  const handleRenderFullVideo = async () => {
    setIsRenderingFullVideo(true);
    setRenderingProgress("Initializing Remotion synthesis engine...");
    setRenderedDownloadUrl(null);

    try {
      const scenePayloads = chapters.map((ch) => ({
        scene_number: ch.chapterNumber,
        script_line: ch.title,
        narration: ch.narration,
        duration: ch.durationSeconds,
        search_keywords: ch.title,
        videoUrl: ch.backgroundVideoUrl,
        transition: "fade",
        overlayType: ch.overlayType,
        overlayData: ch.overlayData
      }));

      setRenderingProgress("Downloading background footage & stitching Remotion graphics...");
      const res = await fetch("/api/render-auto-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: selectedPreset.id || "remotion_animated_study",
          aspectRatio: "16:9",
          scenes: scenePayloads
        })
      });

      if (!res.ok) {
        throw new Error(`Rendering failed with HTTP ${res.status}`);
      }

      const data = await res.json();
      setRenderingProgress("Video rendering complete!");
      setRenderedDownloadUrl(data.downloadUrl || data.videoUrl);
    } catch (e: any) {
      console.error("Render error:", e);
      setRenderingProgress(`Rendering note: ${e.message}`);
    } finally {
      setIsRenderingFullVideo(false);
    }
  };

  // Render Remotion Animated Graphic Overlay based on overlayType & current frame
  const renderRemotionGraphicOverlay = () => {
    const opacity = interpolate(currentFrame, [0, 20], [0, 1]);
    const translateY = interpolate(currentFrame, [0, 25], [40, 0]);
    const progressWidth = interpolate(currentFrame, [0, totalDurationFrames], [0, 100]);
    const accentColor = currentChapter.overlayData?.accentColor || "#3b82f6";

    return (
      <div
        className="absolute inset-0 p-6 md:p-10 flex flex-col justify-between pointer-events-none select-none transition-all duration-300"
        style={{
          opacity,
          transform: `translateY(${translateY}px)`
        }}
      >
        {/* Top Bar: Lesson Title & Remotion Live Badge */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-stone-950/85 border border-stone-800/80 backdrop-blur-md shadow-lg">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-stone-100 tracking-wide">
              Chapter {currentChapter.chapterNumber}: {currentChapter.title}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/90 border border-indigo-500/40 text-indigo-300 text-[11px] font-mono font-semibold shadow-lg">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>REMOTION REACT ENGINE</span>
          </div>
        </div>

        {/* Center Canvas: Dynamic Remotion Content */}
        <div className="my-auto max-w-3xl mx-auto w-full">
          {/* Overlay Type 1: Math Formula Proof */}
          {currentChapter.overlayType === "math_formula" && (
            <div
              className="p-6 md:p-8 rounded-2xl bg-stone-950/90 border-2 backdrop-blur-xl shadow-2xl flex flex-col gap-4 text-stone-100"
              style={{ borderColor: accentColor }}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Calculator className="w-4 h-4" />
                <span>{currentChapter.overlayData?.heading || "Mathematical Definition"}</span>
              </div>

              {/* Formula Display */}
              <div className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 text-center font-mono text-xl md:text-2xl font-bold tracking-wide text-amber-300 shadow-inner">
                {currentChapter.overlayData?.mathFormula || "f'(x) = \\lim_{\\Delta x \\to 0} \\frac{f(x+\\Delta x) - f(x)}{\\Delta x}"}
              </div>

              {/* Step-by-step Math Breakdown */}
              <div className="space-y-2 pt-1">
                {(currentChapter.overlayData?.mathSteps || []).map((step, sIdx) => {
                  const stepOpacity = interpolate(currentFrame, [30 + sIdx * 30, 50 + sIdx * 30], [0, 1]);
                  return (
                    <div
                      key={sIdx}
                      className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800/80 text-xs text-stone-200 flex items-center gap-2 font-mono"
                      style={{ opacity: stepOpacity }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Overlay Type 2: Code Walkthrough Block */}
          {currentChapter.overlayType === "code_block" && (
            <div
              className="p-6 rounded-2xl bg-stone-950/95 border-2 backdrop-blur-xl shadow-2xl flex flex-col gap-3 font-mono"
              style={{ borderColor: accentColor }}
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Code className="w-4 h-4" />
                  <span>{currentChapter.overlayData?.heading || "Code Execution"}</span>
                </div>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">
                  {currentChapter.overlayData?.codeLanguage || "python"}
                </span>
              </div>

              {/* Code Snippet with typing effect */}
              <pre className="p-4 rounded-xl bg-stone-900/90 border border-stone-800/80 text-xs md:text-sm text-emerald-300 overflow-x-auto leading-relaxed">
                <code>
                  {(currentChapter.overlayData?.codeSnippet || "").slice(
                    0,
                    Math.floor(
                      interpolate(
                        currentFrame,
                        [10, totalDurationFrames - 30],
                        [0, (currentChapter.overlayData?.codeSnippet || "").length]
                      )
                    )
                  )}
                  <span className="animate-pulse font-bold text-emerald-400">|</span>
                </code>
              </pre>

              {/* Terminal Output Box */}
              {currentChapter.overlayData?.codeOutput && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-[11px] text-emerald-300 flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">&gt;</span>
                  <span>{currentChapter.overlayData.codeOutput}</span>
                </div>
              )}
            </div>
          )}

          {/* Overlay Type 3: Node-based Diagram Flow */}
          {currentChapter.overlayType === "diagram_flow" && (
            <div
              className="p-6 md:p-8 rounded-2xl bg-stone-950/90 border-2 backdrop-blur-xl shadow-2xl flex flex-col gap-5 text-stone-100"
              style={{ borderColor: accentColor }}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
                <Atom className="w-4 h-4" />
                <span>{currentChapter.overlayData?.heading || "System Architecture Diagram"}</span>
              </div>

              {/* Diagram Node Flow */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(currentChapter.overlayData?.diagramNodes || []).map((node, nIdx) => {
                  const nodeOpacity = interpolate(currentFrame, [20 + nIdx * 25, 40 + nIdx * 25], [0, 1]);
                  const nodeScale = interpolate(currentFrame, [20 + nIdx * 25, 40 + nIdx * 25], [0.85, 1]);

                  return (
                    <div
                      key={node.id}
                      className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 flex flex-col items-center text-center gap-1.5 shadow-lg relative"
                      style={{
                        opacity: nodeOpacity,
                        transform: `scale(${nodeScale})`
                      }}
                    >
                      <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center border border-purple-500/30">
                        {nIdx + 1}
                      </div>
                      <div className="text-xs font-bold text-stone-100">{node.label}</div>
                      <div className="text-[10px] text-purple-300 font-mono">{node.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Overlay Type 4: Whiteboard Study Notes */}
          {(currentChapter.overlayType === "whiteboard_notes" || currentChapter.overlayType === "concept_card") && (
            <div
              className="p-6 md:p-8 rounded-2xl bg-stone-950/90 border-2 backdrop-blur-xl shadow-2xl flex flex-col gap-4 text-stone-100"
              style={{ borderColor: accentColor }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                  <BookOpen className="w-4 h-4" />
                  <span>{currentChapter.overlayData?.heading || "Study Takeaways"}</span>
                </div>
                {currentChapter.overlayData?.subheading && (
                  <span className="text-xs text-stone-400 font-mono">{currentChapter.overlayData.subheading}</span>
                )}
              </div>

              {/* Bullet Points */}
              <div className="space-y-2.5 pt-1">
                {(currentChapter.overlayData?.bulletPoints || []).map((bp, bIdx) => {
                  const bpOpacity = interpolate(currentFrame, [25 + bIdx * 30, 45 + bIdx * 30], [0, 1]);
                  return (
                    <div
                      key={bIdx}
                      className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-xs text-stone-200 flex items-start gap-3 shadow-xs"
                      style={{ opacity: bpOpacity }}
                    >
                      <span className="w-2 h-2 rounded-full bg-sky-400 mt-1 shrink-0" />
                      <span className="leading-relaxed">{bp}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar: Voiceover Subtitles & Frame Timeline */}
        <div className="flex flex-col gap-2">
          {/* Voiceover Captions */}
          <div className="p-3 rounded-xl bg-stone-950/90 border border-stone-800/80 backdrop-blur-md text-xs text-center font-medium text-amber-200 shadow-xl max-w-2xl mx-auto w-full leading-relaxed">
            "{currentChapter.narration}"
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-stone-900 overflow-hidden border border-stone-800/50">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 transition-all duration-75"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-stone-900 to-amber-950/50 border border-indigo-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
              NEW REMOTION ENGINE
            </span>
            <span className="text-stone-400 text-xs">• Long-Format Animated Lessons</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-stone-100 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-400" />
            <span>Long-Format Animated Studies & Remotion Studio</span>
          </h2>
          <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
            Create in-depth animated educational courses, STEM lectures, and whiteboard study guides. Combines real-time React Remotion motion overlays with stock footage and TTS voiceovers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowCodeModal(true)}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-semibold flex items-center gap-2 border border-stone-700/60 shadow-xs transition-colors"
          >
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>Export Remotion JSX</span>
          </button>

          <button
            onClick={handleRenderFullVideo}
            disabled={isRenderingFullVideo}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-colors"
          >
            <Film className="w-4 h-4" />
            <span>{isRenderingFullVideo ? "Synthesizing Video..." : "Render Full MP4 Lesson"}</span>
          </button>
        </div>
      </div>

      {/* Render Progress Banner */}
      {renderingProgress && (
        <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-700/60 text-indigo-200 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-indigo-400 animate-ping" />
            <span className="font-mono">{renderingProgress}</span>
          </div>
          {renderedDownloadUrl && (
            <a
              href={renderedDownloadUrl}
              download="remotion_study_lesson.mp4"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download MP4</span>
            </a>
          )}
        </div>
      )}

      {/* Main Studio Grid: Player & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Remotion Live Canvas Player & Controls (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Remotion Canvas Stage */}
          <div className="relative aspect-video w-full rounded-2xl bg-stone-950 border border-stone-800 overflow-hidden shadow-2xl group">
            {/* Layer 1: Background Stock Footage */}
            <video
              ref={videoRef}
              src={currentChapter.backgroundVideoUrl}
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-35 transition-opacity duration-300"
            />

            {/* Layer 2: Remotion Graphic Animation Overlay */}
            {renderRemotionGraphicOverlay()}

            {/* Hidden Voiceover Audio Element */}
            {audioBlobUrl && (
              <audio
                ref={audioRef}
                src={audioBlobUrl}
                muted={isMuted}
                onEnded={() => {
                  if (activeChapterIdx < chapters.length - 1) {
                    setActiveChapterIdx((prev) => prev + 1);
                  }
                }}
              />
            )}
          </div>

          {/* Player Toolbar Controls */}
          <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center justify-center shadow-md transition-transform active:scale-95"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <button
                onClick={() => {
                  setCurrentFrame(0);
                  setIsPlaying(false);
                }}
                className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 transition-colors"
                title="Reset to frame 0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="text-xs font-mono text-stone-400">
                Frame: <span className="text-amber-400 font-bold">{currentFrame}</span> / {totalDurationFrames} ({(currentFrame / fps).toFixed(1)}s)
              </div>
            </div>

            {/* Right Controls: Audio & Voice gender */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 transition-colors"
                title={isMuted ? "Unmute Voiceover" : "Mute Voiceover"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>

              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-stone-950 border border-stone-800 text-xs">
                <button
                  onClick={() => setVoiceGender("female")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    voiceGender === "female" ? "bg-amber-500 text-stone-950" : "text-stone-400"
                  }`}
                >
                  Sonia (F)
                </button>
                <button
                  onClick={() => setVoiceGender("male")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    voiceGender === "male" ? "bg-amber-500 text-stone-950" : "text-stone-400"
                  }`}
                >
                  Guy (M)
                </button>
              </div>
            </div>
          </div>

          {/* Lesson Chapter Navigation Stack */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Lesson Modules ({chapters.length} Chapters)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {chapters.map((ch, idx) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapterIdx(idx)}
                  className={`p-3.5 rounded-xl text-left flex flex-col gap-2 transition-all border ${
                    activeChapterIdx === idx
                      ? "bg-amber-500/10 border-amber-500 text-stone-100 shadow-md"
                      : "bg-stone-900 hover:bg-stone-850 border-stone-800 text-stone-300"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-400 font-mono">Ch {ch.chapterNumber}</span>
                    <span className="text-[10px] text-stone-400 uppercase font-mono">{ch.overlayType}</span>
                  </div>
                  <div className="text-xs font-semibold line-clamp-1">{ch.title}</div>
                  <div className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">{ch.narration}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Lesson Script Generator & Presets (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* AI Study Lesson Generator Form */}
          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-bold text-stone-100 border-b border-stone-800 pb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Generate AI Animated Lesson</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Study Topic / Lesson Goal</label>
                <input
                  type="text"
                  value={lessonTopic}
                  onChange={(e) => setLessonTopic(e.target.value)}
                  placeholder="e.g. Organic Chemistry Reactions & Mechanisms"
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 focus:outline-hidden focus:border-amber-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs"
                  >
                    <option value="computer_science">CS & Coding</option>
                    <option value="math">Mathematics</option>
                    <option value="physics">Physics & Engineering</option>
                    <option value="biology">Biology & Life</option>
                    <option value="economics">Economics & Finance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 font-medium mb-1">Duration</label>
                  <select
                    value={targetDurationMins}
                    onChange={(e) => setTargetDurationMins(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs"
                  >
                    <option value={3}>3 Mins (Core Summary)</option>
                    <option value={5}>5 Mins (Full Chapter)</option>
                    <option value={10}>10 Mins (Deep Study)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateAILesson}
                disabled={isGeneratingLesson || !lessonTopic.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>{isGeneratingLesson ? "Building Remotion Script..." : "Generate Remotion Lesson"}</span>
              </button>
            </div>
          </div>

          {/* Built-in Lesson Presets */}
          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-bold text-stone-100 border-b border-stone-800 pb-3">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Educational Preset Library</span>
            </div>

            <div className="space-y-3">
              {SAMPLE_LESSON_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedPreset(preset);
                    setChapters(preset.chapters);
                    setActiveChapterIdx(0);
                  }}
                  className={`w-full p-3.5 rounded-xl text-left flex flex-col gap-1.5 transition-all border ${
                    selectedPreset.id === preset.id
                      ? "bg-indigo-950/40 border-indigo-500 text-stone-100"
                      : "bg-stone-950/60 hover:bg-stone-950 border-stone-800 text-stone-300"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-300">{preset.title}</span>
                    <span className="text-[10px] text-stone-400 font-mono">{preset.durationLabel}</span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed line-clamp-2">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Remotion Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col gap-4 text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <FileCode className="w-5 h-5" />
                <span>Remotion React JSX Source Code</span>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-stone-400 hover:text-stone-200 text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-stone-300">
              Copy this React component directly into your local Remotion project (<code>@remotion/player</code> or Remotion CLI) to render high-resolution 4K/60fps study videos!
            </div>

            <pre className="p-4 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-indigo-300 overflow-x-auto max-h-96 leading-relaxed">
              <code>{generateRemotionCode()}</code>
            </pre>

            <div className="flex items-center justify-between border-t border-stone-800 pt-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateRemotionCode());
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-colors"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? "Copied to Clipboard!" : "Copy Remotion Code"}</span>
              </button>

              <button
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
