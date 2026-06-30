import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import toIco from 'to-ico';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'public', 'RKN.png');
const outDir = join(root, 'public', 'pwa');
const maskableBackground = '#000000';

const icons = [
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'android-chrome-192x192.png', size: 192 },
  { file: 'android-chrome-512x512.png', size: 512 },
  { file: 'maskable-icon-512x512.png', size: 512, maskable: true },
];

await mkdir(outDir, { recursive: true });

for (const icon of icons) {
  const target = join(outDir, icon.file);

  if (icon.maskable) {
    const inner = Math.round(icon.size * 0.8);
    const inset = Math.round((icon.size - inner) / 2);
    const resized = await sharp(source).resize(inner, inner).png().toBuffer();

    await sharp({
      create: {
        width: icon.size,
        height: icon.size,
        channels: 4,
        background: maskableBackground,
      },
    })
      .composite([{ input: resized, left: inset, top: inset }])
      .png()
      .toFile(target);
  } else {
    await sharp(source).resize(icon.size, icon.size).png().toFile(target);
  }

  console.log(`wrote ${icon.file}`);
}

const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icoBuffers = await Promise.all(
  icoSizes.map((size) => sharp(source).resize(size, size).png().toBuffer()),
);
const ico = await toIco(icoBuffers);
await writeFile(join(root, 'public', 'RKN.ico'), ico);
console.log('wrote RKN.ico');
