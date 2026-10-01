const fs = require('fs');
const path = require('path');

function getHtmlFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(getHtmlFiles(full));
    } else if (item.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

async function check() {
  const htmlFiles = getHtmlFiles('docs/demos');
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const imageUsages = [];

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      const src = match[1];
      if (src.startsWith('http')) {
        imageUsages.push({ file, src });
      }
    }
  }

  console.log(`Found ${imageUsages.length} external image tags across all demo pages.`);

  for (const item of imageUsages) {
    try {
      const res = await fetch(item.src, { method: 'HEAD' });
      if (res.status >= 400) {
        console.log(`❌ BROKEN [${res.status}]: ${item.src} in ${item.file}`);
      } else {
        console.log(`✅ OK [${res.status}]: ${item.src.slice(0, 60)}...`);
      }
    } catch (err) {
      console.log(`❌ ERROR: ${item.src} in ${item.file} (${err.message})`);
    }
  }
}

check();
