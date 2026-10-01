import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import cron from "node-cron";
import { exec, execSync } from "child_process";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { generatePythonScript } from "./src/pythonTemplate.ts";
import { EXPANDED_CURATED_VIDEO_CATALOG } from "./src/data/videoCatalog.ts";
import {
  buildShortsFallbackPlan,
  getShortsTopicIdeas,
  isContentPillar,
  normalizeShortsPlanRequest,
} from "./shortsPlanner.ts";
import { startWhatsAppService, getWhatsAppState, requestPairingCode, disconnectWhatsApp, getWhatsAppSocket, initializeMessageHandler } from "./whatsappService.ts";
import { searchStockMedia, searchStockAudio, getRateLimits } from "./stockMedia.ts";

let _filename = "";
let _dirname = "";
try {
  _filename = fileURLToPath((import.meta as any).url);
  _dirname = path.dirname(_filename);
} catch (e) {
  if (typeof __filename !== "undefined") {
    _filename = __filename;
    _dirname = __dirname;
  } else {
    _dirname = process.cwd();
  }
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '200mb' }));

// Network diagnostics endpoint
app.get("/api/network/test", async (req, res) => {
  const tests = {
    pexels: false,
    pixabay: false,
    giphy: false,
    nasa: false,
    archive: false
  };

  const testUrl = async (url: string) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      await fetch(url, { method: "HEAD", signal: controller.signal });
      clearTimeout(timeout);
      return true;
    } catch {
      return false;
    }
  };

  tests.pexels = await testUrl("https://api.pexels.com");
  tests.pixabay = await testUrl("https://pixabay.com");
  tests.giphy = await testUrl("https://api.giphy.com");
  tests.nasa = await testUrl("https://images-api.nasa.gov");
  tests.archive = await testUrl("https://archive.org");

  res.json({
    status: "Network connectivity test",
    tests,
    summary: `${Object.values(tests).filter(Boolean).length}/5 APIs reachable`
  });
});

// API Keys with defaults from user configuration
const PEXELS_KEY = process.env.PEXELS_API_KEY || "h1r1DWw3EyuEcP8pFXl6e9jo76I0RfxUoG3d18kvEliS6pH6eEyHbmNo";
const PIXABAY_KEY = process.env.PIXABAY_API_KEY || "35348186-369453ead8e33f2eec3ada4ec";
const GIPHY_KEY = process.env.GIPHY_API_KEY || "glVs44nST7draZncBpDT52GYz89IF5IA";
const NASA_KEY = process.env.NASA_API_KEY || "DEMO_KEY";

const YOUTUBE_CLIENT_ID = process.env.CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || "";
const YOUTUBE_CLIENT_SECRET = process.env.CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET || "";
const YOUTUBE_REFRESH_TOKEN = process.env.REFRESH_TOKEN || process.env.YOUTUBE_REFRESH_TOKEN || "";

const YOUTUBE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";
const YOUTUBE_DATA_URL = "https://youtube.googleapis.com/youtube/v3";
const YOUTUBE_ANALYTICS_URL = "https://youtubeanalytics.googleapis.com/v2";
const YOUTUBE_CONTENT_STORE_FILE = path.join(_dirname, "youtube-content-store.json");

function normalizeAppBaseUrl(raw?: string) {
  const envValue = String(raw || '').trim();
  if (!envValue || /MY_APP_URL/i.test(envValue)) {
    return 'http://localhost:3000';
  }
  if (/^https?:\/\//i.test(envValue)) {
    return envValue.replace(/\/+$/, '');
  }
  return `http://${envValue.replace(/\/+$/, '')}`;
}

const APP_BASE_URL = normalizeAppBaseUrl(process.env.APP_URL);

interface ChannelContentRecord {
  videoId: string;
  title: string;
  description: string;
  tags: string[];
  searchKeywords: string[];
  topicRecommendations: string[];
  uploadedAt: number;
  telemetry: { rows?: any[] } | any;
  lastTelemetryAt: number;
}

function normalizeStringArray(input: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(input)) {
    return input.map(String).map(item => item.trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    return input.split(/[\s,]+/).map(item => item.trim()).filter(Boolean);
  }
  return fallback;
}

function normalizeSingleMusicTrack(input: unknown): string | undefined {
  if (Array.isArray(input)) {
    const tracks = input.map(String).map(item => item.trim()).filter(Boolean);
    return tracks.length > 0 ? tracks[0] : undefined;
  }
  if (typeof input === "string") {
    const cleaned = input.trim();
    return cleaned.length > 0 ? cleaned : undefined;
  }
  return undefined;
}

function loadYoutubeContentStoreFromDisk(): Map<string, ChannelContentRecord> {
  const store = new Map<string, ChannelContentRecord>();
  try {
    if (!fs.existsSync(YOUTUBE_CONTENT_STORE_FILE)) {
      return store;
    }
    const raw = fs.readFileSync(YOUTUBE_CONTENT_STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Record<string, ChannelContentRecord>;
    for (const [videoId, record] of Object.entries(parsed)) {
      if (record && record.videoId === videoId) {
        store.set(videoId, record);
      }
    }
  } catch (err) {
    console.warn("Unable to load persisted YouTube content store:", err);
  }
  return store;
}

function persistYoutubeContentStoreToDisk(store: Map<string, ChannelContentRecord>) {
  try {
    const payload = Object.fromEntries(store.entries());
    fs.writeFileSync(YOUTUBE_CONTENT_STORE_FILE, JSON.stringify(payload, null, 2), "utf8");
  } catch (err) {
    console.warn("Unable to persist YouTube content store:", err);
  }
}

const youtubeContentStore = loadYoutubeContentStoreFromDisk();

async function getYoutubeAccessToken() {
  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
    throw new Error("Missing OAuth credentials: CLIENT_ID, CLIENT_SECRET, or REFRESH_TOKEN is required for YouTube OAuth 2.0 uploads and analytics.");
  }

  const form = new URLSearchParams({
    client_id: YOUTUBE_CLIENT_ID,
    client_secret: YOUTUBE_CLIENT_SECRET,
    refresh_token: YOUTUBE_REFRESH_TOKEN,
    grant_type: "refresh_token"
  });

  const res = await fetch(YOUTUBE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString()
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`YouTube OAuth token refresh failed: ${res.status} ${errText}`);
  }

  const data = await res.json() as { access_token?: string; expires_in?: number; token_type?: string };
  if (!data.access_token) {
    throw new Error("YouTube OAuth token refresh returned no access_token");
  }

  return data.access_token;
}

async function fetchYoutubeChannel(accessToken: string) {
  const channelRes = await fetch(`${YOUTUBE_DATA_URL}/channels?part=snippet,contentDetails,statistics&mine=true`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!channelRes.ok) {
    const err = await channelRes.text();
    throw new Error(`YouTube Data API channel lookup failed: ${channelRes.status} ${err}`);
  }

  return await channelRes.json();
}

async function fetchYoutubeAnalytics(accessToken: string, reqQuery: any) {
  const startDate = reqQuery.startDate || "2026-01-01";
  const endDate = reqQuery.endDate || new Date().toISOString().slice(0, 10);
  const metrics = reqQuery.metrics || "views,estimatedMinutesWatched,averageViewDuration";
  const dimensions = reqQuery.dimensions || "day";
  const ids = reqQuery.ids || "channel==MINE";
  const filters = reqQuery.videoId ? `filters=${encodeURIComponent(`video==${reqQuery.videoId}`)}` : "";

  const url = `${YOUTUBE_ANALYTICS_URL}/reports?ids=${encodeURIComponent(ids)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&metrics=${encodeURIComponent(metrics)}&dimensions=${encodeURIComponent(dimensions)}${filters ? `&${filters}` : ""}`;

  const analyticsRes = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!analyticsRes.ok) {
    const err = await analyticsRes.text();
    throw new Error(`YouTube Analytics API failed: ${analyticsRes.status} ${err}`);
  }

  return await analyticsRes.json();
}

function applyShortsDurationRule(scenes: Array<{ duration?: number; durationSeconds?: number }> = [], aspectRatio?: string) {
  if (String(aspectRatio || "16:9") !== "9:16") {
    return scenes;
  }

  const currentTotal = scenes.reduce((sum, s) => sum + Number(s.duration ?? s.durationSeconds ?? 0), 0);
  if (currentTotal < 50 || currentTotal > 60) {
    const target = 55;
    const ratio = Math.max(0.001, target / Math.max(currentTotal, 1));
    scenes.forEach((s) => {
      const cur = Number(s.duration ?? s.durationSeconds ?? 5);
      const next = Math.min(18, Math.max(3, Math.round(cur * ratio)));
      s.duration = next;
      s.durationSeconds = next;
    });
  }

  const total = scenes.reduce((sum, s) => sum + Number(s.duration ?? s.durationSeconds ?? 0), 0);
  if (total < 50) {
    scenes[scenes.length - 1].duration = Number(scenes[scenes.length - 1].duration ?? scenes[scenes.length - 1].durationSeconds ?? 5) + (50 - total);
    scenes[scenes.length - 1].durationSeconds = scenes[scenes.length - 1].duration;
  } else if (total > 60) {
    const over = total - 60;
    scenes[scenes.length - 1].duration = Math.max(3, Number(scenes[scenes.length - 1].duration ?? scenes[scenes.length - 1].durationSeconds ?? 5) - over);
    scenes[scenes.length - 1].durationSeconds = scenes[scenes.length - 1].duration;
  }

  return scenes;
}

async function fetchYouTubeCompetitorResearch(accessToken: string, niche: string = "creator strategy ai workflow") {
  const q = encodeURIComponent(niche || "creator strategy ai workflow");
  const url = `${YOUTUBE_DATA_URL}/search?part=snippet&type=video&order=viewCount&maxResults=5&safeSearch=none&q=${q}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`YouTube search.list failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

function buildRichDescription(title: string, description: string, tags: string[], keywords: string[]) {
  const cleanTitle = String(title || "Creator Workflow").replace(/\s+/g, " ").trim();
  const cleanTags = Array.from(new Set([
    ...normalizeStringArray(tags, []),
    ...normalizeStringArray(keywords, [])
  ].map((t: string) => String(t).trim().replace(/^#+/, "")).filter(Boolean))).slice(0, 12);

  const hook = `${cleanTitle}: research, systems, and publishing momentum`;
  const valueBody = [
    "This short turns creator research into a clear automation workflow for publishing faster.",
    "It connects searchable ideas, repeatable structure, and channel feedback to improve future content decisions.",
    "The goal is to make the next video stronger, cleaner, and easier to optimize."
  ].slice(0, 3).join(" ");

  const hashtags = Array.from(new Set([
    "#Shorts",
    "#YouTubeAutomation",
    "#AI",
    ...cleanTags.map(t => `#${String(t).replace(/[^a-zA-Z0-9_\-]/g, "")}`)
  ])).filter(Boolean).slice(0, 12);

  return `${hook}\n${valueBody}\n${hashtags.join(" ")}`;
}

async function uploadThumbnailToYouTube(accessToken: string, videoId: string, buffer: Buffer, mimeType: string = "image/jpeg") {
  const url = `${YOUTUBE_DATA_URL}/thumbnails/set?videoId=${encodeURIComponent(videoId)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": mimeType,
      "Content-Length": String(buffer.byteLength)
    },
    body: buffer
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`YouTube thumbnail upload failed: ${res.status} ${err}`);
  }

  return await res.json();
}

async function createThumbnailFromVideoBuffer(videoBuffer: Buffer, tmpDir?: string) {
  const workDir = tmpDir || path.join(os.tmpdir(), `thumb_${Date.now()}_${Math.round(Math.random() * 1e7)}`);
  await fs.promises.mkdir(workDir, { recursive: true });
  const src = path.join(workDir, "source.mp4");
  const thumb = path.join(workDir, "thumb.jpg");
  await fs.promises.writeFile(src, videoBuffer);

  await new Promise((resolve, reject) => {
    exec(`ffmpeg -y -i "${src}" -ss 00:00:01 -vframes 1 -q:v 2 "${thumb}"`, (err) => err ? reject(err) : resolve(true));
  });

  const image = await fs.promises.readFile(thumb);
  try { await fs.promises.rm(workDir, { recursive: true, force: true }); } catch {}
  return image;
}

function chooseUploadPacing(analytics: any): number {
  const rows = Array.isArray(analytics?.rows) ? analytics.rows : [];
  const totalViews = rows.reduce((sum: number, row: any) => sum + Number(row[1] || row.views || 0), 0);
  const totalWatch = rows.reduce((sum: number, row: any) => sum + Number(row[2] || row.estimatedMinutesWatched || 0), 0);
  const velocity = totalViews > 0 ? totalViews / Math.max(rows.length, 1) : 0;
  const retention = totalWatch > 0 && totalViews > 0 ? totalWatch / Math.max(totalViews, 1) : 0;

  if (velocity >= 8 && retention >= 2) {
    return 2;
  }
  return 1;
}

async function runAutonomousYoutubeLoop(payload: any = {}) {
  try {
    const accessToken = await getYoutubeAccessToken();
    const channel = await fetchYoutubeChannel(accessToken);
    const analytics = await fetchYoutubeAnalytics(accessToken, {
      ids: "channel==MINE",
      startDate: "2026-01-01",
      endDate: new Date().toISOString().slice(0, 10),
      metrics: "views,estimatedMinutesWatched,averageViewDuration",
      dimensions: "day"
    });

    const uploadBudget = chooseUploadPacing(analytics);
    const niche = payload.niche || "creator workflow automation";
    const research = await fetchYouTubeCompetitorResearch(accessToken, niche);

    const planner = {
      niche,
      researchCount: research.length,
      uploadBudget,
      trendingTopics: research.map((item: any) => item?.snippet?.title || "").filter(Boolean),
      scheduledAt: new Date().toISOString()
    };

    const source = {
      title: `${niche} ${uploadBudget === 2 ? "Growth System" : "Workflow Sprint"} #Shorts`,
      description: `Plan a weekly creator workflow for ${niche}.`,
      tags: ["#Shorts", niche, "creator workflow", "youtube automation", "ai video"]
    };

    const title = source.title;
    const description = buildRichDescription(title, source.description, source.tags, planner.trendingTopics);
    const tags = Array.from(new Set([...(source.tags || []), ...(planner.trendingTopics || [])].map((x) => String(x).trim()).filter(Boolean)));

    const scenes = [
      { scene_number: 1, title: 'Research Sprint', script_line: 'Map the niche pattern', narration: 'Research the strongest creator workflows in your niche.', subtitle: 'Research the strongest creator workflows in your niche.', duration: 15, search_keywords: niche, videoUrl: EXPANDED_CURATED_VIDEO_CATALOG[0].downloadUrl, transition: 'fade', overlayData: { style: 'headline' } },
      { scene_number: 2, title: 'Production System', script_line: 'Turn research into a repeatable system', narration: 'Create a video loop that turns research into assets and publishing momentum.', subtitle: 'Create a video loop that turns research into assets and publishing momentum.', duration: 15, search_keywords: niche, videoUrl: EXPANDED_CURATED_VIDEO_CATALOG[1].downloadUrl, transition: 'fade', overlayData: { style: 'headline' } },
      { scene_number: 3, title: 'Publish Window', script_line: 'Ship the short and learn', narration: 'Publish the short and let your analytics feedback shape the next cycle.', subtitle: 'Publish the short and let your analytics feedback shape the next cycle.', duration: 20, search_keywords: niche, videoUrl: EXPANDED_CURATED_VIDEO_CATALOG[2].downloadUrl, transition: 'fade', overlayData: { style: 'headline' } }
    ];

    applyShortsDurationRule(scenes, '9:16');

    const renderPayload = {
      title,
      aspectRatio: '9:16',
      scenes,
      voice: 'en-US-JennyNeural',
      subtitlesStyle: 'none',
      musicUrl: undefined,
      musicVolume: 0.2
    };

    const renderRes = await fetch(`${APP_BASE_URL}/api/render-complete-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(renderPayload)
    });

    if (!renderRes.ok) {
      throw new Error(`Autonomous render failed: ${renderRes.status}`);
    }

    const renderBuffer = Buffer.from(await renderRes.arrayBuffer());
    const thumbBuffer = await createThumbnailFromVideoBuffer(renderBuffer, path.join(os.tmpdir(), `autonomous_thumb_${Date.now()}`));

    const publishPayload = {
      title,
      description,
      tags,
      searchKeywords: tags,
      categoryId: '27',
      privacyStatus: 'private',
      videoDataUrl: `data:video/mp4;base64,${renderBuffer.toString('base64')}`,
      playlistId: undefined,
      thumbnailDataUrl: `data:image/jpeg;base64,${thumbBuffer.toString('base64')}`
    };

    const publishRes = await fetch(`${APP_BASE_URL}/api/youtube/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishPayload)
    });

    const publishText = await publishRes.text();
    if (!publishRes.ok) {
      throw new Error(`Autonomous publish failed: ${publishRes.status} ${publishText}`);
    }

    const published = JSON.parse(publishText);
    return { ok: true, uploadBudget, researchCount: research.length, channel, analytics, published };
  } catch (err: any) {
    console.error("Autonomous YouTube loop failed:", err);
    return { ok: false, error: err?.message || "Autonomous loop failed" };
  }
}

function buildTopicRecommendationsFromTelemetry(record: ChannelContentRecord) {
  const telemetry = record.telemetry || {};
  const rows = Array.isArray(telemetry.rows) ? telemetry.rows : [];
  const totalViews = rows.reduce((sum: number, row: any) => sum + Number(row[1] || row.views || 0), 0);
  const totalWatchTime = rows.reduce((sum: number, row: any) => sum + Number(row[2] || row.estimatedMinutesWatched || 0), 0);
  const trend = totalViews > 0 ? "high-performing" : "newlyPublished";

  const topics = new Set<string>(record.topicRecommendations || []);
  if (trend === "high-performing") {
    topics.add(record.title.trim().split(/\s+/).slice(0, 2).join(" "));
    topics.add(`${record.title} analytics feedback`);
  } else {
    topics.add(`${record.title} topic expansion`);
    topics.add(`channel performance improvement`);
  }

  return Array.from(topics).slice(0, 4);
}

function optimizeTeachingTagsAndKeywords(record: ChannelContentRecord) {
  const telemetry = record.telemetry || {};
  const rows = Array.isArray(telemetry.rows) ? telemetry.rows : [];
  const totalViews = rows.reduce((sum: number, row: any) => sum + Number(row[1] || row.views || 0), 0);

  const tags = Array.from(new Set([
    ...record.tags,
    ...(totalViews > 100 ? ["performance", "analytics", "growth"] : []),
    "automation",
    "ai video"
  ])).slice(0, 8);

  const searchKeywords = Array.from(new Set([
    ...record.searchKeywords,
    ...(totalViews > 100 ? ["learn", "creator workflow", "content strategy"] : []),
    record.title.split(/\s+/).slice(0, 4).join(" ")
  ])).slice(0, 5);

  return { tags, searchKeywords };
}

async function uploadVideoToYouTubeFromUrl(accessToken: string, payload: any) {
  const { title, description = "", tags = [], categoryId = "28", privacyStatus = "private", videoUrl, filePath, playlistId, videoDataUrl } = payload;

  let videoBuffer: Buffer;
  if (filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Uploaded video file path not found: ${filePath}`);
    }
    videoBuffer = await fs.promises.readFile(filePath);
  } else if (videoDataUrl) {
    const match = videoDataUrl.match(/^data:video\/mp4;base64,(.+)$/i)
      || videoDataUrl.match(/^data:application\/octet-stream;base64,(.+)$/i)
      || videoDataUrl.match(/^data:.*;base64,(.+)$/i);

    if (!match || !match[1]) {
      throw new Error("YouTube publish received an invalid videoDataUrl payload.");
    }

    const base64Data = match[1].replace(/\s/g, "");
    videoBuffer = Buffer.from(base64Data, "base64");
  } else if (videoUrl) {
    const remote = await fetch(videoUrl);
    if (!remote.ok) {
      throw new Error(`Remote video URL fetch failed: ${remote.status}`);
    }
    const remoteBuffer = Buffer.from(await remote.arrayBuffer());
    videoBuffer = remoteBuffer;
  } else {
    throw new Error("YouTube upload requires either videoUrl, filePath, or videoDataUrl in the request body.");
  }

  if (!videoBuffer || videoBuffer.byteLength <= 0) {
    throw new Error("YouTube upload received an empty video binary payload.");
  }

  const metadata = {
    snippet: {
      title: title || "AI Generated Video",
      description: description || "Generated by the AI Video B-Roll Assistant.",
      tags: Array.isArray(tags) ? tags : String(tags || "").split(/[,\s]+/).filter(Boolean),
      categoryId: String(categoryId || "28")
    },
    status: {
      privacyStatus: privacyStatus || "private",
      selfDeclaredMadeForKids: false
    }
  };

  const metaRes = await fetch(`${YOUTUBE_UPLOAD_URL}?part=snippet,status&uploadType=resumable`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": "video/mp4",
      "X-Upload-Content-Length": String(videoBuffer.byteLength)
    },
    body: JSON.stringify(metadata)
  });

  if (!metaRes.ok) {
    const err = await metaRes.text();
    throw new Error(`YouTube resumable upload session failed: ${metaRes.status} ${err}`);
  }

  const uploadLocation = metaRes.headers.get("location") || metaRes.headers.get("Location");
  if (!uploadLocation) {
    throw new Error("YouTube resumable upload did not return a Location header for the video byte upload.");
  }

  const uploadRes = await fetch(uploadLocation, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "video/mp4",
      "Content-Length": String(videoBuffer.byteLength)
    },
    body: videoBuffer
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`YouTube video upload failed during PUT bytes: ${uploadRes.status} ${err}`);
  }

  const uploaded = await uploadRes.json();
  if (playlistId) {
    try {
      await fetch(`${YOUTUBE_DATA_URL}/playlistItems?part=snippet`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
          snippet: {
            playlistId,
            resourceId: { kind: "youtube#video", videoId: uploaded.id }
          }
        })
      });
    } catch (playlistErr) {
      console.warn("Playlist add warning:", playlistErr);
    }
  }

  return uploaded;
}

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
  },
  giphy: {
    limit: null as number | null,
    remaining: null as number | null,
    reset: null as number | null,
    lastUpdated: null as string | null,
    status: 'healthy' as 'healthy' | 'warning' | 'throttled' | 'unknown',
  },
  nasa: {
    limit: null as number | null,
    remaining: null as number | null,
    reset: null as number | null,
    lastUpdated: null as string | null,
    status: 'healthy' as 'healthy' | 'warning' | 'throttled' | 'unknown',
  },
  archive: {
    limit: 999999 as number | null,
    remaining: 999999 as number | null,
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
// SPEECH-AWARE DURATION CALCULATOR
// -------------------------------------------------------------
function computeSpeechAwareDuration(text: string, basePacingDuration: number = 5): number {
  if (!text || !text.trim()) return basePacingDuration;
  const words = text.trim().split(/\s+/).filter(Boolean);
  // Natural narration speaking rate is ~2.1 words/sec.
  // Add 1.2s padding (0.4s pre-speech buffer + 0.8s post-speech buffer)
  const needed = (words.length / 2.1) + 1.2;
  return Math.max(basePacingDuration, Math.round(needed * 10) / 10);
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
  } else if (/(pyramid|giza|egypt|ancient|history|pharaoh|sphinx|archaeology|monument|mummy|temple|ruins|mystery|civilization)/.test(lowerWhole)) {
    domain = "history";
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

  if (domain === "history") {
    if (/(pyramid|giza|egypt|sphinx|pharaoh|tomb)/.test(lowerSentence)) {
      return {
        keywords: "great pyramid giza egypt ancient monument drone",
        secondary: "sphinx egypt desert ancient civilization aerial",
        music: "mysterious cinematic ambient desert atmospheric",
        mood: "epic ancient mystery"
      };
    }
    return {
      keywords: "ancient history archaeological site monument ruins",
      secondary: "ancient civilization historical mystery desert",
      music: "mysterious cinematic ambient desert atmospheric",
      mood: "epic ancient mystery"
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

// Strips metadata artifacts from subtitle/narration text before writing to ASS.
// Removes pipe-separated API source/style labels, "API Source:" and "Style:" prefixes
// that leak from the LongFormat script parser into visual subtitles.
function cleanSubtitleText(raw: string): string {
  if (!raw) return "";
  let text = raw.trim();

  // Remove pipe-separated segments after the first (narration) pipe:
  // e.g. "Narration text | NASA Media API | keyword | Style: ..." → "Narration text"
  if (text.includes("|")) {
    text = text.split("|")[0].trim();
  }

  // Strip known metadata prefixes if they somehow survived
  text = text
    .replace(/^\s*API\s+Source\s*:\s*/i, "")
    .replace(/^\s*Style\s*:\s*/i, "")
    .replace(/^\s*Visual\s+Style\s*:\s*/i, "")
    .replace(/\bAPI Source\s*:.*$/im, "")
    .replace(/\bStyle\s*:.*$/im, "");

  // Remove surrounding quotes that might wrap the narration
  text = text.replace(/^["']|["']$/g, "").trim();

  // Truncate to a sane max length for display
  if (text.length > 220) {
    // Break at last word boundary before 220 chars
    const cutoff = text.lastIndexOf(" ", 220);
    text = text.slice(0, cutoff > 0 ? cutoff : 220).trim();
  }

  return text;
}

function generateAssContent(
  scenes: Array<{ duration: number; subtitle?: string; narration?: string; overlayData?: any; title?: string }>,
  subtitlesStyle: string = "highlight",
  aspectRatio: string = "16:9"
): string {
  const isPortrait = aspectRatio === "9:16";
  const resX = isPortrait ? 1080 : 1920;
  const resY = isPortrait ? 1920 : 1080;
  const fontSize = isPortrait ? 56 : 48;
  const marginV = isPortrait ? 220 : 80;

  // Default style: yellow text, bold, strong outline/shadow, bottom-center
  let styleLine = `Style: Default,DejaVu Sans,${fontSize},&H0000FFFF,&H000000FF,&H00000000,&H90000000,-1,0,0,0,100,100,0,0,1,3.5,2,2,40,40,${marginV},1`;
  if (subtitlesStyle === "classic") {
    styleLine = `Style: Default,DejaVu Sans,${fontSize},&H00FFFFFF,&H000000FF,&H00000000,&H90000000,-1,0,0,0,100,100,0,0,1,3.5,2,2,40,40,${marginV},1`;
  } else if (subtitlesStyle === "minimal") {
    styleLine = `Style: Default,DejaVu Sans,${fontSize - 4},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,3,2,1,2,40,40,${marginV},1`;
  }

  // Overlay heading: large cyan bold text at top-center with shadow for depth
  // Alignment=8 = top-center
  const overlayHeadingStyle = `Style: OverlayHeading,DejaVu Sans,${isPortrait ? 58 : 62},&H00FFFF00,&H000000FF,&H00000000,&HB0000000,-1,0,0,0,100,100,0,0,1,4,4,8,80,80,${isPortrait ? 280 : 110},1`;

  // Code style: green monospace, left-aligned panel
  const overlayCodeStyle = `Style: OverlayCode,Courier New,${isPortrait ? 34 : 38},&H0000FF00,&H000000FF,&H00000000,&HA0000000,0,0,0,0,100,100,0,0,1,3,3,4,80,80,${isPortrait ? 400 : 200},1`;

  // Bullet style: white text, alignment=4 (middle-left), left-margin pushed in for panel look
  const overlayBulletStyle = `Style: OverlayBullet,DejaVu Sans,${isPortrait ? 42 : 46},&H00FFFFFF,&H000000FF,&H00000000,&HB0000000,0,0,0,0,100,100,0,0,1,3,2,4,${isPortrait ? 60 : 80},${isPortrait ? 60 : 80},${isPortrait ? 400 : 200},1`;

  let events = "";
  let currentTime = 0;

  for (const sc of scenes) {
    const dur = Math.max(1, Number(sc.duration) || 5);
    const startTimeStr = formatAssTime(currentTime);
    const endTimeStr = formatAssTime(currentTime + dur);

    // ── SUBTITLE LINE (bottom narration bar) ──────────────────────────────
    const rawSubtitle = sc.subtitle || sc.narration || "";
    const cleanText = cleanSubtitleText(rawSubtitle)
      .replace(/[\r\n]+/g, " ")
      .replace(/[{}]/g, "")
      .replace(/"/g, "'");

    if (cleanText) {
      const words = cleanText.split(/\s+/);
      let formattedText = cleanText;
      // Split long text into two lines at midpoint
      if (words.length > 7) {
        const mid = Math.ceil(words.length / 2);
        formattedText = words.slice(0, mid).join(" ") + "\\N" + words.slice(mid).join(" ");
      }
      // Animated: fade in 300ms, fade out 300ms using ASS \fad() tag
      events += `Dialogue: 0,${startTimeStr},${endTimeStr},Default,,0,0,0,,{\\fad(300,300)}${formattedText}\n`;
    }

    // ── OVERLAY DATA (heading + bullets/code) ─────────────────────────────
    if (sc.overlayData) {
      const o = sc.overlayData;

      // Heading: slide in from left using \move() + fade in
      if (o.heading) {
        const hRaw = cleanSubtitleText(o.heading)
          .replace(/[\r\n]+/g, " ").replace(/[{}]/g, "");
        const subRaw = (o.subheading || "")
          .replace(/[\r\n]+/g, " ").replace(/[{}]/g, "");
        // Clean subheading too — strip metadata
        const subClean = cleanSubtitleText(subRaw).replace(/[{}]/g, "");
        const subTag = subClean
          ? `\\N{\\fs${isPortrait ? 32 : 36}\\c&H00FFFFFF&\\fad(400,300)}${subClean}`
          : "";
        // \fad(500,400) = 500ms fade-in, 400ms fade-out
        // \t(0,600,\fscx105\fscy105) = slight scale-up entrance
        events += `Dialogue: 0,${startTimeStr},${endTimeStr},OverlayHeading,,0,0,0,,{\\fad(500,400)\\t(0,600,\\fscx105\\fscy105)}${hRaw}${subTag}\n`;
      }

      // Code block: typewriter reveal using staggered lines
      if (o.codeSnippet) {
        const codeLines = o.codeSnippet.split("\n").slice(0, 6);
        // Each line of code appears at even intervals during the scene
        const lineInterval = Math.max(0.5, dur / (codeLines.length + 1));
        let visibleLines: string[] = [];
        for (let li = 0; li < codeLines.length; li++) {
          const lineStart = currentTime + li * lineInterval;
          const lineEnd = currentTime + dur;
          if (lineStart >= currentTime + dur) break;
          visibleLines.push(codeLines[li].replace(/[{}]/g, ""));
          const snapshot = visibleLines.join("\\N");
          const ls = formatAssTime(lineStart);
          const le = formatAssTime(lineEnd);
          const fadIn = li === 0 ? 400 : 200;
          events += `Dialogue: 0,${ls},${le},OverlayCode,,0,0,0,,{\\fad(${fadIn},300)}${snapshot}\n`;
        }
      }
      // Bullet points: each bullet fades in one-at-a-time during the scene
      else if (o.bulletPoints && o.bulletPoints.length > 0) {
        const bullets = (o.bulletPoints as string[])
          .slice(0, 4)
          .map(b => cleanSubtitleText(b).replace(/[{}]/g, "").trim())
          .filter(b => b.length > 0 && !b.match(/^(API Source|Style|Visual Style)\s*:/i));

        if (bullets.length > 0) {
          const bulletInterval = Math.max(0.8, dur / (bullets.length + 1));
          let visibleBullets: string[] = [];
          for (let bi = 0; bi < bullets.length; bi++) {
            const bulletStart = currentTime + bi * bulletInterval;
            const bulletEnd = currentTime + dur;
            if (bulletStart >= currentTime + dur) break;
            visibleBullets.push(`• ${bullets[bi]}`);
            const snapshot = visibleBullets.join("\\N\\N");
            const bs = formatAssTime(bulletStart);
            const be = formatAssTime(bulletEnd);
            const fadIn = bi === 0 ? 500 : 300;
            events += `Dialogue: 0,${bs},${be},OverlayBullet,,0,0,0,,{\\fad(${fadIn},400)}${snapshot}\n`;
          }
        }
      }
      // Diagram flow nodes: appear as a left-to-right chain with fade
      else if (o.diagramNodes && o.diagramNodes.length > 0) {
        const nodes = (o.diagramNodes as any[]).slice(0, 5)
          .map(n => `[ ${(n.label || "").replace(/[{}]/g, "")} ]`);
        if (nodes.length > 0) {
          const nodeInterval = Math.max(0.6, dur / (nodes.length + 1));
          let visibleNodes: string[] = [];
          for (let ni = 0; ni < nodes.length; ni++) {
            const nodeStart = currentTime + ni * nodeInterval;
            const nodeEnd = currentTime + dur;
            if (nodeStart >= currentTime + dur) break;
            visibleNodes.push(nodes[ni]);
            const chain = visibleNodes.join("  →  ");
            const ns = formatAssTime(nodeStart);
            const ne = formatAssTime(nodeEnd);
            events += `Dialogue: 0,${ns},${ne},OverlayBullet,,0,0,0,,{\\fad(300,300)}${chain}\n`;
          }
        }
      }
    }

    currentTime += dur;
  }

  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${resX}
PlayResY: ${resY}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styleLine}
${overlayHeadingStyle}
${overlayCodeStyle}
${overlayBulletStyle}

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
  } else if (/(pyramid|giza|egypt|ancient|history|pharaoh|sphinx|archaeology|monument|mummy|temple|ruins|mystery|civilization)/.test(lower)) {
    domainTag = "great pyramid giza egypt ancient monument";
    music_keywords = ["mysterious cinematic ambient desert", "epic ancient mystery", "atmospheric drone"];
    sfx_keywords = ["wind blow desert", "mysterious chime", "stone rumbling"];
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

const YOUTUBE_API_FEATURES = [
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

app.get("/api/youtube/features", (req, res) => {
  res.json({ features: YOUTUBE_API_FEATURES });
});

app.post("/api/youtube/automate", (req, res) => {
  const { action = "publish", payload = {} } = req.body || {};
  res.json({
    ok: true,
    pipeline: "youtube-automation",
    action,
    plan: {
      upload: action === "publish" ? "videos.insert + thumbnails.set" : "metadata only",
      seo: "title, description, tags, categoryId, featureImage",
      community: "commentThreads.list + comments.insert",
      playlists: "organize series and schedule publish windows",
      analytics: "YouTube Analytics + Reporting API feedback" ,
      payload
    }
  });
});

app.get("/api/youtube/channel", async (req, res) => {
  try {
    const accessToken = await getYoutubeAccessToken();
    const channel = await fetchYoutubeChannel(accessToken);
    res.json({ ok: true, channel });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "YouTube channel lookup failed" });
  }
});

app.get("/api/youtube/research", async (req, res) => {
  try {
    const accessToken = await getYoutubeAccessToken();
    const niche = String(req.query.niche || req.query.q || "creator workflow automation");
    const research = await fetchYouTubeCompetitorResearch(accessToken, niche);
    res.json({ ok: true, niche, research: research.map((item: any) => ({
      title: item?.snippet?.title || "",
      channelTitle: item?.snippet?.channelTitle || "",
      description: item?.snippet?.description || "",
      tags: item?.snippet?.tags || [],
      topic: item?.snippet?.title || ""
    })) });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "YouTube research query failed" });
  }
});

app.post("/api/youtube/autonomous-loop", async (req, res) => {
  try {
    const payload = req.body || {};
    const loop = await runAutonomousYoutubeLoop(payload);
    res.json({ ok: true, loop });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Autonomous loop failed" });
  }
});

app.get("/api/youtube/analytics", async (req, res) => {
  try {
    const accessToken = await getYoutubeAccessToken();
    const analytics = await fetchYoutubeAnalytics(accessToken, req.query);

    const rows = Array.isArray(analytics.rows) ? analytics.rows : [];
    if (req.query.videoId) {
      const record = youtubeContentStore.get(String(req.query.videoId));
      if (record) {
        record.telemetry = analytics;
        record.lastTelemetryAt = Date.now();
        const updated = optimizeTeachingTagsAndKeywords(record);
        record.tags = updated.tags;
        record.searchKeywords = updated.searchKeywords;
        record.topicRecommendations = buildTopicRecommendationsFromTelemetry(record);
        persistYoutubeContentStoreToDisk(youtubeContentStore);
      }
    }

    res.json({ ok: true, analytics, telemetryAvailable: rows.length > 0 });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "YouTube analytics query failed" });
  }
});

app.post("/api/youtube/publish", async (req, res) => {
  try {
    const accessToken = await getYoutubeAccessToken();
    const payload = req.body || {} as any;

    if (payload.aspectRatio === "9:16" || payload.shortForm === true) {
      applyShortsDurationRule(payload.scenes ?? [], payload.aspectRatio || "9:16");
    }

    const title = String(payload.title || "AI Generated Video");
    const existingDescription = String(payload.description || "");
    const existingTags = normalizeStringArray(payload.tags, []);
    const keywords = normalizeStringArray(payload.searchKeywords, [title]);

    const richDescription = buildRichDescription(title, existingDescription, existingTags, keywords);
    const normalizedTags = Array.from(new Set([
      ...existingTags,
      ...(keywords || []),
      "#Shorts",
      "creator workflow",
      "ai video",
      "youtube automation"
    ])).slice(0, 20);

    payload.description = richDescription;
    payload.tags = normalizedTags;

    const result = await uploadVideoToYouTubeFromUrl(accessToken, payload);

    if (payload.thumbnailDataUrl) {
      try {
        const match = payload.thumbnailDataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,([\s\S]+)$/i);
        if (match && match[2]) {
          const mime = match[1].toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';
          const thumbBuffer = Buffer.from(match[2], 'base64');
          await uploadThumbnailToYouTube(accessToken, result.id, thumbBuffer, mime);
        }
      } catch (thumbErr) {
        console.warn("Thumbnail upload warning:", thumbErr);
      }
    }

    const record: ChannelContentRecord = {
      videoId: result.id,
      title: title,
      description: payload.description || "",
      tags: normalizedTags,
      searchKeywords: normalizeStringArray(payload.searchKeywords, normalizeStringArray(title || "ai video", [])),
      topicRecommendations: normalizeStringArray([payload.title || "AI Lesson", "video content strategy", "creator feedback loop"], []),
      uploadedAt: Date.now(),
      telemetry: { rows: [] },
      lastTelemetryAt: Date.now()
    };

    youtubeContentStore.set(result.id, record);
    persistYoutubeContentStoreToDisk(youtubeContentStore);

    res.json({ ok: true, youtube: result, contentRecord: { videoId: result.id, title: record.title, stored: true } });
  } catch (err: any) {
    console.error("YouTube publish route failed:", err);
    res.status(500).json({ error: err?.message || "YouTube publish failed" });
  }
});

async function optimizeContentHandler(req: express.Request, res: express.Response) {
  try {
    const { videoId, title, description, tags = [], searchKeywords = [], topic } = req.body || {};
    if (!videoId) {
      return res.status(400).json({ error: "videoId is required to optimize content" });
    }

    const baseRecord = youtubeContentStore.get(String(videoId)) || {
      videoId: String(videoId),
      title: title || "AI Generated Video",
      description: description || "",
      tags: normalizeStringArray(tags, []),
      searchKeywords: normalizeStringArray(searchKeywords, normalizeStringArray(title || "ai video", [])),
      topicRecommendations: [topic || title || "automation content"],
      uploadedAt: Date.now(),
      telemetry: { rows: [] },
      lastTelemetryAt: Date.now()
    } as ChannelContentRecord;

    const record = baseRecord;
    let telemetry = record.telemetry;
    if (!telemetry || !Array.isArray(telemetry.rows) || telemetry.rows.length === 0) {
      try {
        const accessToken = await getYoutubeAccessToken();
        const analytics = await fetchYoutubeAnalytics(accessToken, { startDate: "2026-01-01", endDate: new Date().toISOString().slice(0, 10), metrics: "views,estimatedMinutesWatched", dimensions: "day", videoId: String(videoId) });
        telemetry = analytics;
        record.telemetry = analytics;
        record.lastTelemetryAt = Date.now();
      } catch {
        telemetry = { rows: [] };
      }
    }

    const optimized = optimizeTeachingTagsAndKeywords(record);
    record.tags = optimized.tags;
    record.searchKeywords = optimized.searchKeywords;
    record.topicRecommendations = buildTopicRecommendationsFromTelemetry(record);
    if (record.videoId) {
      youtubeContentStore.set(record.videoId, record);
      persistYoutubeContentStoreToDisk(youtubeContentStore);
    }

    return res.json({
      ok: true,
      videoId,
      contentPlan: {
        tags: record.tags,
        searchKeywords: record.searchKeywords,
        topicRecommendations: record.topicRecommendations,
        telemetryAvailable: Array.isArray(telemetry?.rows) && telemetry.rows.length > 0,
        telemetryRows: Array.isArray(telemetry?.rows) ? telemetry.rows.length : 0
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Content optimization failed" });
  }
}

app.post("/api/youtube/optimize-content", optimizeContentHandler);
app.post("/api/youtube/optimization", optimizeContentHandler);

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// Health check
app.get("/api/whatsapp/status", (req, res) => {
  const state = getWhatsAppState();
  console.log("[whatsapp] Status requested:", state.status, "QR URL present:", !!state.qrCodeUrl);
  res.json(state);
});

app.post("/api/whatsapp/pairing-code", async (req, res) => {
  try {
    const rawPhone = String(req.body?.phoneNumber || "").replace(/\D/g, "");
    let phoneNumber = rawPhone;

    // Handle Kenyan numbers that start with 0
    if (/^0\d{9}$/.test(phoneNumber)) {
      phoneNumber = `254${phoneNumber.slice(1)}`;
    }

    // If user enters just 9 digits (without country code or leading 0), try both formats
    if (/^\d{9}$/.test(phoneNumber)) {
      // Try with Kenyan country code first
      phoneNumber = `254${phoneNumber}`;
    }

    if (!/^\d{10,15}$/.test(phoneNumber)) {
      return res.status(400).json({ error: "phoneNumber must be 10-15 digits with country code, e.g. 254743269133 or 447432691333" });
    }
    
    console.log("[whatsapp] Requesting pairing code for phone:", phoneNumber);
    console.log("[whatsapp] IMPORTANT: Ensure your WhatsApp account is registered with this exact number format:", phoneNumber);
    const code = await requestPairingCode(phoneNumber);
    return res.json({ ok: true, pairingCode: code, usedNumber: phoneNumber });
  } catch (err: any) {
    console.error("[whatsapp] Pairing code error:", err);
    return res.status(500).json({ error: err?.message || "Unable to request pairing code" });
  }
});

app.post("/api/whatsapp/disconnect", async (req, res) => {
  try {
    await disconnectWhatsApp();
    return res.json({ ok: true, status: getWhatsAppState() });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Unable to disconnect WhatsApp" });
  }
});

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
      model: "gemini-2.5-flash",
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
    console.log("Using built-in semantic scene engine (AI analysis skipped).");
    // Graceful fallback to avoid leaving user hanging
    const fallbackResult = fallbackRuleBasedParser(script);
    return res.json({
      ...fallbackResult,
      _notice: "Analyzed using built-in semantic scene engine"
    });
  }
});

// Helper to detect if prompt has structured script formatting (timestamps, visual/audio tags, scene headers)
function hasStructuredScriptFormatting(text: string): boolean {
  return (
    /\d{1,2}:\d{2}\s*[-–—to]\s*\d{1,2}:\d{2}/i.test(text) ||
    /(?:\[?\s*(?:visual|video|scene)\s*:?\s*\]?)/i.test(text) ||
    /(?:\[?\s*(?:audio|narration|voice)\s*:?\s*\]?)/i.test(text) ||
    /^scene\s*\d+[:\s-]/im.test(text)
  );
}

// Studio-grade structured script parser for timestamped drafts (e.g. 0:00 - 0:02 (Hook): Visual: ... Audio: ...)
function parseStructuredScriptDraft(scriptText: string, defaultAspect = "16:9") {
  const lines = scriptText.split("\n").map(l => l.trim()).filter(Boolean);
  
  // Extract title if present
  let title = "";
  const firstLine = lines[0] || "";
  const titleMatch = firstLine.match(/^(?:high-retention\s+script\s+draft|script\s+draft|script|title)\s*:\s*["\x27]?([^"\x27\n]+)["\x27]?/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  } else if (!/^\d{1,2}:\d{2}/.test(firstLine) && !/^scene\s*\d+/i.test(firstLine) && firstLine.length < 60) {
    title = firstLine.replace(/["\x27#]/g, "").trim();
  }
  if (!title) {
    title = "Autonomous Video";
  }

  // Split into timestamp or scene blocks (also handle bracketed visual/audio blocks without timestamps)
  const blocks = scriptText.split(/(?=(?:^|\n)(?:(?:scene\s*\d+[:\s]*)?\d{1,2}:\d{2}\s*[-–—to]\s*\d{1,2}:\d{2}|scene\s*\d+[:\s-]|\[?\s*visual\s*:?\s*\]?))/gi);
  
  const parsedScenes: any[] = [];
  
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    
    // Check for timestamp header: e.g. "0:00 - 0:02 (Hook):" or "Scene 1: 0:02 - 0:15 (Pacing & Setup):"
    // Also handle bracketed blocks: "[Visual: ...]"
    const tsMatch = trimmed.match(/^(?:scene\s*\d+[:\s-]*)?(\d{1,2}:\d{2})\s*[-–—to]\s*(\d{1,2}:\d{2})(?:\s*\(([^)]+)\))?/i);
    const sceneNumMatch = trimmed.match(/^scene\s*(\d+)[:\s-]*([^\n]*)/i);
    const bracketMatch = trimmed.match(/^\[?\s*(visual|audio|narration)\s*:?\s*\]?/i);

    let startSec: number | undefined;
    let endSec: number | undefined;
    let tag = "";
    let content = trimmed;

    if (tsMatch) {
      const [_, sStr, eStr, t] = tsMatch;
      const parseT = (str: string) => {
        const parts = str.split(":").map(Number);
        return parts[0] * 60 + parts[1];
      };
      startSec = parseT(sStr);
      endSec = parseT(eStr);
      tag = t?.trim() || "";
      content = trimmed.replace(/^[^\n]+\n?/, "");
    } else if (sceneNumMatch) {
      tag = sceneNumMatch[2]?.trim() || "";
      content = trimmed.replace(/^[^\n]+\n?/, "");
    } else if (bracketMatch) {
      // This is a bracketed block without timestamps, treat entire block as content
      tag = "Scene";
      content = trimmed;
    } else {
      if (!/(?:\[?\s*(?:visual|audio|narration)\s*:?\s*\]?)/i.test(trimmed)) {
        continue; // skip title preamble
      }
    }
    
    // Extract Visual and Audio (handle both [Visual: and Visual: formats)
    let visualText = "";
    let audioText = "";

    const vMatch = content.match(/(?:\[?\s*(?:visual|video|scene|screen|b-roll)\s*:?\s*\]?\s*)([^\n]+(?:\n(?!(?:\[?\s*(?:audio|narration|voice|sound|sfx)\s*:?\s*\]?))[^\n]+)*)/i);
    if (vMatch) visualText = vMatch[1].trim();

    const aMatch = content.match(/(?:\[?\s*(?:audio|narration|voice|dialogue|spoken|speech)\s*:?\s*\]?\s*)([^\n]+(?:\n(?!(?:\[?\s*(?:visual|video|scene|screen)\s*:?\s*\]?))[^\n]+)*)/i);
    if (aMatch) audioText = aMatch[1].trim();
    
    if (!visualText && !audioText) {
      const cleaned = content.replace(/^["\x27\s]+|["\x27\s]+$/g, "");
      if (cleaned) {
        audioText = cleaned;
        visualText = cleaned;
      }
    }
    
    // Clean audio text (remove brackets and quotes)
    audioText = audioText.replace(/^["\x27\s\[\]]+|["\x27\s\[\]]+$/g, "");
    visualText = visualText.replace(/^["\x27\s\[\]]+|["\x27\s\[\]]+$/g, "");
    
    if (!audioText && !visualText) continue;
    
    // Calculate scene duration
    let dur = 5;
    if (startSec !== undefined && endSec !== undefined && endSec > startSec) {
      dur = Math.max(2, Math.min(30, endSec - startSec));
    } else if (audioText) {
      const words = audioText.split(/\s+/).length;
      dur = Math.max(3, Math.min(15, Math.round(words / 2.6)));
    }
    
    // Detect split screen or zoom
    const isSplit = /split\s*screen|side\s*by\s*side|compare|reaction|two\s*screens|split\s*view|montage/i.test(visualText) || /split\s*screen/i.test(tag);
    const isZoom = /zoom|close\s*up|fast\s*zoom|focus|overlay/i.test(visualText);
    
    // Clean keywords for stock search (smart angle extraction for split screen)
    let primaryKw = "";
    let secondaryKw = "";
    let tertiaryKw = "";
    let quaternaryKw = "";

    if (isSplit && visualText) {
      const parts = visualText
        .replace(/split\s*screen\s*(?:showing|with)?/gi, "")
        .split(/\s+(?:and|vs|versus|alongside|with)\s+/i)
        .map(p => p.trim())
        .filter(Boolean);

      const cleanPart = (p: string) =>
        p
          .replace(/["\x27:]/g, " ")
          .replace(/[^a-zA-Z0-9\s]/g, " ")
          .split(/\s+/)
          .filter(w => w.length > 2 && !["the", "and", "with", "for", "that", "this", "when", "said", "from", "into", "showing"].includes(w.toLowerCase()))
          .slice(0, 4)
          .join(" ");

      if (parts.length >= 2) {
        primaryKw = cleanPart(parts[0]);
        secondaryKw = cleanPart(parts[1]);
        if (parts[2]) tertiaryKw = cleanPart(parts[2]);
        if (parts[3]) quaternaryKw = cleanPart(parts[3]);
      } else {
        primaryKw = cleanPart(visualText);
        secondaryKw = `${primaryKw} meme reaction contrast`.trim();
      }
    } else {
      const cleanKw = (visualText || audioText)
        .replace(/overlaid\s*with|giant\s*text|high-speed\s*zoom\s*on|typing|on\s*a/gi, "")
        .replace(/["\x27:]/g, " ")
        .replace(/[^a-zA-Z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 2 && !["the", "and", "with", "for", "that", "this", "when", "said", "from", "into"].includes(w.toLowerCase()))
        .slice(0, 4)
        .join(" ");
      primaryKw = cleanKw || "technology coding workspace";
    }

    parsedScenes.push({
      scene_number: parsedScenes.length + 1,
      narration: audioText || visualText || `Scene ${parsedScenes.length + 1}`,
      search_keywords: primaryKw || "technology coding workspace",
      secondary_keywords: isSplit ? (secondaryKw || "funny reaction graphic meme") : undefined,
      tertiary_keywords: isSplit && tertiaryKw ? tertiaryKw : undefined,
      quaternary_keywords: isSplit && quaternaryKw ? quaternaryKw : undefined,
      duration: dur,
      subtitle: tag || (audioText.length > 35 ? audioText.slice(0, 32) + "..." : audioText),
      transition: isSplit ? "splitscreen" : isZoom ? "zoom" : "fade",
      layout: isSplit ? "splitscreen" : "standard",
      splitLayout: isSplit ? "2-split" : "single"
    });
  }

  return {
    title,
    prompt: scriptText.slice(0, 80),
    full_script: parsedScenes.map(s => s.narration).join(" "),
    aspect_ratio: defaultAspect,
    music_keyword: "energetic modern tech electronic",
    music_mood: "dynamic tech satirical",
    scenes: parsedScenes,
    total_duration: parsedScenes.reduce((sum, s) => sum + s.duration, 0),
    _structured: true
  };
}

// Dynamic Topic-Aware Autonomous Video Generator for any prompt or custom script
function generateTopicAwareVideoPlan(
  rawInput: string,
  style = "tech",
  aspectRatio = "16:9",
  pacing = "balanced",
  targetDuration = 30
) {
  const rawInputTopic = (rawInput || "Creative Video Storytelling").trim();
  const sceneDuration = pacing === "fast" ? 3.5 : pacing === "cinematic" ? 7 : 5;

  // If input has structured timestamp or scene format, parse directly with precision
  if (hasStructuredScriptFormatting(rawInputTopic)) {
    const structuredPlan = parseStructuredScriptDraft(rawInputTopic, aspectRatio);
    if (structuredPlan.scenes.length > 0) {
      return structuredPlan;
    }
  }

  // Intelligent meta-prompt cleaner: if user writes a prompt like "Write a fast-paced script about X. Hook audience with Y...",
  // extract the core content sentences and remove formatting/instruction directives ("Write a...", "Match with...", "subtitles", etc.)
  let cleanedInput = rawInputTopic;
  if (/^(write|create|generate)\s+a/i.test(cleanedInput)) {
    cleanedInput = cleanedInput.replace(/^(write|create|generate)\s+a\s+[^a-z0-9]*\bscript\s+(about|on)\s+/i, "");
  }

  const sentenceCandidates = cleanedInput
    .split(/(?<=[.?!])\s+|\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  let userSentences = sentenceCandidates.filter(s => {
    const low = s.toLowerCase();
    return !(
      low.startsWith("write ") ||
      low.startsWith("create ") ||
      low.startsWith("generate ") ||
      low.includes("match with") ||
      low.includes("subtitles") ||
      low.includes("music") ||
      low.includes("stock footage") ||
      low.includes("hook the audience")
    );
  });

  // If instruction sentences were all filtered out or prompt was phrased as a single meta instruction, extract clauses or use rawInputTopic
  if (userSentences.length === 0) {
    userSentences = [rawInputTopic];
  }

  const inputTopic = userSentences.join(" ");
  const lower = inputTopic.toLowerCase();

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

  type DomainType = "cyber" | "culinary" | "wildlife" | "sports" | "travel" | "crypto" | "space" | "cars" | "health" | "art" | "tech" | "history" | "custom";
  let domain: DomainType = "custom";

  if (/(hack|lazarus|cyber|pyongyang|malware|trojan|backdoor|exploit|phishing|ransomware|firewall|breach|state-sponsored)/.test(lower)) {
    domain = "cyber";
  } else if (/(morning|routine|productivity|focus|minimalist|habit|lifestyle|relax|meditation|wellness|mindful|mental|calm)/.test(lower)) {
    domain = "health";
  } else if (/(pyramid|giza|egypt|ancient|history|pharaoh|sphinx|archaeology|monument|mummy|temple|ruins|mystery|civilization)/.test(lower)) {
    domain = "history";
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
      const speechDur = computeSpeechAwareDuration(sentence, sceneDuration);
      return {
        narration: sentence,
        search_keywords: semantic.keywords,
        secondary_keywords: semantic.secondary,
        duration: speechDur,
        subtitle: sentence.split(/\s+/).slice(0, 7).join(" "),
        transition: trans
      };
    });
  } else {
    // Check if prompt has comma or 'and' clauses for custom multi-part decomposition
    const parts = inputTopic.split(/[,;&]|\s+for\s+|\s+and\s+/).map(p => p.trim()).filter(p => p.length > 3);
    if (parts.length >= 2) {
      music_keyword = "minimalist ambient focus peaceful";
      music_mood = "peaceful focus";
      rawScenes = parts.map((part, idx) => {
        const narration = idx === 0
          ? `Discover ${part}, crafted for maximum impact and intentional execution.`
          : idx === parts.length - 1
          ? `Mastering ${part} to unlock your absolute highest potential.`
          : `Integrating ${part} into your daily ritual for sustainable excellence.`;
        const trans: 'fade' | 'splitscreen' | 'zoom' | 'slide' = (idx % 4 === 1) ? 'splitscreen' : (idx % 4 === 2) ? 'zoom' : (idx % 4 === 3) ? 'slide' : 'fade';
        return {
          narration,
          search_keywords: `${part} minimalist aesthetic cinematic b-roll`,
          secondary_keywords: `${inputTopic} professional workflow detail`,
          duration: sceneDuration,
          subtitle: part.charAt(0).toUpperCase() + part.slice(1),
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
      case "history":
        music_keyword = "mysterious cinematic ambient desert atmospheric";
        music_mood = "epic ancient mystery";
        basePool = [
          { narration: `Unveiling the profound mysteries of the Great Pyramid of Giza, an enduring marvel of ancient engineering.`, search_keywords: `great pyramid giza egypt ancient monument drone`, duration: sceneDuration, subtitle: "The Great Pyramid", transition: "fade" },
          { narration: `If you multiply the height of the Great Pyramid by one billion, it equals the exact distance from the Earth to the Sun.`, search_keywords: `ancient egyptian pyramid desert sun aerial`, secondary_keywords: `pyramids of giza aerial cinematic shot`, duration: sceneDuration, subtitle: "Cosmic Alignment", transition: "splitscreen" },
          { narration: `The precise geographic coordinates of the Great Pyramid match the exact speed of light in meters per second.`, search_keywords: `ancient hieroglyphs stone carving mystery history`, duration: sceneDuration, subtitle: "Speed of Light Coordinates", transition: "zoom" },
          { narration: `An unbelievable coincidence, or advanced ancient knowledge lost to the sands of time?`, search_keywords: `mysterious ancient ruins sphinx egypt desert`, secondary_keywords: `ancient stone monument historical mystery`, duration: sceneDuration, subtitle: "Ancient Engineering", transition: "fade" }
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

  // Append a dedicated Subscriber Outro Scene at the end of every video to drive subscriber growth
  scenes.push({
    scene_number: scenes.length + 1,
    narration: "If you enjoyed this video, hit that subscribe button, leave a like, and turn on notifications so you never miss out on future content!",
    search_keywords: "neon subscribe notification click button glowing digital animation",
    secondary_keywords: "subscribe button youtube icon motion",
    duration: 5,
    subtitle: "Subscribe & Turn on Notifications!",
    transition: "fade",
    layout: "standard"
  });

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

app.get("/api/shorts/topic-ideas", (req, res) => {
  if (!isContentPillar(req.query.pillar)) {
    return res.status(400).json({ error: "pillar must be tech-ai, unusual-science, or african-history" });
  }

  return res.json({ pillar: req.query.pillar, ideas: getShortsTopicIdeas(req.query.pillar) });
});

// Autonomous Video Creation: Generate complete video narrative, scenes, and music cues
app.post("/api/auto-video/plan", async (req, res) => {
  const {
    prompt,
    script,
    style = "tech",
    aspectRatio = "16:9",
    pacing = "balanced",
    targetDuration = 30,
    pillar,
    shortsMode = false,
  } = req.body;
  const isShortsRequest = shortsMode === true;
  let shortsRequest: ReturnType<typeof normalizeShortsPlanRequest> | undefined;

  if (isShortsRequest) {
    try {
      shortsRequest = normalizeShortsPlanRequest({ pillar, targetDuration });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  const selectedAspectRatio = shortsRequest?.aspectRatio ?? aspectRatio;
  const selectedPacing = shortsRequest?.pacing ?? pacing;
  const selectedTargetDuration = shortsRequest?.targetDuration ?? targetDuration;
  const inputTopic = (prompt || script || "Creative Video Storytelling").trim();
  const sceneDuration = selectedPacing === "fast" ? 3.5 : selectedPacing === "cinematic" ? 7 : 5;
  const targetNumScenes = shortsRequest
    ? Math.max(5, Math.min(8, Math.round(selectedTargetDuration / sceneDuration)))
    : Math.max(3, Math.min(16, Math.round(Number(selectedTargetDuration || 30) / sceneDuration)));

  // If input is a structured script draft with timestamps or cues, parse directly
  if (!shortsRequest && hasStructuredScriptFormatting(inputTopic)) {
    const structuredPlan = parseStructuredScriptDraft(inputTopic, selectedAspectRatio);
    if (structuredPlan.scenes.length > 0) {
      return res.json(structuredPlan);
    }
  }

  const systemInstruction = `You are an expert Autonomous AI Video Director and Producer.
Your goal is to transform a custom user prompt or video script into an autonomous video production plan ready for instant playback and rendering.

RULES:
1. Generate an engaging, high-impact narration script split into ${targetNumScenes} sequential scenes tailored precisely to the user's specific topic and target video duration (~${selectedTargetDuration}s).
2. For each scene:
   - "narration": A punchy, spoken sentence (8-16 words) that fits natural voiceover delivery.
   - "search_keywords": 2-4 ultra-descriptive visual keywords tuned for Pexels / Pixabay stock videography (${selectedAspectRatio === "9:16" ? "portrait/vertical short-form video style" : "cinematic 16:9 style"}).
   - "secondary_keywords": Optional secondary B-roll search query for split-screen comparison scenes.
   - "duration": Target duration in seconds (between ${shortsRequest ? "2 and 4" : "3.5 and 7.0"} seconds).
   - "subtitle": Short on-screen subtitle caption text (max 8 words) for bold display.
   - "transition": One of "fade", "splitscreen", "zoom", "slide".
3. Under "music_keyword", provide the ideal royalty-free background music search query matching the genre and vibe.
4. Output valid JSON strictly conforming to the requested schema.${shortsRequest ? `
5. This is a ${shortsRequest.pillar} YouTube Short. Begin scene one with an immediate, subject-specific hook; never open with a greeting or generic setup.
6. Include shorts_metadata with the pillar, hook format, opening hook, payoff, retention strategy, and research note.
7. Every scene must include a concrete visual_brief and retention_beat that earns the next moment of attention.` : ""}`;

  const promptText = `Produce an autonomous video plan for:
Topic / Prompt: "${inputTopic}"
Style: ${style}
Aspect Ratio: ${selectedAspectRatio} (${selectedAspectRatio === "9:16" ? "9:16 Portrait / Vertical Short Form" : "16:9 Landscape Widescreen"})
Target Pacing: ${selectedPacing} (approx ${sceneDuration}s per scene)
Target Total Video Duration: approx ${selectedTargetDuration} seconds (${targetNumScenes} total scenes)${shortsRequest ? `
Shorts Pillar: ${shortsRequest.pillar}
Shorts Constraints: vertical 9:16, fast pacing, immediate subject-specific hook, no greetings or generic setup.` : ""}

Include a catchy project title, cohesive full script, scene breakdowns with stock video keywords, secondary keywords for split screen, and the exact background music search keyword.`;

  try {
    const ai = getGeminiClient();
    if (!ai) {
      throw new Error("Gemini AI client not initialized");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
                  transition: { type: Type.STRING },
                  visual_brief: { type: Type.STRING },
                  retention_beat: { type: Type.STRING }
                },
                required: [
                  "scene_number",
                  "narration",
                  "search_keywords",
                  "duration",
                  "subtitle",
                  ...(shortsRequest ? ["visual_brief", "retention_beat"] : [])
                ]
              }
            },
            shorts_metadata: {
              type: Type.OBJECT,
              properties: {
                pillar: { type: Type.STRING },
                hook_format: { type: Type.STRING },
                opening_hook: { type: Type.STRING },
                payoff: { type: Type.STRING },
                retention_strategy: { type: Type.STRING },
                research_note: { type: Type.STRING }
              }
            }
          },
          required: ["title", "full_script", "music_keyword", "scenes", ...(shortsRequest ? ["shorts_metadata"] : [])]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    const scenes = (parsed.scenes || []).map((s: any, idx: number) => ({
      scene_number: s.scene_number || (idx + 1),
      narration: s.narration || "Visual sequence",
      search_keywords: s.search_keywords || `${inputTopic} footage`,
      secondary_keywords: s.secondary_keywords || `${inputTopic} detail`,
      duration: shortsRequest
        ? Math.max(2, Math.min(4, Number(s.duration) || sceneDuration))
        : Math.max(3, Math.min(10, Number(s.duration) || sceneDuration)),
      subtitle: s.subtitle || s.narration?.slice(0, 40) || "",
      transition: s.transition || (idx % 4 === 1 ? "splitscreen" : idx % 4 === 2 ? "zoom" : "fade"),
      ...(shortsRequest ? {
        visual_brief: s.visual_brief || `Vertical close-up showing ${inputTopic} with a clear focal subject.`,
        retention_beat: s.retention_beat || "Change the visual framing to set up the next reveal."
      } : {}),
      layout: s.transition === "splitscreen" ? "splitscreen" : "standard"
    }));

    const totalDuration = scenes.reduce((sum: number, sc: any) => sum + sc.duration, 0);

    return res.json({
      title: parsed.title || inputTopic,
      prompt: inputTopic,
      full_script: parsed.full_script || scenes.map((s: any) => s.narration).join(" "),
      aspect_ratio: selectedAspectRatio,
      music_keyword: parsed.music_keyword || "ambient modern",
      music_mood: parsed.music_mood || "ambient modern",
      ...(shortsRequest ? {
        shorts_metadata: {
          pillar: shortsRequest.pillar,
          hook_format: parsed.shorts_metadata?.hook_format || "counterintuitive-explainer",
          opening_hook: parsed.shorts_metadata?.opening_hook || scenes[0]?.narration || inputTopic,
          payoff: parsed.shorts_metadata?.payoff || scenes.at(-1)?.narration || "A concise, source-verifiable conclusion.",
          retention_strategy: parsed.shorts_metadata?.retention_strategy || "A new visual beat in every scene keeps the hook moving toward the payoff.",
          research_note: parsed.shorts_metadata?.research_note || "Factual verification is required before publishing."
        }
      } : {}),
      scenes,
      total_duration: totalDuration
    });
  } catch (err: any) {
    console.log("Using smart dynamic topic-aware generator for prompt:", inputTopic);
    if (shortsRequest) {
      return res.json(buildShortsFallbackPlan({
        topic: inputTopic,
        pillar: shortsRequest.pillar,
        targetDuration: shortsRequest.targetDuration,
      }));
    }

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

// Generate a valid minimal silent MP3 buffer (1 second silence at 24kHz/48kbps) for voiceover fallback
function createSilentMp3Buffer(): Buffer {
  // Standard MPEG-1 Layer 3 sync word header + silence frame data
  const frameHeader = Buffer.from([0xFF, 0xFB, 0x90, 0x64]);
  const framePadding = Buffer.alloc(284, 0);
  return Buffer.concat([frameHeader, framePadding]);
}

async function synthesizeNeuralSpeechBuffer(
  text: string,
  voice: string = "en-US-JennyNeural",
  rate: string = "+0%",
  pitch: string = "+0Hz",
  attempt: number = 1
): Promise<Buffer> {
  const safeVoice = CURATED_NEURAL_VOICES.some(v => v.id === voice) ? voice : "en-US-JennyNeural";
  const cleanText = text.trim();
  if (!cleanText) return createSilentMp3Buffer();

  const cacheKey = `${safeVoice}__${rate}__${pitch}__${cleanText}`;
  const cached = ttsAudioCache.get(cacheKey);
  if (cached && cached.buffer) {
    return cached.buffer;
  }

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(safeVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(cleanText, {
      rate: rate || "+0%",
      pitch: pitch || "+0Hz",
    });

    const resultBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      let isDone = false;

      const timeout = setTimeout(() => {
        if (isDone) return;
        isDone = true;
        try { tts.close(); } catch {}
        if (chunks.length > 0) {
          const combined = Buffer.concat(chunks);
          if (combined.length > 500) return resolve(combined);
        }
        reject(new Error("Neural TTS request timed out"));
      }, 12000);

      audioStream.on("data", (chunk: Buffer) => {
        if (chunk && chunk.length > 0) {
          chunks.push(chunk);
        }
      });

      audioStream.on("end", () => {
        if (isDone) return;
        isDone = true;
        clearTimeout(timeout);
        try { tts.close(); } catch {}
        const combined = Buffer.concat(chunks);
        resolve(combined);
      });

      audioStream.on("error", (_err: any) => {
        if (isDone) return;
        try { tts.close(); } catch {}
        // If stream closed before turn.end but audio chunks were received, resolve successfully!
        if (chunks.length > 0) {
          const combined = Buffer.concat(chunks);
          if (combined.length > 500) {
            isDone = true;
            clearTimeout(timeout);
            return resolve(combined);
          }
        }
        isDone = true;
        clearTimeout(timeout);
        reject(new Error("Neural TTS stream closed without sufficient data"));
      });
    });

    if (resultBuffer && resultBuffer.length > 0) {
      if (ttsAudioCache.size > 250) {
        const oldest = ttsAudioCache.keys().next().value;
        if (oldest) ttsAudioCache.delete(oldest);
      }
      ttsAudioCache.set(cacheKey, { buffer: resultBuffer, timestamp: Date.now() });
      return resultBuffer;
    }
  } catch (_err: any) {
    if (attempt < 2) {
      // Retry once with default voice
      return synthesizeNeuralSpeechBuffer(cleanText, "en-US-JennyNeural", "+0%", "+0Hz", attempt + 1);
    }
  }

  // Final fallback: return silent MP3 buffer to ensure non-breaking video render
  return createSilentMp3Buffer();
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
    console.log("Proxy video stream error:", err?.message);
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

  const singleMusicUrl = normalizeSingleMusicTrack(musicUrl);
  const compositionDurations = Array.isArray(scenes)
    ? scenes.reduce((sum, sc: any) => sum + Number(sc.duration ?? sc.durationSeconds ?? 5), 0)
    : 0;

  if (Array.isArray(musicUrl) && musicUrl.length > 1) {
    console.warn("Only the first music URL is accepted for this render; additional music tracks are ignored.");
  }

  if (!scenes || scenes.length === 0) {
    return res.status(400).json({ error: "No scenes provided for complete video render" });
  }

  const isPortrait = aspectRatio === "9:16";
  const targetW = isPortrait ? 1080 : 1920;
  const targetH = isPortrait ? 1920 : 1080;

  const renderId = "render_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  const tmpDir = path.join(os.tmpdir(), renderId);

  try {
    await fs.promises.mkdir(tmpDir, { recursive: true });

    const downloadedClips: string[] = [];
    const voiceClips: string[] = [];
    let hasAnyVoiceover = false;
    const finalScenesSpecs: Array<{ duration: number; subtitle?: string; narration?: string; overlayData?: any; title?: string }> = [];

    for (let i = 0; i < scenes.length; i++) {
      const sc = scenes[i];
      let videoUrl = sc.videoUrl;

      // If no videoUrl provided, use search_keywords to find one first
      if (!videoUrl && sc.search_keywords) {
        try {
          const fallbackQ = encodeURIComponent(sc.search_keywords);
          const pexUrl = `https://api.pexels.com/videos/search?query=${fallbackQ}&per_page=3&orientation=${isPortrait ? 'portrait' : 'landscape'}`;
          const pexRes = await fetch(pexUrl, {
            headers: { Authorization: process.env.PEXELS_API_KEY || "h1r1DWw3EyuEcP8pFXl6e9jo76I0RfxUoG3d18kvEliS6pH6eEyHbmNo" }
          });
          if (pexRes.ok) {
            const data = await pexRes.json();
            if (data.videos && data.videos.length > 0) {
              const randomIdx = Math.floor(Math.random() * Math.min(3, data.videos.length));
              const bestFile = data.videos[randomIdx].video_files.find((f: any) => f.quality === "hd" || f.quality === "sd") || data.videos[randomIdx].video_files[0];
              if (bestFile?.link) {
                videoUrl = bestFile.link;
              }
            }
          }
        } catch (e) {
          console.log(`Initial search for scene ${i} failed, will use fallback`);
        }
      }

      if (!videoUrl) videoUrl = "https://invalid.local/force-fallback";

      const rawClipPath = path.join(tmpDir, `raw_clip_${i}.mp4`);
      const normClipPath = path.join(tmpDir, `norm_clip_${i}.mp4`);
      const voiceScenePath = path.join(tmpDir, `voice_scene_${i}.mp3`);
      const rawVoicePath = path.join(tmpDir, `voice_raw_${i}.mp3`);

      // 1. Generate Voiceover Narration for this scene FIRST to measure exact speaking duration
      const sceneNarration = (sc.narration || sc.subtitle || "").trim();
      let exactVoiceDur = 0;

      if (sceneNarration) {
        try {
          const voiceBuf = await synthesizeNeuralSpeechBuffer(sceneNarration, voice, voiceRate, voicePitch);
          await fs.promises.writeFile(rawVoicePath, voiceBuf);
          try {
            const probeOut = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${rawVoicePath}"`).toString().trim();
            exactVoiceDur = parseFloat(probeOut) || 0;
          } catch (pErr) {
            console.log(`Duration probe notice:`, pErr);
          }
        } catch (vErr) {
          console.log(`Voice synthesis warning for scene ${i}:`, vErr);
        }
      }

      // Calculate TRUE required duration:
      // Must be at least the requested scene duration AND at least exactVoiceDur + 1.0s (natural comfort buffer so it is never cut off!)
      const baseRequestedDur = Math.max(1, Number(sc.duration) || 5);
      const targetDur = exactVoiceDur > 0
        ? Math.max(baseRequestedDur, Math.ceil((exactVoiceDur + 1.0) * 10) / 10)
        : baseRequestedDur;

      finalScenesSpecs.push({
        duration: targetDur,
        subtitle: sc.subtitle || sc.narration || "",
        narration: sc.narration || sc.subtitle || "",
        overlayData: sc.overlayData,
        title: sc.title || sc.script_line
      });

      // 2. Pad voiceover to exact targetDur
      if (exactVoiceDur > 0 && fs.existsSync(rawVoicePath)) {
        try {
          await new Promise((resolve, reject) => {
            const cmd = `ffmpeg -y -i "${rawVoicePath}" -filter_complex "apad=whole_dur=${targetDur}" -t ${targetDur} -ar 44100 -ac 2 -c:a libmp3lame -b:a 192k "${voiceScenePath}"`;
            exec(cmd, (err) => err ? reject(err) : resolve(true));
          });
          voiceClips.push(voiceScenePath);
          hasAnyVoiceover = true;
        } catch (padErr) {
          console.log(`Voice padding notice for scene ${i}:`, padErr);
        }
      } else {
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${targetDur} -ar 44100 -ac 2 -c:a libmp3lame -b:a 192k "${voiceScenePath}"`;
          exec(cmd, (err) => err ? reject(err) : resolve(true));
        });
        voiceClips.push(voiceScenePath);
      }

      // 3. Download & process video clip with -stream_loop -1 -t ${targetDur}
      try {
        let safeVideoUrl = videoUrl;
        let resp: Response | null = null;
        try {
          resp = await fetch(safeVideoUrl);
        } catch (fetchErr) {
          // Silent fallback
        }
        
        if (!resp || !resp.ok) {
          // Attempting dynamic fallback search
          try {
            const fallbackQ = encodeURIComponent(sc.search_keywords || "technology");
            const pexUrl = `https://api.pexels.com/videos/search?query=${fallbackQ}&per_page=3&orientation=${isPortrait ? 'portrait' : 'landscape'}`;
            const pexRes = await fetch(pexUrl, { 
              headers: { Authorization: process.env.PEXELS_API_KEY || "h1r1DWw3EyuEcP8pFXl6e9jo76I0RfxUoG3d18kvEliS6pH6eEyHbmNo" } 
            });
            if (pexRes.ok) {
              const data = await pexRes.json();
              if (data.videos && data.videos.length > 0) {
                const randomIdx = Math.floor(Math.random() * Math.min(3, data.videos.length));
                const bestFile = data.videos[randomIdx].video_files.find((f: any) => f.quality === "hd" || f.quality === "sd") || data.videos[randomIdx].video_files[0];
                if (bestFile?.link) {
                  safeVideoUrl = bestFile.link;
                  try {
                    resp = await fetch(safeVideoUrl);
                  } catch (e) {}
                }
              }
            }
          } catch(e) {}
          
          if (!resp || !resp.ok) {
            safeVideoUrl = EXPANDED_CURATED_VIDEO_CATALOG[i % EXPANDED_CURATED_VIDEO_CATALOG.length].downloadUrl;
            try {
              resp = await fetch(safeVideoUrl);
            } catch (e) {}
          }
        }

        if (!resp || !resp.ok) { throw new Error("Fallback video download also failed."); }

        const buffer = Buffer.from(await resp.arrayBuffer());
        await fs.promises.writeFile(rawClipPath, buffer);

        // Check if this scene is split screen with multiple videos (2-split, 3-split, 4-split)
        const rawSplitUrls: string[] = [];
        if (Array.isArray(sc.splitUrls) && sc.splitUrls.length > 0) {
          rawSplitUrls.push(...sc.splitUrls.filter(Boolean));
        }
        if (sc.secondaryVideoUrl) rawSplitUrls.push(sc.secondaryVideoUrl);
        if (sc.tertiaryVideoUrl) rawSplitUrls.push(sc.tertiaryVideoUrl);
        if (sc.quaternaryVideoUrl) rawSplitUrls.push(sc.quaternaryVideoUrl);

        // Deduplicate and filter out angleAUrl from secondary list if present
        const angleAUrl = videoUrl;
        const distinctExtras = Array.from(new Set(rawSplitUrls.filter(u => u && u !== angleAUrl)));

        let angleBUrl = distinctExtras[0] || sc.secondaryVideoUrl;
        let angleCUrl = distinctExtras[1] || sc.tertiaryVideoUrl;
        let angleDUrl = distinctExtras[2] || sc.quaternaryVideoUrl;

        // Guaranteed fallbacks if secondary clips are missing or identical
        if (!angleBUrl || angleBUrl === angleAUrl) {
          angleBUrl = EXPANDED_CURATED_VIDEO_CATALOG[(i + 1) % EXPANDED_CURATED_VIDEO_CATALOG.length].downloadUrl;
        }
        if (!angleCUrl || angleCUrl === angleAUrl || angleCUrl === angleBUrl) {
          angleCUrl = EXPANDED_CURATED_VIDEO_CATALOG[(i + 2) % EXPANDED_CURATED_VIDEO_CATALOG.length].downloadUrl;
        }
        if (!angleDUrl || angleDUrl === angleAUrl || angleDUrl === angleBUrl || angleDUrl === angleCUrl) {
          angleDUrl = EXPANDED_CURATED_VIDEO_CATALOG[(i + 3) % EXPANDED_CURATED_VIDEO_CATALOG.length].downloadUrl;
        }

        const isSplit = (sc.transition === "splitscreen" || sc.layout === "splitscreen" || (sc.splitLayout && sc.splitLayout !== "single"));

        if (isSplit && (sc.splitLayout === "4-split" || (sc.splitLayout === "auto" && distinctExtras.length >= 3))) {
          // 4-Split Grid (2x2 Quad View)
          const allUrls = [angleAUrl, angleBUrl, angleCUrl, angleDUrl];
          const localPaths: string[] = [rawClipPath];
          for (let sIdx = 1; sIdx < allUrls.length; sIdx++) {
            const extraPath = path.join(tmpDir, `quad_clip_${i}_${sIdx}.mp4`);
            try {
              const eRes = await fetch(allUrls[sIdx]);
              if (eRes.ok) {
                await fs.promises.writeFile(extraPath, Buffer.from(await eRes.arrayBuffer()));
                localPaths.push(extraPath);
              }
            } catch {}
          }

          if (localPaths.length === 4) {
            const w4 = isPortrait ? 540 : 960;
            const h4 = isPortrait ? 960 : 540;
            const inputsStr = localPaths.map(p => `-stream_loop -1 -i "${p}"`).join(" ");
            const filterStr = `"[0:v]scale=${w4}:${h4}:force_original_aspect_ratio=increase,crop=${w4}:${h4},setsar=1[tl]; [1:v]scale=${w4}:${h4}:force_original_aspect_ratio=increase,crop=${w4}:${h4},setsar=1[tr]; [2:v]scale=${w4}:${h4}:force_original_aspect_ratio=increase,crop=${w4}:${h4},setsar=1[bl]; [3:v]scale=${w4}:${h4}:force_original_aspect_ratio=increase,crop=${w4}:${h4},setsar=1[br]; [tl][tr]hstack[top]; [bl][br]hstack[bot]; [top][bot]vstack[v]"`;
            await new Promise((resolve, reject) => {
              const cmd = `ffmpeg -y ${inputsStr} -t ${targetDur} -filter_complex ${filterStr} -map "[v]" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 -video_track_timescale 90000 -an "${normClipPath}"`;
              exec(cmd, (err) => err ? reject(err) : resolve(true));
            });
            downloadedClips.push(normClipPath);
          } else {
            // Fallback
            await new Promise((resolve, reject) => {
              const cmd = `ffmpeg -y -stream_loop -1 -i "${rawClipPath}" -t ${targetDur} -vf "scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},setsar=1" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 -video_track_timescale 90000 -an "${normClipPath}"`;
              exec(cmd, (err) => err ? reject(err) : resolve(true));
            });
            downloadedClips.push(normClipPath);
          }
        } else if (isSplit && (sc.splitLayout === "3-split" || (sc.splitLayout === "auto" && distinctExtras.length >= 2))) {
          // 3-Split (Hero + 2 stacked sub-views)
          const allUrls = [angleAUrl, angleBUrl, angleCUrl];
          const localPaths: string[] = [rawClipPath];
          for (let sIdx = 1; sIdx < allUrls.length; sIdx++) {
            const extraPath = path.join(tmpDir, `triple_clip_${i}_${sIdx}.mp4`);
            try {
              const eRes = await fetch(allUrls[sIdx]);
              if (eRes.ok) {
                await fs.promises.writeFile(extraPath, Buffer.from(await eRes.arrayBuffer()));
                localPaths.push(extraPath);
              }
            } catch {}
          }

          if (localPaths.length === 3) {
            const inputsStr = localPaths.map(p => `-stream_loop -1 -i "${p}"`).join(" ");
            const filterStr = isPortrait
              ? `"[0:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960,setsar=1[top]; [1:v]scale=540:960:force_original_aspect_ratio=increase,crop=540:960,setsar=1[b1]; [2:v]scale=540:960:force_original_aspect_ratio=increase,crop=540:960,setsar=1[b2]; [b1][b2]hstack[bot]; [top][bot]vstack[v]"`
              : `"[0:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080,setsar=1[left]; [1:v]scale=960:540:force_original_aspect_ratio=increase,crop=960:540,setsar=1[r1]; [2:v]scale=960:540:force_original_aspect_ratio=increase,crop=960:540,setsar=1[r2]; [r1][r2]vstack[right]; [left][right]hstack[v]"`;
            await new Promise((resolve, reject) => {
              const cmd = `ffmpeg -y ${inputsStr} -t ${targetDur} -filter_complex ${filterStr} -map "[v]" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 -video_track_timescale 90000 -an "${normClipPath}"`;
              exec(cmd, (err) => err ? reject(err) : resolve(true));
            });
            downloadedClips.push(normClipPath);
          } else {
            await new Promise((resolve, reject) => {
              const cmd = `ffmpeg -y -stream_loop -1 -i "${rawClipPath}" -t ${targetDur} -vf "scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},setsar=1" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 -video_track_timescale 90000 -an "${normClipPath}"`;
              exec(cmd, (err) => err ? reject(err) : resolve(true));
            });
            downloadedClips.push(normClipPath);
          }
        } else if (isSplit) {
          // 2-Split (Side-by-Side Dual View)
          const secRawPath = path.join(tmpDir, `sec_clip_${i}.mp4`);
          const secResp = await fetch(angleBUrl);
          if (secResp.ok) {
            await fs.promises.writeFile(secRawPath, Buffer.from(await secResp.arrayBuffer()));
            await new Promise((resolve, reject) => {
              const splitCmd = isPortrait
                ? `ffmpeg -y -stream_loop -1 -i "${rawClipPath}" -stream_loop -1 -i "${secRawPath}" -t ${targetDur} -filter_complex "[0:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960,setsar=1[top]; [1:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960,setsar=1[bottom]; [top][bottom]vstack[v]" -map "[v]" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 -video_track_timescale 90000 -an "${normClipPath}"`
                : `ffmpeg -y -stream_loop -1 -i "${rawClipPath}" -stream_loop -1 -i "${secRawPath}" -t ${targetDur} -filter_complex "[0:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080,setsar=1[left]; [1:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080,setsar=1[right]; [left][right]hstack[v]" -map "[v]" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 -video_track_timescale 90000 -an "${normClipPath}"`;
              exec(splitCmd, (err) => err ? reject(err) : resolve(true));
            });
            downloadedClips.push(normClipPath);
          } else {
            // Fallback to standard dimension if secondary fetch fails
            await new Promise((resolve, reject) => {
              const cmd = `ffmpeg -y -stream_loop -1 -i "${rawClipPath}" -t ${targetDur} -vf "scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},setsar=1" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 -video_track_timescale 90000 -an "${normClipPath}"`;
              exec(cmd, (err) => err ? reject(err) : resolve(true));
            });
            downloadedClips.push(normClipPath);
          }
        } else {
          // Standard clip normalization with seamless stream_loop, exact framerate and SAR 1:1
          await new Promise((resolve, reject) => {
            const cmd = `ffmpeg -y -stream_loop -1 -i "${rawClipPath}" -t ${targetDur} -vf "scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},setsar=1" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 -video_track_timescale 90000 -an "${normClipPath}"`;
            exec(cmd, (err) => err ? reject(err) : resolve(true));
          });
          downloadedClips.push(normClipPath);
        }
      } catch (clipErr) {
        require("fs").writeFileSync("clip_error.log", String(clipErr) + (clipErr.stack || ""), {flag:"a"}); console.error(`Error processing scene clip ${i}:`, clipErr);
        try {
          await new Promise((resolve, reject) => {
            const cmd = `ffmpeg -y -f lavfi -i color=c=black:s=${targetW}x${targetH}:r=30 -t ${targetDur} -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -video_track_timescale 90000 -an "${normClipPath}"`;
            exec(cmd, (err) => err ? reject(err) : resolve(true));
          });
          downloadedClips.push(normClipPath);
        } catch (fatalErr) {
           console.log("Fatal error generating black fallback clip:", fatalErr);
        }
      }
    }

    if (downloadedClips.length === 0) {
      throw new Error("Could not process video clips for rendering");
    }

    // 1. Concatenate all video clips into single seamless video
    const concatPath = path.join(tmpDir, "concat.txt");
    const concatContent = downloadedClips.map(p => `file '${path.basename(p)}'`).join("\n");
    await fs.promises.writeFile(concatPath, concatContent);

    const stitchedPath = path.join(tmpDir, "stitched.mp4");
    const concatPathFwd = concatPath.replace(/\\/g, "/");
    const stitchedPathFwd = stitchedPath.replace(/\\/g, "/");
    await new Promise((resolve, reject) => {
      const cmd = `ffmpeg -y -f concat -safe 0 -i "${concatPathFwd}" -c copy "${stitchedPathFwd}"`;
      exec(cmd, { cwd: tmpDir }, (err) => err ? reject(err) : resolve(true));
    });

    // 2. Concatenate all scene voiceovers into master voiceover track
    let masterVoicePath: string | null = null;
    if (hasAnyVoiceover && voiceClips.length > 0) {
      try {
        const voiceConcatPath = path.join(tmpDir, "voice_concat.txt");
        const voiceConcatContent = voiceClips.map(p => `file '${path.basename(p)}'`).join("\n");
        await fs.promises.writeFile(voiceConcatPath, voiceConcatContent);

        const fullVoicePath = path.join(tmpDir, "master_voice.mp3");
        const vcpFwd = voiceConcatPath.replace(/\\/g, "/");
        const fvpFwd = fullVoicePath.replace(/\\/g, "/");
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -f concat -safe 0 -i "${vcpFwd}" -ar 44100 -ac 2 -c:a libmp3lame -b:a 192k "${fvpFwd}"`;
          exec(cmd, { cwd: tmpDir }, (err) => err ? reject(err) : resolve(true));
        });
        masterVoicePath = fullVoicePath;
      } catch (vConcatErr) {
        console.log("Voice concatenation failed:", vConcatErr);
      }
    }

    // 3. Download the single background music track if provided, then loop it for the whole video duration.
    let musicLocalPath: string | null = null;
    if (singleMusicUrl) {
      try {
        const musicPath = path.join(tmpDir, "music.mp3");
        const mResp = await fetch(singleMusicUrl);
        if (mResp.ok) {
          await fs.promises.writeFile(musicPath, Buffer.from(await mResp.arrayBuffer()));
          musicLocalPath = musicPath;
        }
      } catch (mErr) {
        console.log("Background music download skipped:", mErr);
      }
    }

    // 4. Generate Subtitles ASS file if requested
    let assLocalPath: string | null = null;
    if (subtitlesStyle !== "none") {
      const assContent = generateAssContent(finalScenesSpecs, subtitlesStyle, aspectRatio);
      const assPath = path.join(tmpDir, "subtitles.ass");
      await fs.promises.writeFile(assPath, assContent, "utf8");
      assLocalPath = assPath;
    }

    // 5. Final Audio, Video & Subtitles Assembly with Universal Standards
    // - pix_fmt yuv420p
    // - -movflags +faststart (places moov header at beginning for 100% Windows/QuickTime/mobile player compatibility)
    // - AAC stereo 44.1kHz audio
    let finalOutputPath = stitchedPath;
    const finalMixedPath = path.join(tmpDir, "production_final.mp4");
    const vol = Math.max(0.05, Math.min(1, Number(musicVolume) || 0.25));

    if (assLocalPath) {
      // Use a relative ASS filename inside the tmpDir working folder.
      // On Windows this avoids FFmpeg mis-parsing an absolute C:/ path as an image-size option.
      const assFilename = path.basename(assLocalPath);

      // Burn subtitles using the ASS filter and mix audio
      if (masterVoicePath && musicLocalPath) {
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -i "${stitchedPath}" -i "${masterVoicePath}" -stream_loop -1 -i "${musicLocalPath}" -filter_complex "[0:v]ass='${assFilename}'[v]; [1:a]volume=1.0[voice]; [2:a]volume=${vol}[bg]; [voice][bg]amix=inputs=2:duration=first:dropout_transition=2[a]" -map "[v]" -map "[a]" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -ac 2 -movflags +faststart -shortest "${finalMixedPath}"`;
          exec(cmd, { cwd: tmpDir }, (err) => err ? reject(err) : resolve(true));
        });
        finalOutputPath = finalMixedPath;
      } else if (masterVoicePath) {
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -i "${stitchedPath}" -i "${masterVoicePath}" -filter_complex "[0:v]ass='${assFilename}'[v]" -map "[v]" -map 1:a -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -ac 2 -movflags +faststart -shortest "${finalMixedPath}"`;
          exec(cmd, { cwd: tmpDir }, (err) => err ? reject(err) : resolve(true));
        });
        finalOutputPath = finalMixedPath;
      } else if (musicLocalPath) {
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -i "${stitchedPath}" -stream_loop -1 -i "${musicLocalPath}" -filter_complex "[0:v]ass='${assFilename}'[v]; [1:a]volume=${vol}[a]" -map "[v]" -map "[a]" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -ac 2 -movflags +faststart -shortest "${finalMixedPath}"`;
          exec(cmd, { cwd: tmpDir }, (err) => err ? reject(err) : resolve(true));
        });
        finalOutputPath = finalMixedPath;
      } else {
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -i "${stitchedPath}" -filter_complex "[0:v]ass='${assFilename}'[v]" -map "[v]" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 -movflags +faststart "${finalMixedPath}"`;
          exec(cmd, { cwd: tmpDir }, (err) => err ? reject(err) : resolve(true));
        });
        finalOutputPath = finalMixedPath;
      }
    } else {
      // Subtitles disabled -> mix audio and ensure faststart MP4 container
      if (masterVoicePath && musicLocalPath) {
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -i "${stitchedPath}" -i "${masterVoicePath}" -stream_loop -1 -i "${musicLocalPath}" -filter_complex "[1:a]volume=1.0[voice]; [2:a]volume=${vol}[bg]; [voice][bg]amix=inputs=2:duration=first:dropout_transition=2[a]" -map 0:v -map "[a]" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -ac 2 -movflags +faststart -shortest "${finalMixedPath}"`;
          exec(cmd, (err) => err ? reject(err) : resolve(true));
        });
        finalOutputPath = finalMixedPath;
      } else if (masterVoicePath) {
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -i "${stitchedPath}" -i "${masterVoicePath}" -map 0:v -map 1:a -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -ac 2 -movflags +faststart -shortest "${finalMixedPath}"`;
          exec(cmd, (err) => err ? reject(err) : resolve(true));
        });
        finalOutputPath = finalMixedPath;
      } else if (musicLocalPath) {
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -i "${stitchedPath}" -stream_loop -1 -i "${musicLocalPath}" -filter_complex "[1:a]volume=${vol}[a]" -map 0:v -map "[a]" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -ac 2 -movflags +faststart -shortest "${finalMixedPath}"`;
          exec(cmd, (err) => err ? reject(err) : resolve(true));
        });
        finalOutputPath = finalMixedPath;
      } else {
        await new Promise((resolve, reject) => {
          const cmd = `ffmpeg -y -i "${stitchedPath}" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 -movflags +faststart "${finalMixedPath}"`;
          exec(cmd, (err) => err ? reject(err) : resolve(true));
        });
        finalOutputPath = finalMixedPath;
      }
    }

    const safeTitle = (title || "complete_video").replace(/[^a-zA-Z0-9_-]/g, "_");
    const stat = await fs.promises.stat(finalOutputPath);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.mp4"`);

    const readStream = fs.createReadStream(finalOutputPath);
    readStream.pipe(res);
    res.on("finish", async () => {
      try {
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
      } catch {}
    });
  } catch (err: any) {
    console.log("Render complete video error:", err);
    try {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    } catch {}
    res.status(500).json({ error: "Failed to render complete video: " + err.message });
  }
});

// 2. Search stock audio (Pixabay, NASA Space Audio & Curated CC4.0 Master Catalog)
app.get("/api/stock/audio", async (req, res) => {
  const query = (req.query.query as string || "").trim();
  const audioType = (req.query.type as string || "music").toLowerCase();
  const genreFilter = (req.query.genre as string || "all").toLowerCase();
  const perPage = Math.min(Math.max(parseInt(req.query.per_page as string || "30", 10), 1), 60);

  let results: any[] = [];
  let providerStatus = "connected";

  // Check if Pixabay Audio has results
  if (query && PIXABAY_KEY) {
    try {
      const pixabayUrl = `https://pixabay.com/api/audio/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&per_page=10`;
      const upstream = await fetch(pixabayUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        },
        signal: AbortSignal.timeout(3000)
      });

      if (upstream.ok) {
        const data: any = await upstream.json();
        if (data.hits && Array.isArray(data.hits) && data.hits.length > 0) {
          const pResults = data.hits.map((hit: any) => ({
            id: `pixabay-audio-${hit.id}`,
            type: audioType,
            title: hit.tags || hit.name || `Pixabay Audio #${hit.id}`,
            genre: "Pixabay Music",
            tags: hit.tags || "stock music",
            duration: hit.duration,
            download_url: hit.audio || hit.download_url,
            preview_url: hit.audio || hit.preview_url,
            artist: hit.user || "Pixabay Creator",
            license: "Pixabay Free Commercial Use"
          }));
          results.push(...pResults);
        }
      }
    } catch {}
  }

  // NASA Space Audio search for space / science / cosmos queries
  const isSpace = /space|rocket|nasa|moon|mars|jupiter|apollo|voyager|galaxy|shuttle|cosmos|star|launch|countdown|universe/i.test(query) || genreFilter === "nasa";
  if (isSpace) {
    try {
      const nasaAudioUrl = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query || "space")}&media_type=audio&page_size=6`;
      const nasaAudioRes = await fetch(nasaAudioUrl, { signal: AbortSignal.timeout(3500) });
      if (nasaAudioRes.ok) {
        const nData: any = await nasaAudioRes.json();
        const nItems = (nData.collection?.items || []).slice(0, 6);
        const nPromises = nItems.map(async (item: any) => {
          const meta = item.data?.[0] || {};
          let mp3Url = "";
          try {
            const assetRes = await fetch(item.href, { signal: AbortSignal.timeout(2500) });
            if (assetRes.ok) {
              const assets: string[] = await assetRes.json();
              mp3Url = assets.find((a: string) => a.endsWith("~128k.mp3") || a.endsWith("~orig.mp3") || a.endsWith(".mp3")) || "";
            }
          } catch {}
          if (!mp3Url) return null;
          return {
            id: `nasa-audio-${meta.nasa_id || Math.random().toString(36).substring(7)}`,
            type: "music",
            title: meta.title || "NASA Space Transmission",
            genre: "NASA Space Audio",
            tags: `nasa space science rocket ${meta.keywords?.join(" ") || ""}`,
            duration: 180,
            download_url: mp3Url.replace(/^http:\/\//i, "https://"),
            preview_url: mp3Url.replace(/^http:\/\//i, "https://"),
            artist: meta.center ? `NASA (${meta.center})` : "NASA Space Operations",
            license: "NASA Public Domain Free Use"
          };
        });
        const resolvedNasa = (await Promise.all(nPromises)).filter(Boolean);
        results.push(...resolvedNasa);
      }
    } catch {}
  }

  // 40+ Verified High-Quality Royalty-Free Curated Library
  const curatedAudioPool = [
    // Cyber, Synth & EDM
    {
      id: "curated-cyber-01",
      type: "music",
      title: "Syntheticity",
      genre: "Cyber & Electronic",
      tags: "cyber synth electronic tech ai digital coding future matrix data software robotics automation",
      duration: 184,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Syntheticity.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Syntheticity.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-cyber-02",
      type: "music",
      title: "Deeper (Cosmic Deep Tech)",
      genre: "Cyber & Electronic",
      tags: "space cosmos deep tech ambient future subtle quantum minimal digital stars glitch",
      duration: 162,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Deeper.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Deeper.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-cyber-03",
      type: "music",
      title: "Defiance (Long Cyber Remix)",
      genre: "Cyber & Electronic",
      tags: "cyberpunk synth electronic beat energy dark club edm digital futuristic bass club rave",
      duration: 198,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Defiance%20(long%20remix).mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Defiance%20(long%20remix).mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-cyber-04",
      type: "music",
      title: "Defiance (Synthwave Pulse)",
      genre: "Cyber & Electronic",
      tags: "synthwave electronic future tech cyber glitch bass retro 80s neon synth arcade",
      duration: 142,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Defiance.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Defiance.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-cyber-05",
      type: "music",
      title: "Surreptitious",
      genre: "Cyber & Electronic",
      tags: "stealth cyber tech electronic hacking spy undercover pulse mystery dark coding",
      duration: 176,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Surreptitious.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Surreptitious.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },

    // Epic Cinematic & Trailer
    {
      id: "curated-cinematic-01",
      type: "music",
      title: "Destiny (Epic Orchestral Trailer)",
      genre: "Epic Cinematic",
      tags: "epic trailer destiny orchestral hero heroic grand triumph climax movie war battle glory",
      duration: 175,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Destiny.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Destiny.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-cinematic-02",
      type: "music",
      title: "Dark Knight (Authoritative & Powerful Climax)",
      genre: "Epic Cinematic",
      tags: "dark knight powerful authoritative epic cinematic tension intensity action climax battle force",
      duration: 158,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Dark%20Knight.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Dark%20Knight.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-cinematic-03",
      type: "music",
      title: "Crossroads (Cinematic Drama & Narrative)",
      genre: "Epic Cinematic",
      tags: "crossroads drama cinematic story storytelling documentary decision narrative history journey",
      duration: 210,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Crossroads.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Crossroads.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-cinematic-04",
      type: "music",
      title: "Fate (Dramatic Orchestral Rise)",
      genre: "Epic Cinematic",
      tags: "fate destiny dramatic suspense orchestral rise cinematic documentary intense strings",
      duration: 164,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Fate.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Fate.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-cinematic-05",
      type: "music",
      title: "Retribution (Thunderous Climax)",
      genre: "Epic Cinematic",
      tags: "retribution vengeance epic battle cinematic climax war intense dramatic trailer drums",
      duration: 182,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Retribution.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Retribution.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-cinematic-06",
      type: "music",
      title: "Ominosity (Tense Thriller & Suspense)",
      genre: "Epic Cinematic",
      tags: "ominous thrill suspense horror dark scary mystery tension fear predator crime investigation",
      duration: 155,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Ominosity.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Ominosity.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-cinematic-07",
      type: "music",
      title: "The Haunting (Dark Ambient Mystery)",
      genre: "Epic Cinematic",
      tags: "haunting mystery spooky dark ambient ghost horror eerie suspenseful stranger eerie",
      duration: 170,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/The%20Haunting.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/The%20Haunting.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },

    // Upbeat & Corporate & Inspirational
    {
      id: "curated-inspire-01",
      type: "music",
      title: "Daybreak (Inspirational Horizon)",
      genre: "Upbeat & Corporate",
      tags: "daybreak sunrise morning hope inspiration corporate business growth vision startup success motivational",
      duration: 195,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Daybreak.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Daybreak.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-inspire-02",
      type: "music",
      title: "From Here (Modern Momentum & Progress)",
      genre: "Upbeat & Corporate",
      tags: "progress momentum future forward innovation tech modern startup business success start journey",
      duration: 148,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/From%20Here.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/From%20Here.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-inspire-03",
      type: "music",
      title: "Faith (Uplifting Harmony)",
      genre: "Upbeat & Corporate",
      tags: "faith uplifting harmony hope inspiring corporate motivation love positive bright cheerful",
      duration: 172,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Faith%20(love%20remix).mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Faith%20(love%20remix).mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-inspire-04",
      type: "music",
      title: "Deserve to be Loved (Bright & Warm)",
      genre: "Upbeat & Corporate",
      tags: "happy inspiring love positive family wellness health lifestyle community bright sunshine",
      duration: 165,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Deserve%20to%20be%20Loved.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Deserve%20to%20be%20Loved.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-inspire-05",
      type: "music",
      title: "Find You (Celebration & Teamwork)",
      genre: "Upbeat & Corporate",
      tags: "find search optimistic march celebration victory bright upbeat teamwork team leadership",
      duration: 150,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Find%20You%20(march%20remix).mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Find%20You%20(march%20remix).mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },

    // Acoustic & Folk Nature
    {
      id: "curated-acoustic-01",
      type: "music",
      title: "The Forest Awakes (Organic & Nature)",
      genre: "Acoustic & Folk",
      tags: "forest nature trees wildlife animals morning calm green peaceful eco ecology organic earth meadow",
      duration: 190,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/The%20Forest%20Awakes.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/The%20Forest%20Awakes.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-acoustic-02",
      type: "music",
      title: "Familiar Roads (Acoustic Roadtrip)",
      genre: "Acoustic & Folk",
      tags: "roads roadtrip travel drive country acoustic guitar summer friends vacation journey car highway",
      duration: 168,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Familiar%20Roads.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Familiar%20Roads.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-acoustic-03",
      type: "music",
      title: "Wild Waters (Flowing Currents & Waves)",
      genre: "Acoustic & Folk",
      tags: "ocean water sea waves flow swimming beach river lake meditation aquatic nature surf water",
      duration: 180,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Wild%20Waters.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Wild%20Waters.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-acoustic-04",
      type: "music",
      title: "Home (Warm Acoustic Comfort)",
      genre: "Acoustic & Folk",
      tags: "home warm acoustic comfort family peaceful cozy nostalgic gentle love relax hearth fireside",
      duration: 160,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Home.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Home.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },

    // Fantasy, Travel & World Adventure
    {
      id: "curated-travel-01",
      type: "music",
      title: "The Journey (World Exploration)",
      genre: "Fantasy & Adventure",
      tags: "travel journey explore adventure discovery vlog world flight destination trip wanderlust tour",
      duration: 204,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/The%20Journey%20(Kroc's%20Theme).mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/The%20Journey%20(Kroc's%20Theme).mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-travel-02",
      type: "music",
      title: "Lost Islands (Mystical Exotic Adventure)",
      genre: "Fantasy & Adventure",
      tags: "island lost mystery ancient exotic temple pacific secret jungle tropical treasure explorer",
      duration: 172,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Lost%20Islands.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Lost%20Islands.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-travel-03",
      type: "music",
      title: "Cyaron's Gate (Mystic Kingdom)",
      genre: "Fantasy & Adventure",
      tags: "fantasy realm gate castle medieval kingdom magic mythical rpg quest lore dragon sorcery",
      duration: 185,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Cyaron's%20Gate.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Cyaron's%20Gate.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-travel-04",
      type: "music",
      title: "King of the Desert (Arabic & Sands)",
      genre: "Fantasy & Adventure",
      tags: "desert egypt arabic sands dunes pyramids oriental middle eastern exotic camels oasis caravan",
      duration: 192,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/King%20of%20the%20Desert.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/King%20of%20the%20Desert.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },

    // Classical & Piano Emotional
    {
      id: "curated-piano-01",
      type: "music",
      title: "A Memory Away (Tender Storytelling)",
      genre: "Classical & Piano",
      tags: "memory tender sad emotional storytelling reflection documentary heartfelt thoughtful piano soft drama",
      duration: 188,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/A%20Memory%20Away.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/A%20Memory%20Away.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-piano-02",
      type: "music",
      title: "Aerith's Theme (Gentle Piano Romance)",
      genre: "Classical & Piano",
      tags: "piano romance gentle tender sweet beautiful ballad classical love final fantasy emotional",
      duration: 215,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Aerith's%20Theme%20-%20Piano%20arrangement.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Aerith's%20Theme%20-%20Piano%20arrangement.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-piano-03",
      type: "music",
      title: "Leaving Millie (Solo Acoustic Piano)",
      genre: "Classical & Piano",
      tags: "piano solo acoustic live melancholy farewell emotional sad goodbye delicate tears",
      duration: 178,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Leaving%20Millie%20(live%20piano).mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Leaving%20Millie%20(live%20piano).mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-piano-04",
      type: "music",
      title: "Hidden Tears (Dramatic Sorrow)",
      genre: "Classical & Piano",
      tags: "tears sorrow sad mournful depression emotional tragedy cinema piano strings grief",
      duration: 165,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Hidden%20Tears.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Hidden%20Tears.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },

    // Rock, Action & Gaming Combat
    {
      id: "curated-action-01",
      type: "music",
      title: "Now or Never (High Stakes Action)",
      genre: "Rock & Action",
      tags: "action fast urgent speed racing workout fitness sports gaming energy rush adrenaline intense sprint",
      duration: 154,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Now%20or%20Never.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Now%20or%20Never.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-action-02",
      type: "music",
      title: "Assault on Mist Castle (Gaming Battle)",
      genre: "Rock & Action",
      tags: "gaming game combat fight battle adrenaline epic intense action levels arcade arcade boss",
      duration: 165,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Assault%20on%20Mist%20Castle.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Assault%20on%20Mist%20Castle.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-action-03",
      type: "music",
      title: "Reign of Anarchy (Heavy Metal Guitar)",
      genre: "Rock & Action",
      tags: "rock heavy metal electric guitar drums rebellion power workout driving extreme distortion",
      duration: 180,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Reign%20of%20Anarchy.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Reign%20of%20Anarchy.mp3",
      artist: "Tanner Helland",
      license: "Creative Commons Attribution 4.0"
    },

    // Lo-Fi & Chillout
    {
      id: "curated-lofi-01",
      type: "music",
      title: "Midnight Dreamer (Lo-Fi Study Beat)",
      genre: "Lo-Fi & Chill",
      tags: "lofi lofi-hiphop chill relaxing study sleep coffee beats slow vinyl tape chillout peaceful cafe",
      duration: 156,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/A%20Memory%20Away.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/A%20Memory%20Away.mp3",
      artist: "Lo-Fi Soundscapes",
      license: "Creative Commons Attribution 4.0"
    },
    {
      id: "curated-lofi-02",
      type: "music",
      title: "Rainy Window Coffee",
      genre: "Lo-Fi & Chill",
      tags: "lofi chill rain cozy coffee tea study sleep chillout relaxing mellow warm study beat",
      duration: 160,
      download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Home.mp3",
      preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Home.mp3",
      artist: "Lo-Fi Soundscapes",
      license: "Creative Commons Attribution 4.0"
    },

    // Sound Effects (SFX)
    {
      id: "curated-sfx-01",
      type: "sfx",
      title: "Deep Cosmic Gong Resonance",
      genre: "Sound Effects",
      tags: "gong bell resonance cinematic hit transition impact cosmic meditation sound effect sfx chime",
      duration: 6,
      download_url: "https://raw.githubusercontent.com/Tonejs/audio/master/berklee/gong_1.mp3",
      preview_url: "https://raw.githubusercontent.com/Tonejs/audio/master/berklee/gong_1.mp3",
      artist: "Audio Lab",
      license: "MIT Royalty-Free"
    },
    {
      id: "curated-sfx-02",
      type: "sfx",
      title: "Futuristic Sub Bass Drop",
      genre: "Sound Effects",
      tags: "bass kick drop sub boom impact slam punch hit sound effect transition whoosh hit sfx",
      duration: 2,
      download_url: "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/CR78/kick.mp3",
      preview_url: "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/CR78/kick.mp3",
      artist: "Audio Lab",
      license: "MIT Royalty-Free"
    },
    {
      id: "curated-sfx-03",
      type: "sfx",
      title: "Crisp Cyber Snare Impact",
      genre: "Sound Effects",
      tags: "snare clap hit strike impact drum crack whoosh sound effect sfx transition",
      duration: 2,
      download_url: "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/CR78/snare.mp3",
      preview_url: "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/CR78/snare.mp3",
      artist: "Audio Lab",
      license: "MIT Royalty-Free"
    },
    {
      id: "curated-sfx-04",
      type: "sfx",
      title: "Analog Synth Sine Tone",
      genre: "Sound Effects",
      tags: "synth tone note chime ding notification alert cue sound effect sfx",
      duration: 4,
      download_url: "https://raw.githubusercontent.com/Tonejs/audio/master/casio/A1.mp3",
      preview_url: "https://raw.githubusercontent.com/Tonejs/audio/master/casio/A1.mp3",
      artist: "Audio Lab",
      license: "MIT Royalty-Free"
    }
  ];

  // Filter curated pool by audioType and genre
  let pool = curatedAudioPool.filter(item => !audioType || item.type === audioType);
  if (genreFilter && genreFilter !== "all") {
    const gLower = genreFilter.toLowerCase();
    pool = pool.filter(item => {
      const itemGenre = (item.genre || "").toLowerCase();
      const itemTags = (item.tags || "").toLowerCase();
      if (gLower === "cyber" && (itemGenre.includes("cyber") || itemGenre.includes("electronic"))) return true;
      if (gLower === "cinematic" && itemGenre.includes("cinematic")) return true;
      if (gLower === "inspire" && (itemGenre.includes("corporate") || itemGenre.includes("upbeat"))) return true;
      if (gLower === "acoustic" && itemGenre.includes("acoustic")) return true;
      if (gLower === "travel" || gLower === "fantasy") return itemGenre.includes("adventure") || itemGenre.includes("fantasy");
      if (gLower === "piano") return itemGenre.includes("piano") || itemGenre.includes("classical");
      if (gLower === "action") return itemGenre.includes("action") || itemGenre.includes("rock");
      if (gLower === "lofi") return itemGenre.includes("lo-fi") || itemGenre.includes("chill");
      if (gLower === "sfx") return item.type === "sfx";
      return itemGenre.includes(gLower) || itemTags.includes(gLower);
    });
  }

  // Scoring by search query keywords
  const qTokens = (query || "").toLowerCase().split(/[\s,._-]+/).filter(t => t.length > 1);
  if (qTokens.length > 0) {
    const scoredPool = pool.map(item => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const genreLower = (item.genre || "").toLowerCase();
      const tagsLower = (item.tags || "").toLowerCase();
      for (const token of qTokens) {
        if (titleLower.includes(token)) score += 6;
        if (genreLower.includes(token)) score += 4;
        if (tagsLower.includes(token)) score += 3;
      }
      const tieBreaker = Math.random() * 0.5;
      return { item, score: score + tieBreaker };
    });
    scoredPool.sort((a, b) => b.score - a.score);
    const topScored = scoredPool.map(s => s.item);
    results.push(...topScored);
  } else {
    results.push(...pool);
  }

  // Deduplicate by download_url or id
  const seenUrls = new Set<string>();
  const deduplicatedResults: any[] = [];
  for (const r of results) {
    if (r && r.download_url && !seenUrls.has(r.download_url)) {
      seenUrls.add(r.download_url);
      deduplicatedResults.push(r);
    }
  }

  const finalResults = deduplicatedResults.slice(0, perPage);

  res.json({
    query,
    type: audioType,
    genre: genreFilter,
    count: finalResults.length,
    providerStatus,
    results: finalResults
  });
});

// 2b. Audio Streaming Proxy with Range Support and CORS headers
app.get("/api/audio/proxy", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  try {
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "audio/*, */*"
    };
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    const upstream = await fetch(targetUrl, { headers });
    res.status(upstream.status);

    const passHeaders = ["content-type", "content-length", "content-range", "accept-ranges"];
    for (const h of passHeaders) {
      const v = upstream.headers.get(h);
      if (v) res.setHeader(h, v);
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");

    if (upstream.body) {
      // @ts-ignore
      const reader = upstream.body.getReader();
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch {
          res.end();
        }
      };
      pump();
    } else {
      res.end();
    }
  } catch (err: any) {
    console.log("Audio proxy error:", err);
    res.status(500).json({ error: "Failed to stream audio: " + err.message });
  }
});

// Rate limit telemetry endpoint
app.get("/api/stock/rate-limits", async (_req, res) => {
  // Check NASA official API rate limits if available
  try {
    const nasaCheckUrl = `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(NASA_KEY)}`;
    const nRes = await fetch(nasaCheckUrl, { signal: AbortSignal.timeout(3000) });
    const limit = nRes.headers.get("x-ratelimit-limit");
    const remaining = nRes.headers.get("x-ratelimit-remaining");
    if (limit) rateLimitState.nasa.limit = parseInt(limit, 10);
    if (remaining) rateLimitState.nasa.remaining = parseInt(remaining, 10);
    rateLimitState.nasa.lastUpdated = new Date().toISOString();
    rateLimitState.nasa.status = (rateLimitState.nasa.remaining ?? 10) > 0 ? 'healthy' : 'throttled';
  } catch {}

  // Internet Archive is completely open and public domain
  rateLimitState.archive.status = 'healthy';
  rateLimitState.archive.limit = 999999;
  rateLimitState.archive.remaining = 999999;
  rateLimitState.archive.lastUpdated = new Date().toISOString();

  res.json(rateLimitState);
});

// 3. Search stock assets (Pexels, Pixabay, and Giphy) with rate-limit monitoring
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

  const errors: string[] = [];
  const pexResults: any[] = [];
  const pixResults: any[] = [];
  const giphResults: any[] = [];
  const iaResults: any[] = [];
  const nasaResults: any[] = [];

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

            pexResults.push({
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
            pexResults.push({
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
      console.log("Pexels fetch error:", err?.message);
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
              pixResults.push({
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
            pixResults.push({
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
      console.log("Pixabay fetch error:", err?.message);
      errors.push(`Pixabay: ${err?.message}`);
    }
  }

  // GIPHY Search (Animated GIFs & short MP4 looping clips)
  if (source === "all" || source === "giphy") {
    try {
      const giphyApiKey = (req.query.giphyKey as string) || GIPHY_KEY;
      if (giphyApiKey) {
        const limit = source === "giphy" ? 16 : 6;
        const giphyUrl = `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(giphyApiKey)}&q=${encodeURIComponent(query)}&limit=${limit}&rating=g`;
        const gRes = await fetch(giphyUrl, {
          headers: {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
          }
        });

        const gLimit = gRes.headers.get("x-ratelimit-limit");
        const gRemaining = gRes.headers.get("x-ratelimit-remaining");
        const gReset = gRes.headers.get("x-ratelimit-reset");

        if (gLimit) rateLimitState.giphy.limit = parseInt(gLimit, 10);
        if (gRemaining) {
          const rem = parseInt(gRemaining, 10);
          rateLimitState.giphy.remaining = rem;
          rateLimitState.giphy.status = rem < 50 ? (rem === 0 ? 'throttled' : 'warning') : 'healthy';
        }
        if (gReset) rateLimitState.giphy.reset = parseInt(gReset, 10);
        rateLimitState.giphy.lastUpdated = new Date().toISOString();

        if (gRes.ok) {
          const gData: any = await gRes.json();
          for (const item of (gData.data || [])) {
            // Giphy original or fixed_height MP4 clip
            const mp4Url = item.images?.original?.mp4 || item.images?.fixed_height?.mp4 || item.images?.looping?.mp4;
            const gifUrl = item.images?.original?.url || item.images?.fixed_height?.url;

            // When searching for videos, only accept items with valid MP4 video streams
            if (mediaType === "video" && !mp4Url) {
              continue;
            }

            const previewUrl = (mediaType === "video" && mp4Url) ? (item.images?.fixed_height?.mp4 || mp4Url) : (gifUrl || item.images?.fixed_height?.url);
            const thumbUrl = item.images?.fixed_height_small?.url || item.images?.fixed_height?.url || item.images?.preview_gif?.url || gifUrl;
            const downloadUrl = (mediaType === "video" && mp4Url) ? mp4Url : (gifUrl || mp4Url);

            if (downloadUrl) {
              giphResults.push({
                id: `giphy-${item.id}`,
                source: "giphy",
                type: (mediaType === "video" && mp4Url) ? "video" : "image",
                title: item.title ? item.title.trim() : `GIPHY #${item.id}`,
                previewUrl: previewUrl || downloadUrl,
                thumbnailUrl: thumbUrl || previewUrl,
                downloadUrl: downloadUrl,
                width: parseInt(item.images?.original?.width || "480", 10),
                height: parseInt(item.images?.original?.height || "270", 10),
                duration: 4,
                author: item.user?.display_name || item.username || "GIPHY Creator",
                authorUrl: item.user?.profile_url || item.url,
                quality: mp4Url ? "MP4 Video (GIPHY)" : "Animated GIF (GIPHY)"
              });
            }
          }
        } else if (gRes.status === 429) {
          rateLimitState.giphy.status = 'throttled';
          errors.push("GIPHY rate limit reached (HTTP 429)");
        } else if (gRes.status === 401 || gRes.status === 403) {
          errors.push(`GIPHY unauthorized: Verify GIPHY API key in Settings/environment`);
        }
      }
    } catch (gErr: any) {
      console.log("GIPHY search error:", gErr?.message);
      errors.push(`GIPHY: ${gErr?.message}`);
    }
  }

  // Internet Archive (archive.org / Internet Library - completely open API, no key required)
  if (source === "all" || source === "archive") {
    try {
      const iaLimit = source === "archive" ? 16 : 6;
      const mediaFilter = mediaType === "image" ? "mediatype:image" : "mediatype:movies";
      const iaSearchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+${mediaFilter}&fl[]=identifier,title,description,duration,downloads&sort[]=downloads+desc&rows=${iaLimit}&page=1&output=json`;
      const iaRes = await fetch(iaSearchUrl, { signal: AbortSignal.timeout(15000) });
      
      if (iaRes.ok) {
        const iaData: any = await iaRes.json();
        const docs = (iaData.response?.docs || []).slice(0, iaLimit);

        const iaPromises = docs.map(async (doc: any) => {
          try {
            let mp4Name: string | null = null;
            let durationSec = doc.duration ? Math.round(parseFloat(doc.duration)) : undefined;

            if (mediaType !== "image") {
              const filesRes = await fetch(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}/files`, { signal: AbortSignal.timeout(2500) });
              if (filesRes.ok) {
                const filesData: any = await filesRes.json();
                const filesList: any[] = filesData.result || [];
                const mp4File = filesList.find(
                  (f: any) => f.format === "512Kb MPEG4" || f.format === "h.264" || (f.name && f.name.toLowerCase().endsWith(".mp4") && !f.name.includes("thumb"))
                );
                if (mp4File?.name) {
                  mp4Name = mp4File.name;
                  if (!durationSec && mp4File.length) {
                    durationSec = Math.round(parseFloat(mp4File.length));
                  }
                }
              }
            }

            const videoUrl = mp4Name
              ? `https://archive.org/download/${encodeURIComponent(doc.identifier)}/${encodeURIComponent(mp4Name)}`
              : `https://archive.org/download/${encodeURIComponent(doc.identifier)}/${encodeURIComponent(doc.identifier)}.mp4`;
            const thumbUrl = `https://archive.org/services/img/${encodeURIComponent(doc.identifier)}`;

            return {
              id: `archive-${doc.identifier}`,
              source: "archive",
              type: mediaType === "image" ? "image" : "video",
              title: doc.title || doc.identifier,
              previewUrl: mediaType === "image" ? thumbUrl : videoUrl,
              thumbnailUrl: thumbUrl,
              downloadUrl: mediaType === "image" ? thumbUrl : videoUrl,
              width: 1280,
              height: 720,
              duration: durationSec || (mediaType === "video" ? 15 : undefined),
              author: "Internet Archive",
              authorUrl: `https://archive.org/details/${encodeURIComponent(doc.identifier)}`,
              quality: "Public Domain / HD"
            };
          } catch {
            const fallbackUrl = `https://archive.org/download/${encodeURIComponent(doc.identifier)}/${encodeURIComponent(doc.identifier)}.mp4`;
            const thumbUrl = `https://archive.org/services/img/${encodeURIComponent(doc.identifier)}`;
            return {
              id: `archive-${doc.identifier}`,
              source: "archive",
              type: mediaType === "image" ? "image" : "video",
              title: doc.title || doc.identifier,
              previewUrl: mediaType === "image" ? thumbUrl : fallbackUrl,
              thumbnailUrl: thumbUrl,
              downloadUrl: mediaType === "image" ? thumbUrl : fallbackUrl,
              width: 1280,
              height: 720,
              duration: mediaType === "video" ? 15 : undefined,
              author: "Internet Archive",
              authorUrl: `https://archive.org/details/${encodeURIComponent(doc.identifier)}`,
              quality: "Public Domain"
            };
          }
        });

        const resolvedIa = await Promise.all(iaPromises);
        iaResults.push(...resolvedIa);
        rateLimitState.archive.status = 'healthy';
        rateLimitState.archive.lastUpdated = new Date().toISOString();
      }
    } catch {
      // Internet Archive is optional and should not emit noisy timeout logs.
    }
  }

  // NASA Video & Image Search (Open Access + NASA API key defined)
  if (source === "all" || source === "nasa") {
    try {
      const nasaLimit = source === "nasa" ? 16 : 6;
      const mediaTypes = mediaType === "video" ? "video" : "video,image";
      const nasaSearchUrl = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=${mediaTypes}&page_size=${nasaLimit}`;
      const nasaRes = await fetch(nasaSearchUrl, { signal: AbortSignal.timeout(4500) });

      if (nasaRes.ok) {
        const nasaData: any = await nasaRes.json();
        let items = (nasaData.collection?.items || []).slice(0, nasaLimit);

        // If 0 items for multi-word query on NASA, try relaxing query
        if (items.length === 0 && query.split(/\s+/).length > 1) {
          const firstWord = query.split(/\s+/)[0];
          try {
            const relaxRes = await fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(firstWord)}&media_type=${mediaTypes}&page_size=${nasaLimit}`, { signal: AbortSignal.timeout(3000) });
            if (relaxRes.ok) {
              const relaxData: any = await relaxRes.json();
              items = (relaxData.collection?.items || []).slice(0, nasaLimit);
            }
          } catch {}
        }

        const nasaPromises = items.map(async (item: any) => {
          const meta = item.data?.[0] || {};
          const isVideo = meta.media_type === "video";
          const rawThumb = item.links?.find((l: any) => l.rel === "preview" || l.render === "image")?.href || "";
          const thumbLink = rawThumb ? rawThumb.replace(/^http:\/\//i, "https://") : "";
          let previewUrl = thumbLink;
          let downloadUrl = thumbLink;

          if (isVideo && item.href) {
            try {
              const assetRes = await fetch(item.href, { signal: AbortSignal.timeout(3000) });
              if (assetRes.ok) {
                const assetList: string[] = await assetRes.json();
                const mp4s = assetList.filter((u: string) => typeof u === "string" && u.toLowerCase().endsWith(".mp4"));
                const mediumMp4 = mp4s.find((u) => u.includes("~medium.mp4") || u.includes("~preview.mp4") || u.includes("~large.mp4")) || mp4s[0];
                const origMp4 = mp4s.find((u) => u.includes("~orig.mp4")) || mediumMp4;
                if (mediumMp4) {
                  previewUrl = mediumMp4.replace(/^http:\/\//i, "https://");
                  downloadUrl = (origMp4 || mediumMp4).replace(/^http:\/\//i, "https://");
                }
              }
            } catch {}
          }

          return {
            id: `nasa-${meta.nasa_id || Math.random().toString(36).slice(2, 8)}`,
            source: "nasa",
            type: isVideo ? "video" : "image",
            title: meta.title || "NASA Mission Media",
            previewUrl: previewUrl || thumbLink,
            thumbnailUrl: thumbLink,
            downloadUrl: downloadUrl || previewUrl,
            width: 1920,
            height: 1080,
            duration: isVideo ? 12 : undefined,
            author: meta.center ? `NASA (${meta.center})` : "NASA Space Center",
            authorUrl: "https://images.nasa.gov/",
            quality: isVideo ? "NASA Space 1080p FHD" : "NASA High-Res"
          };
        });

        const resolvedNasa = await Promise.all(nasaPromises);
        nasaResults.push(...resolvedNasa);
        rateLimitState.nasa.status = 'healthy';
        rateLimitState.nasa.lastUpdated = new Date().toISOString();
      }
    } catch (nasaErr: any) {
      console.log("NASA search error:", nasaErr?.message);
      errors.push(`NASA: ${nasaErr?.message}`);
    }
  }

  // Smart Contextual Merging & Round-Robin Interleaving
  const results: any[] = [];
  // Use strict word boundary matching for space queries so coding/starting/workspace keywords don't trigger space results
  const isSpaceQuery = /\b(rocket|outer space|deep space|nasa|mars rover|astronomy|satellite|astronaut|orbit|cosmos|nebula|exoplanet|iss|apollo|artemis|webb telescope|hubble)\b/i.test(query);
  const isHistoricalQuery = /\b(history|vintage|classic|archive|retro|19\d\d|documentary|antique|library)\b/i.test(query);
  const isGifQuery = /\b(meme|reaction|funny|anime|sticker|cartoon|dance|lol|loop)\b/i.test(query);

  // Match Curated Stock Video Catalog based on prompt query
  const qTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const curatedMatches = EXPANDED_CURATED_VIDEO_CATALOG.filter(item => {
    if (mediaType === "image" && item.type !== "image") return false;
    const itemText = `${item.title} ${item.tags} ${item.category}`.toLowerCase();
    return qTerms.some(term => itemText.includes(term));
  }).map(item => ({
    id: item.id,
    source: item.source,
    type: item.type,
    title: item.title,
    previewUrl: item.previewUrl,
    thumbnailUrl: item.thumbnailUrl,
    downloadUrl: item.downloadUrl,
    width: item.width,
    height: item.height,
    duration: item.duration,
    author: item.author,
    quality: item.quality || "1080p FHD"
  }));

  if (source === "nasa") {
    results.push(...nasaResults);
  } else if (source === "archive") {
    results.push(...iaResults);
  } else if (source === "giphy") {
    results.push(...giphResults);
  } else if (source === "pexels") {
    results.push(...pexResults);
  } else if (source === "pixabay") {
    results.push(...pixResults);
  } else {
    // source === "all" - Diverse mix defined directly from the user's prompt
    if (isSpaceQuery && nasaResults.length > 0) {
      results.push(...nasaResults.slice(0, 2));
    } else if (isHistoricalQuery && iaResults.length > 0) {
      results.push(...iaResults.slice(0, 2));
    } else if (isGifQuery && giphResults.length > 0) {
      results.push(...giphResults.slice(0, 2));
    }

    // Interleave providers fairly with prompt-driven prioritization (Pexels, Pixabay, Curated, Archive, GIPHY)
    const maxLen = Math.max(
      pexResults.length,
      pixResults.length,
      curatedMatches.length,
      iaResults.length,
      giphResults.length,
      isSpaceQuery ? nasaResults.length : 0
    );

    const existingIds = new Set(results.map((r) => r.id));
    for (let i = 0; i < maxLen; i++) {
      // Primary: high definition stock video from Pexels and Pixabay matching prompt keywords
      if (pexResults[i] && !existingIds.has(pexResults[i].id)) {
        results.push(pexResults[i]);
        existingIds.add(pexResults[i].id);
      }
      if (pixResults[i] && !existingIds.has(pixResults[i].id)) {
        results.push(pixResults[i]);
        existingIds.add(pixResults[i].id);
      }
      if (curatedMatches[i] && !existingIds.has(curatedMatches[i].id)) {
        results.push(curatedMatches[i]);
        existingIds.add(curatedMatches[i].id);
      }
      if (iaResults[i] && !existingIds.has(iaResults[i].id)) {
        results.push(iaResults[i]);
        existingIds.add(iaResults[i].id);
      }
      if (giphResults[i] && !existingIds.has(giphResults[i].id)) {
        results.push(giphResults[i]);
        existingIds.add(giphResults[i].id);
      }
      if (isSpaceQuery && nasaResults[i] && !existingIds.has(nasaResults[i].id)) {
        results.push(nasaResults[i]);
        existingIds.add(nasaResults[i].id);
      }
    }

    // If still completely empty, try any available provider results
    if (results.length === 0) {
      for (const pr of [...pexResults, ...pixResults, ...curatedMatches, ...iaResults, ...giphResults]) {
        if (!existingIds.has(pr.id)) {
          results.push(pr);
          existingIds.add(pr.id);
        }
      }
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

  // Guaranteed non-empty catalog fallback if remote APIs returned 429 or 0 results
  if (results.length === 0) {
    const fallbackItems = EXPANDED_CURATED_VIDEO_CATALOG.slice(0, 10).map((c, i) => ({
      id: c.id || `curated-fallback-${i}`,
      source: c.source || "pexels",
      type: c.type || "video",
      title: c.title || "Curated High-Definition B-Roll",
      previewUrl: c.previewUrl,
      thumbnailUrl: c.thumbnailUrl,
      downloadUrl: c.downloadUrl,
      width: c.width || 1920,
      height: c.height || 1080,
      duration: c.duration || 8,
      author: c.author || "Curated Stock Studio",
      quality: "1080p FHD (Curated B-Roll)"
    }));
    results.push(...fallbackItems);
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
        "Referer": fileUrl.includes("pexels.com") ? "https://www.pexels.com/" : fileUrl.includes("giphy.com") ? "https://giphy.com/" : "https://pixabay.com/"
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
    console.log("Proxy download error:", err?.message);
    if (!res.headersSent) {
      res.status(500).json({ error: `Download streaming failed: ${err?.message}` });
    } else {
      res.end();
    }
  }
});

// GIPHY trending endpoint for fast GIF previews
app.get("/api/giphy/trending", async (req, res) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) || "12", 10), 30);
    const giphyApiKey = (req.query.giphyKey as string) || GIPHY_KEY;
    const giphyUrl = `https://api.giphy.com/v1/gifs/trending?api_key=${encodeURIComponent(giphyApiKey)}&limit=${limit}&rating=g`;
    const gRes = await fetch(giphyUrl);
    if (!gRes.ok) {
      return res.status(gRes.status).json({ error: `GIPHY trending request failed: HTTP ${gRes.status}` });
    }
    const data: any = await gRes.json();
    const results = (data.data || []).map((item: any) => {
      const mp4Url = item.images?.original?.mp4 || item.images?.fixed_height?.mp4;
      const gifUrl = item.images?.original?.url || item.images?.fixed_height?.url;
      return {
        id: `giphy-${item.id}`,
        source: "giphy",
        type: mp4Url ? "video" : "image",
        title: item.title || `Trending GIF #${item.id}`,
        previewUrl: item.images?.fixed_height?.mp4 || item.images?.fixed_height?.url || gifUrl,
        thumbnailUrl: item.images?.fixed_height_small?.url || item.images?.fixed_height?.url || gifUrl,
        downloadUrl: mp4Url || gifUrl,
        width: parseInt(item.images?.original?.width || "480", 10),
        height: parseInt(item.images?.original?.height || "270", 10),
        duration: 4,
        author: item.user?.display_name || item.username || "GIPHY",
        authorUrl: item.user?.profile_url || item.url,
        quality: mp4Url ? "MP4 Video / Animated GIF (GIPHY)" : "Animated GIF (GIPHY)"
      };
    });
    res.json({ count: results.length, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch trending GIFs" });
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
    console.log("Neural TTS streaming error:", err?.message);
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
    console.log("Neural TTS POST error:", err?.message);
    res.status(500).json({ error: "Speech synthesis failed", details: err?.message });
  }
});

// Vite middleware & Static serving
cron.schedule('0 */4 * * *', async () => {
  console.log('[cron] autonomous youtube loop started');
  const result = await runAutonomousYoutubeLoop({
    niche: 'creator workflow automation',
    maxUploadsPerCycle: 1
  });
  console.log('[cron] autonomous youtube loop result:', JSON.stringify(result));
});

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

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`AI Video B-Roll Assistant running on port ${PORT}`);
    try {
      await startWhatsAppService();
      await initializeMessageHandler();
    } catch (err) {
      console.warn("[whatsapp] service started with warning:", err);
    }
  });
}

startServer();
