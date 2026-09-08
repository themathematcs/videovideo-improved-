import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Sparkles, Play, Pause, RotateCcw, Download, Music, Volume2, VolumeX,
  Layers, Sliders, CheckCircle2, Loader2, ArrowRight, Video, FileText,
  Monitor, Smartphone, Maximize2, Minimize2, ExternalLink, RefreshCw,
  Mic, User, Volume1, Settings2, ChevronDown, ChevronUp, Columns, Film, Check,
  Search, X, Upload, Disc, Radio, Filter, FolderOpen
} from "lucide-react";
import { AutoVideoPlan, AutoVideoScene, StockMediaItem, AudioTrackItem } from "../types";
import { EXPANDED_CURATED_MUSIC_LIBRARY, MUSIC_GENRES, MusicGenre } from "../data/musicCatalog";

// Keywords to accurately distinguish female and male synthesizer voices across OS and browsers
const FEMALE_VOICE_KEYWORDS = [
  "female", "woman", "zira", "jenny", "samantha", "victoria", "karen", "aria",
  "sonia", "libby", "susan", "hazel", "catherine", "lisa", "stephanie", "eva",
  "ava", "emma", "serena", "moira", "fiona", "tessa", "alice", "allison", "shelley",
  "ana", "claire", "julie", "laura", "helena", "microsoft jenny", "google us english (female)"
];

const MALE_VOICE_KEYWORDS = [
  "male", "man", "david", "guy", "mark", "daniel", "george", "james", "ryan",
  "richard", "tom", "oliver", "alex", "brian", "lee", "steve", "fred", "reed", "cosmo",
  "microsoft guy", "google us english (male)"
];

interface AutonomousVideoCreatorProps {
  onExportToStoryboard?: (plan: any) => void;
}

// Guaranteed rock-solid diverse fallback stock video footage pool
const FALLBACK_STOCK_VIDEOS: StockMediaItem[] = [
  {
    id: "fallback-v1-code",
    source: "pixabay",
    type: "video",
    title: "Software Developer Coding",
    previewUrl: "https://cdn.pixabay.com/video/2020/05/25/40130-424754705_large.mp4",
    downloadUrl: "https://cdn.pixabay.com/video/2020/05/25/40130-424754705_large.mp4",
    thumbnailUrl: "https://cdn.pixabay.com/photo/2020/05/25/17/03/code-5219468_640.jpg",
    width: 1920,
    height: 1080,
    duration: 10,
    author: "Pixabay Video",
  },
  {
    id: "fallback-v2-cyber",
    source: "pixabay",
    type: "video",
    title: "Digital High Tech Matrix",
    previewUrl: "https://cdn.pixabay.com/video/2019/04/23/23011-332470725_large.mp4",
    downloadUrl: "https://cdn.pixabay.com/video/2019/04/23/23011-332470725_large.mp4",
    thumbnailUrl: "https://cdn.pixabay.com/photo/2019/04/23/15/45/binary-code-4149830_640.jpg",
    width: 1920,
    height: 1080,
    duration: 12,
    author: "Pixabay Video",
  },
  {
    id: "fallback-v3-office",
    source: "pixabay",
    type: "video",
    title: "Modern Tech Workspace",
    previewUrl: "https://cdn.pixabay.com/video/2016/09/21/5361-183786491_large.mp4",
    downloadUrl: "https://cdn.pixabay.com/video/2016/09/21/5361-183786491_large.mp4",
    thumbnailUrl: "https://cdn.pixabay.com/photo/2016/11/29/08/42/desk-1868494_640.jpg",
    width: 1920,
    height: 1080,
    duration: 15,
    author: "Pixabay Video",
  },
  {
    id: "fallback-v4-city",
    source: "pixabay",
    type: "video",
    title: "Futuristic Night City Lights",
    previewUrl: "https://cdn.pixabay.com/video/2020/01/17/31377-386445585_large.mp4",
    downloadUrl: "https://cdn.pixabay.com/video/2020/01/17/31377-386445585_large.mp4",
    thumbnailUrl: "https://cdn.pixabay.com/photo/2020/01/17/16/38/city-4773418_640.jpg",
    width: 1920,
    height: 1080,
    duration: 14,
    author: "Pixabay Video",
  },
  {
    id: "fallback-v5-nature",
    source: "pixabay",
    type: "video",
    title: "Cinematic Nature Forest Stream",
    previewUrl: "https://cdn.pixabay.com/video/2016/05/12/2953-166547631_large.mp4",
    downloadUrl: "https://cdn.pixabay.com/video/2016/05/12/2953-166547631_large.mp4",
    thumbnailUrl: "https://cdn.pixabay.com/photo/2015/12/01/20/28/forest-1072828_640.jpg",
    width: 1920,
    height: 1080,
    duration: 12,
    author: "Pixabay Video",
  },
  {
    id: "fallback-v6-space",
    source: "pixabay",
    type: "video",
    title: "Deep Space Nebula Stars",
    previewUrl: "https://cdn.pixabay.com/video/2020/03/30/34190-401340156_large.mp4",
    downloadUrl: "https://cdn.pixabay.com/video/2020/03/30/34190-401340156_large.mp4",
    thumbnailUrl: "https://cdn.pixabay.com/photo/2016/10/20/18/35/sunrise-1756274_640.jpg",
    width: 1920,
    height: 1080,
    duration: 16,
    author: "Pixabay Video",
  },
  {
    id: "fallback-v7-abstract",
    source: "pixabay",
    type: "video",
    title: "Abstract Particle Waves",
    previewUrl: "https://cdn.pixabay.com/video/2021/04/07/70685-535384435_large.mp4",
    downloadUrl: "https://cdn.pixabay.com/video/2021/04/07/70685-535384435_large.mp4",
    thumbnailUrl: "https://cdn.pixabay.com/photo/2018/01/14/23/12/nature-3082832_640.jpg",
    width: 1920,
    height: 1080,
    duration: 10,
    author: "Pixabay Video",
  },
  {
    id: "fallback-v8-ocean",
    source: "pixabay",
    type: "video",
    title: "Ocean Waves Aerial",
    previewUrl: "https://cdn.pixabay.com/video/2017/05/16/9119-218087965_large.mp4",
    downloadUrl: "https://cdn.pixabay.com/video/2017/05/16/9119-218087965_large.mp4",
    thumbnailUrl: "https://cdn.pixabay.com/photo/2016/09/19/22/46/lake-1681534_640.jpg",
    width: 1920,
    height: 1080,
    duration: 15,
    author: "Pixabay Video",
  }
];

export interface StudioNeuralVoice {
  id: string;
  name: string;
  gender: "female" | "male";
  tag: string;
  description: string;
  popular?: boolean;
}

export const STUDIO_NEURAL_VOICES: StudioNeuralVoice[] = [
  { id: "en-US-JennyNeural", name: "Jenny", gender: "female", tag: "Warm Storyteller", description: "Natural, conversational tone with authentic human inflection & breathing", popular: true },
  { id: "en-US-AriaNeural", name: "Aria", gender: "female", tag: "Dynamic Creator", description: "Vibrant, confident voice ideal for YouTube, TikTok & Reels", popular: true },
  { id: "en-US-GuyNeural", name: "Guy", gender: "male", tag: "Casual Host", description: "Relaxed, authentic YouTube creator & podcast narrator", popular: true },
  { id: "en-US-ChristopherNeural", name: "Christopher", gender: "male", tag: "Cinematic Narrator", description: "Deep, authoritative movie trailer & documentary voice", popular: true },
  { id: "en-US-AvaNeural", name: "Ava", gender: "female", tag: "Studio Host", description: "Clear, crisp corporate & educational presenter", popular: false },
  { id: "en-US-EmmaNeural", name: "Emma", gender: "female", tag: "Friendly Explainer", description: "Gentle, calming tutorial & lifestyle narrator", popular: false },
  { id: "en-US-BrianNeural", name: "Brian", gender: "male", tag: "Smooth Professional", description: "Refined, articulate corporate & tech narrator", popular: false },
  { id: "en-US-EricNeural", name: "Eric", gender: "male", tag: "Upbeat Dynamic", description: "Energetic, modern youthful storyteller", popular: false },
  { id: "en-GB-SoniaNeural", name: "Sonia", gender: "female", tag: "Refined British", description: "Sophisticated British documentary host", popular: false },
  { id: "en-GB-RyanNeural", name: "Ryan", gender: "male", tag: "Smooth British", description: "Articulate, stylish British male narrator", popular: false },
];

export const DEFAULT_CURATED_MUSIC_LIST: AudioTrackItem[] = EXPANDED_CURATED_MUSIC_LIBRARY;

export const AutonomousVideoCreator: React.FC<AutonomousVideoCreatorProps> = ({
  onExportToStoryboard,
}) => {
  // Input settings state
  const [customPrompt, setCustomPrompt] = useState(
    "How AI is revolutionizing software engineering, modern developer tools, and the future of coding."
  );
  const [useRawScript, setUseRawScript] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [pacing, setPacing] = useState<"fast" | "balanced" | "cinematic">("balanced");
  const [targetDuration, setTargetDuration] = useState<number>(30);
  const [mediaSource, setMediaSource] = useState<"all" | "pexels" | "pixabay" | "giphy" | "archive" | "nasa">("all");
  const [vibeStyle, setVibeStyle] = useState<string>("tech");
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(true);
  const [subtitlesStyle, setSubtitlesStyle] = useState<"highlight" | "classic" | "minimal" | "none">("highlight");
  const [musicVolume, setMusicVolume] = useState(0.4);

  // Scene Footage Swapping State (supports Pexels, Pixabay, GIPHY, Internet Archive, and NASA)
  const [swappingSceneIdx, setSwappingSceneIdx] = useState<number | null>(null);
  const [swapKeywords, setSwapKeywords] = useState<string>("");
  const [swapProvider, setSwapProvider] = useState<"all" | "pexels" | "pixabay" | "giphy" | "archive" | "nasa">("all");
  const [swapResults, setSwapResults] = useState<StockMediaItem[]>([]);
  const [isSearchingSwap, setIsSearchingSwap] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);

  // Studio Neural Voice State (Ultra-realistic, human-sounding)
  const [voiceEngine, setVoiceEngine] = useState<"neural" | "browser">("neural");
  const [selectedNeuralVoice, setSelectedNeuralVoice] = useState<string>("en-US-JennyNeural");
  const [voicePacingRate, setVoicePacingRate] = useState<string>("+0%");
  const [voicePitchOffset, setVoicePitchOffset] = useState<string>("+0Hz");

  // Fallback browser SpeechSynthesis state
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceGender, setVoiceGender] = useState<"female" | "male" | "custom">("female");
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [voicePitch, setVoicePitch] = useState<number>(1.2);
  const [voiceRate, setVoiceRate] = useState<number>(1.05);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [showVoiceDetails, setShowVoiceDetails] = useState(false);

  // Dedicated Audio element for Studio Neural Voiceover
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load voices from browser SpeechSynthesis
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);

        // Auto-select the best female voice initially if none selected
        setSelectedVoiceURI((prevURI) => {
          if (prevURI) return prevURI;
          const femaleMatch = voices.find(
            (v) =>
              v.lang.startsWith("en") &&
              FEMALE_VOICE_KEYWORDS.some((k) => v.name.toLowerCase().includes(k))
          );
          if (femaleMatch) return femaleMatch.voiceURI || femaleMatch.name;
          const firstEn = voices.find((v) => v.lang.startsWith("en"));
          return firstEn ? firstEn.voiceURI || firstEn.name : voices[0].voiceURI || voices[0].name;
        });
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Quick switch between Female and Male narrator personas
  const handleSelectGender = (gender: "female" | "male") => {
    setVoiceGender(gender);
    if (gender === "female") {
      setVoicePitch(1.22);
      const femaleMatch = availableVoices.find(
        (v) =>
          v.lang.startsWith("en") &&
          FEMALE_VOICE_KEYWORDS.some((k) => v.name.toLowerCase().includes(k))
      );
      if (femaleMatch) {
        setSelectedVoiceURI(femaleMatch.voiceURI || femaleMatch.name);
      }
    } else {
      setVoicePitch(0.9);
      const maleMatch = availableVoices.find(
        (v) =>
          v.lang.startsWith("en") &&
          MALE_VOICE_KEYWORDS.some((k) => v.name.toLowerCase().includes(k))
      );
      if (maleMatch) {
        setSelectedVoiceURI(maleMatch.voiceURI || maleMatch.name);
      }
    }
  };

  // Select a specific system synthesizer voice
  const handleSelectVoiceURI = (uri: string) => {
    setSelectedVoiceURI(uri);
    setVoiceGender("custom");
    const vObj = availableVoices.find((v) => (v.voiceURI || v.name) === uri);
    if (vObj) {
      const isFem = FEMALE_VOICE_KEYWORDS.some((k) => vObj.name.toLowerCase().includes(k));
      const isM = MALE_VOICE_KEYWORDS.some((k) => vObj.name.toLowerCase().includes(k));
      if (isFem) {
        setVoiceGender("female");
        setVoicePitch(1.2);
      } else if (isM) {
        setVoiceGender("male");
        setVoicePitch(0.9);
      }
    }
  };

  // Select Studio Neural Voice
  const handleSelectNeuralVoice = (voiceId: string) => {
    setSelectedNeuralVoice(voiceId);
    const vObj = STUDIO_NEURAL_VOICES.find((v) => v.id === voiceId);
    if (vObj) {
      setVoiceGender(vObj.gender);
    }
  };

  // Instant voice audition (Supports both Studio Neural Voice and Browser Fallback)
  const handleTestVoice = async () => {
    if (isTestingVoice) return;
    setIsTestingVoice(true);

    if (voiceAudioRef.current) {
      try {
        voiceAudioRef.current.pause();
        voiceAudioRef.current.currentTime = 0;
      } catch {}
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (voiceEngine === "neural") {
      const curVoice = STUDIO_NEURAL_VOICES.find((v) => v.id === selectedNeuralVoice) || STUDIO_NEURAL_VOICES[0];
      const sampleText = `Hello! I am ${curVoice.name}, your neural voice narrator. Every scene in your video will be spoken with this natural human studio voice.`;
      const url = `/api/tts?text=${encodeURIComponent(sampleText)}&voice=${encodeURIComponent(selectedNeuralVoice)}&rate=${encodeURIComponent(voicePacingRate)}&pitch=${encodeURIComponent(voicePitchOffset)}`;

      const audio = new Audio(url);
      voiceAudioRef.current = audio;

      audio.onended = () => setIsTestingVoice(false);
      audio.onerror = () => {
        setIsTestingVoice(false);
        speakBrowserFallback(sampleText);
      };

      try {
        await audio.play();
      } catch (err) {
        setIsTestingVoice(false);
        speakBrowserFallback(sampleText);
      }
    } else {
      const isFemale = voiceGender === "female" || voicePitch >= 1.1;
      const testSample = isFemale
        ? "Hi there! I am your female AI voice narrator. Every scene in your video will be spoken with this voice."
        : "Hello there! I am your male AI voice narrator. Every scene in your video will be spoken with this voice.";

      const utterance = new SpeechSynthesisUtterance(testSample);
      utterance.pitch = voicePitch;
      utterance.rate = voiceRate;

      const chosenVoice = availableVoices.find(
        (v) => (v.voiceURI || v.name) === selectedVoiceURI
      );
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      utterance.onend = () => setIsTestingVoice(false);
      utterance.onerror = () => setIsTestingVoice(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Browser Speech Synthesis Fallback
  const speakBrowserFallback = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceRate;
      utterance.pitch = voicePitch;

      const voices = window.speechSynthesis.getVoices();
      let chosenVoice: SpeechSynthesisVoice | undefined;

      if (selectedVoiceURI) {
        chosenVoice = voices.find((v) => (v.voiceURI || v.name) === selectedVoiceURI);
      }

      if (!chosenVoice) {
        if (voiceGender === "female") {
          chosenVoice = voices.find(
            (v) =>
              v.lang.startsWith("en") &&
              FEMALE_VOICE_KEYWORDS.some((k) => v.name.toLowerCase().includes(k))
          ) || voices.find((v) => v.lang.startsWith("en"));
        } else if (voiceGender === "male") {
          chosenVoice = voices.find(
            (v) =>
              v.lang.startsWith("en") &&
              MALE_VOICE_KEYWORDS.some((k) => v.name.toLowerCase().includes(k))
          ) || voices.find((v) => v.lang.startsWith("en"));
        }
      }

      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      // Duck background music during voiceover
      if (audioElementRef.current) {
        audioElementRef.current.volume = Math.max(0.08, musicVolume * 0.25);
      }

      utterance.onend = () => {
        if (audioElementRef.current) {
          audioElementRef.current.volume = musicVolume;
        }
      };

      utterance.onerror = () => {
        if (audioElementRef.current) {
          audioElementRef.current.volume = musicVolume;
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Fallback speech synthesis notice:", e);
    }
  }, [availableVoices, selectedVoiceURI, voiceGender, voicePitch, voiceRate, musicVolume]);

  // Helper to calculate speech-aware duration with natural breathing buffers
  const estimateNarrationDuration = (text: string, baseDuration: number = 5): number => {
    if (!text || !text.trim()) return baseDuration;
    const words = text.trim().split(/\s+/).filter(Boolean);
    const needed = (words.length / 2.1) + 1.2;
    return Math.max(baseDuration, Math.round(needed * 10) / 10);
  };

  // Master Speech Narration Helper (Studio Neural AI Voice default with strict single-voice guard)
  const speakNarration = useCallback((text: string, targetSceneIdx?: number) => {
    if (!voiceoverEnabled || !text || !text.trim()) return;

    // Increment call ID to ensure only the latest speech invocation can make sound
    const callId = ++activeNarrationIdRef.current;

    // Immediately & unconditionally silence any existing voice audio element
    if (voiceAudioRef.current) {
      voiceAudioRef.current.onended = null;
      voiceAudioRef.current.onerror = null;
      try {
        voiceAudioRef.current.pause();
        voiceAudioRef.current.removeAttribute("src");
        voiceAudioRef.current.load();
      } catch {}
      voiceAudioRef.current = null;
    }

    // Immediately & unconditionally cancel browser speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    if (voiceEngine === "neural") {
      try {
        const url = `/api/tts?text=${encodeURIComponent(text.trim())}&voice=${encodeURIComponent(selectedNeuralVoice)}&rate=${encodeURIComponent(voicePacingRate)}&pitch=${encodeURIComponent(voicePitchOffset)}`;
        const audio = new Audio(url);
        voiceAudioRef.current = audio;

        // Ensure active scene duration accommodates the actual synthesized speech duration + buffer
        audio.onloadedmetadata = () => {
          if (audio.duration && !isNaN(audio.duration) && typeof targetSceneIdx === "number") {
            const requiredDur = Math.ceil((audio.duration + 0.6) * 10) / 10;
            setLoadedScenes((prev) => {
              if (!prev[targetSceneIdx] || prev[targetSceneIdx].duration >= requiredDur) return prev;
              const updated = [...prev];
              updated[targetSceneIdx] = { ...updated[targetSceneIdx], duration: requiredDur };
              return updated;
            });
          }
        };

        // Duck background music during speech
        if (audioElementRef.current) {
          audioElementRef.current.volume = Math.max(0.08, musicVolume * 0.25);
        }

        audio.onended = () => {
          if (activeNarrationIdRef.current === callId && audioElementRef.current) {
            audioElementRef.current.volume = musicVolume;
          }
        };

        audio.onerror = (e) => {
          if (activeNarrationIdRef.current !== callId) return;
          console.warn("Neural voice notice:", e);
          if (audioElementRef.current) {
            audioElementRef.current.volume = musicVolume;
          }
        };

        audio.play().catch((err) => {
          // If this audio was superseded by a newer call or user paused, silently ignore
          if (activeNarrationIdRef.current !== callId) return;
          if (err?.name === "AbortError" || err?.message?.includes("pause")) return;
          console.warn("Audio play prevented:", err);
          if (audioElementRef.current) {
            audioElementRef.current.volume = musicVolume;
          }
        });
      } catch (err) {
        console.warn("Neural speech error:", err);
      }
    } else {
      speakBrowserFallback(text);
    }
  }, [voiceoverEnabled, voiceEngine, selectedNeuralVoice, voicePacingRate, voicePitchOffset, musicVolume, speakBrowserFallback]);

  // Pipeline state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generated project state
  const [videoPlan, setVideoPlan] = useState<AutoVideoPlan | null>(null);
  const [loadedScenes, setLoadedScenes] = useState<AutoVideoScene[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<AudioTrackItem | null>(null);

  // Video Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [activeBuffer, setActiveBuffer] = useState<"A" | "B">("A");
  const [isMuted, setIsMuted] = useState(false);

  // Dedicated monotonic narration ID to prevent overlapping voices
  const activeNarrationIdRef = useRef<number>(0);
  const currentSceneIndexRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);

  // Music Selection, Filtering & Audition State
  const [availableMusicTracks, setAvailableMusicTracks] = useState<AudioTrackItem[]>(DEFAULT_CURATED_MUSIC_LIST);
  const [musicSearchQuery, setMusicSearchQuery] = useState<string>("");
  const [selectedMusicGenre, setSelectedMusicGenre] = useState<string>("all");
  const [isSearchingMusic, setIsSearchingMusic] = useState<boolean>(false);
  const [showMusicPicker, setShowMusicPicker] = useState<boolean>(false);
  const [previewingMusicId, setPreviewingMusicId] = useState<string | null>(null);
  const musicPreviewAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicFileInputRef = useRef<HTMLInputElement | null>(null);

  // Video Element Refs for instant seamless transitions and split screen
  const videoRefA = useRef<HTMLVideoElement | null>(null);
  const videoRefB = useRef<HTMLVideoElement | null>(null);
  const secVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const playbackTimerRef = useRef<any>(null);
  const sceneStartTimestampRef = useRef<number>(0);

  // Complete Video Rendering & Download state
  const [isRenderingCompleteVideo, setIsRenderingCompleteVideo] = useState(false);
  const [renderProgressMsg, setRenderProgressMsg] = useState<string>("");

  // Footage Swapping Handlers
  const openSwapModal = (idx: number) => {
    const scene = loadedScenes[idx];
    if (!scene) return;
    setSwappingSceneIdx(idx);
    const kw = scene.search_keywords || "";
    setSwapKeywords(kw);
    setSwapProvider(mediaSource);
    setSwapResults([]);
    setSwapError(null);
    performSwapSearch(kw, mediaSource);
  };

  const performSwapSearch = async (query: string, source: "all" | "pexels" | "pixabay" | "giphy" | "archive" | "nasa") => {
    if (!query.trim()) return;
    setIsSearchingSwap(true);
    setSwapError(null);
    try {
      const res = await fetch(
        `/api/stock/search?query=${encodeURIComponent(query)}&mediaType=video&source=${source}&aspectRatio=${aspectRatio}`
      );
      if (!res.ok) throw new Error(`Search failed: HTTP ${res.status}`);
      const data = await res.json();
      setSwapResults(data.results || []);
    } catch (err: any) {
      setSwapError(err.message || "Failed to find media items");
    } finally {
      setIsSearchingSwap(false);
    }
  };

  const handleSelectSwapMedia = (item: StockMediaItem) => {
    if (swappingSceneIdx === null) return;
    setLoadedScenes((prev) =>
      prev.map((sc, i) => (i === swappingSceneIdx ? { ...sc, videoAsset: item } : sc))
    );
    if (videoPlan) {
      setVideoPlan((prevPlan) =>
        prevPlan
          ? {
              ...prevPlan,
              scenes: prevPlan.scenes.map((sc, i) =>
                i === swappingSceneIdx ? { ...sc, videoAsset: item } : sc
              ),
            }
          : null
      );
    }
    setSwappingSceneIdx(null);
  };

  // Presets
  const PRESET_PROMPTS = [
    {
      label: "🚀 AI & Modern Coding",
      prompt: "How modern AI coding assistants accelerate software engineering from minutes to seconds.",
      style: "tech",
    },
    {
      label: "☕ Morning Focus Flow",
      prompt: "The ultimate minimalist morning routine for high productivity, deep focus, and clean code.",
      style: "chill",
    },
    {
      label: "🛡️ Cyber Defense Shield",
      prompt: "Defending the cloud: Behind the scenes of real-time cybersecurity threats and intelligent firewalls.",
      style: "cyber",
    },
    {
      label: "🏙️ Future Startup Vision",
      prompt: "Building scalable technology companies: Passion, innovation, and relentless execution.",
      style: "cinematic",
    },
  ];

  const PIPELINE_STEPS = [
    "Analyzing prompt & directing screenplay with Gemini...",
    "Auto-fetching high-definition B-roll stock footage...",
    "Matching soundtrack & sound design...",
    "Aligning voice narration and subtitles...",
    "Ready for playback!"
  ];

  // Generate Autonomous Video
  const handleGenerateAutonomousVideo = async () => {
    if (!customPrompt.trim()) return;

    setIsGenerating(true);
    setErrorMsg(null);
    handlePause();
    setCurrentTime(0);
    setActiveSceneIndex(0);
    setStepIndex(0);
    setCurrentStep(PIPELINE_STEPS[0]);

    try {
      // Step 1: Request video production plan from backend
      const planRes = await fetch("/api/auto-video/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: customPrompt.trim(),
          style: vibeStyle,
          aspectRatio,
          pacing,
          targetDuration,
        }),
      });

      if (!planRes.ok) {
        throw new Error(`Plan generation returned HTTP ${planRes.status}`);
      }

      const planData: AutoVideoPlan = await planRes.json();
      setStepIndex(1);
      setCurrentStep(PIPELINE_STEPS[1]);

      // Step 2: Fetch stock video clips for each scene with strict uniqueness enforcement
      const scenesWithMedia: AutoVideoScene[] = [];
      const usedVideoIds = new Set<string>();

      for (let idx = 0; idx < planData.scenes.length; idx++) {
        const scene = planData.scenes[idx];
        let chosenMedia: StockMediaItem | undefined;

        try {
          const searchRes = await fetch(
            `/api/stock/search?query=${encodeURIComponent(scene.search_keywords)}&mediaType=video&source=${mediaSource}&aspectRatio=${aspectRatio}`
          );
          if (searchRes.ok) {
            const data = await searchRes.json();
            const mediaItems = (data.results || []).filter(
              (r: any) => (r.type === "video" || r.source === "giphy") && (r.previewUrl || r.downloadUrl)
            );
            for (const v of mediaItems) {
              if (!usedVideoIds.has(v.id)) {
                chosenMedia = v;
                break;
              }
            }
          }
        } catch (err) {
          console.warn(`Stock search notice for scene ${scene.scene_number}:`, err);
        }

        // Guaranteed fallback / rotation if search returned 0 or all were used
        if (!chosenMedia) {
          for (let fIdx = 0; fIdx < FALLBACK_STOCK_VIDEOS.length; fIdx++) {
            const candidate = FALLBACK_STOCK_VIDEOS[(idx + fIdx) % FALLBACK_STOCK_VIDEOS.length];
            if (!usedVideoIds.has(candidate.id)) {
              chosenMedia = candidate;
              break;
            }
          }
          if (!chosenMedia) {
            chosenMedia = FALLBACK_STOCK_VIDEOS[idx % FALLBACK_STOCK_VIDEOS.length];
          }
        }

        if (chosenMedia) {
          usedVideoIds.add(chosenMedia.id);
        }

        // If scene is splitscreen, fetch secondary video clip ensuring uniqueness
        let secondaryMedia: StockMediaItem | undefined;
        if (scene.transition === "splitscreen" || scene.layout === "splitscreen" || scene.secondary_keywords) {
          const secQuery = scene.secondary_keywords || `${scene.search_keywords} detail`;
          try {
            const secRes = await fetch(
              `/api/stock/search?query=${encodeURIComponent(secQuery)}&mediaType=video&source=${mediaSource}&aspectRatio=${aspectRatio}`
            );
            if (secRes.ok) {
              const sData = await secRes.json();
              const sVideos = (sData.results || []).filter(
                (r: any) => (r.type === "video" || r.source === "giphy") && (r.previewUrl || r.downloadUrl) && !usedVideoIds.has(r.id)
              );
              if (sVideos.length > 0) {
                secondaryMedia = sVideos[0];
              }
            }
          } catch (e) {
            console.warn("Secondary video fetch error:", e);
          }
          if (!secondaryMedia) {
            for (let fIdx = 0; fIdx < FALLBACK_STOCK_VIDEOS.length; fIdx++) {
              const candidate = FALLBACK_STOCK_VIDEOS[(idx + fIdx + 3) % FALLBACK_STOCK_VIDEOS.length];
              if (!usedVideoIds.has(candidate.id)) {
                secondaryMedia = candidate;
                break;
              }
            }
            if (!secondaryMedia) {
              secondaryMedia = FALLBACK_STOCK_VIDEOS[(idx + 1) % FALLBACK_STOCK_VIDEOS.length];
            }
          }
          if (secondaryMedia) {
            usedVideoIds.add(secondaryMedia.id);
          }
        }

        const speechDur = estimateNarrationDuration(scene.narration, scene.duration);
        scenesWithMedia.push({
          ...scene,
          duration: speechDur,
          videoAsset: chosenMedia,
          secondaryVideoAsset: secondaryMedia,
        });
      }

      setStepIndex(2);
      setCurrentStep(PIPELINE_STEPS[2]);

      // Step 3: Fetch matching background music
      let musicTrack: AudioTrackItem | null = null;
      try {
        const musicQuery = planData.music_keyword || customPrompt || "ambient cinematic";
        const audioRes = await fetch(`/api/stock/audio?query=${encodeURIComponent(musicQuery)}&type=music&per_page=30`);
        if (audioRes.ok) {
          const aData = await audioRes.json();
          if (aData.results && aData.results.length > 0) {
            musicTrack = aData.results[0];
            setAvailableMusicTracks(aData.results);
          }
        }
      } catch (err) {
        console.warn("Autonomous audio fetch error:", err);
      }
      if (!musicTrack) {
        musicTrack = DEFAULT_CURATED_MUSIC_LIST[0];
      }

      setStepIndex(3);
      setCurrentStep(PIPELINE_STEPS[3]);

      // Setup audio element
      if (musicTrack && (musicTrack.download_url || musicTrack.preview_url)) {
        if (!audioElementRef.current) {
          audioElementRef.current = new Audio();
        }
        audioElementRef.current.crossOrigin = "anonymous";
        audioElementRef.current.src = musicTrack.download_url || musicTrack.preview_url;
        audioElementRef.current.loop = true;
        audioElementRef.current.volume = musicVolume;
      }

      setStepIndex(4);
      setCurrentStep(PIPELINE_STEPS[4]);

      // Update state
      const totalDur = scenesWithMedia.reduce((sum, s) => sum + s.duration, 0);
      const completePlan: AutoVideoPlan = {
        ...planData,
        scenes: scenesWithMedia,
        music_track: musicTrack || undefined,
        total_duration: totalDur,
      };

      setVideoPlan(completePlan);
      setLoadedScenes(scenesWithMedia);
      setSelectedMusic(musicTrack);

      // Preload first video
      if (scenesWithMedia.length > 0 && videoRefA.current) {
        const firstUrl = scenesWithMedia[0].videoAsset?.previewUrl || scenesWithMedia[0].videoAsset?.downloadUrl;
        if (firstUrl) {
          videoRefA.current.src = firstUrl;
          videoRefA.current.load();
        }
      }

      setTimeout(() => {
        setIsGenerating(false);
        setCurrentStep(null);
        handlePlayScene(0, scenesWithMedia);
      }, 700);

    } catch (err: any) {
      console.error("Autonomous creation error:", err);
      setErrorMsg(`Autonomous studio error: ${err.message}. Please try again.`);
      setIsGenerating(false);
    }
  };

  // Perform dynamic search or genre filter across the multi-source music library
  const handleFilterMusic = async (query: string = musicSearchQuery, genre: string = selectedMusicGenre) => {
    setIsSearchingMusic(true);
    try {
      const q = query.trim();
      const params = new URLSearchParams();
      if (q) params.set("query", q);
      if (genre && genre !== "all") params.set("genre", genre);
      params.set("per_page", "40");
      params.set("type", "music");

      const res = await fetch(`/api/stock/audio?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setAvailableMusicTracks(data.results);
          return;
        }
      }
      // Fallback local search if network search returned 0
      let localFiltered = EXPANDED_CURATED_MUSIC_LIBRARY;
      if (genre && genre !== "all") {
        localFiltered = localFiltered.filter((t) => t.genre?.toLowerCase().includes(genre.toLowerCase()));
      }
      if (q) {
        const lowerQ = q.toLowerCase();
        localFiltered = localFiltered.filter((t) => 
          t.title.toLowerCase().includes(lowerQ) ||
          (t.genre && t.genre.toLowerCase().includes(lowerQ)) ||
          (t.artist && t.artist.toLowerCase().includes(lowerQ))
        );
      }
      setAvailableMusicTracks(localFiltered.length > 0 ? localFiltered : EXPANDED_CURATED_MUSIC_LIBRARY);
    } catch (e) {
      console.warn("Music search error:", e);
    } finally {
      setIsSearchingMusic(false);
    }
  };

  // Upload custom local audio file (MP3, WAV, AAC, OGG)
  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
    const customTrack: AudioTrackItem = {
      id: `custom-upload-${Date.now()}`,
      type: "music",
      title: cleanTitle,
      genre: "Custom Audio Upload",
      artist: "Local User Audio",
      duration: 0,
      download_url: fileUrl,
      preview_url: fileUrl,
      license: "User Supplied Soundtrack"
    };

    setAvailableMusicTracks((prev) => [customTrack, ...prev]);
    handleSelectMusicTrack(customTrack);
    if (musicFileInputRef.current) {
      musicFileInputRef.current.value = "";
    }
  };

  // Music track audition preview handler with proxy streaming fallback
  const handlePreviewMusicTrack = (track: AudioTrackItem) => {
    if (previewingMusicId === track.id) {
      if (musicPreviewAudioRef.current) {
        musicPreviewAudioRef.current.pause();
        musicPreviewAudioRef.current = null;
      }
      setPreviewingMusicId(null);
      return;
    }

    if (musicPreviewAudioRef.current) {
      musicPreviewAudioRef.current.pause();
      musicPreviewAudioRef.current = null;
    }

    const audioUrl = track.preview_url || track.download_url;
    const audio = new Audio(audioUrl);
    audio.volume = 0.5;
    
    audio.play().catch(() => {
      // If direct CDN access fails (e.g. CORS), fallback to proxy
      const proxied = `/api/audio/proxy?url=${encodeURIComponent(audioUrl)}`;
      audio.src = proxied;
      audio.play().catch((e) => console.warn("Audition preview notice:", e));
    });

    audio.onended = () => setPreviewingMusicId(null);
    audio.onerror = () => setPreviewingMusicId(null);
    musicPreviewAudioRef.current = audio;
    setPreviewingMusicId(track.id);
  };

  // Select music track
  const handleSelectMusicTrack = (track: AudioTrackItem) => {
    if (musicPreviewAudioRef.current) {
      musicPreviewAudioRef.current.pause();
      musicPreviewAudioRef.current = null;
    }
    setPreviewingMusicId(null);
    setSelectedMusic(track);

    const trackUrl = track.download_url || track.preview_url;
    if (audioElementRef.current) {
      audioElementRef.current.src = trackUrl;
      audioElementRef.current.volume = isMuted ? 0 : musicVolume;
      if (isPlaying) {
        audioElementRef.current.play().catch(() => {
          if (audioElementRef.current) {
            audioElementRef.current.src = `/api/audio/proxy?url=${encodeURIComponent(trackUrl)}`;
            audioElementRef.current.play().catch(() => {});
          }
        });
      }
    } else {
      const a = new Audio(trackUrl);
      a.loop = true;
      a.volume = isMuted ? 0 : musicVolume;
      if (isPlaying) {
        a.play().catch(() => {
          a.src = `/api/audio/proxy?url=${encodeURIComponent(trackUrl)}`;
          a.play().catch(() => {});
        });
      }
      audioElementRef.current = a;
    }
  };

  // Helper to compute scene start time across the complete continuous timeline
  const getSceneStartTime = useCallback((targetIdx: number, scenes = loadedScenes) => {
    let t = 0;
    for (let i = 0; i < targetIdx && i < scenes.length; i++) {
      t += scenes[i].duration;
    }
    return t;
  }, [loadedScenes]);

  // Jump smoothly to a specific scene along the timeline without cutting the flow
  const handleJumpToScene = (idx: number) => {
    if (idx < 0 || idx >= loadedScenes.length) return;
    const sceneStartTime = getSceneStartTime(idx);
    handleSeek(sceneStartTime);
  };

  // Play a specific scene with seamless dual-buffer crossfade & split-screen handling
  const handlePlayScene = (targetIdx: number, scenesList = loadedScenes, startOffset = 0) => {
    if (scenesList.length === 0) return;
    const scene = scenesList[targetIdx];
    if (!scene) return;

    currentSceneIndexRef.current = targetIdx;
    setActiveSceneIndex(targetIdx);
    const videoUrl = scene.videoAsset?.downloadUrl || scene.videoAsset?.previewUrl;
    if (!videoUrl) return;

    // Use A/B dual buffering for instant switch
    const isCurrentlyA = activeBuffer === "A";
    const nextBuffer = isCurrentlyA ? "B" : "A";
    const nextVideo = nextBuffer === "A" ? videoRefA.current : videoRefB.current;
    const currentVideo = isCurrentlyA ? videoRefA.current : videoRefB.current;

    if (nextVideo) {
      if (!nextVideo.src || (!nextVideo.src.includes(encodeURIComponent(videoUrl)) && nextVideo.src !== videoUrl)) {
        nextVideo.src = videoUrl;
      }
      try {
        nextVideo.currentTime = startOffset;
      } catch {}
      nextVideo.play().catch(() => {
        // Fallback to proxy if direct play failed
        const proxied = `/api/proxy-video?url=${encodeURIComponent(videoUrl)}`;
        if (nextVideo.src !== proxied) {
          nextVideo.src = proxied;
          nextVideo.play().catch(() => {});
        }
      });
      setActiveBuffer(nextBuffer);
    }

    // Split-screen secondary video
    if ((scene.transition === "splitscreen" || scene.layout === "splitscreen") && scene.secondaryVideoAsset) {
      const secUrl = scene.secondaryVideoAsset.downloadUrl || scene.secondaryVideoAsset.previewUrl;
      if (secVideoRef.current && secUrl) {
        if (!secVideoRef.current.src || (!secVideoRef.current.src.includes(encodeURIComponent(secUrl)) && secVideoRef.current.src !== secUrl)) {
          secVideoRef.current.src = secUrl;
        }
        try {
          secVideoRef.current.currentTime = startOffset;
        } catch {}
        secVideoRef.current.play().catch(() => {
          const proxiedSec = `/api/proxy-video?url=${encodeURIComponent(secUrl)}`;
          if (secVideoRef.current) {
            secVideoRef.current.src = proxiedSec;
            secVideoRef.current.play().catch(() => {});
          }
        });
      }
    } else if (secVideoRef.current) {
      secVideoRef.current.pause();
    }

    // Preload next upcoming scene video in background
    const nextIdx = (targetIdx + 1) % scenesList.length;
    const upcomingScene = scenesList[nextIdx];
    if (upcomingScene && currentVideo) {
      const upUrl = upcomingScene.videoAsset?.downloadUrl || upcomingScene.videoAsset?.previewUrl;
      if (upUrl && currentVideo.src !== upUrl) {
        setTimeout(() => {
          if (!isPlaying) return;
          currentVideo.src = upUrl;
          currentVideo.load();
        }, 800);
      }
    }

    // Trigger Voiceover Narration with speech duration guard
    speakNarration(scene.narration, targetIdx);

    // Ensure background music is playing
    if (audioElementRef.current && audioElementRef.current.paused) {
      audioElementRef.current.play().catch(() => {});
    }

    setIsPlaying(true);
  };

  // Playback loop interval for single continuous seamless timeline
  useEffect(() => {
    if (!isPlaying || loadedScenes.length === 0) {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      return;
    }

    playbackTimerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        const totalDur = loadedScenes.reduce((sum, s) => sum + s.duration, 0);
        const nextTime = prev + 0.1;

        if (nextTime >= totalDur) {
          // Loop seamlessly back to start
          handlePlayScene(0, loadedScenes, 0);
          return 0;
        }

        // Check if we crossed into a new scene
        let accTime = 0;
        for (let i = 0; i < loadedScenes.length; i++) {
          const sDur = loadedScenes[i].duration;
          if (nextTime >= accTime && nextTime < accTime + sDur) {
            if (i !== currentSceneIndexRef.current) {
              currentSceneIndexRef.current = i;
              handlePlayScene(i, loadedScenes, nextTime - accTime);
            }
            break;
          }
          accTime += sDur;
        }

        return nextTime;
      });
    }, 100);

    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying, loadedScenes, activeBuffer, speakNarration]);

  // Master Play / Pause
  const handlePlay = () => {
    if (loadedScenes.length === 0) return;
    setIsPlaying(true);

    const activeVideo = activeBuffer === "A" ? videoRefA.current : videoRefB.current;
    if (activeVideo) {
      activeVideo.play().catch(() => {});
    }
    const currentScene = loadedScenes[activeSceneIndex];
    if ((currentScene?.transition === "splitscreen" || currentScene?.layout === "splitscreen") && secVideoRef.current) {
      secVideoRef.current.play().catch(() => {});
    }

    if (audioElementRef.current) {
      audioElementRef.current.play().catch(() => {});
    }

    if (currentScene) {
      speakNarration(currentScene.narration, activeSceneIndex);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);

    if (videoRefA.current) videoRefA.current.pause();
    if (videoRefB.current) videoRefB.current.pause();
    if (secVideoRef.current) secVideoRef.current.pause();
    if (audioElementRef.current) audioElementRef.current.pause();
    if (voiceAudioRef.current) {
      try {
        voiceAudioRef.current.pause();
      } catch {}
    }
    if (musicPreviewAudioRef.current) {
      try {
        musicPreviewAudioRef.current.pause();
      } catch {}
      setPreviewingMusicId(null);
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  };

  const handleRestart = () => {
    handlePause();
    if (voiceAudioRef.current) {
      try {
        voiceAudioRef.current.pause();
        voiceAudioRef.current.currentTime = 0;
      } catch {}
    }
    setCurrentTime(0);
    currentSceneIndexRef.current = 0;
    setActiveSceneIndex(0);
    setTimeout(() => {
      handlePlayScene(0, loadedScenes, 0);
    }, 100);
  };

  // Seek across full continuous timeline
  const handleSeek = (newTime: number) => {
    const totalDur = loadedScenes.reduce((sum, s) => sum + s.duration, 0);
    const clamped = Math.max(0, Math.min(totalDur, newTime));
    setCurrentTime(clamped);

    let accTime = 0;
    for (let i = 0; i < loadedScenes.length; i++) {
      const sDur = loadedScenes[i].duration;
      if (clamped >= accTime && (clamped < accTime + sDur || i === loadedScenes.length - 1)) {
        const offset = clamped - accTime;
        currentSceneIndexRef.current = i;
        handlePlayScene(i, loadedScenes, offset);
        const activeVideo = activeBuffer === "A" ? videoRefA.current : videoRefB.current;
        if (activeVideo) {
          try {
            activeVideo.currentTime = offset;
          } catch {}
        }
        if (secVideoRef.current) {
          try {
            secVideoRef.current.currentTime = offset;
          } catch {}
        }
        break;
      }
      accTime += sDur;
    }
  };

  // Render & Download Complete Stitched Video
  const handleDownloadCompleteVideo = async () => {
    if (loadedScenes.length === 0 || isRenderingCompleteVideo) return;

    setIsRenderingCompleteVideo(true);
    setRenderProgressMsg("Downloading high-definition footage & music...");

    try {
      const payload = {
        title: videoPlan?.title || "complete_autonomous_video",
        aspectRatio: aspectRatio,
        subtitlesStyle: subtitlesStyle,
        musicUrl: selectedMusic?.download_url || selectedMusic?.preview_url,
        musicVolume: musicVolume,
        voice: selectedNeuralVoice,
        voiceRate: voicePacingRate,
        voicePitch: voicePitchOffset,
        scenes: loadedScenes.map((sc) => ({
          scene_number: sc.scene_number,
          duration: sc.duration,
          transition: sc.transition || "fade",
          videoUrl: sc.videoAsset?.downloadUrl || sc.videoAsset?.previewUrl,
          secondaryVideoUrl: sc.secondaryVideoAsset?.downloadUrl || sc.secondaryVideoAsset?.previewUrl,
          subtitle: sc.subtitle || sc.narration || "",
          narration: sc.narration || sc.subtitle || ""
        }))
      };

      setRenderProgressMsg("Synthesizing neural voiceover & stitching scenes with FFmpeg...");

      const resp = await fetch("/api/render-complete-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.error || `Render failed with status ${resp.status}`);
      }

      setRenderProgressMsg("Preparing final MP4 for download...");
      const blob = await resp.blob();
      if (!blob || blob.size < 1000) {
        throw new Error("Rendered video stream was empty or incomplete");
      }

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const safeTitle = (videoPlan?.title || "complete_autonomous_video").replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `${safeTitle}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      setRenderProgressMsg("Complete video downloaded successfully!");
      setTimeout(() => {
        setIsRenderingCompleteVideo(false);
        setRenderProgressMsg("");
      }, 3000);
    } catch (err: any) {
      console.error("Complete video render error:", err);
      setRenderProgressMsg("Error: " + (err.message || "Failed to download video"));
      setTimeout(() => {
        setIsRenderingCompleteVideo(false);
        setRenderProgressMsg("");
      }, 6000);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Volume Sync
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.volume = isMuted ? 0 : musicVolume;
    }
  }, [musicVolume, isMuted]);

  // Clean up
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      if (audioElementRef.current) audioElementRef.current.pause();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  // Export current video clip or push to Storyboard
  const handlePushToStoryboard = () => {
    if (!videoPlan || !onExportToStoryboard) return;
    const manualPlan = {
      project_name: videoPlan.title.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      scenes: videoPlan.scenes.map((s, idx) => ({
        scene_number: idx + 1,
        script_line: s.narration,
        search_keywords: s.search_keywords,
        media_type: "video",
        selectedMedia: s.videoAsset,
      })),
      audio_suggestions: {
        music_keywords: [videoPlan.music_keyword, "cinematic inspirational", "tech ambient synth"],
        sfx_keywords: ["keyboard typing", "futuristic swoosh", "data server hum"],
      },
    };
    onExportToStoryboard(manualPlan);
  };

  const totalDuration = loadedScenes.reduce((sum, s) => sum + s.duration, 0);
  const activeScene = loadedScenes[activeSceneIndex];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-stone-900 to-stone-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-100">
                Autonomous AI Video Creator
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-500 text-stone-950">
                Auto Pilot
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Input any creative prompt. The AI will write the script, auto-fetch high-definition stock video clips, pair matching background music, and render a synchronized video with live audio mixing.
            </p>
          </div>
        </div>

        {videoPlan && onExportToStoryboard && (
          <button
            onClick={handlePushToStoryboard}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-750 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-colors shrink-0"
            title="Edit these scenes manually in the Storyboard tab"
          >
            <span>Open in Manual Storyboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Grid: Prompt Controls (Left) & Live Autonomous Video Player (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Prompt & Custom Controls */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-stone-200">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Custom Creative Prompt</span>
              </div>
              <button
                type="button"
                onClick={() => setUseRawScript(!useRawScript)}
                className="text-[11px] text-amber-400 hover:underline"
              >
                {useRawScript ? "Switch to Prompt Mode" : "Paste Exact Script"}
              </button>
            </div>

            {/* Prompt input */}
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                {useRawScript ? "Exact Script Lines:" : "What video should the AI create?"}
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={
                  useRawScript
                    ? "Enter your exact voiceover script lines here..."
                    : "e.g. Explain quantum computing in 30 seconds with upbeat futuristic synth and cyber city footage."
                }
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:outline-none focus:border-amber-500 leading-relaxed resize-none shadow-inner"
              />
            </div>

            {/* Presets Chips */}
            {!useRawScript && (
              <div className="space-y-1.5">
                <span className="text-[11px] text-stone-400 font-medium">Quick Idea Starters:</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setCustomPrompt(p.prompt);
                        setVibeStyle(p.style);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700/60 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Video Configuration Options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {/* Aspect Ratio */}
              <div>
                <label className="block text-[11px] font-medium text-stone-400 mb-1">
                  Format / Ratio
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-950 border border-stone-800">
                  <button
                    type="button"
                    onClick={() => setAspectRatio("16:9")}
                    className={`py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                      aspectRatio === "16:9"
                        ? "bg-amber-500 text-stone-950 font-bold"
                        : "text-stone-400 hover:text-white"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>16:9</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAspectRatio("9:16")}
                    className={`py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                      aspectRatio === "9:16"
                        ? "bg-amber-500 text-stone-950 font-bold"
                        : "text-stone-400 hover:text-white"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>9:16</span>
                  </button>
                </div>
              </div>

              {/* Target Duration */}
              <div>
                <label className="block text-[11px] font-medium text-stone-400 mb-1">
                  Duration
                </label>
                <select
                  value={targetDuration}
                  onChange={(e) => setTargetDuration(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-500 h-[38px] cursor-pointer font-medium"
                >
                  <option value={15}>⏱️ 15s (Shorts)</option>
                  <option value={30}>⏱️ 30s (Balanced)</option>
                  <option value={60}>⏱️ 60s (1 Minute)</option>
                  <option value={90}>⏱️ 90s (1.5 Min)</option>
                </select>
              </div>

              {/* Pacing */}
              <div>
                <label className="block text-[11px] font-medium text-stone-400 mb-1">
                  Pacing
                </label>
                <select
                  value={pacing}
                  onChange={(e: any) => setPacing(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-500 h-[38px] cursor-pointer"
                >
                  <option value="fast">⚡ Fast (3.5s)</option>
                  <option value="balanced">⏱️ Balanced (5s)</option>
                  <option value="cinematic">🎥 Cinematic (7s)</option>
                </select>
              </div>

              {/* Footage Provider */}
              <div>
                <label className="block text-[11px] font-medium text-stone-400 mb-1">
                  Footage Provider
                </label>
                <select
                  value={mediaSource}
                  onChange={(e: any) => setMediaSource(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-500 h-[38px] cursor-pointer"
                >
                  <option value="all">🌟 All (Pexels, Pixabay, GIPHY, Archive, NASA)</option>
                  <option value="pexels">🎬 Pexels Videos</option>
                  <option value="pixabay">🎥 Pixabay Videos</option>
                  <option value="giphy">✨ GIPHY GIFs & Clips</option>
                  <option value="archive">🏛️ Internet Library (Archive.org)</option>
                  <option value="nasa">🚀 NASA Space Archive</option>
                </select>
              </div>
            </div>

            {/* Audio & Subtitles Controls */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Voiceover Speech Toggle */}
              <div>
                <label className="block text-[11px] font-medium text-stone-400 mb-1">
                  AI Voiceover
                </label>
                <button
                  type="button"
                  onClick={() => setVoiceoverEnabled(!voiceoverEnabled)}
                  className={`w-full py-1.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors h-[38px] ${
                    voiceoverEnabled
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : "bg-stone-950 border-stone-800 text-stone-400"
                  }`}
                >
                  <span>{voiceoverEnabled ? "🎙️ Voiceover On" : "🔇 Music Only"}</span>
                  <span className={`w-2 h-2 rounded-full ${voiceoverEnabled ? "bg-emerald-400" : "bg-stone-600"}`} />
                </button>
              </div>

              {/* Subtitles Style */}
              <div>
                <label className="block text-[11px] font-medium text-stone-400 mb-1">
                  Subtitles
                </label>
                <select
                  value={subtitlesStyle}
                  onChange={(e: any) => setSubtitlesStyle(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-500 h-[38px]"
                >
                  <option value="highlight">🔥 Karaoke Box</option>
                  <option value="classic">🎬 Movie Subtitle</option>
                  <option value="none">🚫 No Subtitles</option>
                </select>
              </div>
            </div>

            {/* Dedicated Studio Neural Voice Narrator Controls */}
            {voiceoverEnabled && (
              <div className="p-3.5 rounded-xl bg-stone-950 border border-emerald-950/80 ring-1 ring-emerald-500/20 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-100">Studio Voice Narrator</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Neural AI</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Audition / Test Voice Button */}
                  <button
                    type="button"
                    onClick={handleTestVoice}
                    disabled={isTestingVoice}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
                    title="Audition current voice with natural human speech"
                  >
                    <Volume1 className={`w-3.5 h-3.5 ${isTestingVoice ? "animate-bounce text-emerald-400" : "text-emerald-400"}`} />
                    <span>{isTestingVoice ? "Speaking sample..." : "🔊 Audition Voice"}</span>
                  </button>
                </div>

                {/* 1-Click Studio Persona Cards */}
                <div>
                  <label className="block text-[10px] font-medium text-stone-400 mb-1.5 uppercase tracking-wider">
                    Select Voice Persona
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "en-US-JennyNeural", name: "Jenny", role: "Warm Storyteller", icon: "👩", tag: "Natural & Engaging" },
                      { id: "en-US-AriaNeural", name: "Aria", role: "Dynamic Creator", icon: "👩", tag: "Vibrant & Confident" },
                      { id: "en-US-GuyNeural", name: "Guy", role: "Casual Host", icon: "👨", tag: "Relaxed YouTube Style" },
                      { id: "en-US-ChristopherNeural", name: "Christopher", role: "Cinematic Narrator", icon: "👨", tag: "Deep Documentary" },
                    ].map((persona) => {
                      const isSelected = voiceEngine === "neural" && selectedNeuralVoice === persona.id;
                      return (
                        <button
                          key={persona.id}
                          type="button"
                          onClick={() => {
                            setVoiceEngine("neural");
                            handleSelectNeuralVoice(persona.id);
                          }}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
                            isSelected
                              ? "bg-emerald-950/40 border-emerald-500/80 text-emerald-100 ring-1 ring-emerald-500/40 shadow-sm"
                              : "bg-stone-900/90 border-stone-800 text-stone-300 hover:text-stone-100 hover:border-stone-700"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm">{persona.icon}</span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                            )}
                          </div>
                          <div className="mt-1">
                            <div className="text-xs font-bold leading-tight flex items-center gap-1">
                              <span>{persona.name}</span>
                            </div>
                            <div className="text-[10px] text-stone-400 leading-tight mt-0.5 font-medium truncate">
                              {persona.role}
                            </div>
                            <div className="text-[9px] text-emerald-400/80 mt-1 font-mono">
                              {persona.tag}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Specific Voice dropdown & Pitch Settings Toggle */}
                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowVoiceDetails(!showVoiceDetails)}
                    className="text-[11px] text-stone-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>{showVoiceDetails ? "Hide advanced voice options" : "All Voices & Fine-Tuning"}</span>
                    {showVoiceDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  <span className="text-[10px] text-emerald-400/90 font-mono">
                    {voiceEngine === "neural" ? "Studio Neural MP3" : "Browser Synth"}
                  </span>
                </div>

                {/* Expandable Advanced Voice Controls */}
                {showVoiceDetails && (
                  <div className="pt-2.5 border-t border-stone-800/90 space-y-3">
                    {/* Engine Switcher */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] text-stone-400">Voice Synthesis Engine:</span>
                      <div className="flex items-center gap-1 bg-stone-900 p-0.5 rounded-lg border border-stone-800">
                        <button
                          type="button"
                          onClick={() => setVoiceEngine("neural")}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                            voiceEngine === "neural" ? "bg-emerald-500 text-stone-950" : "text-stone-400 hover:text-stone-200"
                          }`}
                        >
                          Studio Neural
                        </button>
                        <button
                          type="button"
                          onClick={() => setVoiceEngine("browser")}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                            voiceEngine === "browser" ? "bg-stone-700 text-white" : "text-stone-400 hover:text-stone-200"
                          }`}
                        >
                          Browser Synth
                        </button>
                      </div>
                    </div>

                    {voiceEngine === "neural" ? (
                      <>
                        {/* Complete Neural Voice Library Dropdown */}
                        <div>
                          <label className="block text-[10px] font-medium text-stone-400 mb-1">
                            Choose from 10 Studio Neural Voices:
                          </label>
                          <select
                            value={selectedNeuralVoice}
                            onChange={(e) => handleSelectNeuralVoice(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-emerald-500"
                          >
                            {STUDIO_NEURAL_VOICES.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} ({v.gender === "female" ? "Female" : "Male"}) — {v.tag}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Speaking Rate / Pacing */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-stone-400">Pacing Speed:</span>
                          <div className="flex items-center gap-1.5">
                            {[
                              { label: "Relaxed (-10%)", val: "-10%" },
                              { label: "Natural (0%)", val: "+0%" },
                              { label: "Upbeat (+10%)", val: "+10%" },
                            ].map((s) => (
                              <button
                                key={s.val}
                                type="button"
                                onClick={() => setVoicePacingRate(s.val)}
                                className={`px-2 py-1 rounded text-[10px] border transition-colors cursor-pointer ${
                                  voicePacingRate === s.val
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold"
                                    : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Pitch Tuning */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-stone-400">Pitch Tone:</span>
                          <div className="flex items-center gap-1.5">
                            {[
                              { label: "Deeper (-5Hz)", val: "-5Hz" },
                              { label: "Normal (0Hz)", val: "+0Hz" },
                              { label: "Brighter (+5Hz)", val: "+5Hz" },
                            ].map((p) => (
                              <button
                                key={p.val}
                                type="button"
                                onClick={() => setVoicePitchOffset(p.val)}
                                className={`px-2 py-1 rounded text-[10px] border transition-colors cursor-pointer ${
                                  voicePitchOffset === p.val
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold"
                                    : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Browser system voices dropdown */}
                        {availableVoices.length > 0 && (
                          <div>
                            <label className="block text-[10px] font-medium text-stone-400 mb-1">
                              Select System Synthesizer Voice:
                            </label>
                            <select
                              value={selectedVoiceURI}
                              onChange={(e) => handleSelectVoiceURI(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-500"
                            >
                              {availableVoices.map((v) => (
                                <option key={v.voiceURI || v.name} value={v.voiceURI || v.name}>
                                  {v.name} ({v.lang})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-stone-400">Pitch ({voicePitch.toFixed(2)}x):</span>
                          <input
                            type="range"
                            min="0.75"
                            max="1.45"
                            step="0.05"
                            value={voicePitch}
                            onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                            className="w-24 accent-amber-500 cursor-pointer"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Background Music Volume Slider */}
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-stone-300">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                <span>Music Volume</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 rounded text-stone-400 hover:text-stone-200"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-stone-400" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : musicVolume}
                  onChange={(e) => {
                    setMusicVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-20 accent-amber-500 cursor-pointer"
                />
                <span className="font-mono text-xs text-stone-400 w-8 text-right">
                  {isMuted ? "0%" : `${Math.round(musicVolume * 100)}%`}
                </span>
              </div>
            </div>

            {/* Background Soundtrack Track Selector & Audition Drawer */}
            <div className="pt-2 border-t border-stone-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-stone-300 min-w-0">
                  <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-medium text-stone-400 shrink-0">Track:</span>
                  <span className="text-amber-400 truncate max-w-[140px] font-semibold" title={selectedMusic?.title || "Auto Matching Topic"}>
                    {selectedMusic?.title || "Auto Matching Topic"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMusicPicker(!showMusicPicker)}
                  className="px-2 py-0.5 rounded text-[11px] font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer shrink-0"
                >
                  {showMusicPicker ? "Close Tracks" : "Change Track"}
                </button>
              </div>

              {/* Music Selection Drawer */}
              {showMusicPicker && (
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-3 max-h-96 overflow-y-auto">
                  {/* Top Bar: Title + Upload Audio Button */}
                  <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-xs">
                    <div className="flex items-center gap-1.5 text-stone-300 font-semibold">
                      <Music className="w-3.5 h-3.5 text-amber-400" />
                      <span>Soundtrack Library ({availableMusicTracks.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        ref={musicFileInputRef}
                        type="file"
                        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                        onChange={handleCustomAudioUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => musicFileInputRef.current?.click()}
                        className="px-2 py-1 rounded-lg text-[11px] font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Upload local MP3, WAV, or AAC audio file"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Audio</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={musicSearchQuery}
                        onChange={(e) => {
                          setMusicSearchQuery(e.target.value);
                          handleFilterMusic(e.target.value, selectedMusicGenre);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleFilterMusic(musicSearchQuery, selectedMusicGenre);
                          }
                        }}
                        placeholder="Search tracks, moods, NASA audio, artists..."
                        className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-stone-950 border border-stone-800 focus:border-amber-500 text-xs text-stone-200 placeholder-stone-500 focus:outline-none"
                      />
                      {musicSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setMusicSearchQuery("");
                            handleFilterMusic("", selectedMusicGenre);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={isSearchingMusic}
                      onClick={() => handleFilterMusic(musicSearchQuery, selectedMusicGenre)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {isSearchingMusic ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
                    </button>
                  </div>

                  {/* Genre Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                    {MUSIC_GENRES.map((g) => {
                      const isSelected = selectedMusicGenre === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setSelectedMusicGenre(g.id);
                            handleFilterMusic(musicSearchQuery, g.id);
                          }}
                          className={`px-2 py-0.8 rounded-full border whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? "bg-amber-500 text-stone-950 font-bold border-amber-400 shadow-sm"
                              : "bg-stone-950/80 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-300"
                          }`}
                        >
                          <span>{g.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Track Cards List */}
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                    {availableMusicTracks.length === 0 ? (
                      <div className="py-6 text-center text-xs text-stone-500 space-y-1">
                        <p>No audio tracks found matching "{musicSearchQuery}".</p>
                        <button
                          type="button"
                          onClick={() => {
                            setMusicSearchQuery("");
                            setSelectedMusicGenre("all");
                            handleFilterMusic("", "all");
                          }}
                          className="text-amber-400 hover:underline text-[11px]"
                        >
                          Reset filters & show all tracks
                        </button>
                      </div>
                    ) : (
                      availableMusicTracks.map((track) => {
                        const isSelected = selectedMusic?.download_url === track.download_url;
                        const isPreviewing = previewingMusicId === track.id;

                        return (
                          <div
                            key={track.id}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${
                              isSelected
                                ? "bg-amber-500/15 border-amber-500 text-stone-100"
                                : "bg-stone-950/70 border-stone-800/80 text-stone-300 hover:border-stone-700"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold truncate text-[11px]">{track.title}</span>
                                {track.genre && (
                                  <span className="px-1.5 py-0.2 rounded bg-stone-800 text-[9px] text-amber-400/90 shrink-0 font-mono">
                                    {track.genre}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-stone-500">
                                {track.artist} • {track.duration ? `${track.duration}s` : "Full track"} {track.license ? `• ${track.license}` : ""}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handlePreviewMusicTrack(track)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  isPreviewing
                                    ? "bg-amber-500 text-stone-950 border-amber-400 animate-pulse"
                                    : "bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700"
                                }`}
                                title={isPreviewing ? "Stop Audition" : "Audition Track"}
                              >
                                {isPreviewing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSelectMusicTrack(track)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-500 text-stone-950 border-amber-500 shadow-sm"
                                    : "bg-stone-800 hover:bg-stone-700 text-amber-300 border-stone-700"
                                }`}
                              >
                                {isSelected ? "Active" : "Use"}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Autonomous Generation Trigger Button */}
            <button
              id="autonomous-generate-btn"
              onClick={handleGenerateAutonomousVideo}
              disabled={isGenerating || !customPrompt.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Directing Autonomous Video...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Generate Autonomous Video</span>
                </>
              )}
            </button>
          </div>

          {/* Autonomous Status / Pipeline Progress Banner */}
          {isGenerating && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/50 space-y-2.5 animate-pulse">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Autonomous Studio Pipeline In Action</span>
              </div>
              <div className="text-xs text-stone-300 pl-6">
                {currentStep}
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${((stepIndex + 1) / PIPELINE_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-200">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Right Column: Live Autonomous Video Player */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div
            ref={playerContainerRef}
            className="p-5 rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl space-y-4 flex flex-col"
          >
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-100 truncate max-w-sm">
                  {videoPlan?.title || "Autonomous Video Preview"}
                </h3>
                <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                  <span>{loadedScenes.length} Autonomous Scenes</span>
                  <span>•</span>
                  <span className="font-mono">{totalDuration.toFixed(1)}s Runtime</span>
                  {selectedMusic && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400 flex items-center gap-1 truncate max-w-[140px]">
                        <Music className="w-3 h-3 shrink-0" />
                        <span className="truncate">{selectedMusic.title}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {loadedScenes.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadCompleteVideo}
                    disabled={isRenderingCompleteVideo}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-stone-950 text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer"
                    title="Render and download full stitched 1080p video"
                  >
                    {isRenderingCompleteVideo ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="truncate max-w-[160px]">{renderProgressMsg || "Rendering..."}</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Complete Video (.MP4)</span>
                      </>
                    )}
                  </button>

                  {activeScene?.videoAsset?.downloadUrl && (
                    <a
                      href={`/api/proxy-download?url=${encodeURIComponent(activeScene.videoAsset.downloadUrl)}&filename=scene_${activeScene.scene_number}.mp4`}
                      download={`scene_${activeScene.scene_number}.mp4`}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-stone-700"
                      title="Download active scene clip only"
                    >
                      <Film className="w-3 h-3 text-stone-400" />
                      <span className="hidden sm:inline">Clip</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Rendering Progress Banner if active */}
            {isRenderingCompleteVideo && (
              <div className="px-4 py-2.5 rounded-xl bg-amber-950/60 border border-amber-600/60 flex items-center gap-3 text-xs text-amber-200 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                <div className="flex-1 font-medium">
                  {renderProgressMsg || "Stitching complete video with transitions, split-screen, and background music..."}
                </div>
              </div>
            )}

            {/* Hardware-Accelerated Native Video Stage */}
            <div className={`relative w-full rounded-xl bg-stone-950 border border-stone-800 overflow-hidden flex items-center justify-center shadow-inner group ${
              aspectRatio === "9:16" ? "max-w-[320px] mx-auto aspect-[9/16]" : "aspect-[16/9]"
            }`}>
              {/* Always-Mounted Video Element A */}
              <video
                ref={videoRefA}
                muted
                playsInline
                loop
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src && !target.src.includes("/api/proxy-video")) {
                    console.info("Buffer A video playback fallback to streaming proxy");
                    target.src = `/api/proxy-video?url=${encodeURIComponent(target.src)}`;
                    target.play().catch(() => {});
                  }
                }}
                className={`absolute top-0 bottom-0 object-cover transition-all duration-500 ease-in-out ${
                  (activeScene?.transition === "splitscreen" || activeScene?.layout === "splitscreen") && activeScene.secondaryVideoAsset
                    ? "left-0 w-1/2 border-r-2 border-amber-500/60 z-10 opacity-100"
                    : activeBuffer === "A"
                    ? "left-0 w-full opacity-100 scale-100 z-10"
                    : "left-0 w-full opacity-0 scale-105 z-0 pointer-events-none"
                } ${activeScene?.transition === "zoom" && activeScene?.transition !== "splitscreen" ? "scale-105 transition-transform duration-3000" : ""}`}
              />

              {/* Always-Mounted Video Element B */}
              <video
                ref={videoRefB}
                muted
                playsInline
                loop
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src && !target.src.includes("/api/proxy-video")) {
                    console.info("Buffer B video playback fallback to streaming proxy");
                    target.src = `/api/proxy-video?url=${encodeURIComponent(target.src)}`;
                    target.play().catch(() => {});
                  }
                }}
                className={`absolute top-0 bottom-0 left-0 w-full object-cover transition-all duration-500 ease-in-out ${
                  !((activeScene?.transition === "splitscreen" || activeScene?.layout === "splitscreen") && activeScene.secondaryVideoAsset) && activeBuffer === "B"
                    ? "opacity-100 scale-100 z-10"
                    : "opacity-0 scale-105 z-0 pointer-events-none"
                } ${activeScene?.transition === "zoom" && activeScene?.transition !== "splitscreen" ? "scale-105 transition-transform duration-3000" : ""}`}
              />

              {/* Always-Mounted Secondary Video Element for Split-Screen */}
              <video
                ref={secVideoRef}
                muted
                playsInline
                loop
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src && !target.src.includes("/api/proxy-video")) {
                    console.info("Secondary video playback fallback to streaming proxy");
                    target.src = `/api/proxy-video?url=${encodeURIComponent(target.src)}`;
                    target.play().catch(() => {});
                  }
                }}
                className={`absolute top-0 bottom-0 right-0 w-1/2 object-cover transition-all duration-500 ease-in-out ${
                  (activeScene?.transition === "splitscreen" || activeScene?.layout === "splitscreen") && activeScene.secondaryVideoAsset
                    ? "opacity-100 z-10"
                    : "opacity-0 pointer-events-none z-0"
                }`}
              />

              {/* Split Screen Indicator Badges when active */}
              {(activeScene?.transition === "splitscreen" || activeScene?.layout === "splitscreen") && activeScene.secondaryVideoAsset && (
                <>
                  <div className="absolute top-3 left-3 z-30 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[10px] font-mono text-amber-300 font-bold border border-amber-500/40">
                    ANGLE A
                  </div>
                  <div className="absolute top-3 right-3 z-30 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[10px] font-mono text-cyan-300 font-bold border border-cyan-500/40">
                    ANGLE B
                  </div>
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-500/50 text-[10px] font-mono font-bold text-amber-400 shadow-xl flex items-center gap-1.5">
                    <Columns className="w-3 h-3 text-amber-400" />
                    <span>SPLIT-SCREEN DUAL VIEW</span>
                  </div>
                </>
              )}

              {/* Cinematic Vignette Overlay */}
              <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/30" />

              {/* Scene Counter Badge & Transition Badge */}
              {loadedScenes.length > 0 && (
                <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 font-mono text-xs text-amber-400 font-bold shadow-md">
                    SCENE {activeSceneIndex + 1} / {loadedScenes.length}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] text-stone-300 font-medium font-mono">
                    {activeScene?.duration.toFixed(1)}s
                  </span>
                  {activeScene?.transition && activeScene.transition !== "none" && (
                    <span className="px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-sm text-[10px] text-amber-300 font-medium border border-amber-500/30 flex items-center gap-1">
                      {activeScene.transition === "splitscreen" ? <Columns className="w-2.5 h-2.5" /> : <Sparkles className="w-2.5 h-2.5" />}
                      <span className="capitalize">{activeScene.transition}</span>
                    </span>
                  )}
                  {voiceoverEnabled && (
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] text-emerald-300 font-medium flex items-center gap-1 border border-emerald-500/30">
                      <Mic className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{voiceEngine === "neural" ? `${STUDIO_NEURAL_VOICES.find(v => v.id === selectedNeuralVoice)?.name || "Jenny"} (Neural)` : "Browser Voice"}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Subtitles Overlay */}
              {loadedScenes.length > 0 && subtitlesStyle !== "none" && activeScene?.subtitle && (
                <div className="absolute bottom-6 inset-x-4 z-30 flex justify-center text-center pointer-events-none">
                  {subtitlesStyle === "highlight" ? (
                    <div className="px-4 py-2 rounded-xl bg-stone-950/90 border border-amber-500/70 shadow-2xl backdrop-blur-md">
                      <p className="text-base sm:text-lg font-bold text-amber-400 tracking-wide">
                        {activeScene.subtitle}
                      </p>
                    </div>
                  ) : (
                    <p className="text-base sm:text-lg font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] max-w-md">
                      {activeScene.subtitle}
                    </p>
                  )}
                </div>
              )}

              {/* Empty Stage Placeholder */}
              {loadedScenes.length === 0 && !isGenerating && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center text-stone-400 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-amber-400 shadow-lg">
                    <Video className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-200">Autonomous Video Stage Ready</h4>
                    <p className="text-xs text-stone-500 max-w-sm mt-1">
                      Type your prompt on the left and click "Generate Autonomous Video" to generate and edit seamless footage with audio!
                    </p>
                  </div>
                </div>
              )}

              {/* Big overlay play button when paused */}
              {loadedScenes.length > 0 && !isPlaying && !isGenerating && (
                <button
                  onClick={handlePlay}
                  className="absolute z-40 w-16 h-16 rounded-full bg-amber-500/90 hover:bg-amber-400 text-stone-950 flex items-center justify-center shadow-2xl transition-transform hover:scale-105 cursor-pointer"
                  title="Play video"
                >
                  <Play className="w-7 h-7 fill-current ml-1" />
                </button>
              )}
            </div>

            {/* Seamless Interactive Multi-Scene Timeline & Playback Controls */}
            {loadedScenes.length > 0 && (
              <div className="space-y-3 pt-1">
                {/* Visual Multi-Scene Chronological Timeline Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400 font-bold">{currentTime.toFixed(1)}s</span>
                      <span className="text-stone-600">/</span>
                      <span>{totalDuration.toFixed(1)}s</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400">Continuous Seamless Timeline</span>
                      <span className="px-1.5 py-0.5 rounded bg-stone-800 text-[10px] text-stone-300">
                        {loadedScenes.length} Segments
                      </span>
                    </div>
                  </div>

                  {/* Multi-Segment Timeline Bar Container */}
                  <div className="relative w-full h-10 rounded-xl bg-stone-950 border border-stone-800 p-1 flex gap-1 overflow-hidden shadow-inner">
                    {/* Scene Blocks */}
                    {loadedScenes.map((scene, idx) => {
                      const sceneStart = getSceneStartTime(idx);
                      const sceneEnd = sceneStart + scene.duration;
                      const isActive = currentTime >= sceneStart && (currentTime < sceneEnd || (idx === loadedScenes.length - 1 && currentTime <= sceneEnd));
                      const progressInScene = isActive ? Math.max(0, Math.min(1, (currentTime - sceneStart) / scene.duration)) : currentTime > sceneEnd ? 1 : 0;
                      const widthPercent = (scene.duration / totalDuration) * 100;

                      return (
                        <div
                          key={scene.scene_number}
                          onClick={() => handleJumpToScene(idx)}
                          style={{ width: `${widthPercent}%` }}
                          className={`relative h-full rounded-lg overflow-hidden cursor-pointer transition-all border flex items-center justify-between px-2 ${
                            isActive
                              ? "border-amber-500 bg-stone-900 shadow-md ring-1 ring-amber-500/40"
                              : "border-stone-800/80 bg-stone-900/60 hover:border-stone-700"
                          }`}
                          title={`Scene ${scene.scene_number}: ${scene.narration} (${scene.duration}s) - Click to jump`}
                        >
                          {/* Progress fill within this scene */}
                          <div
                            className="absolute inset-y-0 left-0 bg-amber-500/20 pointer-events-none transition-all duration-100"
                            style={{ width: `${progressInScene * 100}%` }}
                          />

                          {/* Scene Label & Transition */}
                          <div className="relative z-10 flex items-center gap-1 truncate">
                            <span className={`text-[10px] font-bold ${isActive ? "text-amber-400 font-mono" : "text-stone-300 font-mono"}`}>
                              S{scene.scene_number}
                            </span>
                            {scene.transition === "splitscreen" && (
                              <span className="text-[9px] px-1 rounded bg-amber-500/30 text-amber-300 font-mono hidden sm:inline">
                                Split
                              </span>
                            )}
                          </div>

                          <span className="relative z-10 text-[9px] font-mono text-stone-500">
                            {scene.duration}s
                          </span>
                        </div>
                      );
                    })}

                    {/* Master Playhead Line across entire timeline */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 pointer-events-none transition-all duration-100 shadow-[0_0_8px_#f59e0b]"
                      style={{ left: `${(currentTime / (totalDuration || 1)) * 100}%` }}
                    >
                      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-stone-950" />
                    </div>
                  </div>

                  {/* Scrubber slider overlay */}
                  <input
                    type="range"
                    min="0"
                    max={totalDuration || 1}
                    step="0.1"
                    value={currentTime}
                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-stone-800 rounded-lg opacity-80 hover:opacity-100 transition-opacity"
                    title="Drag to scrub anywhere in the video"
                  />
                </div>

                {/* Control Buttons row */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={isPlaying ? handlePause : handlePlay}
                      className="p-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 transition-colors cursor-pointer shadow-md"
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>

                    <button
                      onClick={handleRestart}
                      className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 transition-colors cursor-pointer"
                      title="Replay entire video from start"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <span className="text-xs text-stone-300 font-medium ml-2">
                      Scene {activeSceneIndex + 1} of {loadedScenes.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 transition-colors cursor-pointer"
                      title="Toggle Fullscreen"
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>

                    {voiceoverEnabled && (
                      <div className="text-[11px] font-mono text-stone-300 bg-stone-800 px-2 py-1 rounded border border-stone-700 flex items-center gap-1">
                        <Mic className="w-3 h-3 text-amber-400" />
                        <span>{voiceGender === "female" ? "Female Voice" : voiceGender === "male" ? "Male Voice" : "Custom Voice"}</span>
                      </div>
                    )}

                    <div className="text-[11px] font-mono text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-700/40">
                      Seamless 1080p
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Autonomous Scene Breakdown Timeline Section */}
          {loadedScenes.length > 0 && (
            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-200">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Autonomous Scene Breakdown</span>
                </div>
                <span className="text-[11px] text-amber-400/90 font-medium">
                  Click any scene to jump playback along the timeline
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                {loadedScenes.map((scene, idx) => {
                  const isActive = activeSceneIndex === idx;
                  const sceneStart = getSceneStartTime(idx);

                  return (
                    <div
                      key={scene.scene_number}
                      onClick={() => handleJumpToScene(idx)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 relative overflow-hidden group ${
                        isActive
                          ? "bg-amber-500/10 border-amber-500 text-stone-100 shadow-sm ring-1 ring-amber-500/30"
                          : "bg-stone-950 border-stone-800/80 text-stone-400 hover:border-stone-700"
                      }`}
                    >
                      {/* Thumbnail container */}
                      <div className="w-16 h-12 rounded-lg overflow-hidden bg-stone-850 shrink-0 relative">
                        {scene.videoAsset?.thumbnailUrl ? (
                          <img
                            src={scene.videoAsset.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-600">
                            <Video className="w-4 h-4" />
                          </div>
                        )}
                        <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 font-mono text-[9px] text-white">
                          {scene.duration}s
                        </span>
                        {isActive && (
                          <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                            <Play className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className={`font-semibold truncate ${isActive ? "text-amber-400" : "text-stone-300"}`}>
                              Scene {scene.scene_number}
                            </span>
                            {scene.transition === "splitscreen" && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[9px] text-amber-300 font-mono">
                                Split-Screen
                              </span>
                            )}
                            {scene.transition === "zoom" && (
                              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-[9px] text-cyan-300 font-mono">
                                Zoom
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-stone-500 shrink-0">
                            {sceneStart.toFixed(0)}s - {(sceneStart + scene.duration).toFixed(0)}s
                          </span>
                        </div>
                        <p className="text-[11px] line-clamp-2 mt-0.5 text-stone-400">
                          {scene.narration}
                        </p>
                        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-stone-800/60">
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                              scene.videoAsset?.source === "giphy"
                                ? "bg-purple-900/70 text-purple-200 border border-purple-700/50"
                                : scene.videoAsset?.source === "pexels"
                                ? "bg-emerald-900/70 text-emerald-200 border border-emerald-700/50"
                                : scene.videoAsset?.source === "nasa"
                                ? "bg-blue-900/70 text-blue-200 border border-blue-700/50"
                                : scene.videoAsset?.source === "archive"
                                ? "bg-amber-900/70 text-amber-200 border border-amber-700/50"
                                : "bg-sky-900/70 text-sky-200 border border-sky-700/50"
                            }`}
                          >
                            {scene.videoAsset?.source || "stock"}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSwapModal(idx);
                            }}
                            className="px-2 py-0.5 rounded bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-300 text-[10px] font-medium flex items-center gap-1 transition-colors border border-stone-700/50"
                            title="Replace footage with custom Pexels, Pixabay, GIPHY, Archive, or NASA clip"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>Swap / Providers</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Footage & GIPHY Replacement Modal */}
      {swappingSceneIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
                    Scene {swappingSceneIdx + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-stone-100">
                    Replace Footage with Pexels, Pixabay, or GIPHY
                  </h3>
                </div>
                <p className="text-xs text-stone-400 truncate max-w-md mt-0.5">
                  "{loadedScenes[swappingSceneIdx]?.narration}"
                </p>
              </div>
              <button
                onClick={() => setSwappingSceneIdx(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 border-b border-stone-800/80 bg-stone-900/60 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={swapKeywords}
                    onChange={(e) => setSwapKeywords(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") performSwapSearch(swapKeywords, swapProvider);
                    }}
                    placeholder="Search keywords or vibe (e.g. pyramids egypt, coding computer, excited meme)..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <button
                  onClick={() => performSwapSearch(swapKeywords, swapProvider)}
                  disabled={isSearchingSwap}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSearchingSwap ? "animate-spin" : ""}`} />
                  <span>Search</span>
                </button>
              </div>

              {/* Provider Tabs */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="inline-flex p-0.5 rounded-lg bg-stone-950 border border-stone-800 text-[11px] flex-wrap">
                  {(["all", "pexels", "pixabay", "giphy", "archive", "nasa"] as const).map((src) => (
                    <button
                      key={src}
                      onClick={() => {
                        setSwapProvider(src);
                        performSwapSearch(swapKeywords, src);
                      }}
                      className={`px-2.5 py-1 rounded-md transition-colors capitalize ${
                        swapProvider === src
                          ? "bg-amber-500 text-stone-950 font-bold"
                          : "text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      {src === "giphy"
                        ? "✨ GIPHY"
                        : src === "pexels"
                        ? "🎬 Pexels"
                        : src === "pixabay"
                        ? "🎥 Pixabay"
                        : src === "archive"
                        ? "🏛️ Archive"
                        : src === "nasa"
                        ? "🚀 NASA"
                        : "🌟 All"}
                    </button>
                  ))}
                </div>

                {/* Quick Trending / Space Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSwapKeywords("space galaxy earth nebula");
                      setSwapProvider("nasa");
                      performSwapSearch("space galaxy earth nebula", "nasa");
                    }}
                    className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>🚀 NASA Space</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setSwapProvider("giphy");
                      setIsSearchingSwap(true);
                      setSwapError(null);
                      try {
                        const res = await fetch("/api/giphy/trending?limit=15");
                        if (!res.ok) throw new Error("GIPHY trending request failed");
                        const data = await res.json();
                        setSwapResults(data.results || []);
                      } catch (e: any) {
                        setSwapError(e.message);
                      } finally {
                        setIsSearchingSwap(false);
                      }
                    }}
                    className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>🔥 Trending GIPHY</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Results Grid */}
            <div className="p-4 overflow-y-auto flex-1 min-h-[280px]">
              {isSearchingSwap ? (
                <div className="flex flex-col items-center justify-center py-16 text-stone-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                  <span className="text-xs">Searching {swapProvider.toUpperCase()} for "{swapKeywords}"...</span>
                </div>
              ) : swapError ? (
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-300 text-xs flex items-center justify-between">
                  <span>{swapError}</span>
                  <button
                    onClick={() => performSwapSearch(swapKeywords, swapProvider)}
                    className="underline hover:text-rose-100"
                  >
                    Retry
                  </button>
                </div>
              ) : swapResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-stone-500 gap-2 text-center">
                  <Film className="w-8 h-8 text-stone-600" />
                  <p className="text-xs">Type a search term, or click "NASA Space" / "Trending GIPHY" to find clips for this scene.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {swapResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectSwapMedia(item)}
                      className="group relative rounded-xl overflow-hidden border border-stone-800 bg-stone-950 hover:border-amber-500 cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col"
                    >
                      <div className="aspect-video relative bg-stone-900 overflow-hidden">
                        {item.type === "video" && item.previewUrl ? (
                          <video
                            src={item.previewUrl}
                            muted
                            loop
                            playsInline
                            onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                            onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={item.thumbnailUrl || item.previewUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                        <span
                          className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            item.source === "giphy"
                              ? "bg-purple-900/90 text-purple-200 border border-purple-700/50"
                              : item.source === "pexels"
                              ? "bg-emerald-900/90 text-emerald-200 border border-emerald-700/50"
                              : item.source === "nasa"
                              ? "bg-blue-900/90 text-blue-200 border border-blue-700/50"
                              : item.source === "archive"
                              ? "bg-amber-900/90 text-amber-200 border border-amber-700/50"
                              : "bg-sky-900/90 text-sky-200 border border-sky-700/50"
                          }`}
                        >
                          {item.source}
                        </span>
                        {item.duration && (
                          <span className="absolute bottom-1.5 right-1.5 px-1 py-0.2 rounded bg-black/80 text-stone-200 font-mono text-[9px]">
                            {item.duration}s
                          </span>
                        )}
                      </div>
                      <div className="p-2 flex items-center justify-between gap-1">
                        <span className="text-[11px] text-stone-300 truncate font-medium">
                          {item.title || item.id}
                        </span>
                        <span className="text-[10px] text-amber-400 font-semibold shrink-0 group-hover:underline">
                          Select
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
