const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');
const newContent = content.replace(/console\.error\(\`Error processing scene clip \$\{i\}:\`, clipErr\);/, 
  'require("fs").writeFileSync("/app/clip_error.log", String(clipErr) + (clipErr.stack || ""), {flag:"a"}); console.log(`Error processing scene clip ${i}:`, clipErr);');
fs.writeFileSync('server.ts', newContent);
