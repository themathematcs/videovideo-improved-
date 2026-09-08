const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');
const newContent = content.replace(/console\.log\(`Error processing scene clip \${i}, generating black fallback clip:`, clipErr\);/, 
  'require("fs").writeFileSync("clip_error.log", String(clipErr) + (clipErr.stack || ""), {flag:"a"}); console.log(`Error processing scene clip ${i}...`);');
fs.writeFileSync('server.ts', newContent);
