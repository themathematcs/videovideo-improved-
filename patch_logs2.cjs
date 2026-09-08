const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');
const newContent = content.replace(/console\.log\(\`Error processing scene clip \$\{i\}\.\.\.\`\);/, 
  'console.error(`Error processing scene clip ${i}:`, clipErr);');
fs.writeFileSync('server.ts', newContent);
