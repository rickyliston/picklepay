const sharp = require('sharp');
const path = require('path');

const sizes = [192, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

async function generate() {
  for (const size of sizes) {
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="url(#bg)"/>
  <text x="${size/2}" y="${size * 0.42}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="${size*0.22}" fill="white" letter-spacing="${size*0.01}">PICKLE</text>
  <text x="${size/2}" y="${size * 0.68}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="${size*0.22}" fill="white" opacity="0.9" letter-spacing="${size*0.01}">PAY</text>
</svg>`);

    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}.png`));
    console.log(`Created icon-${size}.png`);
  }

  // Also create a favicon
  const faviconSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#059669"/>
  <text x="16" y="22" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="14" fill="white">P</text>
</svg>`);

  await sharp(faviconSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'favicon.png'));

  // Create ico-like favicon
  await sharp(faviconSvg)
    .resize(32, 32)
    .toFormat('png')
    .toFile(path.join(__dirname, '..', 'src', 'app', 'favicon.ico'));

  console.log('Created favicon');
}

generate().catch(console.error);
