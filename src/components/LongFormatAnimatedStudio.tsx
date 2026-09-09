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
  FileCode,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Mic,
  Video,
  FileText,
  Sliders,
  CheckCircle2,
  ListVideo,
  Eye,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { EXPANDED_CURATED_VIDEO_CATALOG } from "../data/videoCatalog";

const FALLBACK_STOCK_VIDEOS = EXPANDED_CURATED_VIDEO_CATALOG;

export interface RemotionLessonChapter {
  id: string;
  chapterNumber: number;
  title: string;
  durationSeconds: number;
  narration: string;
  searchQuery?: string;
  apiTarget?: string;
  visualStyle?: string;
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

type YouTubeFeature = {
  title: string;
  provider: string;
  description: string;
  capabilities: string[];
};

const DEFAULT_YOUTUBE_FEATURES: YouTubeFeature[] = [
  {
    title: "YouTube Data API v3",
    provider: "Google",
    description: "Video & thumbnail uploads, metadata SEO, playlists, channel assets, and viewer-facing content management.",
    capabilities: ["videos.insert", "thumbnails.set", "channels.list", "playlists.insert", "commentThreads.list"]
  },
  {
    title: "YouTube Analytics API",
    provider: "Google",
    description: "Audience watch time, traffic sources, view counts, retention, and content performance feedback loops.",
    capabilities: ["reports.query", "metrics", "views", "watchTime", "trafficSources"]
  },
  {
    title: "YouTube Reporting API",
    provider: "Google",
    description: "Daily and weekly reporting exports for channel automation, creator operations, and publishing decisions.",
    capabilities: ["reporting", "channel reports", "content reports", "performance exports"]
  }
];

export const CURATED_NEURAL_VOICES = [
  { id: "en-US-JennyNeural", name: "Jenny", gender: "female", tag: "Warm Storyteller" },
  { id: "en-US-AriaNeural", name: "Aria", gender: "female", tag: "Dynamic Creator" },
  { id: "en-US-AvaNeural", name: "Ava", gender: "female", tag: "Studio Host" },
  { id: "en-US-EmmaNeural", name: "Emma", gender: "female", tag: "Friendly Explainer" },
  { id: "en-US-GuyNeural", name: "Guy", gender: "male", tag: "Casual Host" },
  { id: "en-US-ChristopherNeural", name: "Christopher", gender: "male", tag: "Cinematic Narrator" },
  { id: "en-US-BrianNeural", name: "Brian", gender: "male", tag: "Smooth Professional" },
  { id: "en-US-EricNeural", name: "Eric", gender: "male", tag: "Upbeat Dynamic" },
  { id: "en-GB-SoniaNeural", name: "Sonia", gender: "female", tag: "Refined British" },
  { id: "en-GB-RyanNeural", name: "Ryan", gender: "male", tag: "Smooth British" },
];

export const DEFAULT_TECH_TYPO_SCRIPT = `This 45-second Short breaks down the ultimate classic tech nightmare: The $10 Billion Syntax Typo, where a single accidental command wipes out global servers and crashes half the internet.

0:00 - 0:03 | "A single missing slash in a junior dev's terminal command just took down half the global internet." | GIPHY Clips | server explosion panic | Fast zoom on dramatic reaction clip; duck background audio -12dB.
0:03 - 0:12 | "Instead of wiping local test files, the script targeted root directory / on the primary production cluster." | NASA Media API | satellite network telemetry | High-tech visual grid with red signal drop indicators flashing.
0:12 - 0:24 | "Within 40 seconds, global DNS routing collapsed, taking down banking systems, cloud hosts, and video platforms worldwide." | Internet Archive | vintage server rack LEDs | Fast cuts of flashing network switches, retro rack lights, and terminal warning text.
0:24 - 0:36 | "The lead sysadmin had to physically run into the server room and yank the main fiber optic trunk line straight out of the wall." | Internet Archive | vintage cable patching hardware | Rapid industrial montage of physical cables being pulled and emergency sirens.
0:36 - 0:42 | "Have you ever accidentally pushed bad code straight into production? Share your worst tech story below." | NASA Media API | mission control operations | On-screen question graphic overlaid on live control room monitors.
0:42 - 0:45 | "And if you think that was bad, wait until you see what happened when..." (Seamless Loop) | GIPHY Clips | shocked facepalm | 0.8-second reaction cut that seamlessly loops straight back to 0:00.`;

// Multi-Source Visual Script & Asset Pipeline Parser
export function parseCustomStructuredScript(rawScriptText: string): RemotionLessonChapter[] {
  const lines = rawScriptText.split("\n").map(l => l.trim()).filter(Boolean);
  const chapters: RemotionLessonChapter[] = [];

  let idx = 0;
  for (const line of lines) {
    const tsMatch = line.match(/^(\d{1,2}:\d{2})\s*[-–—to]\s*(\d{1,2}:\d{2})/i);
    if (!tsMatch) continue;

    const startStr = tsMatch[1];
    const endStr = tsMatch[2];

    const parseSec = (str: string) => {
      const parts = str.split(":").map(Number);
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    };

    const startSec = parseSec(startStr);
    const endSec = parseSec(endStr);
    const duration = Math.max(2, endSec - startSec);

    const rest = line.slice(tsMatch[0].length).replace(/^[\s:|]+/, "");

    let narration = "";
    let apiTarget = "Pexels Video";
    let searchQuery = "technology server code";
    let visualStyle = "High-tech visual grid";

    if (rest.includes("|")) {
      const parts = rest.split("|").map(p => p.trim());
      narration = parts[0]?.replace(/^["']|["']$/g, "") || "";
      apiTarget = parts[1] || apiTarget;
      searchQuery = parts[2] || searchQuery;
      visualStyle = parts[3] || visualStyle;
    } else {
      const quoteMatch = rest.match(/["']([^"']+)["']/);
      if (quoteMatch) {
        narration = quoteMatch[1];
        const remaining = rest.replace(quoteMatch[0], "").trim();
        searchQuery = remaining.slice(0, 40) || "server cloud technology";
      } else {
        narration = rest;
        searchQuery = rest.slice(0, 30);
      }
    }

    // Pick matching video from catalog
    let bgVideo = EXPANDED_CURATED_VIDEO_CATALOG.find(v =>
      v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.tags?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (!bgVideo) {
      bgVideo = EXPANDED_CURATED_VIDEO_CATALOG[(idx * 2 + 1) % EXPANDED_CURATED_VIDEO_CATALOG.length];
    }

    const overlayTypes: RemotionLessonChapter["overlayType"][] = [
      "code_block",
      "whiteboard_notes",
      "diagram_flow",
      "concept_card",
      "math_formula"
    ];
    const overlayType = overlayTypes[idx % overlayTypes.length];

    chapters.push({
      id: `parsed_ch_${idx + 1}`,
      chapterNumber: idx + 1,
      title: `${startStr}-${endStr}: ${searchQuery || "Scene " + (idx + 1)}`,
      durationSeconds: duration,
      narration: narration || "Visual sequence walkthrough.",
      searchQuery,
      apiTarget,
      visualStyle,
      overlayType,
      overlayData: {
        heading: searchQuery ? searchQuery.toUpperCase() : `Scene ${idx + 1}`,
        subheading: visualStyle || "Multi-Source Visual Script",
        codeLanguage: "bash",
        codeSnippet: overlayType === "code_block" ? `rm -rf / # $10B Syntax Typo\n# Error 404: Root directory targeted\n# Global DNS Routing Collapsed` : undefined,
        bulletPoints: [
          narration.slice(0, 80),
          `Key Concept: ${searchQuery.slice(0, 30) || "Educational"}`,
          "Data Analysis & Visualization"
        ],
        diagramNodes: [
          { id: "1", label: "Dev Terminal", sub: "Typo Trigger" },
          { id: "2", label: "Root Dir /", sub: "Target Path" },
          { id: "3", label: "DNS Servers", sub: "Routing Collapse" },
          { id: "4", label: "Sysadmin", sub: "Fiber Pull" }
        ],
        accentColor: idx % 4 === 0 ? "#f43f5e" : idx % 4 === 1 ? "#3b82f6" : idx % 4 === 2 ? "#eab308" : "#10b981"
      },
      backgroundVideoUrl: bgVideo.downloadUrl,
      backgroundVideoTitle: bgVideo.title || `${apiTarget} Footage`
    });

    idx++;
  }

  return chapters;
}

const SAMPLE_LESSON_PRESETS: LessonPreset[] = [
  {
    id: "tech_typo_nightmare",
    title: "The $10 Billion Syntax Typo (Shorts Format)",
    subject: "computer_science",
    durationLabel: "0:45 mins (Seamless Loop Short)",
    description: "Detailed multi-source visual pipeline breaking down how a single missing slash wiped root production servers.",
    chapters: parseCustomStructuredScript(DEFAULT_TECH_TYPO_SCRIPT)
  },
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
        title: "Sync vs Async Execution & Throughput",
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
        title: "Event Loop Architecture & Sockets",
        durationSeconds: 15,
        narration: "The event loop manages execution tasks. When an async coroutine encounters an await expression, it registers a socket callback and yields.",
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
  }
];

interface LongFormatAnimatedStudioProps {
  script?: string;
  plan?: any;
}

export const LongFormatAnimatedStudio: React.FC<LongFormatAnimatedStudioProps> = ({ script, plan }) => {
  const [selectedPreset, setSelectedPreset] = useState<LessonPreset>(SAMPLE_LESSON_PRESETS[0]);
  const [chapters, setChapters] = useState<RemotionLessonChapter[]>(SAMPLE_LESSON_PRESETS[0].chapters);
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);

  // Keep the plan-driven studio update, but do not auto-parse the outer ScriptInput text.
  // That text is entered into a dedicated paste modal, where the user selects the chapters.
  useEffect(() => {
    if (plan && plan.scenes && plan.scenes.length > 0) {
      const converted: RemotionLessonChapter[] = plan.scenes.map((s: any, idx: number) => {
        const bgVideo = s.selectedMedia
          ? (s.selectedMedia.downloadUrl || s.selectedMedia.previewUrl)
          : (EXPANDED_CURATED_VIDEO_CATALOG[(idx * 2 + 1) % EXPANDED_CURATED_VIDEO_CATALOG.length]?.downloadUrl || FALLBACK_STOCK_VIDEOS[idx % FALLBACK_STOCK_VIDEOS.length].downloadUrl);

        const bgTitle = s.selectedMedia
          ? (s.selectedMedia.title || "Selected B-Roll")
          : (EXPANDED_CURATED_VIDEO_CATALOG[(idx * 2 + 1) % EXPANDED_CURATED_VIDEO_CATALOG.length]?.title || "B-Roll Track");

        const overlayTypes: RemotionLessonChapter["overlayType"][] = [
          "code_block",
          "whiteboard_notes",
          "diagram_flow",
          "concept_card",
          "math_formula"
        ];

        return {
          id: `app_plan_ch_${s.scene_number || idx + 1}`,
          chapterNumber: s.scene_number || idx + 1,
          title: s.script_line ? s.script_line.slice(0, 45) : `Scene ${idx + 1}`,
          durationSeconds: 8,
          narration: s.script_line || "Educational scene analysis.",
          searchQuery: s.search_keywords,
          overlayType: overlayTypes[idx % overlayTypes.length],
          overlayData: {
            heading: `Scene ${s.scene_number || idx + 1}: ${(s.search_keywords || "STUDY").toUpperCase()}`,
            subheading: s.script_line?.slice(0, 60),
            codeLanguage: "typescript",
            codeSnippet: `// Scene ${s.scene_number || idx + 1}\n// ${s.search_keywords}\nconsole.log("Executing study sequence...");`,
            bulletPoints: [
              s.script_line ? s.script_line.slice(0, 70) + "..." : "Exploring the core concepts of this subject.",
              "Identifying critical components and workflows.",
              "Visualizing data for optimized learning outcomes."
            ],
            accentColor: idx % 4 === 0 ? "#3b82f6" : idx % 4 === 1 ? "#10b981" : idx % 4 === 2 ? "#eab308" : "#8b5cf6"
          },
          backgroundVideoUrl: bgVideo,
          backgroundVideoTitle: bgTitle
        };
      });

      if (converted.length > 0) {
        setChapters(converted);
        setActiveChapterIdx(0);
        setCurrentFrame(0);
      }
    }
  }, [plan]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSeamlessMasterPlay, setIsSeamlessMasterPlay] = useState<boolean>(true);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const fps = 30;

  // Voiceover & Neural TTS State
  const [selectedNeuralVoice, setSelectedNeuralVoice] = useState<string>("en-US-JennyNeural");
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);

  // Script import modal & state
  const [showScriptImportModal, setShowScriptImportModal] = useState<boolean>(false);
  const [customScriptText, setCustomScriptText] = useState<string>(DEFAULT_TECH_TYPO_SCRIPT);

  // Video track change modal & search
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [editingVideoChapterIdx, setEditingVideoChapterIdx] = useState<number>(0);
  const [videoSearchQuery, setVideoSearchQuery] = useState<string>("");
  const [customVideoUrlInput, setCustomVideoUrlInput] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>(EXPANDED_CURATED_VIDEO_CATALOG);
  const [isSearchingVideo, setIsSearchingVideo] = useState<boolean>(false);

  // AI Generator Form State
  const [lessonTopic, setLessonTopic] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<"math" | "computer_science" | "physics" | "biology" | "economics">("computer_science");
  const [targetDurationMins, setTargetDurationMins] = useState<number>(5);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState<boolean>(false);

  // Render MP4 Full Video state
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isRenderingFullVideo, setIsRenderingFullVideo] = useState<boolean>(false);
  const [renderingProgress, setRenderingProgress] = useState<string | null>(null);
  const [youtubeFeatures, setYoutubeFeatures] = useState<YouTubeFeature[]>(DEFAULT_YOUTUBE_FEATURES);
  const [isPublishingToYouTube, setIsPublishingToYouTube] = useState<boolean>(false);
  const [youtubeVisibility, setYoutubeVisibility] = useState<"private" | "unlisted" | "public">("private");
  const [youtubePublishStatus, setYoutubePublishStatus] = useState<string | null>(null);
  const [youtubeAnalyticsStatus, setYoutubeAnalyticsStatus] = useState<string | null>(null);

  const [publishedVideoId, setPublishedVideoId] = useState<string>("");
  const [contentPlanTags, setContentPlanTags] = useState<string[]>([]);
  const [contentPlanKeywords, setContentPlanKeywords] = useState<string[]>([]);
  const [contentPlanTopics, setContentPlanTopics] = useState<string[]>([]);
  const [contentPlanTelemetryAvailable, setContentPlanTelemetryAvailable] = useState<boolean>(false);
  const [contentPlanTelemetryRows, setContentPlanTelemetryRows] = useState<number>(0);
  const [contentPlanStatus, setContentPlanStatus] = useState<string | null>(null);
  const [isSyncingAnalyticsAndOptimization, setIsSyncingAnalyticsAndOptimization] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/youtube/features")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.features?.length) {
          setYoutubeFeatures(data.features);
        }
      })
      .catch(() => {
        setYoutubeFeatures(DEFAULT_YOUTUBE_FEATURES);
      });
  }, []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<number | null>(null);

  // Current active chapter
  const currentChapter = chapters[activeChapterIdx] || chapters[0];

  // Total Master Video Duration in Seconds & Frames
  const masterTotalSeconds = chapters.reduce((sum, ch) => sum + ch.durationSeconds, 0);
  const masterTotalFrames = Math.max(1, masterTotalSeconds * fps);

  // Calculate master frame & active chapter during continuous playback
  const getChapterIndexFromMasterFrame = useCallback((frame: number) => {
    let accumulated = 0;
    for (let i = 0; i < chapters.length; i++) {
      const durFrames = chapters[i].durationSeconds * fps;
      if (frame >= accumulated && frame < accumulated + durFrames) {
        return { index: i, frameInChapter: frame - accumulated, chapterDurFrames: durFrames };
      }
      accumulated += durFrames;
    }
    return { index: chapters.length - 1, frameInChapter: 0, chapterDurFrames: (chapters[chapters.length - 1]?.durationSeconds || 5) * fps };
  }, [chapters, fps]);

  // Synthesize voiceover TTS for current active chapter
  const generateChapterVoiceover = useCallback(async (narrationText: string, voiceId: string) => {
    if (!narrationText.trim()) return;
    setIsGeneratingAudio(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: narrationText, voice: voiceId })
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
  }, []);

  // Update voiceover whenever chapter or selected voice changes
  useEffect(() => {
    if (currentChapter) {
      generateChapterVoiceover(currentChapter.narration, selectedNeuralVoice);
    }
  }, [activeChapterIdx, currentChapter?.id, selectedNeuralVoice, generateChapterVoiceover]);

  // Master Continuous Frame Ticker Loop
  useEffect(() => {
    if (isPlaying) {
      if (audioRef.current && audioBlobUrl && !isMuted) {
        audioRef.current.play().catch(() => {});
      }
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }

      const animate = () => {
        setCurrentFrame((prevMasterFrame) => {
          if (prevMasterFrame >= masterTotalFrames) {
            // Loop or stop
            if (isSeamlessMasterPlay) {
              setActiveChapterIdx(0);
              return 0;
            } else {
              setIsPlaying(false);
              return masterTotalFrames;
            }
          }

          const nextFrame = prevMasterFrame + 1;
          const { index: newIdx } = getChapterIndexFromMasterFrame(nextFrame);
          if (newIdx !== activeChapterIdx) {
            setActiveChapterIdx(newIdx);
          }
          return nextFrame;
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
  }, [isPlaying, masterTotalFrames, activeChapterIdx, isSeamlessMasterPlay, getChapterIndexFromMasterFrame, audioBlobUrl, isMuted]);

  // Test / Audition selected voice
  const handleTestSelectedVoice = async () => {
    if (isTestingVoice) return;
    setIsTestingVoice(true);
    try {
      const voiceObj = CURATED_NEURAL_VOICES.find(v => v.id === selectedNeuralVoice) || CURATED_NEURAL_VOICES[0];
      const testText = `Hello! I am ${voiceObj.name}, your neural studio narrator. Every scene in your video will be spoken with this natural voice.`;
      const res = await fetch(`/api/tts?text=${encodeURIComponent(testText)}&voice=${encodeURIComponent(selectedNeuralVoice)}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const auditionAudio = new Audio(url);
        auditionAudio.onended = () => setIsTestingVoice(false);
        auditionAudio.onerror = () => setIsTestingVoice(false);
        await auditionAudio.play();
      } else {
        setIsTestingVoice(false);
      }
    } catch {
      setIsTestingVoice(false);
    }
  };

  // Import custom structured script
  const handleImportStructuredScript = () => {
    if (!customScriptText.trim()) return;
    const parsedChapters = parseCustomStructuredScript(customScriptText.trim());
    if (parsedChapters.length > 0) {
      setChapters(parsedChapters);
      setActiveChapterIdx(0);
      setCurrentFrame(0);
      setSelectedPreset({
        id: "custom_imported_script",
        title: "Imported Multi-Source Visual Script",
        subject: "computer_science",
        durationLabel: `${parsedChapters.reduce((s, c) => s + c.durationSeconds, 0)}s Short/Lesson`,
        description: "Custom parsed script pipeline with timestamps, API targets, and voiceovers.",
        chapters: parsedChapters
      });
      setShowScriptImportModal(false);
    }
  };

  // Search video track for current chapter
  const handleSearchVideoTrack = async (query: string) => {
    if (!query.trim()) return;
    setIsSearchingVideo(true);
    try {
      const res = await fetch(`/api/stock/search?query=${encodeURIComponent(query)}&mediaType=video`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setSearchResults(data.results);
        } else {
          setSearchResults(EXPANDED_CURATED_VIDEO_CATALOG);
        }
      }
    } catch {
      setSearchResults(EXPANDED_CURATED_VIDEO_CATALOG);
    } finally {
      setIsSearchingVideo(false);
    }
  };

  // Assign background video clip to active editing chapter
  const handleSelectVideoForChapter = (videoUrl: string, videoTitle: string) => {
    setChapters(prev => prev.map((ch, idx) => {
      if (idx !== editingVideoChapterIdx) return ch;
      return {
        ...ch,
        backgroundVideoUrl: videoUrl,
        backgroundVideoTitle: videoTitle
      };
    }));
    setShowVideoModal(false);
  };

  // Generate AI Long-Form Animated Lesson
  const handleGenerateAILesson = async () => {
    if (!lessonTopic.trim()) return;
    setIsGeneratingLesson(true);
    try {
      const prompt = `Create a structured long-form animated study lesson on: "${lessonTopic}".
Subject area: ${selectedSubject}.
Target duration: ${targetDurationMins} minutes.`;

      const res = await fetch("/api/analyze-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: prompt })
      });

      if (res.ok) {
        const data = await res.json();
        const generatedChapters: RemotionLessonChapter[] = (data.scenes || []).slice(0, 5).map((sc: any, idx: number) => {
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
            durationSeconds: 12,
            narration: sc.script_line || `In this chapter, we explore the core mechanics of ${lessonTopic}.`,
            overlayType,
            overlayData: {
              heading: `Key Concept: Chapter ${idx + 1}`,
              subheading: lessonTopic,
              codeLanguage: "python",
              codeSnippet: overlayType === "code_block" ? `def execute_pipeline(data):\n    return process(data)\n\n# Execution complete` : undefined,
              bulletPoints: [
                `Understand core principles of ${lessonTopic}`,
                "Analyze mathematical and computational foundations",
                "Apply step-by-step problem solving strategies"
              ],
              diagramNodes: [
                { id: "1", label: "Input Data", sub: "Features" },
                { id: "2", label: "Model Layer", sub: "Transform" },
                { id: "3", label: "Evaluation", sub: "Metrics" },
                { id: "4", label: "Output", sub: "Result" }
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
          setCurrentFrame(0);
        }
      }
    } catch (e) {
      console.warn("AI Lesson generation error:", e);
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  // Synthesize & Render Full MP4 Video
  const buildScenePayloads = () => chapters.map((ch) => ({
    scene_number: ch.chapterNumber,
    script_line: ch.title,
    narration: ch.narration,
    duration: ch.durationSeconds,
    search_keywords: ch.title,
    videoUrl: ch.backgroundVideoUrl,
    transition: "fade",
    subtitle: ch.narration,
    overlayData: ch.overlayData,
    title: ch.title
  }));

  const handleRenderFullVideo = async () => {
    setIsRenderingFullVideo(true);
    setRenderingProgress("Initializing complete video render engine...");

    try {
      const scenePayloads = buildScenePayloads();

      setRenderingProgress("Downloading background footage & stitching audio/video tracks...");
      const res = await fetch("/api/render-complete-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedPreset.id || "remotion_animated_study",
          aspectRatio: "16:9",
          scenes: scenePayloads,
          voice: selectedNeuralVoice
        })
      });

      if (!res.ok) {
        throw new Error(`Rendering failed with HTTP ${res.status}`);
      }

      // Trigger direct browser download of the rendered MP4 file
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${selectedPreset.id || "animated_study_lesson"}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setRenderingProgress("Rendering complete! Video downloaded successfully.");
    } catch (e: any) {
      console.error("Render error:", e);
      setRenderingProgress(`Rendering note: ${e.message}`);
    } finally {
      setIsRenderingFullVideo(false);
    }
  };

  const handlePublishToYouTube = async () => {
    if (isPublishingToYouTube || isRenderingFullVideo) return;
    setIsPublishingToYouTube(true);
    setYoutubePublishStatus("Rendering MP4 for YouTube upload...");
    setYoutubeAnalyticsStatus(null);

    try {
      const scenePayloads = buildScenePayloads();
      const res = await fetch("/api/render-complete-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedPreset.id || "remotion_animated_study",
          aspectRatio: "16:9",
          scenes: scenePayloads,
          voice: selectedNeuralVoice
        })
      });

      if (!res.ok) {
        throw new Error(`Rendering failed with HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const videoDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Unable to convert the rendered MP4 into a YouTube payload."));
        reader.readAsDataURL(blob);
      });

      setYoutubePublishStatus("Uploading MP4 through the YouTube OAuth 2.0 gateway...");

      const publishRes = await fetch("/api/youtube/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${selectedPreset.title || "Remotion Study"}`,
          description: `${selectedPreset.description || "Generated by the AI Video B-Roll Assistant."}\n\nSource: ${selectedPreset.title}`,
          tags: [selectedPreset.subject, "ai video", "learning", "remotion", "youtube automation"],
          categoryId: "27",
          privacyStatus: youtubeVisibility,
          videoDataUrl,
          playlistId: undefined
        })
      });

      if (!publishRes.ok) {
        const errJson = await publishRes.json().catch(() => ({ error: "YouTube upload failed with an unknown error" }));
        throw new Error(errJson.error || `YouTube publish failed with HTTP ${publishRes.status}`);
      }

      const uploadPayload = await publishRes.json();
      const storedVideoId = uploadPayload?.contentRecord?.videoId || uploadPayload?.youtube?.id || "";
      setPublishedVideoId(storedVideoId);
      setContentPlanTags(Array.isArray(uploadPayload?.contentRecord?.tags) ? uploadPayload.contentRecord.tags : []);
      setContentPlanKeywords([]);
      setContentPlanTopics([]);
      setYoutubePublishStatus(`Published to YouTube successfully: ${storedVideoId || "video"}`);

      try {
        const analyticsRes = await fetch(`/api/youtube/analytics?startDate=${encodeURIComponent(new Date().toISOString().slice(0, 10))}&endDate=${encodeURIComponent(new Date().toISOString().slice(0, 10))}&metrics=${encodeURIComponent("views,estimatedMinutesWatched")}&dimensions=${encodeURIComponent("day")}`);
        if (!analyticsRes.ok) {
          const errJson = await analyticsRes.json().catch(() => ({ error: "analytics pending" }));
          setYoutubeAnalyticsStatus(errJson.error || "Analytics are pending for the newly published video.");
        } else {
          const analytics = await analyticsRes.json();
          if (analytics?.analytics?.rows?.length) {
            setYoutubeAnalyticsStatus(`Telemetry ready: ${analytics.analytics.rows.length} report row(s).`);
          } else {
            setYoutubeAnalyticsStatus("Telemetry pending: the Analytics API has not yet reported this newly published video.");
          }
        }
      } catch (err) {
        setYoutubeAnalyticsStatus("Telemetry pending: YouTube Analytics data is not available yet for this newly published video.");
      }
    } catch (e: any) {
      console.error("YouTube publish error:", e);
      setYoutubePublishStatus(`YouTube publish note: ${e.message}`);
      setYoutubeAnalyticsStatus("Telemetry pending: analytics unavailable until the upload appears in the YouTube channel report stream.");
    } finally {
      setIsPublishingToYouTube(false);
    }
  };

  const handleSyncAnalyticsAndOptimize = async () => {
    if (!publishedVideoId) {
      setContentPlanStatus("Publish a video to YouTube first to generate a stored video.id.");
      return;
    }

    setIsSyncingAnalyticsAndOptimization(true);
    setContentPlanStatus("Syncing analytics and optimizing your content plan...");

    try {
      const endDate = new Date().toISOString().slice(0, 10);
      const analyticsUrl = `/api/youtube/analytics?videoId=${encodeURIComponent(publishedVideoId)}&startDate=${encodeURIComponent("2026-01-01")}&endDate=${encodeURIComponent(endDate)}&metrics=${encodeURIComponent("views,estimatedMinutesWatched")}&dimensions=${encodeURIComponent("day")}`;
      const analyticsRes = await fetch(analyticsUrl);
      if (!analyticsRes.ok) {
        const errJson = await analyticsRes.json().catch(() => ({ error: "Analytics sync failed" }));
        throw new Error(errJson.error || "Analytics sync failed");
      }

      const analyticsPayload = await analyticsRes.json();
      const analyticsRows = Array.isArray(analyticsPayload?.analytics?.rows) ? analyticsPayload.analytics.rows.length : 0;
      setContentPlanTelemetryRows(analyticsRows);
      setContentPlanTelemetryAvailable(analyticsRows > 0);

      const optimizeRes = await fetch("/api/youtube/optimization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: publishedVideoId,
          title: selectedPreset.title || "AI Generated Video",
          description: selectedPreset.description || "",
          tags: contentPlanTags,
          searchKeywords: contentPlanKeywords,
          topic: selectedPreset.title || "automation content"
        })
      });

      if (!optimizeRes.ok) {
        const errJson = await optimizeRes.json().catch(() => ({ error: "Optimization sync failed" }));
        throw new Error(errJson.error || "Optimization sync failed");
      }

      const optimized = await optimizeRes.json();
      const plan = optimized?.contentPlan || {};
      setContentPlanTags(Array.isArray(plan.tags) ? plan.tags : []);
      setContentPlanKeywords(Array.isArray(plan.searchKeywords) ? plan.searchKeywords : []);
      setContentPlanTopics(Array.isArray(plan.topicRecommendations) ? plan.topicRecommendations : []);
      setContentPlanTelemetryRows(Array.isArray(optimized?.contentPlan?.telemetryRows) ? optimized.contentPlan.telemetryRows : analyticsRows);
      setContentPlanTelemetryAvailable(Boolean(optimized?.contentPlan?.telemetryAvailable));
      setContentPlanStatus(`Telemetry rows: ${plan.telemetryRows ?? analyticsRows}.`);
    } catch (e: any) {
      console.error("Content sync error:", e);
      setContentPlanStatus(`Content sync note: ${e.message}`);
    } finally {
      setIsSyncingAnalyticsAndOptimization(false);
    }
  };

  const handleExportContentPlanJson = async () => {
    const payload = {
      videoId: publishedVideoId || "pending-upload",
      generatedAt: new Date().toISOString(),
      telemetry: {
        available: contentPlanTelemetryAvailable,
        rows: contentPlanTelemetryRows
      },
      tags: contentPlanTags,
      searchKeywords: contentPlanKeywords,
      topicRecommendations: contentPlanTopics,
      source: {
        title: selectedPreset.title || "AI Generated Video",
        subject: selectedPreset.subject || "computer_science",
        description: selectedPreset.description || ""
      }
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `content-plan-${publishedVideoId || "draft"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(json);
        setContentPlanStatus("Content plan exported and copied to clipboard.");
      } else {
        setContentPlanStatus("Content plan exported to JSON download.");
      }
    } catch {
      setContentPlanStatus("Content plan exported to JSON download.");
    }
  };

  // Remotion interpolation helper
  const interpolate = (frame: number, inputRange: [number, number], outputRange: [number, number]) => {
    const [inMin, inMax] = inputRange;
    const [outMin, outMax] = outputRange;
    if (frame <= inMin) return outMin;
    if (frame >= inMax) return outMax;
    const ratio = (frame - inMin) / (inMax - inMin);
    return outMin + ratio * (outMax - outMin);
  };

  // Render Remotion Motion Overlay
  const renderRemotionGraphicOverlay = () => {
    const { frameInChapter, chapterDurFrames } = getChapterIndexFromMasterFrame(currentFrame);
    const opacity = interpolate(frameInChapter, [0, 15], [0, 1]);
    const translateY = interpolate(frameInChapter, [0, 20], [35, 0]);
    const accentColor = currentChapter.overlayData?.accentColor || "#3b82f6";

    return (
      <div
        className="absolute inset-0 p-6 md:p-10 flex flex-col justify-between pointer-events-none select-none transition-all duration-300"
        style={{ opacity, transform: `translateY(${translateY}px)` }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-stone-950/85 border border-stone-800/80 backdrop-blur-md shadow-lg">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-stone-100 tracking-wide">
              Scene {currentChapter.chapterNumber}/{chapters.length}: {currentChapter.title}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/90 border border-indigo-500/40 text-indigo-300 text-[11px] font-mono font-semibold shadow-lg">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>REMOTION MOTION OVERLAY</span>
          </div>
        </div>

        {/* Center Canvas */}
        <div className="my-auto max-w-3xl mx-auto w-full">
          {currentChapter.overlayType === "code_block" && (
            <div
              className="p-6 rounded-2xl bg-stone-950/95 border-2 backdrop-blur-xl shadow-2xl flex flex-col gap-3 font-mono"
              style={{ borderColor: accentColor }}
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Code className="w-4 h-4" />
                  <span>{currentChapter.overlayData?.heading || "Code Execution Pipeline"}</span>
                </div>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">
                  {currentChapter.overlayData?.codeLanguage || "bash"}
                </span>
              </div>

              <pre className="p-4 rounded-xl bg-stone-900/90 border border-stone-800/80 text-xs md:text-sm text-emerald-300 overflow-x-auto leading-relaxed">
                <code>
                  {(currentChapter.overlayData?.codeSnippet || "").slice(
                    0,
                    Math.floor(
                      interpolate(
                        frameInChapter,
                        [5, chapterDurFrames - 15],
                        [0, (currentChapter.overlayData?.codeSnippet || "").length]
                      )
                    )
                  )}
                  <span className="animate-pulse font-bold text-emerald-400">|</span>
                </code>
              </pre>
            </div>
          )}

          {currentChapter.overlayType !== "code_block" && (
            <div
              className="p-6 md:p-8 rounded-2xl bg-stone-950/90 border-2 backdrop-blur-xl shadow-2xl flex flex-col gap-4 text-stone-100"
              style={{ borderColor: accentColor }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <BookOpen className="w-4 h-4" />
                  <span>{currentChapter.overlayData?.heading || "Visual Breakdown"}</span>
                </div>
                {currentChapter.visualStyle && (
                  <span className="text-xs text-stone-400 font-mono">{currentChapter.visualStyle}</span>
                )}
              </div>

              <div className="space-y-2 pt-1">
                {(currentChapter.overlayData?.bulletPoints || []).map((bp, bIdx) => (
                  <div
                    key={bIdx}
                    className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-xs text-stone-200 flex items-start gap-3 shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                    <span className="leading-relaxed">{bp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar: Subtitles */}
        <div className="p-3 rounded-xl bg-stone-950/90 border border-stone-800/80 backdrop-blur-md text-xs text-center font-medium text-amber-200 shadow-xl max-w-2xl mx-auto w-full leading-relaxed">
          "{currentChapter.narration}"
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
            <span className="text-stone-400 text-xs">• Long-Format Animated Studies</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-stone-100 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-400" />
            <span>Long-Format Animated Studies & Remotion Studio</span>
          </h2>
          <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
            Create multi-scene animated educational courses, STEM lectures, and multi-source visual pipeline shorts. Combines real-time React Remotion motion overlays with customizable stock video tracks and neural studio TTS voiceovers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowScriptImportModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-md transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Paste Custom Script</span>
          </button>

          <div className="flex items-center gap-2 rounded-xl bg-stone-900 border border-stone-700 px-2">
            <label className="text-[10px] uppercase tracking-wide text-stone-400">Visibility</label>
            <select
              value={youtubeVisibility}
              onChange={(e) => setYoutubeVisibility(e.target.value as "private" | "unlisted" | "public")}
              className="bg-stone-950 text-stone-100 text-xs px-2 py-2 rounded-lg border border-stone-700 focus:outline-none"
              title="YouTube video visibility"
            >
              <option value="private">private</option>
              <option value="unlisted">unlisted</option>
              <option value="public">public</option>
            </select>
          </div>

          <button
            onClick={handlePublishToYouTube}
            disabled={isPublishingToYouTube || isRenderingFullVideo}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 transition-colors"
          >
            <Film className="w-4 h-4" />
            <span>{isPublishingToYouTube ? "Publishing..." : "Publish to YouTube"}</span>
          </button>

          <button
            onClick={handleRenderFullVideo}
            disabled={isRenderingFullVideo}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-colors"
          >
            <Film className="w-4 h-4" />
            <span>{isRenderingFullVideo ? "Synthesizing MP4..." : "Render Full MP4 Lesson"}</span>
          </button>
        </div>
      </div>

      {/* Render Status Banner */}
      {renderingProgress && (
        <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-700/60 text-indigo-200 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-indigo-400 animate-ping" />
            <span className="font-mono">{renderingProgress}</span>
          </div>
        </div>
      )}

      {(youtubePublishStatus || youtubeAnalyticsStatus) && (
        <div className="p-4 rounded-xl bg-stone-900 border border-stone-700 text-stone-200 text-xs flex flex-col gap-2">
          {youtubePublishStatus && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono">{youtubePublishStatus}</span>
            </div>
          )}
          {youtubeAnalyticsStatus && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-mono text-amber-200">{youtubeAnalyticsStatus}</span>
            </div>
          )}
        </div>
      )}

      <section className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-indigo-300 font-bold">Content Plan View</div>
            <div className="text-sm font-semibold text-stone-100 mt-1">Stored video ID: <span className="font-mono text-amber-300">{publishedVideoId || "pending upload"}</span></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncAnalyticsAndOptimize}
              disabled={isSyncingAnalyticsAndOptimization || !publishedVideoId}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{isSyncingAnalyticsAndOptimization ? "Syncing..." : "Sync Analytics & Optimize"}</span>
            </button>
            <button
              onClick={handleExportContentPlanJson}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-2 shadow-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Content Plan (JSON)</span>
            </button>
          </div>
        </div>

        {contentPlanStatus && (
          <div className="mt-3 text-xs font-mono text-amber-200">{contentPlanStatus}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="rounded-xl bg-stone-950/60 border border-stone-800 p-3">
            <div className="text-[10px] uppercase tracking-widest text-stone-500">Tags</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(contentPlanTags.length ? contentPlanTags : ["automation", "ai video"]).map((tag, idx) => (
                <span key={`${tag}-${idx}`} className="px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-[11px] border border-indigo-500/30">{tag}</span>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-stone-950/60 border border-stone-800 p-3">
            <div className="text-[10px] uppercase tracking-widest text-stone-500">Search Keywords</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(contentPlanKeywords.length ? contentPlanKeywords : [selectedPreset.title || "ai video"]).map((kw, idx) => (
                <span key={`${kw}-${idx}`} className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-[11px] border border-emerald-500/30">{kw}</span>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-stone-950/60 border border-stone-800 p-3">
            <div className="text-[10px] uppercase tracking-widest text-stone-500">Topic Recommendations</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(contentPlanTopics.length ? contentPlanTopics : [selectedPreset.title || "automation content"]).map((topic, idx) => (
                <span key={`${topic}-${idx}`} className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-200 text-[11px] border border-amber-500/30">{topic}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Player & Scene Timeline (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Remotion Canvas Stage */}
          <div className="relative aspect-video w-full rounded-2xl bg-stone-950 border border-stone-800 overflow-hidden shadow-2xl group">
            {/* Layer 1: Background Stock Video Track */}
            <video
              ref={videoRef}
              src={currentChapter.backgroundVideoUrl}
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-40 transition-opacity duration-300"
            />

            {/* Layer 2: Remotion Graphic Animation Overlay */}
            {renderRemotionGraphicOverlay()}

            {/* Hidden Voiceover Audio Element */}
            {audioBlobUrl && (
              <audio
                ref={audioRef}
                src={audioBlobUrl}
                muted={isMuted}
              />
            )}
          </div>

          {/* Player Toolbar Controls & Master Timeline */}
          <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
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
                    setActiveChapterIdx(0);
                    setIsPlaying(false);
                  }}
                  className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 transition-colors"
                  title="Reset to start"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <div className="text-xs font-mono text-stone-400">
                  Time: <span className="text-amber-400 font-bold">{(currentFrame / fps).toFixed(1)}s</span> / {masterTotalSeconds}s (Scene {activeChapterIdx + 1}/{chapters.length})
                </div>
              </div>

              {/* Neural Studio Voice Selector */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800">
                  <Mic className="w-3.5 h-3.5 text-amber-400" />
                  <select
                    value={selectedNeuralVoice}
                    onChange={(e) => setSelectedNeuralVoice(e.target.value)}
                    className="bg-transparent text-stone-200 text-xs font-medium focus:outline-hidden"
                  >
                    {CURATED_NEURAL_VOICES.map((v) => (
                      <option key={v.id} value={v.id} className="bg-stone-900 text-stone-100">
                        {v.name} ({v.tag})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleTestSelectedVoice}
                  disabled={isTestingVoice}
                  className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Audition voice"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isTestingVoice ? "Speaking..." : "Audition"}</span>
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>
            </div>

            {/* Master Seamless Scrubber */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={masterTotalFrames}
                value={currentFrame}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCurrentFrame(val);
                  const { index } = getChapterIndexFromMasterFrame(val);
                  if (index !== activeChapterIdx) {
                    setActiveChapterIdx(index);
                  }
                }}
                className="w-full accent-amber-500 cursor-pointer h-1.5 rounded-lg bg-stone-950"
              />
              <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                <span>0:00</span>
                <span>Seamless Master Playback Flow</span>
                <span>{masterTotalSeconds}s</span>
              </div>
            </div>
          </div>

          {/* Video Track & Scene Modules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Scene Video Tracks ({chapters.length} Scenes)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {chapters.map((ch, idx) => (
                <div
                  key={ch.id}
                  className={`p-3.5 rounded-xl flex flex-col gap-2 transition-all border ${
                    activeChapterIdx === idx
                      ? "bg-amber-500/10 border-amber-500 text-stone-100 shadow-md"
                      : "bg-stone-900 border-stone-800 text-stone-300"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        setActiveChapterIdx(idx);
                        let accum = 0;
                        for (let i = 0; i < idx; i++) accum += chapters[i].durationSeconds * fps;
                        setCurrentFrame(accum);
                      }}
                      className="font-bold text-amber-400 font-mono hover:underline flex items-center gap-1"
                    >
                      <span>Scene {ch.chapterNumber}</span>
                      <span className="text-[10px] text-stone-400">({ch.durationSeconds}s)</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingVideoChapterIdx(idx);
                        setVideoSearchQuery(ch.searchQuery || ch.title);
                        setShowVideoModal(true);
                      }}
                      className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-[11px] font-semibold text-indigo-300 flex items-center gap-1 border border-stone-700/60"
                    >
                      <Video className="w-3 h-3 text-indigo-400" />
                      <span>Change Video Track</span>
                    </button>
                  </div>

                  <div className="text-xs font-semibold line-clamp-1">{ch.title}</div>

                  <div className="p-2 rounded-lg bg-stone-950/80 border border-stone-800/80 text-[11px] text-stone-400 flex items-center justify-between gap-2">
                    <span className="truncate font-mono">Track: {ch.backgroundVideoTitle}</span>
                    {ch.apiTarget && <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-indigo-950 text-indigo-300 font-mono shrink-0">{ch.apiTarget}</span>}
                  </div>

                  <div className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed font-serif italic">
                    "{ch.narration}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Generator & Presets */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Custom Script Quick Loader Banner */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/50 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Multi-Source Script Pipeline Ready</span>
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              Have a timestamped script with GIPHY, NASA, or Archive API targets? Click "Paste Custom Script" above to parse it instantly!
            </p>
          </div>

          {/* Screenshot-aligned YouTube Automation API Cards */}
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-stone-100">
                <Film className="w-4 h-4 text-red-400" />
                <span>YouTube Automation API Stack</span>
              </div>
              <button
                className="w-9 h-9 rounded-full bg-stone-700 hover:bg-stone-600 text-white text-lg flex items-center justify-center"
                title="Next automation API"
                onClick={() => {
                  const next = youtubeFeatures[1 % youtubeFeatures.length];
                  setYoutubeFeatures([next, ...youtubeFeatures.filter((f) => f.title !== next.title)]);
                }}
              >
                <span aria-hidden="true">›</span>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {youtubeFeatures.slice(0, 3).map((feature, idx) => (
                <div key={feature.title} className="rounded-2xl bg-stone-950/60 border border-stone-700 p-4 min-h-[180px] flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-10 h-10 bg-red-500 rounded-md flex items-center justify-center">
                      <Play className="w-4 h-4 fill-white text-white" />
                    </span>
                    <span className="text-lg font-semibold text-stone-100">{feature.title}</span>
                  </div>
                  <div className="text-xs text-stone-400 font-medium">{feature.provider}</div>
                  <div className="text-sm text-stone-300 leading-relaxed">{feature.description}</div>
                  {idx === 0 && (
                    <div className="mt-auto flex flex-wrap gap-2">
                      {feature.capabilities.slice(0, 3).map((cap) => (
                        <span key={cap} className="px-2 py-0.5 rounded-full bg-stone-800 text-[10px] text-stone-300 border border-stone-700">{cap}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI Study Lesson Generator */}
          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-bold text-stone-100 border-b border-stone-800 pb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Generate AI Lesson Plan</span>
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

          {/* Built-in Presets */}
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
                    setCurrentFrame(0);
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

      {/* Video Track Selection Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Video className="w-5 h-5" />
                <span>Select Background Video Track (Scene {editingVideoChapterIdx + 1})</span>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-stone-400 hover:text-stone-200 text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={videoSearchQuery}
                onChange={(e) => setVideoSearchQuery(e.target.value)}
                placeholder="Search stock video B-roll (e.g. server room, satellite, matrix code)..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:outline-hidden"
              />
              <button
                onClick={() => handleSearchVideoTrack(videoSearchQuery)}
                disabled={isSearchingVideo}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isSearchingVideo ? "Searching..." : "Search"}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
              {searchResults.map((item, idx) => (
                <button
                  key={item.id || idx}
                  onClick={() => handleSelectVideoForChapter(item.downloadUrl || item.previewUrl, item.title || "Selected B-Roll")}
                  className="p-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 flex flex-col gap-2 text-left group transition-all"
                >
                  <div className="aspect-video w-full rounded-lg bg-stone-900 overflow-hidden relative">
                    <img src={item.thumbnailUrl || item.previewUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-xs bg-black/80 text-[9px] font-mono text-stone-300">
                      {item.source || "stock"}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-stone-200 line-clamp-1">{item.title || "Stock Video Clip"}</div>
                </button>
              ))}
            </div>

            <div className="border-t border-stone-800 pt-3 flex items-center gap-2">
              <input
                type="text"
                value={customVideoUrlInput}
                onChange={(e) => setCustomVideoUrlInput(e.target.value)}
                placeholder="Or paste direct video URL (https://...)"
                className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs"
              />
              <button
                onClick={() => {
                  if (customVideoUrlInput.trim()) {
                    handleSelectVideoForChapter(customVideoUrlInput.trim(), "Custom Video Track");
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shrink-0"
              >
                Apply Custom URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Script Import Modal */}
      {showScriptImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col gap-4 text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <FileText className="w-5 h-5" />
                <span>Paste Custom Multi-Source Visual Script</span>
              </div>
              <button
                onClick={() => setShowScriptImportModal(false)}
                className="text-stone-400 hover:text-stone-200 text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-stone-300 leading-relaxed space-y-1">
              <p>Paste your timestamped script breakdown (supports multi-column piped formats with timestamps, voiceover text, API targets, and queries!):</p>
              <p className="text-[11px] text-stone-400 font-mono">Example: <code>0:00 - 0:03 | "Voiceover line..." | GIPHY Clips | search query | Visual style</code></p>
            </div>

            <textarea
              rows={10}
              value={customScriptText}
              onChange={(e) => setCustomScriptText(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs font-mono focus:outline-hidden focus:border-amber-500 leading-relaxed"
            />

            <div className="flex items-center justify-between border-t border-stone-800 pt-3">
              <button
                onClick={() => setCustomScriptText(DEFAULT_TECH_TYPO_SCRIPT)}
                className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 text-xs font-medium"
              >
                Load Example ($10B Syntax Typo)
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowScriptImportModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportStructuredScript}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Parse & Build Remotion Chapters</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
