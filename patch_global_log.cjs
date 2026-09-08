const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');
const newContent = 'const origLog = console.log; console.log = (...args) => { require("fs").appendFileSync("/tmp/server.log", args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ") + "\\n"); origLog(...args); };\n' + content;
fs.writeFileSync('server.ts', newContent);
