/**
 * Captures raw store screenshots of the real app running on an Android emulator, for every App Store /
 * Google Play size. The emulator display is resized with `wm size` / `wm density`, so every size is a real
 * layout of the app (phones, 7"/10" tablets and the 13" iPad layout), not a scaled copy.
 *
 * Setup (once per session):
 *   1. Start an emulator (e.g. AVD Pixel_10_Pro_XL) and Metro:  npx expo start --go
 *   2. adb reverse tcp:8081 tcp:8081, and open the project once in Expo Go (exp://127.0.0.1:8081)
 *      so it is loaded. Hide Expo Go's floating "Tools button" in its developer menu.
 *   3. node store/tools/capture-screenshots.mjs [device-key]
 *
 * The run loads a mid-game save through the development-only `/?demo=1` route (src/dev/demoSave.ts) and
 * plays real moments: scrubbing a robot clean, connecting a wire, painting a ukulele mint with polka dots,
 * playing its test melody and delivering it. Output: store/screenshots/raw/<device>/NN-name.png.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { DEVICES, ROOT } from './devices.mjs';

const URL = 'exp://127.0.0.1:8081/--/';
const only = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const adb = (...args) => execFileSync('adb', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30000 });
const adbRaw = (...args) => execFileSync('adb', args, { maxBuffer: 64 * 1024 * 1024 });

/** Fixed 9:41 clock, full battery and Wi-Fi, no notifications. */
function demoStatusBar() {
  adb('shell', 'settings', 'put', 'global', 'sysui_demo_allowed', '1');
  const b = (...extra) => adb('shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', ...extra);
  b('enter');
  b('clock', '-e', 'hhmm', '0941');
  b('battery', '-e', 'level', '100', '-e', 'plugged', 'false');
  b('network', '-e', 'mobile', 'hide');
  b('network', '-e', 'wifi', 'show', '-e', 'level', '4', '-e', 'fully', 'true');
  b('notifications', '-e', 'visible', 'false');
}

async function open(route, wait = 4000) {
  adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', `'${URL}${route}'`, 'host.exp.exponent');
  await sleep(wait);
}

/** Opens a route via the workshop so screens that are already on the stack remount fresh. */
async function go(route, wait = 5500) {
  await open('workshop', 1800);
  await open(route, wait);
}

/** All on-screen nodes with their label (content-desc or text) and bounds. */
function nodes() {
  adb('shell', 'uiautomator', 'dump', '/sdcard/ui.xml');
  const xml = adb('shell', 'cat', '/sdcard/ui.xml');
  const out = [];
  for (const m of xml.matchAll(/<node [^>]*>/g)) {
    const tag = m[0];
    const attr = (k) => tag.match(new RegExp(`${k}="([^"]*)"`))?.[1] ?? '';
    const [x1, y1, x2, y2] = attr('bounds').match(/\d+/g).map(Number);
    out.push({ label: attr('content-desc') || attr('text'), x1, y1, x2, y2, cx: (x1 + x2) >> 1, cy: (y1 + y2) >> 1 });
  }
  return out;
}

function find(re) {
  const n = nodes().find((x) => re.test(x.label));
  if (!n) throw new Error(`nothing on screen matches ${re}`);
  return n;
}

/** Taps the first node matching `re`, scrolling down (short phones) until it is on screen. */
async function tap(re, wait = 700) {
  let n = nodes().find((x) => re.test(x.label));
  for (let i = 0; !n && i < 4; i++) {
    const [, h] = adb('shell', 'wm', 'size').match(/(\d+)x(\d+)\s*$/).slice(1).map(Number);
    adb('shell', 'input', 'swipe', '100', String(Math.round(h * 0.75)), '100', String(Math.round(h * 0.35)), '400');
    await sleep(800);
    n = nodes().find((x) => re.test(x.label));
  }
  if (!n) throw new Error(`nothing on screen matches ${re}`);
  adb('shell', 'input', 'tap', String(n.cx), String(n.cy));
  await sleep(wait);
}

function shot(dir, name) {
  fs.writeFileSync(path.join(dir, `${name}.png`), adbRaw('exec-out', 'screencap', '-p'));
  console.log(`  ${path.relative(ROOT, path.join(dir, name))}.png`);
}

async function capture(device) {
  const dir = path.join(ROOT, 'store/screenshots/raw', device.key);
  fs.mkdirSync(dir, { recursive: true });
  const [w, h] = device.px;
  adb('shell', 'wm', 'size', `${w}x${h}`);
  adb('shell', 'wm', 'density', String(device.density));
  await sleep(2500);
  demoStatusBar();

  // Resizing the display makes Expo Go reload the app: let it settle, then load a fresh mid-game save.
  await open('workshop', 15000);
  await open('?demo=1', 6000);
  await go('workshop', 4000);
  shot(dir, '01-workshop');
  await go('customer/s4-2');
  shot(dir, '02-customer');
  await go('jobs');
  shot(dir, '07-jobs');
  await go('collection');
  shot(dir, '08-collection');
  await go('shop');
  shot(dir, '09-upgrades');

  // Cleaning: scrub the left two thirds of the greasy robot.
  await go('repair/s3-3?stage=clean');
  const c = find(/^Dirty /);
  const right = Math.round(c.x1 + (c.x2 - c.x1) * 0.62);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = c.y1 + (c.y2 - c.y1) * 0.12; y < c.y2 - (c.y2 - c.y1) * 0.08; y += (c.y2 - c.y1) / 16) {
      adb('shell', 'input', 'swipe', String(c.x1 + (c.x2 - c.x1) * 0.18), String(Math.round(y)), String(right), String(Math.round(y)), '220');
    }
  }
  await sleep(900);
  shot(dir, '03-cleaning');

  // Repair: connect the first wire of the pocket radio.
  await go('repair/s1-5?stage=repair');
  await tap(/^Wires red circle/, 400);
  await tap(/^Terminals red circle/, 1200);
  shot(dir, '04-repair');

  // Paint the ukulele mint (the customer's request) with polka dots.
  await go('repair/s4-2?stage=paint');
  await tap(/^Mint/);
  await tap(/^Pattern$/);
  await tap(/^Polka dots/, 1200);
  shot(dir, '05-paint');

  // Test: play the seeded melody (So, Do, Mi, Do for job s4-2), then deliver.
  await tap(/^Looks great/, 4500);
  const screen = nodes();
  const pad = (note) => screen.find((n) => n.label === note);
  for (const note of ['So', 'Do', 'Mi', 'Do']) {
    adb('shell', 'input', 'tap', String(pad(note).cx), String(pad(note).cy));
    await sleep(350);
  }
  await sleep(2000);
  await tap(/^Deliver/, 6500);
  shot(dir, '06-results');
}

try {
  for (const device of DEVICES.filter((d) => !only || d.key === only)) {
    console.log(device.store);
    await capture(device);
  }
} finally {
  adb('shell', 'wm', 'size', 'reset');
  adb('shell', 'wm', 'density', 'reset');
}
