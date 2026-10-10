// SVG source of the app icon, adaptive icon layers and splash logo (rendered by render-icons.mjs).

const NAVY = '#1F2A44';

/** The emblem: a mint vintage radio with a brass wrench behind it, in a 1024 box. */
function emblem({ mono = false } = {}) {
  const fill = (c) => (mono ? '#FFFFFF' : c);
  const line = mono ? '#FFFFFF' : NAVY;
  // Wrench: open jaw at the top left, ring end at the bottom right, shaft hidden behind the radio.
  const id = mono ? 'jawMono' : 'jaw';
  return `
  <defs>
    <mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
      <rect width="1024" height="1024" fill="#fff"/>
      <rect x="20" y="478" width="150" height="68" rx="10" fill="#000"/>
      <circle cx="912" cy="512" r="34" fill="#000"/>
    </mask>
  </defs>
  <g transform="rotate(45 512 512)">
    <g mask="url(#${id})">
      <rect x="120" y="474" width="792" height="76" rx="38" fill="${fill('#D4A84A')}" stroke="${line}" stroke-width="22"/>
      <circle cx="120" cy="512" r="104" fill="${fill('#D4A84A')}" stroke="${line}" stroke-width="22"/>
      <circle cx="912" cy="512" r="80" fill="${fill('#D4A84A')}" stroke="${line}" stroke-width="22"/>
      <rect x="120" y="485" width="792" height="54" rx="27" fill="${fill('#D4A84A')}"/>
    </g>
    <path d="M22 478 H170 V546 H22" fill="none" stroke="${line}" stroke-width="20" stroke-linejoin="round"/>
    <circle cx="912" cy="512" r="34" fill="none" stroke="${line}" stroke-width="20"/>
  </g>
  <path d="M352 352 C352 250 672 250 672 352" fill="none" stroke="${line}" stroke-width="58" stroke-linecap="round"/>
  <path d="M352 352 C352 250 672 250 672 352" fill="none" stroke="${fill('#C9902F')}" stroke-width="22" stroke-linecap="round"/>
  <rect x="212" y="340" width="600" height="420" rx="96" fill="${fill('#7FD3B4')}" stroke="${line}" stroke-width="26"/>
  ${mono ? '' : '<rect x="236" y="362" width="552" height="120" rx="70" fill="#FFFFFF" opacity="0.28"/>'}
  <circle cx="390" cy="560" r="128" fill="${fill('#F6D27C')}" stroke="${line}" stroke-width="22"/>
  ${mono ? '' : [96, 70, 44].map((r) => `<circle cx="390" cy="560" r="${r}" fill="none" stroke="#C9902F" stroke-width="12"/>`).join('')}
  <rect x="560" y="450" width="196" height="104" rx="22" fill="${fill('#FFF3D6')}" stroke="${line}" stroke-width="20"/>
  ${mono ? '' : [588, 620, 652, 684, 716].map((x) => `<rect x="${x}" y="470" width="8" height="${x === 652 ? 36 : 22}" rx="4" fill="${NAVY}"/>`).join('')}
  ${mono ? '' : '<rect x="666" y="462" width="14" height="80" rx="7" fill="#EE6352"/>'}
  <circle cx="606" cy="662" r="40" fill="${fill('#F2C14E')}" stroke="${line}" stroke-width="18"/>
  <circle cx="712" cy="662" r="40" fill="${fill('#F2C14E')}" stroke="${line}" stroke-width="18"/>
  ${mono ? '' : '<path d="M606 632 v26 M712 632 v26" stroke="#FFF6E6" stroke-width="12" stroke-linecap="round"/>'}
  ${mono ? '' : sparkle(822, 250, 54, '#FFFFFF') + sparkle(130, 590, 32, '#FFF6E6') + sparkle(900, 560, 28, '#FFF6E6')}`;
}

function sparkle(x, y, r, color) {
  const s = r * 0.28;
  return `<path d="M${x} ${y - r} Q${x + s} ${y - s} ${x + r} ${y} Q${x + s} ${y + s} ${x} ${y + r} Q${x - s} ${y + s} ${x - r} ${y} Q${x - s} ${y - s} ${x} ${y - r} Z" fill="${color}"/>`;
}

const background = `
  <defs>
    <radialGradient id="bg" cx="38%" cy="30%" r="85%">
      <stop offset="0" stop-color="#FFE3B0"/>
      <stop offset="0.55" stop-color="#F9B566"/>
      <stop offset="1" stop-color="#E9792E"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <ellipse cx="512" cy="838" rx="330" ry="44" fill="#9C4E1C" opacity="0.28"/>`;

const svg = (body, size = 1024) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${body}</svg>`;
/** Scales the emblem around the centre (adaptive icons keep art inside the 66% safe zone). */
const scaled = (s, body) => `<g transform="translate(${512 - 512 * s} ${512 - 512 * s}) scale(${s})">${body}</g>`;

export const ICONS = {
  'icon.png': { svg: svg(background + emblem()), size: 1024 },
  'android-icon-background.png': { svg: svg(background), size: 1024 },
  'android-icon-foreground.png': { svg: svg(scaled(0.62, emblem())), size: 1024 },
  'android-icon-monochrome.png': { svg: svg(scaled(0.62, emblem({ mono: true }))), size: 1024 },
  'splash-icon.png': { svg: svg(emblem()), size: 1024 },
  'favicon.png': { svg: svg(background + emblem()), size: 96 },
};
