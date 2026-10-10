/**
 * Composes the store graphics from the app icon and the raw emulator captures:
 * captioned screenshots for every device size, the Google Play feature graphic and the store icons.
 *
 *   node store/tools/capture-screenshots.mjs   (first; needs the emulator)
 *   node store/tools/render-graphics.mjs       (needs `npm install --no-save playwright-core` and Edge or Chrome)
 */
import fs from 'node:fs';
import path from 'node:path';

import { chromium } from 'playwright-core';

import { DEVICES, ROOT } from './devices.mjs';

const b64 = (file) => fs.readFileSync(file).toString('base64');
const png = (file) => `data:image/png;base64,${b64(file)}`;
const font = (name) => b64(path.join(ROOT, `node_modules/@expo-google-fonts/fredoka/${name}/Fredoka_${name}.ttf`));
const FONTS = `
@font-face { font-family: Fredoka; font-weight: 500; src: url(data:font/ttf;base64,${font('500Medium')}) format('truetype'); }
@font-face { font-family: Fredoka; font-weight: 600; src: url(data:font/ttf;base64,${font('600SemiBold')}) format('truetype'); }
@font-face { font-family: Fredoka; font-weight: 700; src: url(data:font/ttf;base64,${font('700Bold')}) format('truetype'); }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; font-family: Fredoka, sans-serif; }`;

const ICON = path.join(ROOT, 'assets/images/icon.png');
const NAVY = '#1F2A44';

// ── Captioned screenshots ─────────────────────────────────────────────────────────────────────
const SHOTS = {
  '01-workshop': { title: 'Your cozy repair shop', sub: 'It grows with every upgrade you buy' },
  '02-customer': { title: 'Treasures need fixing', sub: 'Friendly customers with special wishes' },
  '03-cleaning': { title: 'Scrub away the grime', sub: 'Dust, grease, rust and mud' },
  '04-repair': { title: 'Fix it with your hands', sub: '22 hands-on repair mini-games' },
  '05-paint': { title: 'Paint it your way', sub: 'Colours, patterns, finishes, stickers' },
  '06-results': { title: 'Make customers smile', sub: 'Before & after, stars and rewards' },
  '07-jobs': { title: 'A new job every day', sub: '30 jobs and a daily special' },
  '08-collection': { title: 'Collect every repair', sub: 'Radios, bikes, robots, cameras & more' },
  '09-upgrades': { title: 'Grow your workshop', sub: '11 upgrades unlock new repairs' },
};
/** Background colour of each caption page (the game's palette), so the set reads as a strip. */
const TINTS = ['#F28C38', '#EE6352', '#7CC6F2', '#7FD3B4', '#F2C14E', '#EE6352', '#F28C38', '#7CC6F2', '#7FD3B4'];

/** Android status bar and gesture bar, cut off so the shots look the same on iOS and Android. */
const crop = (device) => ({ top: Math.round((53 * device.density) / 160), bottom: Math.round((40 * device.density) / 160) });

function captionPage(device, name, file, index) {
  const s = SHOTS[name];
  const [W, H] = device.css;
  const wide = W / H > 0.7;
  const titleSize = Math.round(W * (wide ? 0.058 : 0.082));
  const subSize = Math.round(titleSize * 0.54);
  const { top, bottom } = crop(device);
  const [pw, ph] = device.px;
  // Visible part of the capture in CSS px of the page.
  const shotH = (ph - top - bottom) / device.dpr;
  const shotW = pw / device.dpr;
  const headerH = Math.round(H * 0.18);
  const frameH = H - headerH - Math.round(H * 0.035);
  const scale = Math.min(frameH / shotH, (W * (wide ? 0.82 : 0.86)) / shotW);
  const border = Math.max(3, Math.round(W * 0.012));
  const tint = TINTS[index % TINTS.length];
  return `<style>${FONTS}
    body { width:${W}px; height:${H}px; display:flex; flex-direction:column; align-items:center; position:relative;
      background: radial-gradient(circle at 20% 0%, rgba(255,255,255,0.35), transparent 55%), ${tint}; color:${NAVY}; }
    body::before { content:''; position:absolute; inset:0; opacity:0.18;
      background-image: radial-gradient(${NAVY} 1.2px, transparent 1.4px); background-size: ${Math.round(W * 0.05)}px ${Math.round(W * 0.05)}px; }
    header { position:relative; height:${headerH}px; display:flex; flex-direction:column; justify-content:center; align-items:center;
      text-align:center; padding: 0 ${Math.round(W * 0.06)}px; gap:${Math.round(H * 0.006)}px; }
    h1 { font-weight:700; font-size:${titleSize}px; line-height:1.05; }
    p { font-weight:600; font-size:${subSize}px; opacity:0.85; }
    .frame { position:relative; width:${Math.round(shotW * scale)}px; height:${Math.round(shotH * scale)}px; border-radius:${Math.round(W * (wide ? 0.022 : 0.055))}px;
      overflow:hidden; border:${border}px solid ${NAVY}; box-shadow: 0 ${Math.round(H * 0.012)}px 0 rgba(31,42,68,0.35); background:#FFF6E6; }
    .frame img { position:absolute; left:0; top:${-Math.round(top / device.dpr * scale)}px; width:100%; }
  </style>
  <header><h1>${s.title}</h1><p>${s.sub}</p></header>
  <div class="frame"><img src="${png(file)}"></div>`;
}

// ── Feature graphic (Google Play, 1024 × 500) ─────────────────────────────────────────────────
function featureGraphic() {
  const shot = (n) => png(path.join(ROOT, 'store/screenshots/raw/ios-iphone-6.9', `${n}.png`));
  return `<style>${FONTS}
    body { width:1024px; height:500px; position:relative; color:${NAVY};
      background: radial-gradient(circle at 15% 10%, #FFF6E6 0%, #FFE7C2 45%, #F6C27E 100%); }
    body::before { content:''; position:absolute; inset:0; opacity:0.12;
      background-image: radial-gradient(${NAVY} 1.4px, transparent 1.6px); background-size: 34px 34px; }
    .icon { position:absolute; left:64px; top:62px; width:132px; height:132px; border-radius:30px; border:5px solid ${NAVY};
      box-shadow: 0 8px 0 rgba(31,42,68,0.3); }
    h1 { position:absolute; left:60px; top:214px; font-size:80px; font-weight:700; line-height:0.95; }
    p { position:absolute; left:64px; top:398px; font-size:28px; font-weight:600; }
    .phone { position:absolute; width:196px; height:400px; border-radius:28px; border:6px solid ${NAVY}; overflow:hidden;
      box-shadow: 0 12px 0 rgba(31,42,68,0.3); background-size:cover; background-position:center 4%; background-color:#FFF6E6; }
    .a { left:600px; top:84px; transform: rotate(-7deg); background-image:url(${shot('03-cleaning')}); }
    .b { left:790px; top:40px; transform: rotate(6deg); background-image:url(${shot('06-results')}); }
  </style>
  <img class="icon" src="${png(ICON)}">
  <h1>Tiny<br>Repair Shop</h1>
  <p>Fix it. Clean it. Paint it. Love it.</p>
  <div class="phone a"></div><div class="phone b"></div>`;
}

const iconPage = `<style>${FONTS} img{display:block;width:100%;height:100%}</style><img src="${png(ICON)}">`;

const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : 'chrome', headless: true });
const render = async (html, file, w, h, scale = 1) => {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file });
  await page.close();
  console.log(`  ${path.relative(ROOT, file)}`);
};

try {
  const graphics = path.join(ROOT, 'store/graphics');
  console.log('Store graphics');
  await render(iconPage, path.join(graphics, 'app-store-icon-1024.png'), 1024, 1024);
  await render(iconPage, path.join(graphics, 'play-store-icon-512.png'), 512, 512);
  await render(featureGraphic(), path.join(graphics, 'play-feature-graphic-1024x500.png'), 1024, 500);
  if (process.argv[2] === 'graphics') process.exit(0);

  console.log('Captioned screenshots');
  for (const device of DEVICES) {
    for (const [i, name] of Object.keys(SHOTS).entries()) {
      const raw = path.join(ROOT, 'store/screenshots/raw', device.key, `${name}.png`);
      if (!fs.existsSync(raw)) continue;
      const out = path.join(ROOT, 'store/screenshots', device.key, `${name}.png`);
      await render(captionPage(device, name, raw, i), out, device.css[0], device.css[1], device.dpr);
    }
  }
} finally {
  await browser.close();
}
