const fs = require('fs');
fetch('http://localhost:3000/api/render-complete-video', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    scenes: [{
      scene_number: 1,
      duration: 5,
      script_line: "Test line",
      search_keywords: "technology",
      overlay_type: "code_block"
    }],
    audioVoice: "alloy",
    aspectRatio: "16:9"
  })
}).then(res => res.text()).then(console.log).catch(console.error);
