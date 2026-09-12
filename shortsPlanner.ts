export const CONTENT_PILLARS = ["tech-ai", "unusual-science", "african-history"] as const;
export type ContentPillar = (typeof CONTENT_PILLARS)[number];
export type ShortsHookFormat =
  | "shocking-fact"
  | "hidden-shift"
  | "myth-vs-truth"
  | "before-after"
  | "unresolved-mystery"
  | "counterintuitive-explainer";

export interface ShortsTopicIdea {
  id: string;
  pillar: ContentPillar;
  title: string;
  hook: string;
  hookFormat: ShortsHookFormat;
  payoff: string;
  researchNote: string;
}

const verify = "Factual verification is required before publishing.";

const TOPIC_IDEAS: Record<ContentPillar, ShortsTopicIdea[]> = {
  "tech-ai": [
    ["on-device-small-models", "Small language models on your phone", "Your phone can now run a surprisingly capable language model without sending every word to a server.", "counterintuitive-explainer", "See why smaller models can be faster, more private, and useful offline.", "mobile AI"],
    ["computer-vision-recycling", "The unexpected uses of computer vision", "Computer vision is sorting recycling, reading crops, and spotting defects far beyond the camera roll.", "shocking-fact", "A camera becomes a measurement tool when software learns what patterns mean.", "computer vision"],
    ["ai-chip-memory", "Why AI chips move data instead of just doing math", "The bottleneck in modern AI is often moving numbers through memory, not multiplying them.", "hidden-shift", "Memory architecture explains why specialized chips can beat general processors.", "AI hardware"],
    ["synthetic-data", "When synthetic data trains a real model", "Some AI systems learn from carefully generated examples before they ever see the real world.", "before-after", "Synthetic data can cover rare cases, but it still needs real-world checks.", "synthetic data"],
    ["error-correcting-codes", "The invisible code that saves your downloads", "A file can arrive intact even when pieces disappear because extra mathematics reconstructs the missing bits.", "counterintuitive-explainer", "Error-correcting codes quietly protect storage, broadcasts, and spacecraft messages.", "error correction"],
    ["robotic-grasping", "Why robots still struggle to pick up a cup", "A human hand solves a thousand tiny uncertainties before a robot ever closes its fingers.", "myth-vs-truth", "Grasping combines vision, friction, force, and fast feedback in one delicate loop.", "robot hands"],
    ["federated-learning", "How a model can learn without collecting your photos", "A learning system can improve from many devices while keeping the original examples on those devices.", "hidden-shift", "Federated learning moves updates instead of raw personal data, with important caveats.", "federated learning"],
    ["quantum-error", "The real problem with useful quantum computers", "Quantum bits are powerful in theory, but tiny disturbances can scramble their information.", "unresolved-mystery", "Error correction is the engineering bridge between fragile qubits and reliable computation.", "quantum error correction"],
    ["neural-audio", "How noise cancellation predicts the next sound", "Your earbuds estimate the noise arriving next and create an opposite signal in real time.", "before-after", "The result is a physics trick powered by fast microphones and prediction.", "noise cancelling"],
    ["web-crawlers", "What a search engine actually remembers", "Search engines do not keep the whole web in one giant folder; they build layered indexes of clues.", "myth-vs-truth", "Crawling, indexing, and ranking are separate jobs with different trade-offs.", "search index"],
    ["open-source-models", "Why an open model can be useful even when it is smaller", "A model you can inspect and run yourself can be more useful than a larger model you cannot control.", "counterintuitive-explainer", "Weights, licenses, hardware, and evaluation all shape practical usefulness.", "open source AI"],
    ["ai-benchmark-traps", "The benchmark number that hides the hard part", "A high score can still miss the messy edge cases people encounter outside a test set.", "myth-vs-truth", "Good evaluation mixes benchmarks with transparent failure analysis and real tasks.", "AI evaluation"],
  ].map(([id, title, hook, hookFormat, payoff, subject]) => ({ id, pillar: "tech-ai", title, hook, hookFormat: hookFormat as ShortsHookFormat, payoff, researchNote: `${verify} Topic focus: ${subject}.` })),
  "unusual-science": [
    ["tardigrade-survival", "How tardigrades survive almost drying out", "A microscopic animal can shut down its metabolism and endure conditions that would kill most life.", "shocking-fact", "Tardigrades reveal how biology can pause damage, then restart when water returns.", "tardigrades"],
    ["cosmic-distance-ladder", "How astronomers measure impossible distances", "Astronomers build a cosmic distance ladder because no single ruler reaches across the universe.", "hidden-shift", "Each rung calibrates the next, from nearby stars to distant galaxies.", "cosmic distance ladder"],
    ["octopus-editing", "The animal that edits its own RNA", "Octopuses can alter RNA messages in ways that change how some proteins are made.", "counterintuitive-explainer", "RNA editing helps explain their unusual nervous systems, without turning them into aliens.", "octopus RNA"],
    ["fungal-wood-wide-web", "What forests exchange through fungal networks", "Fungi connect plant roots, but the real exchange is more specific than the internet metaphor suggests.", "myth-vs-truth", "The underground network links ecology, chemistry, and plant competition.", "mycorrhiza"],
    ["water-bear-radiation", "Why a tiny animal tolerates radiation", "Tardigrades do not simply ignore radiation; their cells use unusual protection and repair strategies.", "before-after", "Their survival toolkit gives researchers clues about DNA damage.", "radiation biology"],
    ["blue-whale-heartbeat", "Why a blue whale heartbeat is hard to measure", "The largest animal alive has a heartbeat that researchers can detect only with careful instruments in the wild.", "unresolved-mystery", "Scale changes the timing, physics, and logistics of observing biology.", "blue whale"],
    ["glass-frog-transparency", "How a glass frog hides its blood", "A glass frog becomes more transparent by moving much of its red blood cells out of view.", "shocking-fact", "Transparency is a living trade-off between camouflage and circulation.", "glass frog"],
    ["antarctic-icefish", "The fish that lives without red blood cells", "Antarctic icefish survive with unusual blood chemistry in water cold enough to change the rules.", "counterintuitive-explainer", "Cold, oxygen-rich water makes a rare physiology possible, but not effortless.", "icefish"],
    ["venus-superrotation", "Why Venus spins its atmosphere so fast", "Venus turns slowly, yet its upper atmosphere races around the planet in just a few days.", "hidden-shift", "Atmospheric circulation can move on a very different clock from a planet’s surface.", "Venus atmosphere"],
    ["quantum-tunneling", "Particles crossing a barrier they should not cross", "Quantum tunneling lets particles appear on the other side of an energy barrier without climbing over it.", "myth-vs-truth", "It is probabilistic physics, not a shortcut for people or spaceships.", "quantum tunneling"],
    ["mimic-octopus", "The octopus that imitates several animals", "A mimic octopus changes posture and movement to resemble different predators and prey.", "before-after", "Imitation becomes an adaptive behavior when the sea floor is full of threats.", "mimic octopus"],
    ["lightning-sand", "How lightning can turn sand into glass", "A lightning strike can melt a narrow path through sand and leave a glassy fossil of the discharge.", "shocking-fact", "Fulgurites preserve a physical trace of an electrical storm underground.", "fulgurite"],
  ].map(([id, title, hook, hookFormat, payoff, subject]) => ({ id, pillar: "unusual-science", title, hook, hookFormat: hookFormat as ShortsHookFormat, payoff, researchNote: `${verify} Topic focus: ${subject}.` })),
  "african-history": [
    ["great-zimbabwe-trade", "How Great Zimbabwe became a trading center", "Great Zimbabwe grew into a stone-built center connected to long-distance trade across southern Africa.", "hidden-shift", "Its architecture and trade networks challenge the idea that complex cities needed outside builders.", "Great Zimbabwe trade networks"],
    ["timbuktu-manuscripts", "What the manuscripts of Timbuktu preserve", "Timbuktu’s manuscripts record scholarship, law, science, and everyday intellectual life across centuries.", "shocking-fact", "The collections show a connected West African knowledge economy, not a footnote to elsewhere.", "manuscripts of Timbuktu"],
    ["swahili-city-states", "How Swahili cities connected the Indian Ocean", "Swahili city-states linked African ports to merchants, languages, and goods moving across the Indian Ocean.", "hidden-shift", "Coastal urban life grew through exchange while retaining local identities.", "Swahili city-states"],
    ["mali-gold-trade", "Why Mali’s gold changed medieval trade", "Gold from West Africa helped shape commercial routes that reached across the Sahara and beyond.", "counterintuitive-explainer", "Trade depended on people, routes, institutions, and knowledge—not gold alone.", "Mali gold trade"],
    ["ethiopian-coffee", "The long journey of coffee from Ethiopia", "Coffee’s global story begins with Ethiopian landscapes, cultivation, and the movement of people and plants.", "before-after", "A familiar drink carries a history of ecology, labor, and exchange.", "Ethiopian coffee"],
    ["benin-bronzes", "What the Benin Bronzes actually depict", "The Benin Bronzes are court artworks that preserve histories, ceremonies, and political memory in metal.", "myth-vs-truth", "Reading them as historical records makes their loss and restitution questions concrete.", "Benin Bronzes"],
    ["mansa-musa-pilgrimage", "Why Mansa Musa’s pilgrimage became famous", "Mansa Musa’s pilgrimage connected Mali to a wider world and was recorded by observers far beyond West Africa.", "shocking-fact", "The journey reveals diplomacy, wealth, geography, and the power of reputation.", "Mansa Musa"],
    ["songhai-learning", "How Songhai supported learning in Gao and Timbuktu", "Songhai’s cities supported scholars, merchants, judges, and institutions along major routes.", "hidden-shift", "Urban knowledge networks helped an empire govern a vast and varied region.", "Songhai Empire"],
    ["nubian-pyramids", "Why Nubia built so many pyramids", "Nubian kingdoms built distinctive pyramids that reflect local royal traditions, not copies without context.", "myth-vs-truth", "Their size, shape, and setting point to a long Nubian history of state power.", "Nubian pyramids"],
    ["afrikaans-anti-colonial-press", "How African newspapers shaped political debate", "Print networks gave African writers a platform to argue about rights, education, and self-government.", "counterintuitive-explainer", "The press was an active political technology, not merely a colonial echo.", "African newspapers"],
    ["great-lakes-ironworking", "What ironworking tells us about Great Lakes societies", "Ironworking traditions in the Great Lakes connected skill, status, tools, and local economies.", "before-after", "Material science becomes a window into social organization and regional change.", "Great Lakes ironworking"],
    ["anti-colonial-womens-networks", "How women organized resistance and survival", "Women’s networks shaped resistance, markets, and community survival during periods of colonial pressure.", "unresolved-mystery", "The archives are uneven, so recovering these stories requires careful local sources.", "women’s resistance networks"],
  ].map(([id, title, hook, hookFormat, payoff, subject]) => ({ id, pillar: "african-history", title, hook, hookFormat: hookFormat as ShortsHookFormat, payoff, researchNote: `${verify} Topic focus: ${subject}.` })),
};

export function isContentPillar(value: unknown): value is ContentPillar {
  return typeof value === "string" && (CONTENT_PILLARS as readonly string[]).includes(value);
}

export function getShortsTopicIdeas(pillar: ContentPillar): ShortsTopicIdea[] {
  return TOPIC_IDEAS[pillar].map((idea) => ({ ...idea }));
}

export function normalizeShortsPlanRequest(input: { pillar: unknown; targetDuration?: unknown }) {
  if (!isContentPillar(input.pillar)) {
    throw new Error("Unsupported Shorts pillar. Choose tech-ai, unusual-science, or african-history.");
  }

  const requested = input.targetDuration;
  if (
    typeof requested !== "number" ||
    !Number.isFinite(requested) ||
    !Number.isInteger(requested) ||
    requested < 20 ||
    requested > 32
  ) {
    throw new RangeError("targetDuration must be a whole number from 20 to 32 seconds.");
  }

  return {
    pillar: input.pillar,
    targetDuration: requested,
    aspectRatio: "9:16" as const,
    pacing: "fast" as const,
  };
}

export interface ShortsPlanInput {
  topic: string;
  pillar: ContentPillar;
  targetDuration?: number;
}

export interface ShortsPlanMetadata {
  pillar: ContentPillar;
  hook_format: ShortsHookFormat;
  opening_hook: string;
  payoff: string;
  retention_strategy: string;
  research_note: string;
}

export interface ShortsPlanScene {
  scene_number: number;
  title: string;
  narration: string;
  subtitle: string;
  duration: number;
  visual_brief: string;
  retention_beat: string;
  search_keywords: string;
  transition: string;
}

export interface ShortsFallbackPlan {
  aspect_ratio: "9:16";
  title: string;
  prompt: string;
  full_script: string;
  music_keyword: string;
  total_duration: number;
  voiceover_enabled: boolean;
  subtitles_style: string;
  shorts_metadata: ShortsPlanMetadata;
  scenes: ShortsPlanScene[];
}

function pickIdea(input: ShortsPlanInput): ShortsTopicIdea {
  const ideas = TOPIC_IDEAS[input.pillar];
  const normalized = input.topic.toLowerCase();
  return ideas.find((idea) => normalized.includes(idea.title.toLowerCase().slice(0, 16))) ?? ideas[0];
}

export function buildShortsFallbackPlan(input: ShortsPlanInput): ShortsFallbackPlan {
  const idea = pickIdea(input);
  const topic = input.topic.trim() || idea.title;
  const target = input.targetDuration ?? 30;
  if (!Number.isFinite(target) || !Number.isInteger(target) || target < 20 || target > 32) {
    throw new RangeError("Shorts fallback supports 20–32 seconds; provide a targetDuration in that range.");
  }
  const sceneCount = 8;
  const base = Math.floor(target / sceneCount);
  const remainder = target - base * sceneCount;
  const beats = [
    ["Hook", idea.hook, "Open with a visual question before the answer.", "camera pushes toward the key subject"],
    ["Context", `This is the setup behind ${topic}.`, "Promise the next reveal in one sentence.", "camera tracks across a contextual wide shot"],
    ["Evidence", `The evidence starts with the details researchers can observe about ${topic}.`, "Show a specific detail, not a vague claim.", "camera moves into a close-up of the evidence"],
    ["Evidence", `Those details connect to a wider pattern that makes the story surprising.`, "Change the visual scale to refresh attention.", "camera rises into a measured overhead shot"],
    ["Contrast", `The common assumption misses an important part of ${topic}.`, "Set up the misconception, then hold the correction.", "camera cuts from a familiar image to a contrasting view"],
    ["Contrast", "The careful version is more interesting because it shows what is known and what remains uncertain.", "Use a pause before the qualification.", "camera circles the subject while labels appear"],
    ["Payoff", idea.payoff, "Deliver the promised answer with a concrete takeaway.", "camera settles on the clearest final diagram"],
    ["Payoff", `Save this story and verify the sources before sharing ${topic}.`, "End on a question that invites a thoughtful rewatch.", "camera pulls back from the final visual"],
  ];
  const selected = beats;
  const scenes = selected.map(([title, narration, retention_beat, visual], index) => ({
    scene_number: index + 1,
    title,
    narration,
    subtitle: narration,
    duration: base + (index < remainder ? 1 : 0),
    visual_brief: `${visual}; cinematic vertical composition with clear subject separation.`,
    retention_beat,
    search_keywords: `${topic} ${title.toLowerCase()} ${input.pillar.replace("-", " ")}`,
    transition: index === 0 ? "cut" : index === selected.length - 1 ? "fade" : index % 2 ? "zoom" : "slide",
  }));
  return {
    aspect_ratio: "9:16",
    title: topic,
    prompt: `Create a ${input.pillar} short about ${topic}.`,
    full_script: scenes.map((scene) => scene.narration).join(" "),
    music_keyword: input.pillar === "african-history" ? "warm documentary pulse" : input.pillar === "unusual-science" ? "curious cinematic minimalism" : "precise energetic synth",
    total_duration: scenes.reduce((sum, scene) => sum + scene.duration, 0),
    voiceover_enabled: true,
    subtitles_style: "bold-readable",
    shorts_metadata: {
      pillar: input.pillar,
      hook_format: idea.hookFormat,
      opening_hook: idea.hook,
      payoff: idea.payoff,
      retention_strategy: "Hook, context, evidence, contrast, then payoff with a visual change every few seconds.",
      research_note: idea.researchNote,
    },
    scenes,
  };
}
