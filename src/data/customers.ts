import type { Customer, Personality } from './types';

/** Two regulars for each personality. All characters are original. */
export const CUSTOMERS: Customer[] = [
  {
    id: 'olga',
    name: 'Olga Brightwood',
    personality: 'perfectionist',
    looks: { skin: '#F1C7A5', hair: '#6B4A3A', hairStyle: 'bun', shirt: '#2F86C4', glasses: true },
    prefers: 'camera',
    lines: {
      greeting: 'Good morning. I expect this done properly.',
      happy: 'Acceptable. Quite acceptable, actually.',
      delighted: 'Flawless! I could not have done it better myself.',
      disappointed: 'Hmm. I see a few rough edges.',
    },
  },
  {
    id: 'felix',
    name: 'Felix Marsh',
    personality: 'perfectionist',
    looks: { skin: '#C98F6B', hair: '#1F1A17', hairStyle: 'short', shirt: '#3F7D5A', glasses: false, beard: true },
    prefers: 'robot',
    lines: {
      greeting: 'Every screw counts, you know.',
      happy: 'Neat work. The screws are all straight.',
      delighted: 'Exquisite. This is museum quality!',
      disappointed: 'It works… but it could be tidier.',
    },
  },
  {
    id: 'rosa',
    name: 'Rosa Delgado',
    personality: 'sentimental',
    looks: { skin: '#E8B48F', hair: '#3B2416', hairStyle: 'long', shirt: '#EE6352', glasses: false },
    prefers: 'radio',
    lines: {
      greeting: 'This was my mother’s. Please be gentle with it.',
      happy: 'It sounds just like it used to.',
      delighted: 'Oh! It’s like hearing her kitchen again.',
      disappointed: 'It feels a little different now…',
    },
  },
  {
    id: 'amir',
    name: 'Amir Haddad',
    personality: 'sentimental',
    looks: { skin: '#B07A52', hair: '#2A1C14', hairStyle: 'curly', shirt: '#F2C14E', glasses: true },
    prefers: 'camera',
    lines: {
      greeting: 'I took my first photos with this one.',
      happy: 'The memories are safe again.',
      delighted: 'You brought it back to life. Thank you!',
      disappointed: 'Well… it’s something, I suppose.',
    },
  },
  {
    id: 'vera',
    name: 'Vera Quill',
    personality: 'collector',
    looks: { skin: '#F4D3B8', hair: '#B23A48', hairStyle: 'short', shirt: '#7A5AA8', glasses: true, hat: 'beret' },
    prefers: 'arcade',
    lines: {
      greeting: 'A rare piece. Originality matters to me.',
      happy: 'A fine addition to my collection.',
      delighted: 'Mint condition! The pride of my shelf.',
      disappointed: 'The value took a small knock, I fear.',
    },
  },
  {
    id: 'hugo',
    name: 'Hugo Penrose',
    personality: 'collector',
    looks: { skin: '#E2A783', hair: '#C9C9C9', hairStyle: 'bald', shirt: '#8A5A3B', glasses: true, beard: true },
    prefers: 'instrument',
    lines: {
      greeting: 'They don’t make them like this any more.',
      happy: 'Splendid craftsmanship, young one.',
      delighted: 'A true restoration. Bravo!',
      disappointed: 'Not quite period-correct, is it?',
    },
  },
  {
    id: 'mia',
    name: 'Mia Okafor',
    personality: 'student',
    looks: { skin: '#8D5A3B', hair: '#1A1210', hairStyle: 'curly', shirt: '#7FD3B4', glasses: false, hat: 'beanie' },
    prefers: 'bicycle',
    lines: {
      greeting: 'I need it for class tomorrow. Can you help?',
      happy: 'Yes! I’ll make it on time now.',
      delighted: 'This is better than new. You’re the best!',
      disappointed: 'It’ll do. Thanks anyway.',
    },
  },
  {
    id: 'jonas',
    name: 'Jonas Berg',
    personality: 'student',
    looks: { skin: '#F6D2B6', hair: '#E2B54A', hairStyle: 'mohawk', shirt: '#2F86C4', glasses: false, hat: 'cap' },
    prefers: 'arcade',
    lines: {
      greeting: 'Our club’s high-score machine died. Help!',
      happy: 'Game on! The club owes you one.',
      delighted: 'It’s glowing! Everyone is going to freak out.',
      disappointed: 'Okay… mostly works, I guess.',
    },
  },
  {
    id: 'tess',
    name: 'Tess Volt',
    personality: 'inventor',
    looks: { skin: '#E9BE9C', hair: '#3A3A44', hairStyle: 'bun', shirt: '#F28C38', glasses: true },
    prefers: 'robot',
    lines: {
      greeting: 'Prototype 7 needs a second opinion.',
      happy: 'Fascinating fix. I’ll take notes.',
      delighted: 'Brilliant! You improved my design.',
      disappointed: 'The tolerances are a bit off.',
    },
  },
  {
    id: 'ollie',
    name: 'Ollie Sprocket',
    personality: 'inventor',
    looks: { skin: '#C48B66', hair: '#6E3B1F', hairStyle: 'curly', shirt: '#3B3B45', glasses: false, beard: true },
    prefers: 'bicycle',
    lines: {
      greeting: 'I modded it a little. Then a little more.',
      happy: 'Now that’s some clever tinkering.',
      delighted: 'Genius! It runs smoother than my mods.',
      disappointed: 'Huh. I would have wired that differently.',
    },
  },
  {
    id: 'lena',
    name: 'Lena Harp',
    personality: 'musician',
    looks: { skin: '#F3CDB0', hair: '#141414', hairStyle: 'long', shirt: '#B9A3E3', glasses: false },
    prefers: 'instrument',
    lines: {
      greeting: 'My gig is tonight and it sounds awful.',
      happy: 'Listen to that tone!',
      delighted: 'Perfect pitch. I could cry!',
      disappointed: 'It’s a bit off-key, but thanks.',
    },
  },
  {
    id: 'kofi',
    name: 'Kofi Mensah',
    personality: 'musician',
    looks: { skin: '#6E4530', hair: '#141414', hairStyle: 'short', shirt: '#F2C14E', glasses: true },
    prefers: 'radio',
    lines: {
      greeting: 'I need to hear my station again.',
      happy: 'Crisp and clear. Nice.',
      delighted: 'That sound! Pure warm vinyl vibes.',
      disappointed: 'Still a little crackly.',
    },
  },
  {
    id: 'grace',
    name: 'Grace Lin',
    personality: 'busy',
    looks: { skin: '#F2D0B1', hair: '#24180F', hairStyle: 'short', shirt: '#1F2A44', glasses: false },
    prefers: 'camera',
    lines: {
      greeting: 'I have a meeting in an hour. Quick, please!',
      happy: 'Great, done in time.',
      delighted: 'Fast AND perfect? You’re hired.',
      disappointed: 'That took longer than I hoped.',
    },
  },
  {
    id: 'theo',
    name: 'Theo Grant',
    personality: 'busy',
    looks: { skin: '#D9A07A', hair: '#5A3A22', hairStyle: 'short', shirt: '#EE6352', glasses: true },
    prefers: 'bicycle',
    lines: {
      greeting: 'Commute’s ruined. Can we be quick?',
      happy: 'Back on the road. Thanks!',
      delighted: 'Lightning fast. Five stars!',
      disappointed: 'I’ll be late now.',
    },
  },
  {
    id: 'nana',
    name: 'Nana Ruth',
    personality: 'grandparent',
    looks: { skin: '#EFC9AC', hair: '#E6E6E6', hairStyle: 'bun', shirt: '#F2A7B8', glasses: true },
    prefers: 'radio',
    lines: {
      greeting: 'Hello, dear. My old friend stopped talking.',
      happy: 'Lovely, dear. Have a toffee.',
      delighted: 'Oh my! Just like the day I bought it.',
      disappointed: 'Well, it’s still my old friend.',
    },
  },
  {
    id: 'walt',
    name: 'Grandpa Walt',
    personality: 'grandparent',
    looks: { skin: '#E0B08C', hair: '#D8D8D8', hairStyle: 'bald', shirt: '#7FD3B4', glasses: true, hat: 'cap', beard: true },
    prefers: 'arcade',
    lines: {
      greeting: 'I set the high score on this in ’82.',
      happy: 'Time to defend my record!',
      delighted: 'Ha! Feels like ’82 all over again!',
      disappointed: 'Not quite how I remember it.',
    },
  },
];

export const PERSONALITY_LABEL: Record<Personality, string> = {
  perfectionist: 'The perfectionist',
  sentimental: 'Sentimental owner',
  collector: 'The collector',
  student: 'The student',
  inventor: 'The inventor',
  musician: 'The musician',
  busy: 'Busy professional',
  grandparent: 'Nostalgic grandparent',
};

export function customerById(id: string): Customer {
  const c = CUSTOMERS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown customer ${id}`);
  return c;
}
