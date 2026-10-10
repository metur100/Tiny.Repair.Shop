// Renders scripts/icon-art.mjs to assets/images/*.png with a headless Chromium-based browser.
// Usage: node scripts/render-icons.mjs   (needs `playwright-core` and Chrome or Edge installed)
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ICONS } from './icon-art.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'assets', 'images');
mkdirSync(out, { recursive: true });

let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  console.error('playwright-core is not installed. Run: npm install --no-save playwright-core');
  process.exit(1);
}

const channel = process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : 'chrome');
const browser = await chromium.launch({ channel });
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const [file, { svg, size }] of Object.entries(ICONS)) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('width="1024" height="1024"', `width="${size}" height="${size}"`)}</body></html>`);
  await page.screenshot({ path: join(out, file), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  console.log('wrote', file);
}
await browser.close();
