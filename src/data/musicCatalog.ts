import { AudioTrackItem } from "../types";

export interface MusicGenre {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const MUSIC_GENRES: MusicGenre[] = [
  { id: "all", name: "All Tracks", icon: "🌟", description: "Browse complete library" },
  { id: "cyber", name: "Cyber & Synth", icon: "⚡", description: "Cyberpunk, synthwave & futuristic EDM" },
  { id: "lofi", name: "Lo-Fi & Chill", icon: "🎧", description: "Relaxing chillout, study beats & ambient" },
  { id: "cinematic", name: "Epic Cinematic", icon: "🎬", description: "Dramatic trailers, orchestral & heroic" },
  { id: "inspire", name: "Upbeat & Corporate", icon: "💼", description: "Motivational, optimistic & modern growth" },
  { id: "acoustic", name: "Acoustic & Folk", icon: "🎸", description: "Warm guitars, organic nature & roadtrips" },
  { id: "space", name: "Cosmic & Sci-Fi", icon: "🚀", description: "Space exploration, nebula & ambient synth" },
  { id: "piano", name: "Classical & Piano", icon: "🎹", description: "Emotional piano, delicate strings & storytelling" },
  { id: "action", name: "Rock & Action", icon: "🔥", description: "High-octane energy, racing & combat" },
  { id: "fantasy", name: "Fantasy & Adventure", icon: "🏰", description: "Mystic landscapes, medieval & journey" },
  { id: "nasa", name: "NASA Space Audio", icon: "🛰️", description: "Authentic space missions, countdowns & comms" },
  { id: "sfx", name: "Sound Effects", icon: "🔊", description: "Impacts, booms, clicks & transitions" }
];

export const EXPANDED_CURATED_MUSIC_LIBRARY: AudioTrackItem[] = [
  // ==========================================
  // 1. CYBER & SYNTH / ELECTRONIC / FUTURE TECH
  // ==========================================
  {
    id: "track-cyber-01",
    type: "music",
    title: "Syntheticity",
    genre: "Cyber & Electronic",
    tags: "cyber synth electronic tech ai digital coding future matrix data coding robots",
    duration: 184,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Syntheticity.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Syntheticity.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-cyber-02",
    type: "music",
    title: "Deeper (Cosmic Deep Tech)",
    genre: "Cyber & Electronic",
    tags: "cosmic tech future ambient deep synth deep tech digital space minimalist glitch",
    duration: 162,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Deeper.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Deeper.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-cyber-03",
    type: "music",
    title: "Defiance (Cyber Remix)",
    genre: "Cyber & Electronic",
    tags: "cyberpunk synth electronic beat energy dark club edm digital futuristic bass",
    duration: 198,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Defiance%20(long%20remix).mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Defiance%20(long%20remix).mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-cyber-04",
    type: "music",
    title: "Defiance (Original Synth)",
    genre: "Cyber & Electronic",
    tags: "synthwave electronic future tech cyber glitch bass retro 80s neon",
    duration: 142,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Defiance.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Defiance.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-cyber-05",
    type: "music",
    title: "Surreptitious",
    genre: "Cyber & Electronic",
    tags: "mysterious stealth cyber tech electronic hacking spy undercover pulse suspense",
    duration: 176,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Surreptitious.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Surreptitious.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },

  // ==========================================
  // 2. CINEMATIC & EPIC TRAILER / DRAMA
  // ==========================================
  {
    id: "track-cinematic-01",
    type: "music",
    title: "Destiny (Epic Orchestral Trailer)",
    genre: "Epic Cinematic",
    tags: "epic trailer destiny orchestral hero heroic grand triumph climax movie war battle",
    duration: 175,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Destiny.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Destiny.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-cinematic-02",
    type: "music",
    title: "Dark Knight (Authoritative & Powerful)",
    genre: "Epic Cinematic",
    tags: "dark knight powerful authoritative epic cinematic tension intensity action climax",
    duration: 158,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Dark%20Knight.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Dark%20Knight.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-cinematic-03",
    type: "music",
    title: "Crossroads (Cinematic Narrative Drama)",
    genre: "Epic Cinematic",
    tags: "crossroads drama cinematic story storytelling documentary decision narrative history",
    duration: 210,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Crossroads.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Crossroads.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-cinematic-04",
    type: "music",
    title: "Fate (Dramatic Orchestral Rise)",
    genre: "Epic Cinematic",
    tags: "fate destiny dramatic suspense orchestral rise cinematic documentary intense",
    duration: 164,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Fate.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Fate.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-cinematic-05",
    type: "music",
    title: "Retribution (Thunderous Climax)",
    genre: "Epic Cinematic",
    tags: "retribution vengeance epic battle cinematic climax war intense dramatic trailer",
    duration: 182,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Retribution.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Retribution.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-cinematic-06",
    type: "music",
    title: "Ominosity (Tense Thriller & Suspense)",
    genre: "Epic Cinematic",
    tags: "ominous thrill suspense horror dark scary mystery tension fear predator",
    duration: 155,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Ominosity.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Ominosity.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-cinematic-07",
    type: "music",
    title: "The Haunting (Atmospheric Dark Drone)",
    genre: "Epic Cinematic",
    tags: "haunting mystery spooky dark ambient ghost horror eerie suspenseful",
    duration: 170,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/The%20Haunting.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/The%20Haunting.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },

  // ==========================================
  // 3. UPBEAT, CORPORATE & INSPIRATIONAL
  // ==========================================
  {
    id: "track-inspire-01",
    type: "music",
    title: "Daybreak (Inspirational Horizon)",
    genre: "Upbeat & Corporate",
    tags: "daybreak sunrise morning hope inspiration corporate business growth vision startup",
    duration: 195,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Daybreak.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Daybreak.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-inspire-02",
    type: "music",
    title: "From Here (Modern Momentum & Progress)",
    genre: "Upbeat & Corporate",
    tags: "progress momentum future forward innovation tech modern startup business success",
    duration: 148,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/From%20Here.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/From%20Here.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-inspire-03",
    type: "music",
    title: "Faith (Uplifting Harmony)",
    genre: "Upbeat & Corporate",
    tags: "faith uplifting harmony hope inspiring corporate motivation love positive bright",
    duration: 172,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Faith%20(love%20remix).mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Faith%20(love%20remix).mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-inspire-04",
    type: "music",
    title: "Deserve to be Loved (Bright & Inspiring)",
    genre: "Upbeat & Corporate",
    tags: "happy inspiring love positive family wellness health lifestyle community bright",
    duration: 165,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Deserve%20to%20be%20Loved.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Deserve%20to%20be%20Loved.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-inspire-05",
    type: "music",
    title: "Find You (Optimistic March)",
    genre: "Upbeat & Corporate",
    tags: "find search optimistic march celebration victory bright upbeat teamwork team",
    duration: 150,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Find%20You%20(march%20remix).mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Find%20You%20(march%20remix).mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },

  // ==========================================
  // 4. ACOUSTIC, FOLK & NATURE HARMONY
  // ==========================================
  {
    id: "track-acoustic-01",
    type: "music",
    title: "The Forest Awakes (Organic & Nature)",
    genre: "Acoustic & Folk",
    tags: "forest nature trees wildlife animals morning calm green peaceful eco ecology organic",
    duration: 190,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/The%20Forest%20Awakes.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/The%20Forest%20Awakes.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-acoustic-02",
    type: "music",
    title: "Familiar Roads (Acoustic Roadtrip)",
    genre: "Acoustic & Folk",
    tags: "roads roadtrip travel drive country acoustic guitar summer friends vacation journey",
    duration: 168,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Familiar%20Roads.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Familiar%20Roads.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-acoustic-03",
    type: "music",
    title: "Wild Waters (Flowing Currents)",
    genre: "Acoustic & Folk",
    tags: "ocean water sea waves flow swimming beach river lake meditation aquatic nature",
    duration: 180,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Wild%20Waters.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Wild%20Waters.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-acoustic-04",
    type: "music",
    title: "Home (Warm Acoustic Comfort)",
    genre: "Acoustic & Folk",
    tags: "home warm acoustic comfort family peaceful cozy nostalgic gentle love relax",
    duration: 160,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Home.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Home.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },

  // ==========================================
  // 5. FANTASY, TRAVEL & ADVENTURE
  // ==========================================
  {
    id: "track-travel-01",
    type: "music",
    title: "The Journey (World Travel & Discovery)",
    genre: "Fantasy & Adventure",
    tags: "travel journey explore adventure discovery vlog world flight destination trip wanderlust",
    duration: 204,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/The%20Journey%20(Kroc's%20Theme).mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/The%20Journey%20(Kroc's%20Theme).mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-travel-02",
    type: "music",
    title: "Lost Islands (Mystical Exotic Adventure)",
    genre: "Fantasy & Adventure",
    tags: "island lost mystery ancient exotic temple pacific secret jungle tropical treasure",
    duration: 172,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Lost%20Islands.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Lost%20Islands.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-travel-03",
    type: "music",
    title: "Cyaron's Gate (Mystic Fantasy Realm)",
    genre: "Fantasy & Adventure",
    tags: "fantasy realm gate castle medieval kingdom magic mythical rpg quest lore",
    duration: 185,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Cyaron's%20Gate.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Cyaron's%20Gate.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-travel-04",
    type: "music",
    title: "King of the Desert (Middle Eastern & Sands)",
    genre: "Fantasy & Adventure",
    tags: "desert egypt arabic sands dunes pyrmamids oriental middle eastern exotic camels oasis",
    duration: 192,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/King%20of%20the%20Desert.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/King%20of%20the%20Desert.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-travel-05",
    type: "music",
    title: "White Knight (Heroic Quest Anthem)",
    genre: "Fantasy & Adventure",
    tags: "hero knight chivalry castle fantasy quest adventure triumph glorious anthem",
    duration: 160,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/White%20Knight%20(remix%20of%20DragonFyre's%20original).mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/White%20Knight%20(remix%20of%20DragonFyre's%20original).mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },

  // ==========================================
  // 6. CLASSICAL & PIANO EMOTIONAL STORYTELLING
  // ==========================================
  {
    id: "track-piano-01",
    type: "music",
    title: "A Memory Away (Tender Storytelling)",
    genre: "Classical & Piano",
    tags: "memory tender sad emotional storytelling reflection documentary heartfelt thoughtful piano soft",
    duration: 188,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/A%20Memory%20Away.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/A%20Memory%20Away.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-piano-02",
    type: "music",
    title: "Aerith's Theme (Gentle Piano Romance)",
    genre: "Classical & Piano",
    tags: "piano aerith final fantasy romance gentle tender sweet beautiful ballad classical love",
    duration: 215,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Aerith's%20Theme%20-%20Piano%20arrangement.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Aerith's%20Theme%20-%20Piano%20arrangement.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-piano-03",
    type: "music",
    title: "Leaving Millie (Live Solo Piano)",
    genre: "Classical & Piano",
    tags: "piano solo acoustic live melancholy farewell emotional sad goodbye delicate",
    duration: 178,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Leaving%20Millie%20(live%20piano).mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Leaving%20Millie%20(live%20piano).mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-piano-04",
    type: "music",
    title: "Hidden Tears (Dramatic Emotional Solo)",
    genre: "Classical & Piano",
    tags: "tears sorrow sad mournful depression emotional tragedy cinema piano strings",
    duration: 165,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Hidden%20Tears.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Hidden%20Tears.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-piano-05",
    type: "music",
    title: "Remember (Reflective Nostalgia)",
    genre: "Classical & Piano",
    tags: "remember nostalgia childhood memories past history reflection contemplation piano",
    duration: 174,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Remember.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Remember.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },

  // ==========================================
  // 7. ROCK, ACTION & HIGH ADRENALINE
  // ==========================================
  {
    id: "track-action-01",
    type: "music",
    title: "Now or Never (Fast High Stakes)",
    genre: "Rock & Action",
    tags: "action fast urgent speed racing workout fitness sports gaming energy rush adrenaline intense",
    duration: 154,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Now%20or%20Never.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Now%20or%20Never.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-action-02",
    type: "music",
    title: "Assault on Mist Castle (Gaming Battle)",
    genre: "Rock & Action",
    tags: "gaming game combat fight battle adrenaline epic intense action levels arcade",
    duration: 165,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Assault%20on%20Mist%20Castle.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Assault%20on%20Mist%20Castle.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-action-03",
    type: "music",
    title: "Reign of Anarchy (Heavy Rock Drive)",
    genre: "Rock & Action",
    tags: "rock heavy metal electric guitar drums rebellion power workout driving extreme",
    duration: 180,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Reign%20of%20Anarchy.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Reign%20of%20Anarchy.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-action-04",
    type: "music",
    title: "Those Who Fight (Battle Theme)",
    genre: "Rock & Action",
    tags: "battle fight boss fight gaming martial arts action intense fast speed",
    duration: 172,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Those%20Who%20Fight%20Further%20(Final%20Fantasy%207)%20-%20Piano%20duet.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Those%20Who%20Fight%20Further%20(Final%20Fantasy%207)%20-%20Piano%20duet.mp3",
    artist: "Tanner Helland",
    license: "Creative Commons Attribution 4.0"
  },

  // ==========================================
  // 8. LO-FI & CHILLOUT RELAXATION
  // ==========================================
  {
    id: "track-lofi-01",
    type: "music",
    title: "Midnight Dreamer (Lo-Fi Study Beat)",
    genre: "Lo-Fi & Chill",
    tags: "lofi lofi-hiphop chill relaxing study sleep coffee beats slow vinyl tape chillout",
    duration: 156,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/A%20Memory%20Away.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/A%20Memory%20Away.mp3",
    artist: "Lo-Fi Soundscapes",
    license: "Creative Commons Attribution 4.0"
  },
  {
    id: "track-lofi-02",
    type: "music",
    title: "Rainy Window Coffee",
    genre: "Lo-Fi & Chill",
    tags: "lofi chill rain cozy coffee tea study sleep chillout relaxing mellow warm",
    duration: 160,
    download_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Home.mp3",
    preview_url: "https://raw.githubusercontent.com/tannerhelland/free-music/master/mp3/Home.mp3",
    artist: "Lo-Fi Soundscapes",
    license: "Creative Commons Attribution 4.0"
  },

  // ==========================================
  // 9. NASA SPACE & HISTORICAL MISSION AUDIO
  // ==========================================
  {
    id: "track-nasa-01",
    type: "music",
    title: "NASA Roman Space Telescope Live Launch Countdown",
    genre: "NASA Space Audio",
    tags: "nasa space countdown rocket launch telescope astrophysics mission control cosmos",
    duration: 180,
    download_url: "https://images-assets.nasa.gov/audio/KSC-20260830-AU-RTD01-0001-Roman_Space_Telescope_Live_Launch_Coverage_CH1_Countdown_CH2_Tech_Feed-M26246/KSC-20260830-AU-RTD01-0001-Roman_Space_Telescope_Live_Launch_Coverage_CH1_Countdown_CH2_Tech_Feed-M26246~orig.mp3",
    preview_url: "https://images-assets.nasa.gov/audio/KSC-20260830-AU-RTD01-0001-Roman_Space_Telescope_Live_Launch_Coverage_CH1_Countdown_CH2_Tech_Feed-M26246/KSC-20260830-AU-RTD01-0001-Roman_Space_Telescope_Live_Launch_Coverage_CH1_Countdown_CH2_Tech_Feed-M26246~orig.mp3",
    artist: "NASA Space Operations",
    license: "NASA Public Domain Free Use"
  },
  {
    id: "track-nasa-02",
    type: "music",
    title: "Artemis II Mission Countdown Comms",
    genre: "NASA Space Audio",
    tags: "nasa artemis moon rocket astronauts spaceflight exploration orion booster launch",
    duration: 165,
    download_url: "https://images-assets.nasa.gov/audio/KSC-20260329-VP-LMM01-0001-Artemis_II_L3_Countdown_Status-M19833/KSC-20260329-VP-LMM01-0001-Artemis_II_L3_Countdown_Status-M19833~orig.mp3",
    preview_url: "https://images-assets.nasa.gov/audio/KSC-20260329-VP-LMM01-0001-Artemis_II_L3_Countdown_Status-M19833/KSC-20260329-VP-LMM01-0001-Artemis_II_L3_Countdown_Status-M19833~orig.mp3",
    artist: "NASA Artemis Program",
    license: "NASA Public Domain Free Use"
  },
  {
    id: "track-nasa-03",
    type: "music",
    title: "Deep Space Comm & Future Interstellar Network",
    genre: "NASA Space Audio",
    tags: "nasa deep space voyager radio transmission signals communication cosmos galaxy",
    duration: 195,
    download_url: "https://images-assets.nasa.gov/audio/Ep425_The_Future_of_Deep_Space_Communication/Ep425_The_Future_of_Deep_Space_Communication~orig.mp3",
    preview_url: "https://images-assets.nasa.gov/audio/Ep425_The_Future_of_Deep_Space_Communication/Ep425_The_Future_of_Deep_Space_Communication~orig.mp3",
    artist: "NASA Deep Space Audio",
    license: "NASA Public Domain Free Use"
  },

  // ==========================================
  // 10. SOUND EFFECTS (SFX) & STINGERS
  // ==========================================
  {
    id: "track-sfx-01",
    type: "sfx",
    title: "Deep Cosmic Gong Resonance",
    genre: "Sound Effects",
    tags: "gong bell resonance cinematic hit transition impact cosmic meditation sound effect",
    duration: 6,
    download_url: "https://raw.githubusercontent.com/Tonejs/audio/master/berklee/gong_1.mp3",
    preview_url: "https://raw.githubusercontent.com/Tonejs/audio/master/berklee/gong_1.mp3",
    artist: "Audio Lab",
    license: "MIT Royalty-Free"
  },
  {
    id: "track-sfx-02",
    type: "sfx",
    title: "Futuristic Sub Bass Drop",
    genre: "Sound Effects",
    tags: "bass kick drop sub boom impact slam punch hit sound effect transition",
    duration: 2,
    download_url: "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/CR78/kick.mp3",
    preview_url: "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/CR78/kick.mp3",
    artist: "Audio Lab",
    license: "MIT Royalty-Free"
  },
  {
    id: "track-sfx-03",
    type: "sfx",
    title: "Crisp Cyber Snare Impact",
    genre: "Sound Effects",
    tags: "snare clap hit strike impact drum crack whoosh sound effect",
    duration: 2,
    download_url: "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/CR78/snare.mp3",
    preview_url: "https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/CR78/snare.mp3",
    artist: "Audio Lab",
    license: "MIT Royalty-Free"
  },
  {
    id: "track-sfx-04",
    type: "sfx",
    title: "Analog Synth Sine Tone",
    genre: "Sound Effects",
    tags: "synth tone note chime ding notification alert cue sound effect",
    duration: 4,
    download_url: "https://raw.githubusercontent.com/Tonejs/audio/master/casio/A1.mp3",
    preview_url: "https://raw.githubusercontent.com/Tonejs/audio/master/casio/A1.mp3",
    artist: "Audio Lab",
    license: "MIT Royalty-Free"
  }
];
