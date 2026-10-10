import { palette } from '@/theme/colors';
import { CATEGORIES, cluesFor } from './objects';
import type { Category, DamageId, Difficulty, DirtKind, Job, Priority, SpecialRequest, TaskKind } from './types';

/** The repair a damage needs first (the rest of a job's tasks come from its category). */
export const PRIMARY_TASK: Record<DamageId, TaskKind> = {
  static: 'dial',
  looseWire: 'wires',
  deadBattery: 'battery',
  detuned: 'dial',
  chainOff: 'chain',
  looseBolt: 'bolt',
  flatTire: 'pump',
  bentWheel: 'wheel',
  noPower: 'robotBattery',
  scrambled: 'symbols',
  overheating: 'cooling',
  brokenString: 'restring',
  outOfTune: 'tune',
  loosePeg: 'pegs',
  scratchedLens: 'lens',
  stuckShutter: 'spring',
  misaligned: 'rings',
  deadFlash: 'flash',
  unplugged: 'power',
  brokenButtons: 'buttons',
  deadPixels: 'pixels',
  stiffJoystick: 'joystick',
};

const TASK_COUNT: Record<Difficulty, number> = { easy: 1, medium: 2, advanced: 3 };
const STAGE_REWARD = [40, 70, 110, 160, 230, 320];
const STAGE_REP = [4, 6, 9, 12, 16, 22];
const DIFF_MULT: Record<Difficulty, number> = { easy: 1, medium: 1.3, advanced: 1.7 };

/** Reputation needed to open each workshop stage. */
export const STAGE_REPUTATION = [0, 18, 48, 95, 160, 245];
export const STAGE_NAMES = ['First Repairs', 'Better Tools', 'Electronics', 'Creative Workshop', 'Advanced Repairs', 'Master Workshop'];

/** Tasks of a job: the damage's own task first, then others of the category up to the difficulty's count. */
export function tasksFor(category: Category, damage: DamageId, difficulty: Difficulty, extra: TaskKind[] = []): TaskKind[] {
  const primary = PRIMARY_TASK[damage];
  const pool = [...CATEGORIES[category].tasks.advanced, ...CATEGORIES[category].tasks.medium, ...CATEGORIES[category].tasks.easy];
  const out: TaskKind[] = [primary];
  for (const t of pool) {
    if (out.length >= TASK_COUNT[difficulty]) break;
    if (!out.includes(t)) out.push(t);
  }
  for (const t of extra) if (!out.includes(t)) out.push(t);
  return out;
}

const ORIGINAL: Record<Category, [string, string]> = {
  radio: [palette.woodLight, palette.mustard],
  bicycle: [palette.sky, palette.navy],
  robot: ['#B8C4D6', palette.orange],
  instrument: [palette.woodLight, palette.woodDark],
  camera: ['#3B3B45', '#C8CCD4'],
  arcade: [palette.navy, palette.coral],
};

interface JobSpec {
  title: string;
  customer: string;
  category: Category;
  variant: number;
  difficulty: Difficulty;
  damage: DamageId;
  dirt: DirtKind;
  dirtAmount: number;
  priority: Priority;
  request: string;
  special?: SpecialRequest;
  rare?: boolean;
  extra?: TaskKind[];
}

const S = (s: JobSpec) => s;

/** The campaign: six workshop stages of five jobs each. */
const STAGES: JobSpec[][] = [
  [
    S({ title: 'Kitchen crackle', customer: 'nana', category: 'radio', variant: 0, difficulty: 'easy', damage: 'detuned', dirt: 'dust', dirtAmount: 0.45, priority: 'relaxed', request: 'My radio only plays static.' }),
    S({ title: 'Flat on campus', customer: 'mia', category: 'bicycle', variant: 0, difficulty: 'easy', damage: 'flatTire', dirt: 'mud', dirtAmount: 0.5, priority: 'urgent', request: 'My tyre went flat on the way to class.' }),
    S({ title: 'Radio for Rosa', customer: 'rosa', category: 'radio', variant: 2, difficulty: 'easy', damage: 'static', dirt: 'dust', dirtAmount: 0.55, priority: 'normal', request: 'It hisses so loudly I can’t hear the songs.' }),
    S({ title: 'Commuter wheels', customer: 'theo', category: 'bicycle', variant: 3, difficulty: 'easy', damage: 'flatTire', dirt: 'mud', dirtAmount: 0.4, priority: 'urgent', request: 'Flat tyre, big meeting. Help!' }),
    S({ title: 'Pocket music', customer: 'kofi', category: 'radio', variant: 4, difficulty: 'medium', damage: 'looseWire', dirt: 'grease', dirtAmount: 0.45, priority: 'normal', request: 'It cuts out whenever I move it.' }),
  ],
  [
    S({ title: 'Wobbly wires', customer: 'rosa', category: 'radio', variant: 1, difficulty: 'medium', damage: 'looseWire', dirt: 'dust', dirtAmount: 0.6, priority: 'relaxed', request: 'The sound comes and goes.' }),
    S({ title: 'Chain reaction', customer: 'ollie', category: 'bicycle', variant: 1, difficulty: 'medium', damage: 'chainOff', dirt: 'grease', dirtAmount: 0.7, priority: 'normal', request: 'My bicycle chain keeps falling off.' }),
    S({ title: 'Dead boombox', customer: 'jonas', category: 'radio', variant: 3, difficulty: 'medium', damage: 'deadBattery', dirt: 'rust', dirtAmount: 0.55, priority: 'normal', request: 'Not a peep out of it. Battery?' }),
    S({ title: 'Delivery day', customer: 'mia', category: 'bicycle', variant: 2, difficulty: 'medium', damage: 'chainOff', dirt: 'mud', dirtAmount: 0.65, priority: 'urgent', request: 'I deliver bread on it. The chain jumped off!' }),
    S({ title: 'Deep clean', customer: 'nana', category: 'radio', variant: 0, difficulty: 'medium', damage: 'static', dirt: 'grease', dirtAmount: 0.85, priority: 'relaxed', request: 'It sat in the attic for years. Can you clean it up?' }),
  ],
  [
    S({ title: 'Sleepy helper', customer: 'tess', category: 'robot', variant: 0, difficulty: 'easy', damage: 'noPower', dirt: 'dust', dirtAmount: 0.5, priority: 'normal', request: 'My robot refuses to wake up.' }),
    S({ title: 'Blurry memories', customer: 'amir', category: 'camera', variant: 0, difficulty: 'easy', damage: 'scratchedLens', dirt: 'dust', dirtAmount: 0.5, priority: 'relaxed', request: 'My camera lens is scratched.' }),
    S({ title: 'Beep boop?', customer: 'felix', category: 'robot', variant: 1, difficulty: 'medium', damage: 'scrambled', dirt: 'grease', dirtAmount: 0.55, priority: 'normal', request: 'It speaks gibberish now.' }),
    S({ title: 'Shutter stuck', customer: 'grace', category: 'camera', variant: 1, difficulty: 'medium', damage: 'stuckShutter', dirt: 'dust', dirtAmount: 0.45, priority: 'urgent', request: 'The shutter won’t click. I shoot a wedding tomorrow!' }),
    S({ title: 'Hot head', customer: 'tess', category: 'robot', variant: 2, difficulty: 'advanced', damage: 'overheating', dirt: 'dust', dirtAmount: 0.7, priority: 'normal', request: 'Prototype 7 keeps overheating.' }),
  ],
  [
    S({ title: 'Gig tonight', customer: 'lena', category: 'instrument', variant: 0, difficulty: 'easy', damage: 'outOfTune', dirt: 'dust', dirtAmount: 0.4, priority: 'urgent', request: 'My guitar is badly out of tune.' }),
    S({
      title: 'Ukulele in mint',
      customer: 'mia',
      category: 'instrument',
      variant: 1,
      difficulty: 'medium',
      damage: 'brokenString',
      dirt: 'dust',
      dirtAmount: 0.5,
      priority: 'normal',
      request: 'A string snapped. Could it be mint green too?',
      special: { kind: 'color', value: 'mint', text: 'Paint it mint green' },
    }),
    S({
      title: 'Polka-dot snaps',
      customer: 'amir',
      category: 'camera',
      variant: 2,
      difficulty: 'medium',
      damage: 'misaligned',
      dirt: 'grease',
      dirtAmount: 0.55,
      priority: 'relaxed',
      request: 'The focus is off. And I’d love polka dots!',
      special: { kind: 'pattern', value: 'dots', text: 'Add a polka-dot pattern' },
    }),
    S({
      title: 'Racer refresh',
      customer: 'theo',
      category: 'bicycle',
      variant: 3,
      difficulty: 'advanced',
      damage: 'bentWheel',
      dirt: 'mud',
      dirtAmount: 0.7,
      priority: 'normal',
      request: 'Bent wheel after a pothole. Make it look fast.',
      special: { kind: 'pattern', value: 'stripes', text: 'Racing stripes' },
    }),
    S({
      title: 'Grandpa’s violin',
      customer: 'hugo',
      category: 'instrument',
      variant: 2,
      difficulty: 'advanced',
      damage: 'loosePeg',
      dirt: 'dust',
      dirtAmount: 0.65,
      priority: 'relaxed',
      request: 'The pegs won’t hold. Keep the original wood, please.',
      special: { kind: 'color', value: 'wood', text: 'Keep it walnut' },
    }),
  ],
  [
    S({ title: 'Game over?', customer: 'jonas', category: 'arcade', variant: 0, difficulty: 'easy', damage: 'unplugged', dirt: 'dust', dirtAmount: 0.6, priority: 'normal', request: 'My arcade machine has no power.' }),
    S({ title: 'Button mash', customer: 'walt', category: 'arcade', variant: 1, difficulty: 'medium', damage: 'brokenButtons', dirt: 'grease', dirtAmount: 0.6, priority: 'relaxed', request: 'Too many high scores. The buttons gave up.' }),
    S({ title: 'Pixel patch', customer: 'vera', category: 'arcade', variant: 2, difficulty: 'advanced', damage: 'deadPixels', dirt: 'dust', dirtAmount: 0.7, priority: 'normal', request: 'Dead pixels on a rare cocktail table. Careful!' }),
    S({ title: 'Flash point', customer: 'olga', category: 'camera', variant: 3, difficulty: 'advanced', damage: 'deadFlash', dirt: 'rust', dirtAmount: 0.6, priority: 'normal', request: 'The flash is dead and the rings are off.' }),
    S({
      title: 'Rover reboot',
      customer: 'felix',
      category: 'robot',
      variant: 3,
      difficulty: 'advanced',
      damage: 'scrambled',
      dirt: 'mud',
      dirtAmount: 0.75,
      priority: 'normal',
      request: 'It drove through a puddle and forgot everything.',
      special: { kind: 'finish', value: 'metallic', text: 'Metallic finish' },
    }),
  ],
  [
    S({
      title: 'The racing legend',
      customer: 'walt',
      category: 'arcade',
      variant: 4,
      difficulty: 'advanced',
      damage: 'stiffJoystick',
      dirt: 'grease',
      dirtAmount: 0.8,
      priority: 'relaxed',
      request: 'The stick on my old racer is stiff as a board.',
      rare: true,
      special: { kind: 'sticker', value: 'star', text: 'A gold star sticker' },
    }),
    S({
      title: 'Banjo heirloom',
      customer: 'hugo',
      category: 'instrument',
      variant: 3,
      difficulty: 'advanced',
      damage: 'brokenString',
      dirt: 'rust',
      dirtAmount: 0.75,
      priority: 'relaxed',
      request: 'A 1920s banjo. Two strings gone, all pegs loose.',
      rare: true,
    }),
    S({
      title: 'Jukebox corner',
      customer: 'kofi',
      category: 'radio',
      variant: 2,
      difficulty: 'advanced',
      damage: 'looseWire',
      dirt: 'dust',
      dirtAmount: 0.8,
      priority: 'normal',
      request: 'Restore my café’s cathedral radio and its little coin buttons.',
      rare: true,
      extra: ['buttons'],
    }),
    S({
      title: 'Golden folding camera',
      customer: 'olga',
      category: 'camera',
      variant: 4,
      difficulty: 'advanced',
      damage: 'misaligned',
      dirt: 'dust',
      dirtAmount: 0.7,
      priority: 'normal',
      request: 'A museum piece. It must be perfect.',
      rare: true,
      special: { kind: 'finish', value: 'gloss', text: 'Gloss finish' },
    }),
    S({
      title: 'Grand restoration',
      customer: 'vera',
      category: 'bicycle',
      variant: 2,
      difficulty: 'advanced',
      damage: 'chainOff',
      dirt: 'rust',
      dirtAmount: 0.9,
      priority: 'relaxed',
      request: 'A vintage delivery bike, rusted solid. Bring it back!',
      rare: true,
      extra: ['pump'],
      special: { kind: 'accessory', value: 'basket', text: 'Add the wicker basket' },
    }),
  ],
];

function buildJob(spec: JobSpec, stage: number, index: number): Job {
  const [base, accent] = ORIGINAL[spec.category];
  const mult = DIFF_MULT[spec.difficulty] * (spec.rare ? 1.5 : 1);
  return {
    id: `s${stage}-${index + 1}`,
    stage,
    title: spec.title,
    customerId: spec.customer,
    category: spec.category,
    variant: spec.variant,
    objectName: CATEGORIES[spec.category].variants[spec.variant],
    difficulty: spec.difficulty,
    priority: spec.priority,
    damage: spec.damage,
    dirt: spec.dirt,
    dirtAmount: spec.dirtAmount,
    tasks: tasksFor(spec.category, spec.damage, spec.difficulty, spec.extra),
    reward: Math.round((STAGE_REWARD[stage - 1] * mult) / 5) * 5,
    reputation: Math.round(STAGE_REP[stage - 1] * mult),
    minutes: 2 + TASK_COUNT[spec.difficulty] + (spec.extra?.length ?? 0),
    targetQuality: spec.difficulty === 'easy' ? 60 : spec.difficulty === 'medium' ? 70 : 80,
    request: spec.request,
    special: spec.special,
    rare: spec.rare,
    original: { baseColor: base, accentColor: accent, pattern: 'none', finish: 'matte', stickers: [], accessory: false },
    clues: cluesFor(spec.category, spec.damage, stage * 7 + index),
  };
}

export const JOBS: Job[] = STAGES.flatMap((jobs, s) => jobs.map((spec, i) => buildJob(spec, s + 1, i)));

export function jobById(id: string): Job | undefined {
  return JOBS.find((j) => j.id === id);
}
