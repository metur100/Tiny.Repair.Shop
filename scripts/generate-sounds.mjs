/**
 * Synthesises every sound effect and the music loop as small 16-bit mono WAV files.
 * Original sounds, no samples: plucks, chimes, clicks and noise bursts built from simple waves.
 *
 *   node scripts/generate-sounds.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const RATE = 22050;
const out = path.resolve(import.meta.dirname, '../assets/sounds');
fs.mkdirSync(out, { recursive: true });

let seed = 7;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

function wav(name, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  let peak = 0;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const gain = peak > 0.95 ? 0.95 / peak : 1;
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i] * gain)) * 32767), 44 + i * 2);
  fs.writeFileSync(path.join(out, `${name}.wav`), buf);
  console.log(`  ${name}.wav  ${(buf.length / 1024).toFixed(1)} KB`);
}

const len = (s) => new Float32Array(Math.round(s * RATE));
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));
const note = (n) => 440 * 2 ** ((n - 69) / 12);

/** Plucked tone (Karplus–Strong). */
function pluck(freq, dur, bright = 0.996) {
  const s = len(dur);
  const p = Math.max(2, Math.round(RATE / freq));
  const ring = Float32Array.from({ length: p }, () => rand() * 2 - 1);
  for (let i = 0; i < s.length; i++) {
    const a = ring[i % p];
    const b = ring[(i + 1) % p];
    ring[i % p] = ((a + b) / 2) * bright;
    s[i] = a;
  }
  return s;
}

/** Bell-like chime from a few inharmonic partials. */
function chime(freq, dur, amp = 0.6) {
  const s = len(dur);
  for (let i = 0; i < s.length; i++) {
    const t = i / RATE;
    s[i] =
      amp *
      env(t, 0.004, dur * 0.35) *
      (Math.sin(2 * Math.PI * freq * t) + 0.45 * Math.sin(2 * Math.PI * freq * 2.76 * t) + 0.2 * Math.sin(2 * Math.PI * freq * 5.4 * t));
  }
  return s;
}

function mix(into, src, at = 0, gain = 1) {
  const o = Math.round(at * RATE);
  for (let i = 0; i < src.length && o + i < into.length; i++) into[o + i] += src[i] * gain;
  return into;
}

function noise(dur, color = 0.5, amp = 0.5, a = 0.002, d = 0.05) {
  const s = len(dur);
  let last = 0;
  for (let i = 0; i < s.length; i++) {
    last = last * color + (rand() * 2 - 1) * (1 - color);
    s[i] = last * amp * env(i / RATE, a, d) * 3;
  }
  return s;
}

function tone(freq, dur, type = 'sine', amp = 0.5, a = 0.005, d = 0.1, slide = 0) {
  const s = len(dur);
  let ph = 0;
  for (let i = 0; i < s.length; i++) {
    const t = i / RATE;
    const f = freq + slide * t;
    ph += (2 * Math.PI * f) / RATE;
    const w = type === 'square' ? Math.sign(Math.sin(ph)) * 0.6 : type === 'tri' ? (2 / Math.PI) * Math.asin(Math.sin(ph)) : Math.sin(ph);
    s[i] = w * amp * env(t, a, d);
  }
  return s;
}

console.log('Sound effects');
wav('tap', tone(880, 0.08, 'sine', 0.5, 0.002, 0.03, -2000));
wav('clean', noise(0.22, 0.65, 0.35, 0.03, 0.08));
{
  const s = len(0.36);
  for (let k = 0; k < 4; k++) mix(s, noise(0.05, 0.2, 0.6, 0.001, 0.012), k * 0.085);
  wav('screw', s);
}
{
  const s = mix(len(0.2), tone(1400, 0.06, 'square', 0.35, 0.001, 0.015));
  mix(s, noise(0.05, 0.1, 0.4, 0.001, 0.01), 0.01);
  wav('wire', s);
}
{
  const s = mix(len(0.4), chime(620, 0.4, 0.45));
  mix(s, noise(0.06, 0.3, 0.4, 0.001, 0.02));
  wav('tool', s);
}
{
  const s = len(0.9);
  [72, 76, 79, 84].forEach((n, i) => mix(s, chime(note(n), 0.6, 0.35), i * 0.09));
  wav('repair', s);
}
{
  const s = len(0.8);
  mix(s, tone(220, 0.6, 'tri', 0.35, 0.2, 0.25, 500));
  mix(s, chime(note(88), 0.3, 0.35), 0.45);
  wav('powerOn', s);
}
{
  const s = len(1.1);
  [76, 79, 83, 88].forEach((n, i) => mix(s, chime(note(n), 0.8, 0.3), i * 0.07));
  wav('happy', s);
}
{
  const s = len(0.5);
  mix(s, chime(note(93), 0.3, 0.4));
  mix(s, chime(note(98), 0.35, 0.4), 0.08);
  wav('coins', s);
}
{
  const s = len(1.4);
  [60, 64, 67, 72, 76].forEach((n, i) => mix(s, pluck(note(n), 1.1, 0.997), i * 0.1, 0.5));
  mix(s, chime(note(84), 0.8, 0.3), 0.55);
  wav('upgrade', s);
}
wav('error', tone(160, 0.25, 'square', 0.3, 0.005, 0.08, -60));
{
  const s = len(0.6);
  [91, 95, 98].forEach((n, i) => mix(s, chime(note(n), 0.35, 0.25), i * 0.06));
  wav('sparkle', s);
}
wav('static', noise(0.9, 0.05, 0.25, 0.05, 0.6));
wav('note', pluck(note(64), 1.2, 0.9975));
{
  const s = len(1.0);
  mix(s, pluck(note(64), 1, 0.996), 0, 0.6);
  mix(s, pluck(note(65.4), 1, 0.996), 0, 0.6);
  wav('sourNote', s);
}
{
  const s = len(0.3);
  mix(s, noise(0.04, 0.1, 0.7, 0.001, 0.008));
  mix(s, noise(0.05, 0.3, 0.5, 0.001, 0.015), 0.07);
  wav('shutter', s);
}
{
  const s = len(0.5);
  for (let k = 0; k < 6; k++) mix(s, noise(0.04, 0.4, 0.4, 0.001, 0.01), k * 0.07 + rand() * 0.02);
  wav('rattle', s);
}
wav('pump', noise(0.25, 0.8, 0.35, 0.02, 0.09));

console.log('Music');
{
  // A gentle 4-chord loop (I–vi–IV–V in F), plucked guitar + soft bass, 8 seconds, loops seamlessly.
  const bpm = 90;
  const beat = 60 / bpm;
  const bars = 4;
  const total = bars * 4 * beat;
  const s = len(total);
  const chords = [
    [53, 57, 60, 65],
    [50, 53, 57, 62],
    [46, 50, 53, 58],
    [48, 52, 55, 60],
  ];
  chords.forEach((c, bar) => {
    const t0 = bar * 4 * beat;
    mix(s, tone(note(c[0] - 12), 4 * beat, 'tri', 0.18, 0.02, 1.2), t0);
    const pattern = [0, 1, 2, 3, 2, 1, 2, 3];
    pattern.forEach((k, i) => mix(s, pluck(note(c[k] + 12), beat * 1.6, 0.995), t0 + i * beat * 0.5, 0.22));
  });
  // Light brush on the off-beats.
  for (let i = 0; i < bars * 4; i++) mix(s, noise(0.08, 0.7, 0.05, 0.005, 0.03), i * beat + beat / 2);
  wav('music', s);
}
