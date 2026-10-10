/** Shared game data types. Everything here is plain, serialisable data. */

export type Category = 'radio' | 'bicycle' | 'robot' | 'instrument' | 'camera' | 'arcade';
export type Difficulty = 'easy' | 'medium' | 'advanced';
export type DirtKind = 'dust' | 'grease' | 'rust' | 'mud';
export type Priority = 'relaxed' | 'normal' | 'urgent';
export type Personality =
  | 'perfectionist'
  | 'sentimental'
  | 'collector'
  | 'student'
  | 'inventor'
  | 'musician'
  | 'busy'
  | 'grandparent';

/** Repair mini-game building blocks. Each object category combines its own set. */
export type TaskKind =
  // Radio
  | 'wires'
  | 'battery'
  | 'dial'
  // Bicycle
  | 'chain'
  | 'bolt'
  | 'pump'
  | 'wheel'
  // Robot
  | 'circuit'
  | 'robotBattery'
  | 'symbols'
  | 'cooling'
  // Instrument
  | 'tune'
  | 'restring'
  | 'pegs'
  // Camera
  | 'lens'
  | 'spring'
  | 'rings'
  | 'flash'
  // Arcade
  | 'power'
  | 'buttons'
  | 'pixels'
  | 'joystick';

export type DamageId =
  | 'static'
  | 'looseWire'
  | 'deadBattery'
  | 'detuned'
  | 'chainOff'
  | 'looseBolt'
  | 'flatTire'
  | 'bentWheel'
  | 'noPower'
  | 'scrambled'
  | 'overheating'
  | 'brokenString'
  | 'outOfTune'
  | 'loosePeg'
  | 'scratchedLens'
  | 'stuckShutter'
  | 'misaligned'
  | 'deadFlash'
  | 'unplugged'
  | 'brokenButtons'
  | 'deadPixels'
  | 'stiffJoystick';

export type PatternId = 'none' | 'stripes' | 'dots' | 'checker' | 'waves' | 'stars';
export type FinishId = 'matte' | 'gloss' | 'metallic' | 'pastel';
export type StickerId = 'heart' | 'star' | 'bolt' | 'flower' | 'note' | 'smile';

export interface Customization {
  baseColor: string;
  accentColor: string;
  pattern: PatternId;
  finish: FinishId;
  stickers: StickerId[];
  accessory: boolean;
}

export interface Clue {
  /** Position on the object art, 0..1 in both axes. */
  x: number;
  y: number;
  /** Which side of the object (the player can turn it around). */
  side: 'front' | 'back';
  text: string;
  /** True for clues that point at the real damage. */
  relevant: boolean;
}

export interface SpecialRequest {
  kind: 'color' | 'pattern' | 'finish' | 'sticker' | 'accessory';
  value: string;
  text: string;
}

export interface Job {
  id: string;
  /** Workshop stage 1..6 (campaign) or 0 for the daily job. */
  stage: number;
  title: string;
  customerId: string;
  category: Category;
  /** Visual variant of the object art (0..4). */
  variant: number;
  objectName: string;
  difficulty: Difficulty;
  priority: Priority;
  damage: DamageId;
  dirt: DirtKind;
  /** 0..1: how much of the object is dirty. */
  dirtAmount: number;
  tasks: TaskKind[];
  reward: number;
  reputation: number;
  /** Rough estimate shown on the job card (minutes of play). */
  minutes: number;
  /** Quality (0..100) the customer hopes for. */
  targetQuality: number;
  request: string;
  special?: SpecialRequest;
  /** Original look of the object (before repair / repaint). */
  original: Customization;
  clues: Clue[];
  /** Rare items show a badge and pay more. */
  rare?: boolean;
}

export interface CustomerLooks {
  skin: string;
  hair: string;
  hairStyle: 'short' | 'long' | 'bun' | 'curly' | 'bald' | 'mohawk';
  shirt: string;
  glasses: boolean;
  hat?: 'beanie' | 'cap' | 'beret';
  beard?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  personality: Personality;
  looks: CustomerLooks;
  prefers: Category;
  /** Short lines used by the dialogue system. */
  lines: {
    greeting: string;
    happy: string;
    delighted: string;
    disappointed: string;
  };
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  /** Reputation needed before it can be bought. */
  reputation: number;
  effect: UpgradeEffect;
}

export type UpgradeEffect =
  | { kind: 'unlockCategory'; category: Category }
  | { kind: 'cleaningBrush'; scale: number }
  | { kind: 'payout'; multiplier: number }
  | { kind: 'happiness'; bonus: number }
  | { kind: 'paintOptions' }
  | { kind: 'repairHelp'; tolerance: number }
  | { kind: 'display' };
