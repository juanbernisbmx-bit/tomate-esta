// Rasterize the original vector logo; keep artwork code-native and reproducible.
const fs = require('node:fs/promises');
const sharp = require('sharp');
async function main() {
  const original = await fs.readFile('public/icon.svg', 'utf8');
  const square = original.replace('rx="40"', 'rx="0"');
  await fs.mkdir('assets', { recursive: true });
  await sharp(Buffer.from(square))
    .resize(1024, 1024)
    .flatten({ background: '#0A0908' })
    .png()
    .toFile('assets/icon.png');
  // Android mask-safe artwork, centered within the inner 66% of the canvas.
  const foreground = await sharp(Buffer.from(original)).resize(640, 640).png().toBuffer();
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#0A0908' } })
    .composite([{ input: foreground, gravity: 'center' }])
    .png()
    .toFile('assets/adaptive-icon.png');
  await sharp(Buffer.from(square)).resize(512, 512).png().toFile('assets/splash.png');
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
