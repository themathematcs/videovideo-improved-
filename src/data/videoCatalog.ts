import { StockMediaItem } from "../types";

export interface VideoCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const VIDEO_CATEGORIES: VideoCategory[] = [
  { id: "all", name: "All Categories", icon: "🎬", description: "All royalty-free stock footage" },
  { id: "productivity", name: "Productivity & Focus", icon: "☕", description: "Clean workspaces, morning routines & focus" },
  { id: "tech", name: "Tech & Coding", icon: "💻", description: "Software engineering, matrix & AI nodes" },
  { id: "business", name: "Business & Finance", icon: "📈", description: "Trading charts, modern skyline & startups" },
  { id: "wellness", name: "Wellness & Nature", icon: "🌿", description: "Meditation, yoga & serene landscapes" },
  { id: "fitness", name: "Fitness & Gym", icon: "⚡", description: "Workouts, athletics & intense training" },
  { id: "culinary", name: "Coffee & Food", icon: "🍳", description: "Espresso, cooking, gourmet dining & cafe" },
  { id: "travel", name: "Travel & Cities", icon: "🏙️", description: "Urban skylines, highways & aerial journeys" },
  { id: "cyber", name: "Cyber & Security", icon: "🛡️", description: "Firewalls, digital threat maps & data rooms" },
  { id: "space", name: "Space & Cosmos", icon: "🚀", description: "Nebulas, rocket launches & planetary orbit" },
  { id: "sports", name: "Sports & Athletics", icon: "🏅", description: "Championship sprints, track & power workouts" }
];

export const EXPANDED_CURATED_VIDEO_CATALOG: (StockMediaItem & { tags: string; category: string })[] = [
  // ==========================================
  // 1. PRODUCTIVITY & ROUTINE & WORKSPACE
  // ==========================================
  {
    id: "curated-prod-01",
    source: "pexels",
    type: "video",
    title: "Minimalist Workspace & Laptop",
    previewUrl: "https://videos.pexels.com/video-files/6391717/6391717-hd_1920_1080_25fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/6391717/6391717-hd_1920_1080_25fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/6391717/pexels-photo-6391717.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 15,
    author: "William Fortunato",
    tags: "productivity routine morning laptop desk workspace focus typing clean minimal office work aesthetic",
    category: "productivity",
    quality: "1080p FHD"
  },
  {
    id: "curated-prod-02",
    source: "pexels",
    type: "video",
    title: "Desk Setup & Coffee Planning",
    previewUrl: "https://videos.pexels.com/video-files/6781557/6781557-hd_1920_1080_25fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/6781557/6781557-hd_1920_1080_25fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/6781557/pexels-photo-6781557.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 14,
    author: "Artem Podrez",
    tags: "coffee morning routine cup desk sunrise warm breakfast productivity peaceful cafe",
    category: "productivity",
    quality: "1080p FHD"
  },
  {
    id: "curated-prod-03",
    source: "pexels",
    type: "video",
    title: "Dual-Monitor High Productivity Setup",
    previewUrl: "https://videos.pexels.com/video-files/34385703/13019808_1920_1080_30fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/34385703/13019808_1920_1080_30fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/34385703/pexels-photo-34385703.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 12,
    author: "Tik Tok Creator",
    tags: "writing journal notebook pen planning goals morning ritual routine schedule focus",
    category: "productivity",
    quality: "1080p FHD"
  },

  // ==========================================
  // 2. TECH & CODING & AI
  // ==========================================
  {
    id: "curated-tech-01",
    source: "pexels",
    type: "video",
    title: "Software Engineer Terminal & Code",
    previewUrl: "https://videos.pexels.com/video-files/33315117/12975971_1920_1080_60fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/33315117/12975971_1920_1080_60fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/33315117/background-computer-code-coding-33315117.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 12,
    author: "Jakub Zerdzicki",
    tags: "coding code terminal developer programmer ai machine learning python javascript software typing",
    category: "tech",
    quality: "1080p FHD"
  },
  {
    id: "curated-tech-02",
    source: "pexels",
    type: "video",
    title: "4K Developer Matrix Interface",
    previewUrl: "https://videos.pexels.com/video-files/34268137/13015486_1920_1080_30fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/34268137/13015486_1920_1080_30fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/34268137/4k-code-coding-computer-34268137.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 16,
    author: "Kirill Levchenko",
    tags: "algorithm server data tech software engineering screens monitors binary glowing",
    category: "tech",
    quality: "1080p FHD"
  },
  {
    id: "curated-tech-03",
    source: "pexels",
    type: "video",
    title: "AI Neural Network Interface",
    previewUrl: "https://videos.pexels.com/video-files/35475054/13054179_1920_1080_30fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/35475054/13054179_1920_1080_30fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/35475054/pexels-photo-35475054.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 15,
    author: "Shutter Break",
    tags: "circuit hardware microchip motherboard electronic high tech cpu gpu processor",
    category: "tech",
    quality: "1080p FHD"
  },

  // ==========================================
  // 3. BUSINESS & FINANCE & CHARTS
  // ==========================================
  {
    id: "curated-biz-01",
    source: "pexels",
    type: "video",
    title: "Stock Market Trading & Growth",
    previewUrl: "https://videos.pexels.com/video-files/8478745/8478745-hd_1920_1080_25fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/8478745/8478745-hd_1920_1080_25fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/8478745/pexels-photo-8478745.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 18,
    author: "ArtHouse Studio",
    tags: "trading stocks finance crypto candlestick chart market economy investment growth money",
    category: "business",
    quality: "1080p FHD"
  },
  {
    id: "curated-biz-02",
    source: "pexels",
    type: "video",
    title: "Corporate Meeting & Analytics",
    previewUrl: "https://videos.pexels.com/video-files/7691558/7691558-hd_1920_1080_25fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/7691558/7691558-hd_1920_1080_25fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/7691558/pexels-photo-7691558.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 15,
    author: "Yan Krukau",
    tags: "business team startup meeting collaboration corporate strategy office discussion",
    category: "business",
    quality: "1080p FHD"
  },

  // ==========================================
  // 4. WELLNESS & NATURE
  // ==========================================
  {
    id: "curated-nature-01",
    source: "pexels",
    type: "video",
    title: "Serene Sunlight Through Forest",
    previewUrl: "https://videos.pexels.com/video-files/38978881/13146419_1920_1080_25fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/38978881/13146419_1920_1080_25fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/38978881/pexels-photo-38978881.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 14,
    author: "C1 Superstar",
    tags: "forest trees sunlight nature green lush peaceful zen calm relaxation morning",
    category: "wellness",
    quality: "1080p FHD"
  },
  {
    id: "curated-nature-02",
    source: "pexels",
    type: "video",
    title: "Alpine Scenic Mountain Landscape",
    previewUrl: "https://videos.pexels.com/video-files/39425155/13155700_1920_1080_30fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/39425155/13155700_1920_1080_30fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/39425155/pexels-photo-39425155.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 16,
    author: "Saqib Rafiq Najar",
    tags: "mountain lake water reflection calm serene peaceful meditation landscape clouds",
    category: "wellness",
    quality: "1080p FHD"
  },

  // ==========================================
  // 5. FITNESS & GYM
  // ==========================================
  {
    id: "curated-fit-01",
    source: "pexels",
    type: "video",
    title: "Intense Athletic Gym Workout",
    previewUrl: "https://videos.pexels.com/video-files/37536686/13106197_1920_1080_25fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/37536686/13106197_1920_1080_25fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/37536686/pexels-photo-37536686.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 14,
    author: "Ds babariya",
    tags: "gym workout training fitness athlete power bodybuilding motivation dumbbells strength",
    category: "fitness",
    quality: "1080p FHD"
  },
  {
    id: "curated-fit-02",
    source: "pexels",
    type: "video",
    title: "Cardio Cycling & Performance",
    previewUrl: "https://videos.pexels.com/video-files/37515281/13105748_1920_1080_25fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/37515281/13105748_1920_1080_25fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/37515281/cycling-fitness-workout-active-37515281.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 15,
    author: "Official Amit",
    tags: "running sprint track athlete morning stamina cardio fitness fast endurance",
    category: "fitness",
    quality: "1080p FHD"
  },

  // ==========================================
  // 6. CULINARY & FOOD
  // ==========================================
  {
    id: "curated-food-01",
    source: "pexels",
    type: "video",
    title: "Gourmet Chef Pan Cooking",
    previewUrl: "https://videos.pexels.com/video-files/854216/free-video-854216.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/854216/free-video-854216.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/854216/free-video-854216.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 15,
    author: "Ela Haney",
    tags: "coffee espresso cafe barista morning steam brewing pouring latte art cafe breakfast",
    category: "culinary",
    quality: "1080p FHD"
  },
  {
    id: "curated-food-02",
    source: "pexels",
    type: "video",
    title: "Fresh Artisan Food Preparation",
    previewUrl: "https://videos.pexels.com/video-files/7457401/7457401-hd_1920_1080_25fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/7457401/7457401-hd_1920_1080_25fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/7457401/cafe-coffee-drink-glass-7457401.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 14,
    author: "Max Medyk",
    tags: "cooking food chef kitchen delicious pasta culinary restaurant fresh vegetables recipe",
    category: "culinary",
    quality: "1080p FHD"
  },

  // ==========================================
  // 7. TRAVEL & CITIES
  // ==========================================
  {
    id: "curated-city-01",
    source: "pexels",
    type: "video",
    title: "Downtown Modern Skyline Drone",
    previewUrl: "https://videos.pexels.com/video-files/12685044/12685044-hd_1920_1080_25fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/12685044/12685044-hd_1920_1080_25fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/12685044/downtown-los-angeles-sunset-skyline-buildings-12685044.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 18,
    author: "CityXcape",
    tags: "city skyline drone aerial skyscrapers urban night sunset metropolis tokyo new york",
    category: "travel",
    quality: "1080p FHD"
  },
  {
    id: "curated-city-02",
    source: "pexels",
    type: "video",
    title: "Aerial Highway & Metropolis Lights",
    previewUrl: "https://videos.pexels.com/video-files/37165732/13095304_1920_1080_30fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/37165732/13095304_1920_1080_30fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/37165732/aerial-view-architecture-buildings-city-37165732.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 16,
    author: "K",
    tags: "travel architecture street culture journey vacation exploring landmarks",
    category: "travel",
    quality: "1080p FHD"
  },

  // ==========================================
  // 8. CYBER & MATRIX
  // ==========================================
  {
    id: "curated-cyber-01",
    source: "pexels",
    type: "video",
    title: "Cyber Shield & Holographic Grid",
    previewUrl: "https://videos.pexels.com/video-files/33503696/12979203_1920_1080_60fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/33503696/12979203_1920_1080_60fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/33503696/pexels-photo-33503696.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 14,
    author: "Nicola Narracci",
    tags: "cyber security firewall hacker hacking digital threat matrix neon server data breach",
    category: "cyber",
    quality: "1080p FHD"
  },
  {
    id: "curated-cyber-02",
    source: "pexels",
    type: "video",
    title: "Matrix Stream & Encryption Tunnel",
    previewUrl: "https://videos.pexels.com/video-files/33503700/12979204_1920_1080_60fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/33503700/12979204_1920_1080_60fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/33503700/pexels-photo-33503700.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 15,
    author: "Nicola Narracci",
    tags: "data stream binary matrix glowing cyber warfare security encryption network",
    category: "cyber",
    quality: "1080p FHD"
  },

  // ==========================================
  // 9. SPACE & COSMOS
  // ==========================================
  {
    id: "curated-space-01",
    source: "pexels",
    type: "video",
    title: "Deep Space Nebula & Glowing Stars",
    previewUrl: "https://videos.pexels.com/video-files/30450505/12861219_1920_1080_60fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/30450505/12861219_1920_1080_60fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/30450505/pexels-photo-30450505.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 16,
    author: "Nicola Narracci",
    tags: "space galaxy stars cosmos nebula universe planet orbit astronomy earth rocket",
    category: "space",
    quality: "1080p FHD"
  },
  {
    id: "curated-space-02",
    source: "pexels",
    type: "video",
    title: "Swirling Galaxy & Cosmic Dust",
    previewUrl: "https://videos.pexels.com/video-files/29790911/12774940_1920_1080_60fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/29790911/12774940_1920_1080_60fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/29790911/pexels-photo-29790911.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 15,
    author: "Nicola Narracci",
    tags: "astronomy cosmic nebula celestial star exploration deep space telescope",
    category: "space",
    quality: "1080p FHD"
  },

  // ==========================================
  // 10. SPORTS & ATHLETICS
  // ==========================================
  {
    id: "curated-sports-01",
    source: "pexels",
    type: "video",
    title: "Sprint Athlete Finish Line Victory",
    previewUrl: "https://videos.pexels.com/video-files/37253080/13098555_1920_1080_25fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/37253080/13098555_1920_1080_25fps.mp4",
    thumbnailUrl: "https://images.pexels.com/videos/37253080/pexels-photo-37253080.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    width: 1920,
    height: 1080,
    duration: 14,
    author: "Harsh & Leena Bansal",
    tags: "sports athlete race sprint stadium running marathon competition track champion",
    category: "sports",
    quality: "1080p FHD"
  }
];
