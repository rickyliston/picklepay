const fs = require('fs');
const path = require('path');

// Create a simple PNG with a green rounded rectangle and paddle emoji
// This uses a minimal approach without canvas dependency

function createSimplePNG(size) {
  // Create an SVG, then we'll use it as the icon
  // Many PWA implementations accept SVG, and for PNG we'd need canvas
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="url(#bg)"/>
  <text x="${size/2}" y="${size * 0.42}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="${size*0.22}" fill="white" letter-spacing="${size*0.01}">PICKLE</text>
  <text x="${size/2}" y="${size * 0.68}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="${size*0.22}" fill="white" opacity="0.9" letter-spacing="${size*0.01}">PAY</text>
</svg>`;
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

[192, 512].forEach(size => {
  const svg = createSimplePNG(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg);
  console.log(`Created icon-${size}.svg`);
});

console.log('Done! Update manifest.json to use .svg if needed, or convert to .png for full compatibility.');
