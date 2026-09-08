const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');
const newContent = content.replace(
  /const videoUrl = sc\.videoUrl;\s*if \(\!videoUrl\) continue;/g,
  'let videoUrl = sc.videoUrl;\n      if (!videoUrl) videoUrl = "https://invalid.local/force-fallback";'
);
fs.writeFileSync('server.ts', newContent);
