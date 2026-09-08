const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');
const newContent = content.replace(
  /for \(let i = 0; i < scenes\.length; i\+\+\) \{/,
  'for (let i = 0; i < scenes.length; i++) { console.log("SCENE", i, scenes[i]);'
).replace(
  /if \(\!resp \|\| \!resp\.ok\) \{(\s*)throw new Error\("Fallback video download also failed\."\);(\s*)\}/,
  'if (!resp || !resp.ok) { console.log("THREW FALLBACK ERROR"); throw new Error("Fallback video download also failed."); }'
).replace(
  /downloadedClips\.push\(normClipPath\);/g,
  'downloadedClips.push(normClipPath); console.log("PUSHED CLIP", normClipPath);'
).replace(
  /if \(downloadedClips\.length === 0\) \{/,
  'console.log("FINAL CLIPS LENGTH", downloadedClips.length); if (downloadedClips.length === 0) {'
);
fs.writeFileSync('server.ts', newContent);
