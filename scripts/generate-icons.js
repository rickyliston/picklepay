// Generate simple PNG icons for PWA
// This creates a green circle with "PP" text as a simple icon

const fs = require('fs');
const path = require('path');

function createPNG(size) {
  // Create a minimal valid PNG with a green background
  // Using raw PNG creation without external dependencies

  const { createCanvas } = (() => {
    try {
      return require('canvas');
    } catch {
      return { createCanvas: null };
    }
  })();

  if (createCanvas) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Green circle background
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
    ctx.fill();

    // Text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.35}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PP', size/2, size/2);

    return canvas.toBuffer('image/png');
  }

  // Fallback: create a minimal 1x1 green PNG and suggest using an SVG
  // Create SVG instead
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#059669"/>
  <text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="central" font-family="Arial,sans-serif" font-weight="bold" font-size="${size*0.35}" fill="white">PP</text>
</svg>`;

  return svg;
}

// Write SVG icons as fallback (works in all browsers for favicons)
const sizes = [192, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

for (const size of sizes) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#059669"/>
  <text x="${size/2}" y="${size * 0.62}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="${size*0.4}" fill="white">🥒</text>
</svg>`;

  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg);
  console.log(`Created icon-${size}.svg`);
}

console.log('Icons generated. For production, convert SVGs to PNGs using a tool like Inkscape or an online converter.');
