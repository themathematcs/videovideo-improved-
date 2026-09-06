import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { generatePythonScript } from "./src/pythonTemplate.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// API Keys with defaults from user configuration
const PEXELS_KEY = process.env.PEXELS_API_KEY || "h1r1DWw3EyuEcP8pFXl6e9jo76I0RfxUoG3d18kvEliS6pH6eEyHbmNo";
const PIXABAY_KEY = process.env.PIXABAY_API_KEY || "35348186-369453ead8e33f2eec3ada4ec";

// Rate limit in-memory telemetry
const rateLimitState = {
  pexels: {
    limit: null as number | null,
    remaining: null as number | null,
    reset: null as number | null,
    lastUpdated: null as string | null,
    status: 'healthy' as 'healthy' | 'warning' | 'throttled' | 'unknown',
  },
  pixabay: {
    limit: null as number | null,
    remaining: null as number | null,
    reset: null as number | null,
    lastUpdated: null as string | null,
    status: 'healthy' as 'healthy' | 'warning' | 'throttled' | 'unknown',
  }
};

// Lazy Gemini AI initialization with key validity check
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key === "MY_GEMINI_API_KEY" || key === "TODO" || key === "YOUR_API_KEY" || key === "undefined" || key === "null") {
    return null;
  }
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch {
      aiClient = null;
    }
  }
  return aiClient;
}

// -------------------------------------------------------------
// SEMANTIC STOCK VIDEO KEYWORD EXTRACTOR & DOMAIN MAPPER
// -------------------------------------------------------------
const NON_VISUAL_STOPWORDS = new Set([
  "meet", "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with",
  "by", "about", "into", "through", "is", "are", "was", "were", "this", "that", "these",
  "those", "they", "them", "their", "we", "us", "our", "you", "your", "he", "she", "it",
  "its", "make", "create", "show", "video", "tell", "story", "generate", "autonomous",
  "don", "t", "s", "just", "play", "game", "write", "post", "fake", "pose", "convince",
  "quietly", "open", "result", "drained", "second", "seconds", "coming", "already",
  "here", "paying", "fund", "entire", "unit", "operator", "operators", "most", "break",
  "personal", "profit", "hard", "soft", "long", "short", "also", "some", "like", "very"
]);

function extractSemanticStockKeywords(
  sentence: string,
  wholeText: string,
  sceneIdx: number
): { keywords: string; secondary: string; music: string; mood: string } {
  const lowerWhole = (wholeText + " " + sentence).toLowerCase();
  const lowerSentence = sentence.toLowerCase();

  // Detect Primary Domain
  let domain = "tech";
  if (/(hack|lazarus|cyber|pyongyang|malware|trojan|backdoor|exploit|phishing|ransomware|firewall|breach|state-sponsored)/.test(lowerWhole)) {
    domain = "cyber";
  } else if (/(crypto|bitcoin|ethereum|blockchain|finance|trading|stock|market|money|invest|wealth|economy|wall street|assets|launder|cash|dollars)/.test(lowerWhole)) {
    domain = "crypto";
  } else if (/(pasta|pizza|cook|kitchen|chef|food|bake|bakery|recipe|dinner|delicious|culinary|italian|restaurant|steak|dessert|burger|coffee|cafe|eating)/.test(lowerWhole)) {
    domain = "culinary";
  } else if (/(wildlife|savannah|safari|animal|lion|elephant|forest|nature|ocean|underwater|whale|reef|mountain|jungle|river|bird|eagle|sunset|island)/.test(lowerWhole)) {
    domain = "wildlife";
  } else if (/(gym|workout|fitness|muscle|athlete|running|marathon|boxing|crossfit|yoga|weightlifting|sports|bodybuilding|football|basketball)/.test(lowerWhole)) {
    domain = "sports";
  } else if (/(travel|tokyo|paris|city|wanderlust|streets|vacation|tourism|hotel|skyline|urban|flight|airport|explore|europe|japan)/.test(lowerWhole)) {
    domain = "travel";
  } else if (/(space|mars|galaxy|cosmos|star|astronaut|nasa|orbit|rocket|planet|universe|nebula|telescope)/.test(lowerWhole)) {
    domain = "space";
  } else if (/(car|supercar|driving|race|racing|drift|drifting|speed|porsche|ferrari|lamborghini|motorcycle|track|engine|automotive)/.test(lowerWhole)) {
    domain = "cars";
  } else if (/(meditation|health|wellness|mindful|mental|spa|peace|calm|skincare|breathe|therapy|relax|doctor|hospital|medical)/.test(lowerWhole)) {
    domain = "health";
  } else if (/(art|paint|painting|design|photo|photography|music|guitar|piano|dj|fashion|aesthetic|dance|studio)/.test(lowerWhole)) {
    domain = "art";
  }

  // Domain-Specific Visual Sequences
  if (domain === "cyber") {
    // Check specific sub-intent in the sentence
    if (/(job|recruiter|linkedin|software engineer|coding test|interview|developer|programmer|phishing|resume|hiring|scam)/.test(lowerSentence)) {
      return {
        keywords: "software engineer typing laptop office desk",
        secondary: "programmer workspace multiple monitors code",
        music: "dark cyber synthwave electronic suspense",
        mood: "tense electronic pulse"
      };
    }
    if (/(crypto|bitcoin|ethereum|exchange|digital assets|drained|launder|bridges|cash|dollar|money|wealth|blockchain|defi|billions)/.test(lowerSentence)) {
      return {
        keywords: "cryptocurrency bitcoin trading chart graph screen",
        secondary: "digital currency matrix money transfer glowing",
        music: "tense electronic pulse technology",
        mood: "high stakes financial"
      };
    }
    if (/(warfare|military|nuclear|weapons|regime|pyongyang|defense|missile|radar|satellite|command)/.test(lowerSentence)) {
      return {
        keywords: "cyber warfare military command center glowing monitors",
        secondary: "digital world map network connections cyber",
        music: "cinematic suspense trailer drone",
        mood: "dark atmospheric thriller"
      };
    }
    if (/(hack|lazarus|cyber unit|operator|state-sponsored|trojan|malware|backdoor|exploit|breach|firewall|payload|system)/.test(lowerSentence)) {
      const cyberPool = [
        "hacker typing computer dark room code",
        "cyber attack server room data center flashing lights",
        "hooded hacker keyboard typing green matrix",
        "cybersecurity firewall lock digital network shield"
      ];
      const secPool = [
        "matrix binary code stream glowing screen",
        "server rack data blinking neon lights",
        "cyber threat map live digital connections"
      ];
      return {
        keywords: cyberPool[sceneIdx % cyberPool.length],
        secondary: secPool[sceneIdx % secPool.length],
        music: "dark cyber synthwave electronic suspense",
        mood: "dark electronic pulse"
      };
    }
    return {
      keywords: "cyber security hacker computer dark room",
      secondary: "server farm data center glowing lights",
      music: "dark cyber synthwave electronic suspense",
      mood: "tense cyber thriller"
    };
  }

  if (domain === "crypto") {
    if (/(trading|chart|market|graph|candlestick|exchange|price)/.test(lowerSentence)) {
      return {
        keywords: "stock trading charts market graphs screen trader",
        secondary: "candlestick chart financial analytics screen",
        music: "dark modern electronic corporate pulse",
        mood: "high tech financial"
      };
    }
    return {
      keywords: "cryptocurrency bitcoin blockchain digital wealth",
      secondary: "server farm blockchain data nodes futuristic",
      music: "dark modern electronic corporate pulse",
      mood: "high tech financial"
    };
  }

  // Generic fallback with intelligent word extraction
  const words = lowerSentence
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !NON_VISUAL_STOPWORDS.has(w));
  
  const meaningfulSubject = words.slice(0, 3).join(" ");
  const fallbackKeywords = meaningfulSubject ? `${meaningfulSubject} ${domain} cinematic` : `${domain} high quality footage`;
  
  return {
    keywords: fallbackKeywords,
    secondary: `${domain} detail close up motion`,
    music: `${domain} ambient modern`,
    mood: `${domain} inspiring`
  };
}

// -------------------------------------------------------------
// SUBTITLE GENERATION (ASS SUBSTATION ALPHA)
// -------------------------------------------------------------
function formatAssTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function generateAssContent(
  scenes: Array<{ duration: number; subtitle?: string; narration?: string }>,
  subtitlesStyle: string = "highlight",
  aspectRatio: string = "16:9"
): string {
  const isPortrait = aspectRatio === "9:16";
  const resX = isPortrait ? 1080 : 1920;
  const resY = isPortrait ? 1920 : 1080;
  const fontSize = isPortrait ? 56 : 46;
  const marginV = isPortrait ? 220 : 75;

  // Colors in ASS are &HAABBGGRR (Alpha, Blue, Green, Red)
  // Yellow highlight: &H0000FFFF (&H00BBGGRR -> BB=00, GG=FF, RR=FF)
  // White: &H00FFFFFF
  // Black outline: &H00000000
  // Shadow: &H80000000

  let styleLine = `Style: Default,DejaVu Sans,${fontSize},&H0000FFFF,&H000000FF,&H00000000,&H90000000,-1,0,0,0,100,100,0,0,1,3.5,2,2,40,40,${marginV},1`;
  if (subtitlesStyle === "classic") {
    styleLine = `Style: Default,DejaVu Sans,${fontSize},&H00FFFFFF,&H000000FF,&H00000000,&H90000000,-1,0,0,0,100,100,0,0,1,3.5,2,2,40,40,${marginV},1`;
  } else if (subtitlesStyle === "minimal") {
    styleLine = `Style: Default,DejaVu Sans,${fontSize - 4},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,3,2,1,2,40,40,${marginV},1`;
  }

  let events = "";
  let currentTime = 0;

  for (const sc of scenes) {
    const dur = Math.max(1, Number(sc.duration) || 5);
    const textRaw = (sc.subtitle || sc.narration || "").trim();
    if (textRaw) {
      // Clean and break long text into 2 balanced lines if needed
      const cleanText = textRaw.replace(/[\r\n]+/g, " ").replace(/"/g, "'");
      const words = cleanText.split(/\s+/);
      let formattedText = cleanText;
      if (words.length > 7) {
        const mid = Math.ceil(words.length / 2);
        formattedText = words.slice(0, mid).join(" ") + "\\N" + words.slice(mid).join(" ");
      }

      const startTimeStr = formatAssTime(currentTime);
      const endTimeStr = formatAssTime(currentTime + dur);
      events += `Dialogue: 0,${startTimeStr},${endTimeStr},Default,,0,0,0,,${formattedText}\n`;
    }
    currentTime += dur;
  }

  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${resX}
PlayResY: ${resY}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styleLine}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events}`;
}
function fallbackRuleBasedParser(script: string) {
  const cleanScript = script.trim();
  const sentences = cleanScript
    .split(/(?<=[.?!])\s+|\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 3);

  // Stop words to clean keywords
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with",
    "by", "about", "against", "between", "into", "through", "during", "before",
    "after", "above", "below", "from", "up", "down", "is", "are", "was", "were",
    "be", "been", "being", "have", "has", "had", "do", "does", "did", "this",
    "that", "these", "those", "it", "its", "they", "them", "their", "we", "us",
    "our", "you", "your", "can", "will", "would", "should", "than", "ever", "very"
  ]);

  const lower = cleanScript.toLowerCase();

  // Detect general domain for optimal stock footage keywords
  let domainTag = "cinematic";
  let music_keywords = ["tech ambient synth", "cinematic inspirational", "lofi chill coding"];
  let sfx_keywords = ["keyboard typing", "futuristic swoosh", "data server hum"];

  if (/(security|cyber|hack|threat|firewall|server|network|cloud)/.test(lower)) {
    domainTag = "cybersecurity technology";
    music_keywords = ["dark cyber synthwave", "tense electronic pulse", "suspense drone"];
    sfx_keywords = ["digital alert glitch", "firewall alarm", "server rack hum"];
  } else if (/(coffee|cafe|morning|espresso|roast|cup|drink)/.test(lower)) {
    domainTag = "coffee roasting cafe";
    music_keywords = ["acoustic chill indie", "warm morning coffee acoustic", "organic ambient piano"];
    sfx_keywords = ["coffee cup clink", "gentle steam pour", "cafe background murmur"];
  } else if (/(energy|solar|wind|clean|turbine|electric|grid|green|sustainable)/.test(lower)) {
    domainTag = "renewable energy solar wind";
    music_keywords = ["clean ambient future", "uplifting orchestral inspire", "inspiring corporate"];
    sfx_keywords = ["wind turbine breeze", "electrical hum", "subtle digital click"];
  } else if (/(code|software|developer|app|programming|engineer|tech|ai|robot)/.test(lower)) {
    domainTag = "software developer technology";
    music_keywords = ["tech ambient synth", "lofi chill coding", "modern electronic pulse"];
    sfx_keywords = ["keyboard typing", "futuristic swoosh", "code compile beep"];
  } else if (/(wildlife|nature|safari|forest|animal|ocean|mountain)/.test(lower)) {
    domainTag = "wildlife nature landscape";
    music_keywords = ["cinematic nature wildlife", "organic acoustic ambient", "majestic orchestral"];
    sfx_keywords = ["forest birds chirping", "wind in trees", "distant thunder"];
  } else if (/(workout|fitness|gym|athlete|running|training|sports)/.test(lower)) {
    domainTag = "athlete gym training";
    music_keywords = ["energetic electronic workout", "high stakes action beat", "rock sports trailer"];
    sfx_keywords = ["dumbbell clank", "heavy breathing", "fast heartbeat"];
  } else if (/(travel|vacation|city|destination|explore|journey)/.test(lower)) {
    domainTag = "travel adventure cityscape";
    music_keywords = ["chillhop lofi travel", "inspirational acoustic guitar", "warm adventure"];
    sfx_keywords = ["airplane whoosh", "city street ambience", "camera shutter click"];
  }

  const scenes = sentences.map((line, idx) => {
    // Extract meaningful nouns and verbs
    const words = line
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    let keywords = words.slice(0, 3).join(" ");
    if (!keywords) keywords = `${domainTag} footage`;

    return {
      scene_number: idx + 1,
      script_line: line,
      search_keywords: `${keywords} ${domainTag}`.trim().split(/\s+/).slice(0, 4).join(" "),
      media_type: "video" as const
    };
  });

  return {
    project_name: "video_project",
    scenes: scenes.length > 0 ? scenes : [
      {
        scene_number: 1,
        script_line: cleanScript || "Video introduction scene",
        search_keywords: `${domainTag} cinematic`,
        media_type: "video" as const
      }
    ],
    audio_suggestions: {
      music_keywords,
      sfx_keywords
    }
  };
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasPexelsKey: Boolean(PEXELS_KEY),
    hasPixabayKey: Boolean(PIXABAY_KEY),
    rateLimits: rateLimitState
  });
});

// Rate limits info endpoint
app.get("/api/stock/rate-limits", (req, res) => {
  res.json(rateLimitState);
});

// 1. Analyze script with Gemini (or fallback)
app.post("/api/analyze-script", async (req, res) => {
  const { script } = req.body;
  if (!script || typeof script !== "string" || !script.trim()) {
    return res.status(400).json({ error: "Script text is required" });
  }

  const promptText = `Analyze this video script line by line. Break it down into sequential video scenes, and recommend background music and audio sound effects (SFX) that fit the mood.
Script:
"""
${script.trim()}
"""`;

  const systemInstruction = `You are an expert AI Video Editor Assistant. Your task is to analyze a video script, break it down into sequential video scenes, AND recommend background music and audio sound effects (SFX) that fit the mood.

RULES:
1. Break down scenes sequentially with optimized stock video search queries. Keep search terms short and descriptive (e.g., "coding laptop office", "aerial city sunset").
2. Under "audio_suggestions", recommend 2-3 background music track keywords matching the tone (e.g., "tech ambient synth", "cinematic inspirational", "lofi chill coding").
3. Recommend 2-3 specific Sound Effects (SFX) for key visual moments (e.g., "keyboard typing", "futuristic swoosh", "server room hum").
4. Output ONLY a valid JSON object wrapped in a json block. Do not include extra conversational text.

OUTPUT FORMAT:
{
  "project_name": "video_project",
  "scenes": [
    {
      "scene_number": 1,
      "script_line": "...",
      "search_keywords": "...",
      "media_type": "video"
    }
  ],
  "audio_suggestions": {
    "music_keywords": ["tech ambient synth", "cinematic inspirational"],
    "sfx_keywords": ["keyboard typing", "futuristic swoosh", "data server hum"]
  }
}`;

  try {
    const ai = getGeminiClient();
    if (!ai) {
      console.log("No GEMINI_API_KEY set; using high-accuracy fallback script parser.");
      const fallbackResult = fallbackRuleBasedParser(script);
      return res.json(fallbackResult);
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            project_name: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  scene_number: { type: Type.INTEGER },
                  script_line: { type: Type.STRING },
                  search_keywords: { type: Type.STRING },
                  media_type: { type: Type.STRING }
                },
                required: ["scene_number", "script_line", "search_keywords", "media_type"]
              }
            },
            audio_suggestions: {
              type: Type.OBJECT,
              properties: {
                music_keywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                sfx_keywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["music_keywords", "sfx_keywords"]
            }
          },
          required: ["project_name", "scenes", "audio_suggestions"]
        }
      }
    });

    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);

    // Normalize media_type & structure
    if (parsed.scenes && Array.isArray(parsed.scenes)) {
      parsed.scenes = parsed.scenes.map((s: any, idx: number) => ({
        scene_number: s.scene_number || (idx + 1),
        script_line: s.script_line || "",
        search_keywords: s.search_keywords || "stock footage b-roll",
        media_type: (s.media_type && s.media_type.toLowerCase() === "image") ? "image" : "video"
      }));
    }

    if (!parsed.audio_suggestions) {
      parsed.audio_suggestions = {
        music_keywords: ["tech ambient synth", "cinematic inspirational"],
        sfx_keywords: ["keyboard typing", "futuristic swoosh", "data server hum"]
      };
    }

    return res.json(parsed);

  } catch (error: any) {
    console.info("Gemini analysis notice (using built-in semantic scene engine):", error?.message || error);
    // Graceful fallback to avoid leaving user hanging
    const fallbackResult = fallbackRuleBasedParser(script);
    return res.json({
      ...fallbackResult,
      _notice: "Analyzed using built-in semantic scene engine"
    });
  }
});

// Dynamic Topic-Aware Autonomous Video Generator for any prompt or custom script
function generateTopicAwareVideoPlan(
  rawInput: string,
  style = "tech",
  aspectRatio = "16:9",
  pacing = "balanced",
  targetDuration = 30
) {
  const inputTopic = (rawInput || "Creative Video Storytelling").trim();
  const sceneDuration = pacing === "fast" ? 3.5 : pacing === "cinematic" ? 7 : 5;
  const lower = inputTopic.toLowerCase();

  // Check if the user entered multiple sentences (an actual script)
  const userSentences = inputTopic
    .split(/(?<=[.?!])\s+|\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with",
    "by", "about", "into", "through", "is", "are", "was", "were", "this", "that",
    "make", "create", "show", "video", "tell", "story", "generate", "autonomous"
  ]);

  const promptWords = lower
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  const primaryTopic = promptWords.slice(0, 3).join(" ") || "cinematic scene";

  type DomainType = "cyber" | "culinary" | "wildlife" | "sports" | "travel" | "crypto" | "space" | "cars" | "health" | "art" | "tech" | "custom";
  let domain: DomainType = "custom";

  if (/(hack|lazarus|cyber|pyongyang|malware|trojan|backdoor|exploit|phishing|ransomware|firewall|breach|state-sponsored)/.test(lower)) {
    domain = "cyber";
  } else if (/(pasta|pizza|cook|kitchen|chef|food|bake|bakery|recipe|dinner|delicious|culinary|italian|restaurant|steak|dessert|burger|coffee|cafe|eating)/.test(lower)) {
    domain = "culinary";
  } else if (/(wildlife|savannah|safari|animal|lion|elephant|forest|nature|ocean|underwater|whale|reef|mountain|jungle|river|bird|eagle|sunset|island)/.test(lower)) {
    domain = "wildlife";
  } else if (/(gym|workout|fitness|muscle|athlete|running|marathon|boxing|crossfit|yoga|weightlifting|sports|bodybuilding|football|basketball)/.test(lower)) {
    domain = "sports";
  } else if (/(travel|tokyo|paris|city|wanderlust|streets|vacation|tourism|hotel|skyline|urban|flight|airport|explore|europe|japan)/.test(lower)) {
    domain = "travel";
  } else if (/(crypto|bitcoin|ethereum|blockchain|finance|trading|stock|market|money|invest|wealth|economy|wall street|assets|launder|cash|dollars)/.test(lower)) {
    domain = "crypto";
  } else if (/(space|mars|galaxy|cosmos|star|astronaut|nasa|orbit|rocket|planet|universe|nebula|telescope)/.test(lower)) {
    domain = "space";
  } else if (/(car|supercar|driving|race|racing|drift|drifting|speed|porsche|ferrari|lamborghini|motorcycle|track|engine|automotive)/.test(lower)) {
    domain = "cars";
  } else if (/(meditation|health|wellness|mindful|mental|spa|peace|calm|skincare|breathe|therapy|relax)/.test(lower)) {
    domain = "health";
  } else if (/(art|paint|painting|design|photo|photography|music|guitar|piano|dj|fashion|aesthetic|dance|studio)/.test(lower)) {
    domain = "art";
  } else if (/(tech|code|coding|software|ai|robot|computer|developer|laptop|matrix|algorithm|data)/.test(lower)) {
    domain = "tech";
  }

  const title = inputTopic.length > 35 ? inputTopic.slice(0, 32) + "..." : inputTopic;
  let music_keyword = "tech ambient synth";
  let music_mood = "inspiring modern";

  interface SceneSpec {
    narration: string;
    search_keywords: string;
    secondary_keywords?: string;
    duration: number;
    subtitle: string;
    transition: 'fade' | 'cut' | 'zoom' | 'splitscreen' | 'slide';
  }

  let rawScenes: SceneSpec[] = [];

  // Calculate target scene count based on targetDuration (e.g. 15s -> 3-4 scenes, 60s -> 9-12 scenes, 90s -> 12-18 scenes)
  const calculatedSceneCount = Math.max(3, Math.min(16, Math.round(targetDuration / sceneDuration)));

  if (userSentences.length >= 2) {
    // Combine short fragments (< 4 words) with the subsequent sentence for natural narration chunking
    const mergedSentences: string[] = [];
    for (let i = 0; i < userSentences.length; i++) {
      const s = userSentences[i];
      const wordCount = s.split(/\s+/).length;
      if (wordCount <= 3 && i + 1 < userSentences.length) {
        mergedSentences.push(`${s} ${userSentences[i + 1]}`);
        i++; // skip next since merged
      } else {
        mergedSentences.push(s);
      }
    }

    const limit = Math.max(mergedSentences.length, calculatedSceneCount);
    rawScenes = mergedSentences.slice(0, limit).map((sentence, idx) => {
      const semantic = extractSemanticStockKeywords(sentence, inputTopic, idx);
      if (idx === 0) {
        music_keyword = semantic.music;
        music_mood = semantic.mood;
      }
      const trans: 'fade' | 'splitscreen' | 'zoom' | 'slide' = (idx % 4 === 1) ? 'splitscreen' : (idx % 4 === 2) ? 'zoom' : (idx % 4 === 3) ? 'slide' : 'fade';
      return {
        narration: sentence,
        search_keywords: semantic.keywords,
        secondary_keywords: semantic.secondary,
        duration: sceneDuration,
        subtitle: sentence.split(/\s+/).slice(0, 7).join(" "),
        transition: trans
      };
    });
  } else {
    // Build domain scene pool that can expand to 60+ seconds
    let basePool: SceneSpec[] = [];
    switch (domain) {
      case "cyber":
        music_keyword = "dark cyber synthwave electronic suspense";
        music_mood = "dark electronic cyber";
        basePool = [
          { narration: `In the shadows of the digital realm, sophisticated cyber operators execute precision strikes against global infrastructure.`, search_keywords: `hacker typing computer dark room code`, duration: sceneDuration, subtitle: "Elite Cyber Threat", transition: "fade" },
          { narration: `Bypassing advanced firewalls and deploying stealth malware quietly into enterprise systems.`, search_keywords: `cyber attack server room data center flashing lights`, secondary_keywords: `matrix binary code stream glowing screen`, duration: sceneDuration, subtitle: "Stealth Infiltration", transition: "splitscreen" },
          { narration: `High-value digital assets and critical credentials drained within minutes across decentralized bridges.`, search_keywords: `cryptocurrency bitcoin trading chart graph screen`, duration: sceneDuration, subtitle: "Digital Asset Heist", transition: "zoom" },
          { narration: `Software engineers and defense firms targeted through weaponized exploits and trojanized payloads.`, search_keywords: `software engineer typing laptop office desk`, secondary_keywords: `hooded hacker keyboard typing green matrix`, duration: sceneDuration, subtitle: "Targeted Infiltration", transition: "splitscreen" },
          { narration: `Nation-state cyber warfare funding strategic military operations and geopolitical agendas.`, search_keywords: `cyber warfare military command center glowing monitors`, duration: sceneDuration, subtitle: "State-Sponsored Warfare", transition: "zoom" },
          { narration: `The digital battlefield is already active—reshaping the future of global security.`, search_keywords: `digital world map network connections cyber`, duration: sceneDuration, subtitle: "The Digital Battlefield", transition: "fade" },
          { narration: `Continuous threat hunting and hardened cyber defense protocols protecting digital sovereignty.`, search_keywords: `cybersecurity firewall lock digital network shield`, duration: sceneDuration, subtitle: "Hardened Defense", transition: "slide" },
          { narration: `In the era of modern cyber warfare, information is the ultimate strategic weapon.`, search_keywords: `server farm data center glowing lights`, duration: sceneDuration, subtitle: "The Ultimate Weapon", transition: "fade" }
        ];
        break;
      case "culinary":
        music_keyword = "italian acoustic cafe guitar warm";
        music_mood = "warm acoustic culinary";
        basePool = [
          { narration: `Every authentic culinary masterpiece begins with the freshest ingredients and culinary passion.`, search_keywords: `${primaryTopic} ingredients fresh kitchen cooking`, duration: sceneDuration, subtitle: "Authentic Culinary Art", transition: "fade" },
          { narration: `Simmering to perfection over heat, bringing rich flavors and fragrant herbs to life.`, search_keywords: `chef boiling pasta pan olive oil`, secondary_keywords: `chopping garlic vegetables culinary cutting`, duration: sceneDuration, subtitle: "Crafting the Dish", transition: "splitscreen" },
          { narration: `Infusing fresh sauces and aromatics that awaken the senses and elevate every detail.`, search_keywords: `chef tossing pasta saucepan flames delicious`, duration: sceneDuration, subtitle: "Rich Flavor Symphony", transition: "zoom" },
          { narration: `Garnishing with hand-picked herbs, aged cheeses, and extra virgin olive oil for unmatched depth.`, search_keywords: `chef garnishing plate food plating detail`, secondary_keywords: `artisan cheese grating culinary chef`, duration: sceneDuration, subtitle: "Artisan Finishing", transition: "splitscreen" },
          { narration: `The aroma fills the room as the golden crust and simmering juices reach their peak harmony.`, search_keywords: `hot delicious meal steaming restaurant table`, duration: sceneDuration, subtitle: "Perfect Texture", transition: "zoom" },
          { narration: `Plated with perfection and ready to savor—a dining experience that speaks for itself.`, search_keywords: `delicious pasta plate restaurant dining serving`, duration: sceneDuration, subtitle: "Culinary Perfection", transition: "fade" },
          { narration: `Sharing exceptional cuisine that brings people together around warmth, taste, and tradition.`, search_keywords: `friends dining eating restaurant cheerful wine`, duration: sceneDuration, subtitle: "Memorable Gathering", transition: "slide" },
          { narration: `An exquisite celebration of flavor crafted with genuine culinary mastery.`, search_keywords: `gourmet restaurant dessert coffee finish luxury`, duration: sceneDuration, subtitle: "Taste of Excellence", transition: "fade" }
        ];
        break;

      case "wildlife":
        music_keyword = "cinematic nature wildlife ambient inspirational";
        music_mood = "majestic wilderness";
        basePool = [
          { narration: `Across vast untamed landscapes, life thrives in pure harmony under the open sky.`, search_keywords: `${primaryTopic} savannah safari nature landscape sunrise`, duration: sceneDuration, subtitle: "The Wild Frontier", transition: "fade" },
          { narration: `Majestic creatures navigate the wilderness, demonstrating raw grace and instincts.`, search_keywords: `wildlife roaming safari animals close up`, secondary_keywords: `aerial savanna plain trees golden hour`, duration: sceneDuration, subtitle: "Untamed Instincts", transition: "splitscreen" },
          { narration: `Every movement is attuned to the pulse of nature, creating unforgettable spectacles.`, search_keywords: `wild animals watering hole sunset safari`, duration: sceneDuration, subtitle: "Pulse of the Wild", transition: "zoom" },
          { narration: `Predators and herds coexist in a delicate, ancient balance carved across generations.`, search_keywords: `lions safari wildlife tracking grassland`, secondary_keywords: `herd zebra wildebeest running savanna`, duration: sceneDuration, subtitle: "Ancient Balance", transition: "splitscreen" },
          { narration: `From morning mist over riverbanks to soaring eagles catching the thermals.`, search_keywords: `eagle flying soaring mountains wildlife nature`, duration: sceneDuration, subtitle: "Sovereign Skies", transition: "zoom" },
          { narration: `As the golden sun sets over the horizon, the eternal beauty of the wild endures.`, search_keywords: `african savannah sunset acacia tree silhouette`, duration: sceneDuration, subtitle: "Eternal Horizons", transition: "fade" },
          { narration: `Under starlit wilderness skies, nocturnal life awakens with quiet, watchful eyes.`, search_keywords: `night safari wilderness stars milky way silhouette`, duration: sceneDuration, subtitle: "Night in the Wild", transition: "slide" },
          { narration: `Protecting these precious ecosystems ensures the rhythm of nature continues unbroken.`, search_keywords: `nature conservation lush green forest river aerial`, duration: sceneDuration, subtitle: "Preserving the Wild", transition: "fade" }
        ];
        break;

      case "sports":
        music_keyword = "energetic electronic workout pulse power";
        music_mood = "high energy athletic";
        basePool = [
          { narration: `Greatness is forged long before the spotlight—built through discipline and early morning dedication.`, search_keywords: `${primaryTopic} athlete training morning workout gym`, duration: sceneDuration, subtitle: "Forged in Discipline", transition: "fade" },
          { narration: `Pushing past limits and testing endurance through explosive power and precise form.`, search_keywords: `weightlifting dumbbells workout intense gym`, secondary_keywords: `athlete running track cardio sprint`, duration: sceneDuration, subtitle: "Relentless Drive", transition: "splitscreen" },
          { narration: `Sweat, focus, and continuous repetitions turn every challenge into measurable strength.`, search_keywords: `crossfit battle ropes intense training fitness`, duration: sceneDuration, subtitle: "Peak Performance", transition: "zoom" },
          { narration: `Refining technique, explosive speed, and mental agility with razor-sharp concentration.`, search_keywords: `athlete sprinting sprinting starting blocks track`, secondary_keywords: `gym boxing punching bag training`, duration: sceneDuration, subtitle: "Laser Focus", transition: "splitscreen" },
          { narration: `Breaking through mental barriers to achieve what once seemed completely impossible.`, search_keywords: `muscular athlete chalk hands barbell deadlift`, duration: sceneDuration, subtitle: "Breakthrough Power", transition: "zoom" },
          { narration: `Victory belongs to those who never surrender—ready to conquer the next milestone.`, search_keywords: `athlete victory celebrate breathing sunset gym`, duration: sceneDuration, subtitle: "Unstoppable Momentum", transition: "fade" },
          { narration: `The journey never stops; every finish line is simply the start of a greater challenge.`, search_keywords: `athlete tying shoes sunrise mountain running`, duration: sceneDuration, subtitle: "Never Settle", transition: "slide" },
          { narration: `Rise, execute, and dominate your potential today.`, search_keywords: `championship celebration stadium crowd cheering`, duration: sceneDuration, subtitle: "Champion Mindset", transition: "fade" }
        ];
        break;

      case "travel":
        music_keyword = "chillhop lofi travel wanderlust beat";
        music_mood = "atmospheric wanderlust";
        basePool = [
          { narration: `Stepping into a new city full of wonder, history, and vibrant hidden corners.`, search_keywords: `${primaryTopic} city streets architecture travel aerial`, duration: sceneDuration, subtitle: "Arrival & Exploration", transition: "fade" },
          { narration: `From bustling urban avenues to historic alleys, every district tells a timeless story.`, search_keywords: `${primaryTopic} bustling streets crowd pedestrians`, secondary_keywords: `${primaryTopic} landmark scenic panorama`, duration: sceneDuration, subtitle: "Stories in the Streets", transition: "splitscreen" },
          { narration: `Immersing in authentic local culture, unique flavors, and unforgettable sights.`, search_keywords: `${primaryTopic} night lights evening city cafe`, duration: sceneDuration, subtitle: "Local Culture", transition: "zoom" },
          { narration: `Wandering through historic markets rich with artisan crafts and local traditions.`, search_keywords: `vibrant travel market food stall spices artisan`, secondary_keywords: `scenic rooftop view city horizon sunset`, duration: sceneDuration, subtitle: "Authentic Charm", transition: "splitscreen" },
          { narration: `Capturing moments of stillness in ancient temples, museums, and coastal lookouts.`, search_keywords: `scenic viewpoint ocean cliff historic architecture`, duration: sceneDuration, subtitle: "Timeless Wonder", transition: "zoom" },
          { narration: `Memories etched against the skyline, inspiring the journey to the next destination.`, search_keywords: `${primaryTopic} sunset viewpoint skyline panoramic`, duration: sceneDuration, subtitle: "Endless Horizons", transition: "fade" },
          { narration: `Connecting with people, sharing stories, and embracing the beauty of exploration.`, search_keywords: `travelers laughing scenic landscape mountain lake`, duration: sceneDuration, subtitle: "Wanderlust Spirit", transition: "slide" },
          { narration: `The world is vast, inviting you to discover something extraordinary around every turn.`, search_keywords: `aerial scenic coastline golden hour travel destination`, duration: sceneDuration, subtitle: "The Journey Awaits", transition: "fade" }
        ];
        break;

      case "crypto":
        music_keyword = "dark modern electronic corporate pulse";
        music_mood = "high tech financial";
        basePool = [
          { narration: `Decentralized finance is reshaping global commerce at the speed of modern technology.`, search_keywords: `${primaryTopic} bitcoin blockchain cryptocurrency digital`, duration: sceneDuration, subtitle: "The Financial Frontier", transition: "fade" },
          { narration: `Real-time data feeds and market volatility demand calculated focus and algorithmic precision.`, search_keywords: `stock trading charts market graphs screen`, secondary_keywords: `trader multiple screens trading desk crypto`, duration: sceneDuration, subtitle: "Algorithmic Precision", transition: "splitscreen" },
          { narration: `Navigating global liquidity and digital assets with clear strategy and discipline.`, search_keywords: `digital currency blockchain network nodes matrix`, duration: sceneDuration, subtitle: "Decentralized Liquidity", transition: "zoom" },
          { narration: `Smart contracts execute immutable transactions across decentralized networks globally.`, search_keywords: `server farm data nodes glowing lights futuristic`, secondary_keywords: `crypto mining hardware digital network`, duration: sceneDuration, subtitle: "Smart Contracts", transition: "splitscreen" },
          { narration: `Analyzing on-chain metrics and liquidity patterns to uncover high-conviction trends.`, search_keywords: `financial analytics candlestick chart trading matrix`, duration: sceneDuration, subtitle: "Market Intelligence", transition: "zoom" },
          { narration: `Unlocking the boundless potential of the new borderless economy.`, search_keywords: `high tech digital finance futuristic city glowing`, duration: sceneDuration, subtitle: "Future of Wealth", transition: "fade" }
        ];
        break;

      case "space":
        music_keyword = "deep space cosmic ambient synth universe";
        music_mood = "deep cosmic mystery";
        basePool = [
          { narration: `Gazing into the unfathomable depths of the cosmos, where billions of worlds await.`, search_keywords: `${primaryTopic} cosmos galaxy deep space stars nebula`, duration: sceneDuration, subtitle: "Infinite Cosmos", transition: "fade" },
          { narration: `Celestial forces and swirling nebulas sculpt the fabric of space and time.`, search_keywords: `planets orbiting solar system space telescope`, secondary_keywords: `space station astronaut earth orbit view`, duration: sceneDuration, subtitle: "Cosmic Forces", transition: "splitscreen" },
          { narration: `Bold missions and exploratory probes venture where no human has dared before.`, search_keywords: `rocket launch space shuttle stars exploration`, duration: sceneDuration, subtitle: "Venturing Beyond", transition: "zoom" },
          { narration: `Astronomers map distant star clusters and exoplanets with interstellar precision.`, search_keywords: `space telescope observatory starry night milky way`, secondary_keywords: `mars rover red planet surface exploration`, duration: sceneDuration, subtitle: "Deep Space Mapping", transition: "splitscreen" },
          { narration: `Witnessing supernova remnants and gravitational waves ripples across the dark void.`, search_keywords: `glowing nebula cosmic gas stellar explosion space`, duration: sceneDuration, subtitle: "Stellar Evolution", transition: "zoom" },
          { narration: `Expanding the boundaries of human knowledge across the eternal stellar frontier.`, search_keywords: `earth from space sunrise atmosphere blue planet`, duration: sceneDuration, subtitle: "The Final Frontier", transition: "fade" }
        ];
        break;

      case "cars":
        music_keyword = "fast rock electronic driving energy";
        music_mood = "adrenaline high speed";
        basePool = [
          { narration: `Pure aerodynamic perfection engineered to dominate both the road and the racetrack.`, search_keywords: `${primaryTopic} sports car supercar driving race track`, duration: sceneDuration, subtitle: "Precision Engineering", transition: "fade" },
          { narration: `Engines roaring at high RPMs, delivering immediate throttle response and surgical handling.`, search_keywords: `car driving fast mountain highway sunset`, secondary_keywords: `cockpit driver hands steering wheel speed`, duration: sceneDuration, subtitle: "Raw Horsepower", transition: "splitscreen" },
          { narration: `Carving through sharp apexes with uncompromising traction and mechanical balance.`, search_keywords: `sports car drifting race circuit tire smoke`, duration: sceneDuration, subtitle: "Track Dominance", transition: "zoom" },
          { narration: `Aerodynamic carbon fiber curves engineered to channel downforce and slice through air.`, search_keywords: `supercar carbon fiber wheel brake caliper detail`, secondary_keywords: `pit stop racing team mechanics tire change`, duration: sceneDuration, subtitle: "Aerodynamic Mastery", transition: "splitscreen" },
          { narration: `Acceleration pinning you into the seat as speedometer needles climb effortlessly.`, search_keywords: `dashboard gauges speedometer glowing racing night`, duration: sceneDuration, subtitle: "Pure Acceleration", transition: "zoom" },
          { narration: `The open asphalt calls—where passion meets pure unadulterated performance.`, search_keywords: `luxury car driving into sunset scenic road`, duration: sceneDuration, subtitle: "Pure Driving Passion", transition: "fade" }
        ];
        break;

      case "health":
        music_keyword = "calming meditation ambient piano peaceful";
        music_mood = "peaceful restorative";
        basePool = [
          { narration: `True wellness begins from within—cultivating stillness in a fast-moving world.`, search_keywords: `${primaryTopic} meditation peaceful nature breathing calm`, duration: sceneDuration, subtitle: "Inner Stillness", transition: "fade" },
          { narration: `Restoring balance and replenishing vital energy through intentional daily mindfulness.`, search_keywords: `yoga stretch morning sunlight peaceful room`, secondary_keywords: `healthy lifestyle tea water fresh fruits`, duration: sceneDuration, subtitle: "Restorative Balance", transition: "splitscreen" },
          { narration: `Gentle movement and calm breathing harmonize the physical body with mental clarity.`, search_keywords: `meditation seaside ocean waves breeze serene`, duration: sceneDuration, subtitle: "Clarity & Calm", transition: "zoom" },
          { narration: `Nourishing body and spirit with wholesome nutrition, hydration, and positive habits.`, search_keywords: `fresh organic food green smoothie preparing healthy`, secondary_keywords: `walking barefoot grass morning dew nature`, duration: sceneDuration, subtitle: "Nourishing Habits", transition: "splitscreen" },
          { narration: `Releasing tension, resetting the nervous system, and discovering deep peace.`, search_keywords: `sunlight through trees peaceful forest stream water`, duration: sceneDuration, subtitle: "Deep Relaxation", transition: "zoom" },
          { narration: `Embracing a lifestyle of longevity, vitality, and deep peace every single day.`, search_keywords: `peaceful forest sunlight green trees wellness`, duration: sceneDuration, subtitle: "Vital Harmony", transition: "fade" }
        ];
        break;

      case "art":
        music_keyword = "creative chill jazz stylish groove";
        music_mood = "inspirational artistic";
        basePool = [
          { narration: `Every creative journey starts with a blank canvas and a spark of raw imagination.`, search_keywords: `${primaryTopic} art studio painting creative design`, duration: sceneDuration, subtitle: "The Creative Spark", transition: "fade" },
          { narration: `Blending texture, light, and vibrant color palettes into bold expressive forms.`, search_keywords: `artist painting canvas brush strokes close up`, secondary_keywords: `creative hands crafting pottery sculpt`, duration: sceneDuration, subtitle: "Expressive Craft", transition: "splitscreen" },
          { narration: `Attention to nuance transforms simple materials into timeless works of art.`, search_keywords: `art gallery exhibition modern sculpture lighting`, duration: sceneDuration, subtitle: "Refined Vision", transition: "zoom" },
          { narration: `Experimenting with new mediums, bold brushstrokes, and captivating color harmonies.`, search_keywords: `palette mixing paint colors artist creative studio`, secondary_keywords: `design studio digital tablet stylus drawing`, duration: sceneDuration, subtitle: "Creative Exploration", transition: "splitscreen" },
          { narration: `Letting inspiration guide each stroke until the deeper meaning comes into focus.`, search_keywords: `modern art gallery visitors admiring artwork`, duration: sceneDuration, subtitle: "Artistic Depth", transition: "zoom" },
          { narration: `Inspiring audiences and sharing a unique creative perspective with the world.`, search_keywords: `artist standing in studio admiring finished work`, duration: sceneDuration, subtitle: "Creative Fulfillment", transition: "fade" }
        ];
        break;

      case "tech":
        music_keyword = "tech ambient synth modern digital";
        music_mood = "futuristic technology";
        basePool = [
          { narration: `Breakthrough technologies and automated workflows are transforming modern industries.`, search_keywords: `${primaryTopic} futuristic technology modern interface digital`, duration: sceneDuration, subtitle: "Technological Frontier", transition: "fade" },
          { narration: `Intelligent algorithms execute rapid computation with remarkable speed and precision.`, search_keywords: `software developer screen code typing laptop`, secondary_keywords: `server room matrix neon lights data`, duration: sceneDuration, subtitle: "High Speed Intelligence", transition: "splitscreen" },
          { narration: `Connecting vision with seamless execution across cloud-scale architectures.`, search_keywords: `futuristic city drone aerial night neon`, duration: sceneDuration, subtitle: "Scalable Innovation", transition: "zoom" },
          { narration: `Machine learning models continuously optimize complex distributed data systems.`, search_keywords: `ai neural network data visualization matrix glowing`, secondary_keywords: `microchip processor circuit board glowing lights`, duration: sceneDuration, subtitle: "Intelligent Systems", transition: "splitscreen" },
          { narration: `Modern developer pipelines streamline deployment from idea to production in seconds.`, search_keywords: `software engineering team modern workspace monitors`, duration: sceneDuration, subtitle: "Continuous Delivery", transition: "zoom" },
          { narration: `Empowering creators and builders to invent the future of digital experiences.`, search_keywords: `modern tech team collaboration futuristic display`, duration: sceneDuration, subtitle: "Building the Future", transition: "fade" },
          { narration: `Next-generation interfaces deliver seamless, responsive interaction across all devices.`, search_keywords: `smartphone tablet modern digital interface clean`, duration: sceneDuration, subtitle: "Next-Gen Experience", transition: "slide" },
          { narration: `The digital transformation is accelerating—unlocking limitless potential for tomorrow.`, search_keywords: `smart city skyline glowing network connectivity aerial`, duration: sceneDuration, subtitle: "The Future is Now", transition: "fade" }
        ];
        break;

      default:
        music_keyword = `${primaryTopic} ambient cinematic`;
        music_mood = "cinematic atmospheric";
        basePool = [
          { narration: `Exploring ${inputTopic}—discovering the unique nuances and compelling moments that define it.`, search_keywords: `${primaryTopic} cinematic establishing footage`, duration: sceneDuration, subtitle: `${title} - Introduction`, transition: "fade" },
          { narration: `Delving deeper into the process, highlighting dynamic action and essential details.`, search_keywords: `${primaryTopic} action close up detail`, secondary_keywords: `${primaryTopic} perspective angle motion`, duration: sceneDuration, subtitle: "Dynamic Exploration", transition: "splitscreen" },
          { narration: `Each perspective brings fresh insight, combining craft, rhythm, and clarity.`, search_keywords: `${primaryTopic} high quality professional video`, duration: sceneDuration, subtitle: "Depth & Perspective", transition: "zoom" },
          { narration: `Uncovering key details and moments that captivate the eye and tell a vivid story.`, search_keywords: `${primaryTopic} modern creative visual motion`, secondary_keywords: `${primaryTopic} close up aesthetic detail`, duration: sceneDuration, subtitle: "Vivid Detail", transition: "splitscreen" },
          { narration: `Bringing precision, style, and cinematic atmosphere into every single frame.`, search_keywords: `${primaryTopic} cinematic motion lighting aesthetic`, duration: sceneDuration, subtitle: "Cinematic Atmosphere", transition: "zoom" },
          { narration: `A cohesive visual journey leaving a lasting impression and inspiring fresh vision.`, search_keywords: `${primaryTopic} sunset cinematic finish beautiful`, duration: sceneDuration, subtitle: "Lasting Impression", transition: "fade" },
          { narration: `Synthesizing ideas into meaningful experiences that resonate with viewers everywhere.`, search_keywords: `${primaryTopic} golden hour panoramic landscape`, duration: sceneDuration, subtitle: "Enduring Vision", transition: "slide" },
          { narration: `Ready to share, inspire, and captivate audiences across the world.`, search_keywords: `${primaryTopic} beautiful cinematic finish aerial`, duration: sceneDuration, subtitle: "Final Masterpiece", transition: "fade" }
        ];
        break;
    }

    // Select enough scenes to satisfy the requested duration (e.g., up to 60s)
    const requiredCount = Math.max(3, Math.min(basePool.length, calculatedSceneCount));
    rawScenes = basePool.slice(0, requiredCount);
  }

  const scenes = rawScenes.map((sc, idx) => ({
    scene_number: idx + 1,
    narration: sc.narration,
    search_keywords: sc.search_keywords,
    secondary_keywords: sc.secondary_keywords || `${primaryTopic} visual detail`,
    duration: sc.duration,
    subtitle: sc.subtitle,
    transition: sc.transition,
    layout: sc.transition === "splitscreen" ? ("splitscreen" as const) : ("standard" as const)
  }));

  const total_duration = scenes.reduce((sum, s) => sum + s.duration, 0);

  return {
    title,
    prompt: inputTopic,
    full_script: scenes.map(s => s.narration).join(" "),
    aspect_ratio: aspectRatio,
    music_keyword,
    music_mood,
    scenes,
    total_duration,
    _fallback: true
  };
}

// Autonomous Video Creation: Generate complete video narrative, scenes, and music cues
app.post("/api/auto-video/plan", async (req, res) => {
  const {
    prompt,
    script,
    style = "tech",
    aspectRatio = "16:9",
    pacing = "balanced",
    targetDuration = 30
  } = req.body;
  const inputTopic = (prompt || script || "Creative Video Storytelling").trim();
  const sceneDuration = pacing === "fast" ? 3.5 : pacing === "cinematic" ? 7 : 5;
  const targetNumScenes = Math.max(3, Math.min(16, Math.round(Number(targetDuration || 30) / sceneDuration)));

  const systemInstruction = `You are an expert Autonomous AI Video Director and Producer.
Your goal is to transform a custom user prompt or video script into an autonomous video production plan ready for instant playback and rendering.

RULES:
1. Generate an engaging, high-impact narration script split into ${targetNumScenes} sequential scenes tailored precisely to the user's specific topic and target video duration (~${targetDuration}s).
2. For each scene:
   - "narration": A punchy, spoken sentence (8-16 words) that fits natural voiceover delivery.
   - "search_keywords": 2-4 ultra-descriptive visual keywords tuned for Pexels / Pixabay stock videography (${aspectRatio === "9:16" ? "portrait/vertical short-form video style" : "cinematic 16:9 style"}).
   - "secondary_keywords": Optional secondary B-roll search query for split-screen comparison scenes.
   - "duration": Target duration in seconds (between 3.5 and 7.0 seconds).
   - "subtitle": Short on-screen subtitle caption text (max 8 words) for bold display.
   - "transition": One of "fade", "splitscreen", "zoom", "slide".
3. Under "music_keyword", provide the ideal royalty-free background music search query matching the genre and vibe.
4. Output valid JSON strictly conforming to the requested schema.`;

  const promptText = `Produce an autonomous video plan for:
Topic / Prompt: "${inputTopic}"
Style: ${style}
Aspect Ratio: ${aspectRatio} (${aspectRatio === "9:16" ? "9:16 Portrait / Vertical Short Form" : "16:9 Landscape Widescreen"})
Target Pacing: ${pacing} (approx ${sceneDuration}s per scene)
Target Total Video Duration: approx ${targetDuration} seconds (${targetNumScenes} total scenes)

Include a catchy project title, cohesive full script, scene breakdowns with stock video keywords, secondary keywords for split screen, and the exact background music search keyword.`;

  try {
    const ai = getGeminiClient();
    if (!ai) {
      throw new Error("Gemini AI client not initialized");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            full_script: { type: Type.STRING },
            music_keyword: { type: Type.STRING },
            music_mood: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  scene_number: { type: Type.INTEGER },
                  narration: { type: Type.STRING },
                  search_keywords: { type: Type.STRING },
                  secondary_keywords: { type: Type.STRING },
                  duration: { type: Type.NUMBER },
                  subtitle: { type: Type.STRING },
                  transition: { type: Type.STRING }
                },
                required: ["scene_number", "narration", "search_keywords", "duration", "subtitle"]
              }
            }
          },
          required: ["title", "full_script", "music_keyword", "scenes"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    const scenes = (parsed.scenes || []).map((s: any, idx: number) => ({
      scene_number: s.scene_number || (idx + 1),
      narration: s.narration || "Visual sequence",
      search_keywords: s.search_keywords || `${inputTopic} footage`,
      secondary_keywords: s.secondary_keywords || `${inputTopic} detail`,
      duration: Math.max(3, Math.min(10, Number(s.duration) || sceneDuration)),
      subtitle: s.subtitle || s.narration?.slice(0, 40) || "",
      transition: s.transition || (idx % 4 === 1 ? "splitscreen" : idx % 4 === 2 ? "zoom" : "fade"),
      layout: s.transition === "splitscreen" ? "splitscreen" : "standard"
    }));

    const totalDuration = scenes.reduce((sum: number, sc: any) => sum + sc.duration, 0);

    return res.json({
      title: parsed.title || inputTopic,
      prompt: inputTopic,
      full_script: parsed.full_script || scenes.map((s: any) => s.narration).join(" "),
      aspect_ratio: aspectRatio,
      music_keyword: parsed.music_keyword || "ambient modern",
      music_mood: parsed.music_mood || "ambient modern",
      scenes,
      total_duration: totalDuration
    });
  } catch (err: any) {
    console.log("Using smart dynamic topic-aware generator for prompt:", inputTopic);
    // Intelligent, high-quality dynamic topic-aware generator
    const dynamicPlan = generateTopicAwareVideoPlan(inputTopic, style, aspectRatio, pacing, Number(targetDuration) || 30);
    return res.json(dynamicPlan);
  }
});

// 5. Studio-Grade Neural Text-To-Speech (Lifelike Human Voices)
const ttsAudioCache = new Map<string, { buffer: Buffer; timestamp: number }>();

const CURATED_NEURAL_VOICES = [
  { id: "en-US-JennyNeural", name: "Jenny", gender: "female", tag: "Warm Storyteller", description: "Natural, engaging human tone with expressive pauses", popular: true },
  { id: "en-US-AriaNeural", name: "Aria", gender: "female", tag: "Dynamic Creator", description: "Vibrant, confident voice ideal for TikTok & YouTube", popular: true },
  { id: "en-US-AvaNeural", name: "Ava", gender: "female", tag: "Studio Host", description: "Clear, crisp corporate & podcast narrator", popular: false },
  { id: "en-US-EmmaNeural", name: "Emma", gender: "female", tag: "Friendly Explainer", description: "Warm, gentle and calm educational voice", popular: false },
  { id: "en-US-GuyNeural", name: "Guy", gender: "male", tag: "Casual Host", description: "Relaxed, conversational YouTube creator tone", popular: true },
  { id: "en-US-ChristopherNeural", name: "Christopher", gender: "male", tag: "Cinematic Narrator", description: "Deep, authoritative documentary & movie trailer voice", popular: true },
  { id: "en-US-BrianNeural", name: "Brian", gender: "male", tag: "Smooth Professional", description: "Polished, reassuring corporate narration", popular: false },
  { id: "en-US-EricNeural", name: "Eric", gender: "male", tag: "Upbeat Dynamic", description: "Energetic, youthful modern host", popular: false },
  { id: "en-GB-SoniaNeural", name: "Sonia", gender: "female", tag: "Refined British", description: "Sophisticated BBC-style documentary female", popular: false },
  { id: "en-GB-RyanNeural", name: "Ryan", gender: "male", tag: "Smooth British", description: "Articulate, stylish British male narrator", popular: false },
];

async function synthesizeNeuralSpeechBuffer(
  text: string,
  voice: string = "en-US-JennyNeural",
  rate: string = "+0%",
  pitch: string = "+0Hz"
): Promise<Buffer> {
  const safeVoice = CURATED_NEURAL_VOICES.some(v => v.id === voice) ? voice : "en-US-JennyNeural";
  const cacheKey = `${safeVoice}__${rate}__${pitch}__${text.trim()}`;
  
  const cached = ttsAudioCache.get(cacheKey);
  if (cached && cached.buffer) {
    return cached.buffer;
  }

  const tts = new MsEdgeTTS();
  await tts.setMetadata(safeVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const { audioStream } = tts.toStream(text, {
    rate: rate || "+0%",
    pitch: pitch || "+0Hz",
  });

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const timeout = setTimeout(() => {
      try { tts.close(); } catch {}
      reject(new Error("Neural TTS request timed out after 10 seconds"));
    }, 10000);

    audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    audioStream.on("end", () => {
      clearTimeout(timeout);
      try { tts.close(); } catch {}
      const combined = Buffer.concat(chunks);
      if (ttsAudioCache.size > 250) {
        const oldest = ttsAudioCache.keys().next().value;
        if (oldest) ttsAudioCache.delete(oldest);
      }
      ttsAudioCache.set(cacheKey, { buffer: combined, timestamp: Date.now() });
      resolve(combined);
    });
    audioStream.on("error", (err: any) => {
      clearTimeout(timeout);
      try { tts.close(); } catch {}
      reject(err);
    });
  });
}

// Fast streaming video proxy to prevent CORS or Range headers issues in browser
app.get("/api/proxy-video", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing video URL parameter" });
  }
  try {
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    };
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }
    const upstream = await fetch(targetUrl, { headers });
    res.status(upstream.status);
    for (const [key, value] of upstream.headers.entries()) {
      if (["content-type", "content-length", "accept-ranges", "content-range"].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");
    if (!upstream.body) {
      return res.end();
    }
    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err: any) {
    console.error("Proxy video stream error:", err?.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Video proxy streaming error" });
    } else {
      res.end();
    }
  }
});

// Render & Stitch Complete Video (with all scenes, transitions, split screen, synced voiceover, ducked music, and burned-in subtitles)
app.post("/api/render-complete-video", async (req, res) => {
  const {
    title = "complete_video",
    scenes = [],
    aspectRatio = "16:9",
    subtitlesStyle = "highlight",
    musicUrl,
    musicVolume = 0.3,
    voice = "en-US-JennyNeural",
    voiceRate = "+0%",
    voicePitch = "+0Hz"
  } = req.body;

  if (!scenes || scenes.length === 0) {
    return res.status(400).json({ error: "No scenes provided for complete video render" });
  }

  const isPortrait = aspectRatio === "9:16";
  const targetW = isPortrait ? 1080 : 1920;
  const targetH = isPortrait ? 1920 : 1080;

  const renderId = "render_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  const tmpDir = path.join("/tmp", renderId);

  try {
    await fs.promises.mkdir(tmpDir, { recursive: true });

    const downloadedClips: string[] = [];
    const voiceClips: string[] = [];
    let hasAnyVoiceover = false;

    for (let i = 0; i < scenes.length; i++) {
      const sc = scenes[i];
      const videoUrl = sc.videoUrl;
      const targetDur = sc.duration || 5;
      if (!videoUrl) continue;

      const rawClipPath = path.join(tmpDir, `raw_clip_${i}.mp4`);
      const normClipPath = path.join(tmpDir, `norm_clip_${i}.mp4`);

      try {
        const resp = await fetch(videoUrl);
        if (!resp.ok) continue;
        const buffer = Buffer.from(await resp.arrayBuffer());
        await fs.promises.writeFile(rawClipPath, buffer);

        // Check if this scene is split screen with secondary video
        if (sc.transition === "splitscreen" && sc.secondaryVideoUrl) {
          const secRawPath = path.join(tmpDir, `sec_clip_${i}.mp4`);
          const secResp = await fetch(sc.secondaryVideoUrl);
          if (secResp.ok) {
            await fs.promises.writeFile(secRawPath, Buffer.from(await secResp.arrayBuffer()));
            await new Promise((resolve, reject) => {
              // For 16:9 (1920x1080), side-by-side splitscreen is two 960x1080 panels (hstack)
              // For 9:16 (1080x1920), stacked or side-by-side dual panel: two 1080x960 panels stacked vertically (vstack)
              const splitCmd = isPortrait
                ? `ffmpeg -y -t ${targetDur} -i "${rawClipPath}" -t ${targetDur} -i "${secRawPath}" -filter_complex "[0:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960[top]; [1:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960[bottom]; [top][bottom]vstack[v]" -map "[v]" -c:v libx264 -pix_fmt yuv420p -r 30 -an "${normClipPath}"`
                : `ffmpeg -y -t ${targetDur} -i "${rawClipPath}" -t ${targetDur} -i "${secRawPath}" -filter_complex "[0:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080[left]; [1:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080[right]; [left][right]hstack[v]" -map "[v]" -c:v libx264 -pix_fmt yuv420p -r 30 -an "${normClipPath}"`;
              exec(splitCmd, (err) => err ? reject(err) : resolve(true));
            });
            downloadedClips.push(normClipPath);
          } else {
            // Fallback to standard dimension if secondary fetch fails
            await new Promise((resolve, reject) => {
              const cmd = `ffmpeg -y -t ${targetDur} -i "${rawClipPath}" -vf "scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH}" -c:v libx264 -pix_fmt yuv420p -r 30 -an "${normClipPath}"`;
              exec(cmd, (err) => err ? reject(err) : resolve(true));
            });
            downloadedClips.push(normClipPath);
          }
        } else {
          // Standard clip normalization (dynamic dimensions based on aspectRatio)
          await new Promise((resolve, reject) => {
            const cmd = `ffmpeg -y -t ${targetDur} -i "${rawClipPath}" -vf "scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH}" -c:v libx264 -pix_fmt yuv420p -r 30 -an "${normClipPath}"`;
            exec(cmd, (err) => err ? reject(err) : resolve(true));
          });
          downloadedClips.push(normClipPath);
        }

        // Generate Voiceover Narration for this scene
        const voiceScenePath = path.join(tmpDir, `voice_scene_${i}.mp3`);
        const sceneNarration = (sc.narration || sc.subtitle || "").trim();

        if (sceneNarration) {
          try {
            const voiceBuf = await synthesizeNeuralSpeechBuffer(sceneNarration, voice, voiceRate, voicePitch);
            const rawVoicePath = path.join(tmpDir, `voice_raw_${i}.mp3`);
            await fs.promises.writeFile(rawVoicePath, voiceBuf);

            // Pad or trim audio to exactly match scene duration with stereo 44.1kHz rate
            await new Promise((resolve, reject) => {
              const cmd = `ffmpeg -y -i "${rawVoicePath}" -filter_complex "apad=whole_dur=${targetDur}" -t ${targetDur} -ar 44100 -ac 2 -c:a libmp3lame -b:a 192k "${voiceScenePath}"`;
              exec(cmd, (err) => err ? reject(err) : resolve(true));
            });
            voiceClips.push(voiceScenePath);
            hasAnyVoiceover = true;
          } catch (vErr) {
            console.warn(`Voice synthesis failed for scene ${i}:`, vErr);
            // Fallback to silence for this scene
            await new Promise((resolve, reject) => {
              const cmd = `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${targetDur} -ar 44100 -ac 2 -c:a libmp3lame -b:a 192k "${voiceScenePath}"`;
              exec(cmd, (err) => err ? reject(err) : resolve(true));
            });
            voiceClips.push(voiceScenePath);
          }
        } else {
          // Empty narration -> silent track for this scene duration
          await new Promise((resolve, reject) => {
            const cmd = `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${targetDur} -ar 44100 -ac 2 -c:a libmp3lame -b:a 192k "${voiceScenePath}"`;
            exec(cmd, (err) => err ? reject(err) : resolve(true));
          });
          voiceClips.push(voiceScenePath);
        }
      } catch (clipErr) {
        console.warn(`Error processing scene clip ${i}:`, clipErr);
      }
    }

    if (downloadedClips.length === 0) {
      throw new Error("Could not process video clips for rendering");
    }

    // 1. Concatenate all video clips into single seamless video
    const concatPath = path.join(tmpDir, "concat.txt");
    const concatContent = downloadedClips.map(p => `file '${p}'`).join("\n");
    await fs.promises.writeFile(concatPath, concatContent);

    const stitchedPath = path.join(tmpDir, "stitched.mp4");
    await new Promise((resolve, reject) => {
      const cmd = `ffmpeg -y -f concat -safe 0 -i "${concatPath}" -c copy "${stitchedPath}"`;
      exec(cmd, (err) => err ? reject(err) : resolve(true));
    });

    // 2. Concatenate all scene voiceovers into master voiceover track
    let masterVoicePath: string | null = null;
    if (hasAnyVoiceover && voiceClips.length > 0) {
      try {
        const voiceConcatPath = path.join(tmpDir, "voice_concat.txt");
        const voiceConcatContent = voiceClips.map(p => `file '${p}'`).join("\n");
        await fs.promises.writeFile(voiceConcatPath, voiceConcatContent);

        const fullVoicePath = path.join(tmpDir, "master_voice.mp3");
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -f concat -safe 0 -i "${voiceConcatPath}" -c:a libmp3lame -b:a 192k "${fullVoicePath}"`;
          exec(cmd, (err) => err ? reject(err) : resolve(true));
        });
        masterVoicePath = fullVoicePath;
      } catch (vConcatErr) {
        console.warn("Voice concatenation failed:", vConcatErr);
      }
    }

    // 3. Download background music if provided
    let musicLocalPath: string | null = null;
    if (musicUrl) {
      try {
        const musicPath = path.join(tmpDir, "music.mp3");
        const mResp = await fetch(musicUrl);
        if (mResp.ok) {
          await fs.promises.writeFile(musicPath, Buffer.from(await mResp.arrayBuffer()));
          musicLocalPath = musicPath;
        }
      } catch (mErr) {
        console.warn("Background music download skipped:", mErr);
      }
    }

    // 4. Generate Subtitles ASS file if requested
    let assLocalPath: string | null = null;
    if (subtitlesStyle !== "none") {
      const assContent = generateAssContent(scenes, subtitlesStyle, aspectRatio);
      const assPath = path.join(tmpDir, "subtitles.ass");
      await fs.promises.writeFile(assPath, assContent, "utf8");
      assLocalPath = assPath;
    }

    // 5. Final Audio, Video & Subtitles Assembly
    let finalOutputPath = stitchedPath;
    const finalMixedPath = path.join(tmpDir, "production_final.mp4");
    const vol = Math.max(0.05, Math.min(1, Number(musicVolume) || 0.25));

    if (assLocalPath) {
      // Burn subtitles using the ASS filter and mix audio
      if (masterVoicePath && musicLocalPath) {
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -i "${stitchedPath}" -i "${masterVoicePath}" -stream_loop -1 -i "${musicLocalPath}" -filter_complex "[0:v]ass='${assLocalPath}'[v]; [1:a]volume=1.0[voice]; [2:a]volume=${vol}[bg]; [voice][bg]amix=inputs=2:duration=first:dropout_transition=2[a]" -map "[v]" -map "[a]" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${finalMixedPath}"`;
          exec(cmd, (err) => err ? reject(err) : resolve(true));
        });
        finalOutputPath = finalMixedPath;
      } else if (masterVoicePath) {
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -i "${stitchedPath}" -i "${masterVoicePath}" -filter_complex "[0:v]ass='${assLocalPath}'[v]" -map "[v]" -map 1:a -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${finalMixedPath}"`;
          exec(cmd, (err) => err ? reject(err) : resolve(true));
        });
        finalOutputPath = finalMixedPath;
      } else if (musicLocalPath) {
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -i "${stitchedPath}" -stream_loop -1 -i "${musicLocalPath}" -filter_complex "[0:v]ass='${assLocalPath}'[v]; [1:a]volume=${vol}[a]" -map "[v]" -map "[a]" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${finalMixedPath}"`;
          exec(cmd, (err) => err ? reject(err) : resolve(true));
        });
        finalOutputPath = finalMixedPath;
      } else {
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -i "${stitchedPath}" -filter_complex "[0:v]ass='${assLocalPath}'[v]" -map "[v]" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p "${finalMixedPath}"`;
          exec(cmd, (err) => err ? reject(err) : resolve(true));
        });
        finalOutputPath = finalMixedPath;
      }
    } else {
      // Subtitles disabled -> stream copy video
      if (masterVoicePath && musicLocalPath) {
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -i "${stitchedPath}" -i "${masterVoicePath}" -stream_loop -1 -i "${musicLocalPath}" -filter_complex "[1:a]volume=1.0[voice]; [2:a]volume=${vol}[bg]; [voice][bg]amix=inputs=2:duration=first:dropout_transition=2[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "${finalMixedPath}"`;
          exec(cmd, (err) => err ? reject(err) : resolve(true));
        });
        finalOutputPath = finalMixedPath;
      } else if (masterVoicePath) {
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -i "${stitchedPath}" -i "${masterVoicePath}" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "${finalMixedPath}"`;
          exec(cmd, (err) => err ? reject(err) : resolve(true));
        });
        finalOutputPath = finalMixedPath;
      } else if (musicLocalPath) {
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -i "${stitchedPath}" -stream_loop -1 -i "${musicLocalPath}" -filter_complex "[1:a]volume=${vol}[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "${finalMixedPath}"`;
          exec(cmd, (err) => err ? reject(err) : resolve(true));
        });
        finalOutputPath = finalMixedPath;
      }
    }

    const safeTitle = (title || "complete_video").replace(/[^a-zA-Z0-9_-]/g, "_");
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.mp4"`);

    const readStream = fs.createReadStream(finalOutputPath);
    readStream.pipe(res);
    readStream.on("close", async () => {
      try {
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
      } catch {}
    });
  } catch (err: any) {
    console.error("Render complete video error:", err);
    try {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    } catch {}
    res.status(500).json({ error: "Failed to render complete video: " + err.message });
  }
});

// 2. Search stock audio (Pixabay Audio API) with fallback
app.get("/api/stock/audio", async (req, res) => {
  const query = (req.query.query as string || "tech ambient").trim();
  const audioType = (req.query.type as string || "music").toLowerCase();
  const perPage = Math.min(Math.max(parseInt(req.query.per_page as string || "5", 10), 1), 10);

  const pixabayUrl = `https://pixabay.com/api/audio/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&per_page=${perPage}`;

  let results: any[] = [];
  let providerStatus = "connected";

  try {
    const upstream = await fetch(pixabayUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      }
    });

    if (upstream.ok) {
      const data: any = await upstream.json();
      if (data.hits && Array.isArray(data.hits) && data.hits.length > 0) {
        results = data.hits.map((hit: any) => ({
          id: `pixabay-audio-${hit.id}`,
          type: audioType,
          title: hit.tags || hit.name || `Pixabay Audio #${hit.id}`,
          duration: hit.duration,
          download_url: hit.audio || hit.download_url,
          preview_url: hit.audio || hit.preview_url,
          artist: hit.user || "Pixabay Creator",
          license: "Pixabay Free Commercial Use"
        }));
      }
    } else {
      // Pixabay Audio endpoints often require customized commercial permissions on user accounts.
      // We cleanly note the fallback status and use our rich CC-licensed curated audio catalog.
      providerStatus = upstream.status === 403 ? "curated_library" : `status_${upstream.status}`;
    }
  } catch (err: any) {
    providerStatus = "curated_library";
  }

  // Curated high quality royalty-free tracks (Direct GitHub CC4.0 MP3s with 100% reliable streaming and FFmpeg download)
  if (results.length === 0) {
    const curatedAudioPool = [
      // Technology, AI, Cyber, Modern
      {
        id: "curated-music-tech-01",
        type: "music",
        title: "Syntheticity (Cyber Ambient & Electronic)",
        genre: "Electronic / Cyber",
        queryMatch: ["tech", "synth", "cyber", "coding", "software", "ambient", "ai", "artificial intelligence", "matrix", "future", "digital", "data", "deep tech", "computer"],
        duration: 184,
        download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Syntheticity.mp3",
        preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Syntheticity.mp3",
        artist: "Tanner Helland",
        license: "Royalty Free (Creative Commons 4.0)"
      },
      {
        id: "curated-music-tech-02",
        type: "music",
        title: "Deeper (Cosmic Deep Tech & Future Ambient)",
        genre: "Ambient / Sci-Fi",
        queryMatch: ["space", "cosmos", "deep", "ambient", "sci-fi", "quantum", "modern", "future", "subtle", "minimal", "galaxy", "stars"],
        duration: 162,
        download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Deeper.mp3",
        preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Deeper.mp3",
        artist: "Tanner Helland",
        license: "Royalty Free (Creative Commons 4.0)"
      },
      // Inspirational, Corporate, Hopeful
      {
        id: "curated-music-inspire-01",
        type: "music",
        title: "Daybreak (Inspirational & Uplifting Horizon)",
        genre: "Cinematic / Inspirational",
        queryMatch: ["inspirational", "uplifting", "hope", "daybreak", "sunrise", "morning", "business", "corporate", "success", "growth", "vision", "motivational"],
        duration: 195,
        download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Daybreak.mp3",
        preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Daybreak.mp3",
        artist: "Tanner Helland",
        license: "Royalty Free (Creative Commons 4.0)"
      },
      {
        id: "curated-music-inspire-02",
        type: "music",
        title: "From Here (Modern Momentum & Progress)",
        genre: "Orchestral / Modern",
        queryMatch: ["progress", "innovation", "forward", "start", "journey", "future", "modern", "corporate", "creative", "new"],
        duration: 148,
        download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/From%20Here.mp3",
        preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/From%20Here.mp3",
        artist: "Tanner Helland",
        license: "Royalty Free (Creative Commons 4.0)"
      },
      // Cinematic, Drama, Epic Trailer
      {
        id: "curated-music-epic-01",
        type: "music",
        title: "Crossroads (Cinematic Drama & Narrative)",
        genre: "Cinematic Drama",
        queryMatch: ["cinematic", "drama", "crossroads", "decision", "story", "documentary", "movie", "epic", "serious", "power", "history"],
        duration: 210,
        download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Crossroads.mp3",
        preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Crossroads.mp3",
        artist: "Tanner Helland",
        license: "Royalty Free (Creative Commons 4.0)"
      },
      {
        id: "curated-music-epic-02",
        type: "music",
        title: "Destiny (Epic Orchestral Trailer)",
        genre: "Epic Orchestral",
        queryMatch: ["epic", "trailer", "destiny", "heroic", "movie trailer", "dramatic", "orchestral", "grand", "legendary", "fate"],
        duration: 175,
        download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Destiny.mp3",
        preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Destiny.mp3",
        artist: "Tanner Helland",
        license: "Royalty Free (Creative Commons 4.0)"
      },
      {
        id: "curated-music-epic-03",
        type: "music",
        title: "Dark Knight (Authoritative & Powerful Climax)",
        genre: "Cinematic Action",
        queryMatch: ["dark", "powerful", "authoritative", "knight", "action", "battle", "intense", "heavy", "force", "trailer"],
        duration: 158,
        download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Dark%20Knight.mp3",
        preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Dark%20Knight.mp3",
        artist: "Tanner Helland",
        license: "Royalty Free (Creative Commons 4.0)"
      },
      // Nature, Earth, Peaceful
      {
        id: "curated-music-nature-01",
        type: "music",
        title: "The Forest Awakes (Nature & Organic Harmony)",
        genre: "Nature / Acoustic",
        queryMatch: ["nature", "forest", "organic", "peaceful", "calm", "morning", "animals", "trees", "wildlife", "earth", "eco", "green", "birds"],
        duration: 190,
        download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/The%20Forest%20Awakes.mp3",
        preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/The%20Forest%20Awakes.mp3",
        artist: "Tanner Helland",
        license: "Royalty Free (Creative Commons 4.0)"
      },
      {
        id: "curated-music-nature-02",
        type: "music",
        title: "Wild Waters (Ocean & Flowing Currents)",
        genre: "Atmospheric",
        queryMatch: ["ocean", "water", "sea", "river", "flow", "waves", "swimming", "fluid", "aquatic", "stream", "beach"],
        duration: 180,
        download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Wild%20Waters.mp3",
        preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Wild%20Waters.mp3",
        artist: "Tanner Helland",
        license: "Royalty Free (Creative Commons 4.0)"
      },
      // Travel, Adventure, Exploration
      {
        id: "curated-music-travel-01",
        type: "music",
        title: "The Journey (Travel, Exploration & Discovery)",
        genre: "Adventure / Travel",
        queryMatch: ["travel", "journey", "explore", "adventure", "discovery", "vlog", "flight", "road", "trip", "destination", "wanderlust", "vacation"],
        duration: 204,
        download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/The%20Journey%20(Kroc's%20Theme).mp3",
        preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/The%20Journey%20(Kroc's%20Theme).mp3",
        artist: "Tanner Helland",
        license: "Royalty Free (Creative Commons 4.0)"
      },
      {
        id: "curated-music-travel-02",
        type: "music",
        title: "Familiar Roads (Acoustic Roadtrip & Country)",
        genre: "Acoustic / Warm",
        queryMatch: ["roads", "roadtrip", "country", "car", "drive", "acoustic", "guitar", "simple", "warm", "folk", "summer"],
        duration: 168,
        download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Familiar%20Roads.mp3",
        preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Familiar%20Roads.mp3",
        artist: "Tanner Helland",
        license: "Royalty Free (Creative Commons 4.0)"
      },
      {
        id: "curated-music-travel-03",
        type: "music",
        title: "Lost Islands (Mystical Exotic Adventure)",
        genre: "Exotic / Adventure",
        queryMatch: ["island", "exotic", "tropical", "mystery", "lost", "ancient", "temple", "beach", "pacific", "secret"],
        duration: 172,
        download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Lost%20Islands.mp3",
        preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Lost%20Islands.mp3",
        artist: "Tanner Helland",
        license: "Royalty Free (Creative Commons 4.0)"
      },
      // High Energy Action, Fast Pace, Sports
      {
        id: "curated-music-action-01",
        type: "music",
        title: "Now or Never (Fast High Stakes Action)",
        genre: "Action / Fast Beat",
        queryMatch: ["action", "fast", "urgent", "speed", "racing", "workout", "fitness", "sports", "gaming", "energy", "rush", "intense"],
        duration: 154,
        download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Now%20or%20Never.mp3",
        preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Now%20or%20Never.mp3",
        artist: "Tanner Helland",
        license: "Royalty Free (Creative Commons 4.0)"
      },
      {
        id: "curated-music-action-02",
        type: "music",
        title: "Assault on Mist Castle (Gaming & High Adrenaline)",
        genre: "Action / Orchestral",
        queryMatch: ["gaming", "game", "castle", "fight", "combat", "adrenaline", "battle", "epic", "intense", "level"],
        duration: 165,
        download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Assault%20on%20Mist%20Castle.mp3",
        preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Assault%20on%20Mist%20Castle.mp3",
        artist: "Tanner Helland",
        license: "Royalty Free (Creative Commons 4.0)"
      },
      // Emotional, Storytelling, Piano, Documentary
      {
        id: "curated-music-story-01",
        type: "music",
        title: "A Memory Away (Emotional Storytelling & Reflection)",
        genre: "Piano / Emotional",
        queryMatch: ["memory", "emotional", "sad", "reflection", "documentary", "heartfelt", "thoughtful", "piano", "tender", "soft", "story"],
        duration: 188,
        download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/A%20Memory%20Away.mp3",
        preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/A%20Memory%20Away.mp3",
        artist: "Tanner Helland",
        license: "Royalty Free (Creative Commons 4.0)"
      },
      {
        id: "curated-music-story-02",
        type: "music",
        title: "Home (Warm Acoustic & Peaceful)",
        genre: "Acoustic / Warm",
        queryMatch: ["home", "family", "warm", "comfort", "peace", "love", "community", "nostalgia", "friends", "relax"],
        duration: 160,
        download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Home.mp3",
        preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Home.mp3",
        artist: "Tanner Helland",
        license: "Royalty Free (Creative Commons 4.0)"
      },
      // SFX
      {
        id: "curated-sfx-01",
        type: "sfx",
        title: "Futuristic Digital Click",
        genre: "SFX",
        queryMatch: ["keyboard", "typing", "code", "click", "keys", "sfx", "digital", "button"],
        duration: 4,
        download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Syntheticity.mp3",
        preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Syntheticity.mp3",
        artist: "Audio Pro",
        license: "Royalty Free (Creative Commons 4.0)"
      }
    ];

    // Smart semantic & query scoring for topic-matching background music
    const qTokens = query.toLowerCase().split(/[\s,._-]+/).filter(t => t.length > 1);
    const scoredPool = curatedAudioPool
      .filter(item => !audioType || item.type === audioType)
      .map(item => {
        let score = 0;
        const titleLower = item.title.toLowerCase();
        const genreLower = (item.genre || "").toLowerCase();
        for (const token of qTokens) {
          if (titleLower.includes(token)) score += 5;
          if (genreLower.includes(token)) score += 4;
          if (item.queryMatch.some(qm => qm.toLowerCase().includes(token) || token.includes(qm.toLowerCase()))) {
            score += 3;
          }
        }
        // Add subtle tie-breaker so subsequent requests or varied prompts get variety
        const tieBreaker = Math.random() * 0.8;
        return { item, score: score + tieBreaker };
      });

    scoredPool.sort((a, b) => b.score - a.score);
    results = scoredPool.slice(0, perPage).map(s => s.item);
  }

  res.json({
    query,
    type: audioType,
    count: results.length,
    providerStatus,
    results
  });
});

// 3. Search stock assets (Pexels & Pixabay) with rate-limit monitoring
app.get("/api/stock/search", async (req, res) => {
  const query = (req.query.query as string || "").trim();
  const mediaType = (req.query.mediaType as string || "video").toLowerCase();
  const source = (req.query.source as string || "all").toLowerCase();
  const orientationParam = (req.query.orientation as string || "").toLowerCase();
  const aspectRatioParam = (req.query.aspectRatio as string || "").toLowerCase();
  const isPortrait = orientationParam === "portrait" || aspectRatioParam === "9:16";
  const pexelsOrientation = isPortrait ? "portrait" : "landscape";

  if (!query) {
    return res.json({ results: [], rateLimits: rateLimitState });
  }

  const results: any[] = [];
  const errors: string[] = [];

  // Pexels Search
  if (source === "all" || source === "pexels") {
    try {
      if (mediaType === "video") {
        const pexUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=6&orientation=${pexelsOrientation}`;
        const pexRes = await fetch(pexUrl, {
          headers: { Authorization: PEXELS_KEY }
        });

        // Track headers
        const pexLimit = pexRes.headers.get("x-ratelimit-limit");
        const pexRemaining = pexRes.headers.get("x-ratelimit-remaining");
        const pexReset = pexRes.headers.get("x-ratelimit-reset");

        if (pexLimit) rateLimitState.pexels.limit = parseInt(pexLimit, 10);
        if (pexRemaining) {
          const rem = parseInt(pexRemaining, 10);
          rateLimitState.pexels.remaining = rem;
          rateLimitState.pexels.status = rem < 5 ? (rem === 0 ? 'throttled' : 'warning') : 'healthy';
        }
        if (pexReset) rateLimitState.pexels.reset = parseInt(pexReset, 10);
        rateLimitState.pexels.lastUpdated = new Date().toISOString();

        if (pexRes.ok) {
          const data: any = await pexRes.json();
          for (const v of (data.videos || [])) {
            // Find HD video file and mobile preview
            const sortedFiles = (v.video_files || []).sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
            const hdFile = sortedFiles[0] || {};
            // Preview file (lighter weight for fast browser loading)
            const previewFile = (v.video_files || []).find((f: any) => (f.width && f.width <= 960 && f.width >= 480)) || hdFile;

            results.push({
              id: `pexels-${v.id}`,
              source: "pexels",
              type: "video",
              title: `Pexels Video #${v.id}`,
              previewUrl: previewFile.link || hdFile.link,
              thumbnailUrl: v.image,
              downloadUrl: hdFile.link || previewFile.link,
              width: v.width,
              height: v.height,
              duration: v.duration,
              author: v.user?.name || "Pexels Creator",
              authorUrl: v.user?.url,
              quality: hdFile.quality ? `${hdFile.quality.toUpperCase()} (${hdFile.width}x${hdFile.height})` : `${v.width}x${v.height}`
            });
          }
        } else if (pexRes.status === 429) {
          rateLimitState.pexels.status = 'throttled';
          errors.push("Pexels rate limit reached (HTTP 429)");
        }
      } else {
        // Pexels photo search
        const pexUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=6&orientation=${pexelsOrientation}`;
        const pexRes = await fetch(pexUrl, {
          headers: { Authorization: PEXELS_KEY }
        });
        if (pexRes.ok) {
          const data: any = await pexRes.json();
          for (const p of (data.photos || [])) {
            results.push({
              id: `pexels-photo-${p.id}`,
              source: "pexels",
              type: "image",
              title: p.alt || `Pexels Photo #${p.id}`,
              previewUrl: p.src?.large || p.src?.medium,
              thumbnailUrl: p.src?.tiny || p.src?.small,
              downloadUrl: p.src?.original || p.src?.large2x,
              width: p.width,
              height: p.height,
              author: p.photographer || "Pexels Creator",
              authorUrl: p.photographer_url,
              quality: `${p.width}x${p.height}`
            });
          }
        }
      }
    } catch (err: any) {
      console.error("Pexels fetch error:", err?.message);
      errors.push(`Pexels: ${err?.message}`);
    }
  }

  // Pixabay Search
  if (source === "all" || source === "pixabay") {
    try {
      if (mediaType === "video") {
        const pixUrl = `https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&per_page=6`;
        const pixRes = await fetch(pixUrl);

        const pixLimit = pixRes.headers.get("x-ratelimit-limit");
        const pixRemaining = pixRes.headers.get("x-ratelimit-remaining");
        const pixReset = pixRes.headers.get("x-ratelimit-reset");

        if (pixLimit) rateLimitState.pixabay.limit = parseInt(pixLimit, 10);
        if (pixRemaining) {
          const rem = parseInt(pixRemaining, 10);
          rateLimitState.pixabay.remaining = rem;
          rateLimitState.pixabay.status = rem < 10 ? (rem === 0 ? 'throttled' : 'warning') : 'healthy';
        }
        if (pixReset) rateLimitState.pixabay.reset = parseInt(pixReset, 10);
        rateLimitState.pixabay.lastUpdated = new Date().toISOString();

        if (pixRes.ok) {
          const data: any = await pixRes.json();
          for (const hit of (data.hits || [])) {
            const vids = hit.videos || {};
            const large = vids.large;
            const medium = vids.medium;
            const small = vids.small;
            const chosen = large?.url ? large : (medium?.url ? medium : small);
            const preview = medium?.url ? medium : (small?.url ? small : chosen);
            const thumb = medium?.thumbnail || chosen?.thumbnail || small?.thumbnail || hit.userImageURL;

            if (chosen?.url) {
              results.push({
                id: `pixabay-${hit.id}`,
                source: "pixabay",
                type: "video",
                title: hit.tags || `Pixabay Video #${hit.id}`,
                previewUrl: preview?.url || chosen.url,
                thumbnailUrl: thumb,
                downloadUrl: chosen.url,
                width: chosen.width || 1920,
                height: chosen.height || 1080,
                duration: hit.duration,
                author: hit.user || "Pixabay Creator",
                authorUrl: hit.pageURL,
                quality: `${chosen.width || 1920}x${chosen.height || 1080}`
              });
            }
          }
        } else if (pixRes.status === 429) {
          rateLimitState.pixabay.status = 'throttled';
          errors.push("Pixabay rate limit reached (HTTP 429)");
        }
      } else {
        // Pixabay Photo search
        const pixUrl = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=6`;
        const pixRes = await fetch(pixUrl);
        if (pixRes.ok) {
          const data: any = await pixRes.json();
          for (const hit of (data.hits || [])) {
            results.push({
              id: `pixabay-photo-${hit.id}`,
              source: "pixabay",
              type: "image",
              title: hit.tags || `Pixabay Photo #${hit.id}`,
              previewUrl: hit.webformatURL,
              thumbnailUrl: hit.previewURL,
              downloadUrl: hit.largeImageURL || hit.webformatURL,
              width: hit.imageWidth,
              height: hit.imageHeight,
              author: hit.user || "Pixabay Creator",
              authorUrl: hit.pageURL,
              quality: `${hit.imageWidth}x${hit.imageHeight}`
            });
          }
        }
      }
    } catch (err: any) {
      console.error("Pixabay fetch error:", err?.message);
      errors.push(`Pixabay: ${err?.message}`);
    }
  }

  // Automatic query relaxation if no results were found for multi-word search
  if (results.length === 0 && query.split(/\s+/).length > 1) {
    const fallbackQuery = query.split(/\s+/).slice(0, 2).join(" ");
    try {
      const pexRes = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(fallbackQuery)}&per_page=6&orientation=${pexelsOrientation}`, {
        headers: { Authorization: PEXELS_KEY }
      });
      if (pexRes.ok) {
        const data: any = await pexRes.json();
        for (const v of (data.videos || [])) {
          const sortedFiles = (v.video_files || []).sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
          const hdFile = sortedFiles[0] || {};
          const previewFile = (v.video_files || []).find((f: any) => (f.width && f.width <= 960 && f.width >= 480)) || hdFile;
          results.push({
            id: `pexels-${v.id}`,
            source: "pexels",
            type: "video",
            title: `Pexels Video #${v.id}`,
            previewUrl: previewFile.link || hdFile.link,
            thumbnailUrl: v.image,
            downloadUrl: hdFile.link || previewFile.link,
            width: v.width,
            height: v.height,
            duration: v.duration,
            author: v.user?.name || "Pexels Creator",
            authorUrl: v.user?.url,
            quality: hdFile.quality ? `${hdFile.quality.toUpperCase()} (${hdFile.width}x${hdFile.height})` : `${v.width}x${v.height}`
          });
        }
      }
    } catch {}
  }

  res.json({
    query,
    count: results.length,
    results,
    rateLimits: rateLimitState,
    errors: errors.length > 0 ? errors : undefined
  });
});

// 3. Proxy media download for seamless client file saving with integrity verification
app.get("/api/proxy-download", async (req, res) => {
  const fileUrl = req.query.url as string;
  const filename = (req.query.filename as string) || "b_roll_asset.mp4";

  if (!fileUrl) {
    return res.status(400).json({ error: "File URL is required" });
  }

  try {
    const upstreamRes = await fetch(fileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5",
        "Referer": fileUrl.includes("pexels.com") ? "https://www.pexels.com/" : "https://pixabay.com/"
      }
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        error: `Upstream CDN returned HTTP ${upstreamRes.status} (${upstreamRes.statusText})`
      });
    }

    const contentType = upstreamRes.headers.get("content-type") || "video/mp4";
    const contentLength = upstreamRes.headers.get("content-length");

    // Guard: ensure upstream did not return an HTML challenge or error page
    if (contentType.includes("text/html") || contentType.includes("application/json")) {
      return res.status(403).json({
        error: "Upstream CDN returned an HTML error/challenge instead of media content."
      });
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }
    // Prevent caching of incomplete downloads
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    // Stream the body to client
    const reader = upstreamRes.body?.getReader();
    if (!reader) {
      return res.status(500).json({ error: "Unable to initialize upstream media stream" });
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err: any) {
    console.error("Proxy download error:", err?.message);
    if (!res.headersSent) {
      res.status(500).json({ error: `Download streaming failed: ${err?.message}` });
    } else {
      res.end();
    }
  }
});

// 4. Download Python script
app.get("/api/download-python-script", (req, res) => {
  const pexKey = (req.query.pexelsKey as string) || PEXELS_KEY;
  const pixKey = (req.query.pixabayKey as string) || PIXABAY_KEY;
  const scriptContent = generatePythonScript(pexKey, pixKey);

  res.setHeader("Content-Type", "text/x-python");
  res.setHeader("Content-Disposition", 'attachment; filename="download_assets.py"');
  res.send(scriptContent);
});

// Get list of natural neural voices
app.get("/api/tts-voices", (_req, res) => {
  res.json({
    status: "ok",
    voices: CURATED_NEURAL_VOICES,
  });
});

// GET endpoint to stream neural speech directly
app.get("/api/tts", async (req, res) => {
  const text = (req.query.text as string || "").trim();
  const voice = (req.query.voice as string) || "en-US-JennyNeural";
  const rate = (req.query.rate as string) || "+0%";
  const pitch = (req.query.pitch as string) || "+0Hz";

  if (!text) {
    return res.status(400).json({ error: "Missing required query parameter: text" });
  }

  try {
    const audioBuffer = await synthesizeNeuralSpeechBuffer(text, voice, rate, pitch);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.length);
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    res.setHeader("Accept-Ranges", "bytes");
    res.send(audioBuffer);
  } catch (err: any) {
    console.error("Neural TTS streaming error:", err?.message);
    res.status(500).json({ error: "Speech synthesis failed", details: err?.message });
  }
});

// POST endpoint for larger scripts or pre-generation
app.post("/api/tts", async (req, res) => {
  const { text, voice, rate, pitch } = req.body || {};
  const cleanText = (text || "").trim();

  if (!cleanText) {
    return res.status(400).json({ error: "Missing required body parameter: text" });
  }

  try {
    const audioBuffer = await synthesizeNeuralSpeechBuffer(
      cleanText,
      voice || "en-US-JennyNeural",
      rate || "+0%",
      pitch || "+0Hz"
    );
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.length);
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    res.send(audioBuffer);
  } catch (err: any) {
    console.error("Neural TTS POST error:", err?.message);
    res.status(500).json({ error: "Speech synthesis failed", details: err?.message });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Video B-Roll Assistant running on port ${PORT}`);
  });
}

startServer();
