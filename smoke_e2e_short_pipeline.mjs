import fs from 'fs';

const baseUrl = 'http://localhost:3000';

const scenes = [
  {
    scene_number: 1,
    title: 'AI workflow sprint',
    script_line: 'Map the learning loop',
    narration: 'Turn scattered ideas into a repeatable creative workflow.',
    subtitle: 'Turn scattered ideas into a repeatable creative workflow.',
    duration: 5,
    search_keywords: 'creative workflow automation',
    videoUrl: 'https://videos.pexels.com/video-files/6391717/6391717-hd_1920_1080_25fps.mp4',
    transition: 'fade',
    overlayData: { style: 'headline' }
  },
  {
    scene_number: 2,
    title: 'Build a production system',
    script_line: 'Turn the workflow into a repeatable system',
    narration: 'Connect strategy, creation, and publishing in one smooth system.',
    subtitle: 'Connect strategy, creation, and publishing in one smooth system.',
    duration: 5,
    search_keywords: 'production system creator pipeline',
    videoUrl: 'https://videos.pexels.com/video-files/6781557/6781557-hd_1920_1080_25fps.mp4',
    transition: 'fade',
    overlayData: { style: 'headline' }
  },
  {
    scene_number: 3,
    title: 'Launch the short',
    script_line: 'Ship your video on the channel',
    narration: 'Publish the short and let analytics guide the next idea.',
    subtitle: 'Publish the short and let analytics guide the next idea.',
    duration: 5,
    search_keywords: 'youtube shorts analytics optimization',
    videoUrl: 'https://videos.pexels.com/video-files/34385703/13019808_1920_1080_30fps.mp4',
    transition: 'fade',
    overlayData: { style: 'headline' }
  }
];

const renderPayload = {
  title: 'AI Workflow Sprint #Shorts',
  aspectRatio: '9:16',
  scenes,
  voice: 'en-US-JennyNeural',
  subtitlesStyle: 'none',
  musicUrl: undefined,
  musicVolume: 0.2
};

console.log('Starting render...');
const renderRes = await fetch(`${baseUrl}/api/render-complete-video`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(renderPayload)
});

if (!renderRes.ok) {
  const text = await renderRes.text();
  console.log('Render HTTP status:', renderRes.status);
  console.log(text);
  process.exit(1);
}

const blob = await renderRes.arrayBuffer();
const buffer = Buffer.from(blob);
fs.writeFileSync('smoke_e2e_short_pipeline.mp4', buffer);
console.log('Rendered bytes:', buffer.length);

const title = 'AI Workflow Sprint Shorts #Shorts';
const description = 'An AI workflow sprint for creative planning, production, and analytics-driven publishing.';
const tags = ['#Shorts', 'ai workflow', 'automation', 'youtube shorts', 'creator system'];
const searchKeywords = ['ai workflow', 'creator system', 'automation', 'youtube shorts'];

const publishPayload = {
  title,
  description,
  tags,
  searchKeywords,
  categoryId: '27',
  privacyStatus: 'private',
  videoDataUrl: `data:video/mp4;base64,${buffer.toString('base64')}`,
  playlistId: undefined
};

console.log('Publishing rendered MP4 to YouTube...');
const publishRes = await fetch(`${baseUrl}/api/youtube/publish`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(publishPayload)
});

const text = await publishRes.text();
console.log('Publish HTTP status:', publishRes.status);
console.log(text);

if (!publishRes.ok) {
  process.exit(1);
}
