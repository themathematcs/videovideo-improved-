const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Revert trace logs
content = content.replace(/for \(let i = 0; i < scenes\.length; i\+\+\) \{ console\.log\("SCENE", i, scenes\[i\]\);/, 'for (let i = 0; i < scenes.length; i++) {');
content = content.replace(/if \(\!resp \|\| \!resp\.ok\) \{ console\.log\("THREW FALLBACK ERROR"\); throw new Error\("Fallback video download also failed\."\); \}/, 'if (!resp || !resp.ok) { throw new Error("Fallback video download also failed."); }');
content = content.replace(/downloadedClips\.push\(normClipPath\); console\.log\("PUSHED CLIP", normClipPath\);/g, 'downloadedClips.push(normClipPath);');
content = content.replace(/console\.log\("FINAL CLIPS LENGTH", downloadedClips\.length\); if \(downloadedClips\.length === 0\) \{/, 'if (downloadedClips.length === 0) {');

// Revert global log intercept
content = content.replace(/^const origLog = console\.log;.*origLog\(\.\.\.args\); \};\n/, '');

// Clean up catch error logging
content = content.replace(/require\("fs"\)\.writeFileSync\("\/app\/clip_error\.log", String\(clipErr\) \+ \(clipErr\.stack \|\| ""\), \{flag:"a"\}\); console\.log\(`Error processing scene clip \$\{i\}:`, clipErr\);/, 'console.error(`Error processing scene clip ${i}:`, clipErr);');

fs.writeFileSync('server.ts', content);
