import type { Category, Clue, DamageId, Difficulty, TaskKind } from './types';

export interface CategoryInfo {
  id: Category;
  name: string;
  plural: string;
  /** MaterialCommunityIcons name. */
  icon: string;
  /** Workshop station that unlocks this category (null = available from the start). */
  station: string | null;
  /** The five visual variants used by jobs. */
  variants: string[];
  /** Which mini-game tasks each damage needs, by difficulty. */
  tasks: Record<Difficulty, TaskKind[]>;
  damages: DamageId[];
  /** Test stage verb shown to the player. */
  test: string;
}

export const CATEGORIES: Record<Category, CategoryInfo> = {
  radio: {
    id: 'radio',
    name: 'Radio',
    plural: 'Old radios',
    icon: 'radio',
    station: null,
    variants: ['Kitchen radio', 'Portable transistor', 'Cathedral radio', 'Boombox', 'Pocket radio'],
    tasks: { easy: ['dial'], medium: ['wires', 'dial'], advanced: ['wires', 'battery', 'dial'] },
    damages: ['static', 'looseWire', 'deadBattery', 'detuned'],
    test: 'Turn it on and tune in a station',
  },
  bicycle: {
    id: 'bicycle',
    name: 'Bicycle',
    plural: 'Bicycles',
    icon: 'bicycle',
    station: 'bikeStand',
    variants: ['City bike', 'BMX', 'Delivery bike', 'Racer', 'Kids’ bike'],
    tasks: { easy: ['pump'], medium: ['chain', 'pump'], advanced: ['chain', 'bolt', 'wheel'] },
    damages: ['chainOff', 'looseBolt', 'flatTire', 'bentWheel'],
    test: 'Take it for a test ride',
  },
  robot: {
    id: 'robot',
    name: 'Robot',
    plural: 'Robots',
    icon: 'robot-happy-outline',
    station: 'robotStation',
    variants: ['Helper bot', 'Round buddy', 'Antenna bot', 'Tracked rover', 'Pocket pal'],
    tasks: { easy: ['robotBattery'], medium: ['circuit', 'robotBattery'], advanced: ['circuit', 'symbols', 'cooling'] },
    damages: ['noPower', 'scrambled', 'overheating'],
    test: 'Wake it up',
  },
  instrument: {
    id: 'instrument',
    name: 'Instrument',
    plural: 'Musical instruments',
    icon: 'guitar-acoustic',
    station: 'musicCorner',
    variants: ['Acoustic guitar', 'Ukulele', 'Violin', 'Banjo', 'Mandolin'],
    tasks: { easy: ['tune'], medium: ['restring', 'tune'], advanced: ['pegs', 'restring', 'tune'] },
    damages: ['brokenString', 'outOfTune', 'loosePeg'],
    test: 'Play a note',
  },
  camera: {
    id: 'camera',
    name: 'Camera',
    plural: 'Cameras',
    icon: 'camera-outline',
    station: 'cameraBench',
    variants: ['Box camera', 'Rangefinder', 'Instant camera', 'Twin-lens camera', 'Folding camera'],
    tasks: { easy: ['lens'], medium: ['lens', 'spring'], advanced: ['spring', 'rings', 'flash'] },
    damages: ['scratchedLens', 'stuckShutter', 'misaligned', 'deadFlash'],
    test: 'Take a photo',
  },
  arcade: {
    id: 'arcade',
    name: 'Arcade',
    plural: 'Arcade machines',
    icon: 'gamepad-variant-outline',
    station: 'arcadeRoom',
    variants: ['Upright cabinet', 'Bartop', 'Cocktail table', 'Mini cabinet', 'Racing cabinet'],
    tasks: { easy: ['power'], medium: ['power', 'buttons'], advanced: ['buttons', 'pixels', 'joystick'] },
    damages: ['unplugged', 'brokenButtons', 'deadPixels', 'stiffJoystick'],
    test: 'Play a quick round',
  },
};

export const CATEGORY_ORDER: Category[] = ['radio', 'bicycle', 'robot', 'instrument', 'camera', 'arcade'];

export const DAMAGE_INFO: Record<DamageId, { name: string; hint: string; sound?: 'static' | 'silence' | 'rattle' | 'buzz' | 'squeak' | 'sourNote' }> = {
  static: { name: 'Noisy static', hint: 'A crackle comes from the speaker.', sound: 'static' },
  looseWire: { name: 'Loose wire', hint: 'A wire inside has come undone.', sound: 'buzz' },
  deadBattery: { name: 'Dead battery', hint: 'The battery is corroded and flat.', sound: 'silence' },
  detuned: { name: 'Lost station', hint: 'The dial slipped off its station.', sound: 'static' },
  chainOff: { name: 'Chain off', hint: 'The chain has slipped off the gears.', sound: 'rattle' },
  looseBolt: { name: 'Loose bolt', hint: 'Something wobbles near the handlebar.', sound: 'rattle' },
  flatTire: { name: 'Flat tyre', hint: 'A tyre is completely flat.', sound: 'squeak' },
  bentWheel: { name: 'Bent wheel', hint: 'The wheel wobbles when it spins.', sound: 'squeak' },
  noPower: { name: 'No power', hint: 'Not a single light comes on.', sound: 'silence' },
  scrambled: { name: 'Scrambled memory', hint: 'It beeps in random patterns.', sound: 'buzz' },
  overheating: { name: 'Overheating', hint: 'It gets hot and switches off.', sound: 'buzz' },
  brokenString: { name: 'Broken string', hint: 'One string is snapped.', sound: 'sourNote' },
  outOfTune: { name: 'Out of tune', hint: 'Every chord sounds sour.', sound: 'sourNote' },
  loosePeg: { name: 'Loose tuning peg', hint: 'A peg spins without resistance.', sound: 'sourNote' },
  scratchedLens: { name: 'Scratched lens', hint: 'Photos come out blurry.', sound: 'silence' },
  stuckShutter: { name: 'Stuck shutter', hint: 'The shutter won’t click.', sound: 'silence' },
  misaligned: { name: 'Misaligned optics', hint: 'The focus rings don’t line up.', sound: 'rattle' },
  deadFlash: { name: 'Dead flash', hint: 'The flash never fires.', sound: 'silence' },
  unplugged: { name: 'Power fault', hint: 'The power cable is torn out.', sound: 'silence' },
  brokenButtons: { name: 'Broken buttons', hint: 'Buttons are cracked or missing.', sound: 'rattle' },
  deadPixels: { name: 'Dead pixels', hint: 'Black spots on the screen.', sound: 'buzz' },
  stiffJoystick: { name: 'Stiff joystick', hint: 'The stick barely moves.', sound: 'squeak' },
};

/** Inspection clue spots for each category (front and back), relevant to a damage or harmless. */
interface Spot {
  x: number;
  y: number;
  side: 'front' | 'back';
  text: string;
}

const CLUE_SPOTS: Record<Category, Partial<Record<DamageId, Spot[]>> & { decoy: Spot[] }> = {
  radio: {
    static: [
      { x: 0.32, y: 0.55, side: 'front', text: 'The speaker cloth buzzes with static.' },
      { x: 0.55, y: 0.6, side: 'back', text: 'A crusty contact near the speaker.' },
    ],
    looseWire: [
      { x: 0.45, y: 0.5, side: 'back', text: 'A red wire is hanging loose!' },
      { x: 0.7, y: 0.62, side: 'back', text: 'A scorch mark by the terminal block.' },
    ],
    deadBattery: [
      { x: 0.3, y: 0.7, side: 'back', text: 'White crust on the battery clips.' },
      { x: 0.72, y: 0.4, side: 'front', text: 'The power lamp stays dark.' },
    ],
    detuned: [
      { x: 0.74, y: 0.45, side: 'front', text: 'The tuning needle is way off the stations.' },
      { x: 0.66, y: 0.7, side: 'front', text: 'The tuning knob slips.' },
    ],
    decoy: [
      { x: 0.2, y: 0.25, side: 'front', text: 'Just a little scratch. Harmless.' },
      { x: 0.8, y: 0.2, side: 'back', text: 'A faded sticker. All fine here.' },
      { x: 0.5, y: 0.88, side: 'front', text: 'The feet are fine.' },
    ],
  },
  bicycle: {
    chainOff: [
      { x: 0.45, y: 0.72, side: 'front', text: 'The chain droops off the front gear.' },
      { x: 0.7, y: 0.75, side: 'back', text: 'Oily marks where the chain dragged.' },
    ],
    looseBolt: [
      { x: 0.62, y: 0.28, side: 'front', text: 'The handlebar bolt turns by hand.' },
      { x: 0.5, y: 0.45, side: 'back', text: 'A rattle near the frame joint.' },
    ],
    flatTire: [
      { x: 0.2, y: 0.72, side: 'front', text: 'The rear tyre squashes flat.' },
      { x: 0.78, y: 0.72, side: 'back', text: 'A tiny thorn in the tread.' },
    ],
    bentWheel: [
      { x: 0.8, y: 0.66, side: 'front', text: 'The front rim wobbles.' },
      { x: 0.25, y: 0.62, side: 'back', text: 'Two spokes are loose.' },
    ],
    decoy: [
      { x: 0.42, y: 0.3, side: 'front', text: 'The saddle is just worn.' },
      { x: 0.85, y: 0.3, side: 'back', text: 'The bell rings fine.' },
      { x: 0.55, y: 0.55, side: 'front', text: 'Paint chip. Cosmetic only.' },
    ],
  },
  robot: {
    noPower: [
      { x: 0.5, y: 0.6, side: 'back', text: 'The battery hatch is empty!' },
      { x: 0.5, y: 0.3, side: 'front', text: 'The eyes stay completely dark.' },
    ],
    scrambled: [
      { x: 0.5, y: 0.55, side: 'front', text: 'The chest screen shows jumbled symbols.' },
      { x: 0.35, y: 0.45, side: 'back', text: 'A memory chip sits crooked.' },
    ],
    overheating: [
      { x: 0.68, y: 0.5, side: 'back', text: 'The fan is clogged with fluff.' },
      { x: 0.32, y: 0.62, side: 'front', text: 'A warm, burnt smell here.' },
    ],
    decoy: [
      { x: 0.25, y: 0.85, side: 'front', text: 'Scuffed feet. Totally normal.' },
      { x: 0.75, y: 0.2, side: 'back', text: 'The antenna bends but works.' },
      { x: 0.8, y: 0.6, side: 'front', text: 'Just a sticker from a fan.' },
    ],
  },
  instrument: {
    brokenString: [
      { x: 0.5, y: 0.45, side: 'front', text: 'A string has snapped and curled.' },
      { x: 0.5, y: 0.8, side: 'back', text: 'The string end is torn at the bridge.' },
    ],
    outOfTune: [
      { x: 0.5, y: 0.6, side: 'front', text: 'The strings sound sour when plucked.' },
      { x: 0.5, y: 0.12, side: 'back', text: 'The pegs have all slipped.' },
    ],
    loosePeg: [
      { x: 0.42, y: 0.1, side: 'front', text: 'One peg spins freely!' },
      { x: 0.58, y: 0.14, side: 'back', text: 'A worn peg hole.' },
    ],
    decoy: [
      { x: 0.35, y: 0.72, side: 'front', text: 'A pick scratch. Adds character.' },
      { x: 0.6, y: 0.6, side: 'back', text: 'The back is solid.' },
      { x: 0.66, y: 0.82, side: 'front', text: 'The bridge is fine.' },
    ],
  },
  camera: {
    scratchedLens: [
      { x: 0.5, y: 0.55, side: 'front', text: 'Fine scratches across the lens.' },
      { x: 0.5, y: 0.5, side: 'back', text: 'The viewfinder image is hazy.' },
    ],
    stuckShutter: [
      { x: 0.78, y: 0.2, side: 'front', text: 'The shutter button is jammed.' },
      { x: 0.4, y: 0.55, side: 'back', text: 'A spring pokes out of the body.' },
    ],
    misaligned: [
      { x: 0.5, y: 0.62, side: 'front', text: 'The focus rings don’t line up.' },
      { x: 0.65, y: 0.45, side: 'back', text: 'Something rattles inside.' },
    ],
    deadFlash: [
      { x: 0.22, y: 0.2, side: 'front', text: 'The flash bulb is dark.' },
      { x: 0.3, y: 0.7, side: 'back', text: 'The flash capacitor is bulging.' },
    ],
    decoy: [
      { x: 0.85, y: 0.75, side: 'front', text: 'Worn leather. Just cosmetic.' },
      { x: 0.7, y: 0.25, side: 'back', text: 'The strap lug is fine.' },
      { x: 0.2, y: 0.6, side: 'front', text: 'A thumb print. Nothing more.' },
    ],
  },
  arcade: {
    unplugged: [
      { x: 0.5, y: 0.9, side: 'back', text: 'The power cable is ripped out!' },
      { x: 0.5, y: 0.3, side: 'front', text: 'The screen is totally black.' },
    ],
    brokenButtons: [
      { x: 0.5, y: 0.6, side: 'front', text: 'Two buttons are cracked.' },
      { x: 0.4, y: 0.55, side: 'back', text: 'Loose button wiring.' },
    ],
    deadPixels: [
      { x: 0.5, y: 0.32, side: 'front', text: 'Black dots on the screen.' },
      { x: 0.6, y: 0.4, side: 'back', text: 'A display ribbon is kinked.' },
    ],
    stiffJoystick: [
      { x: 0.35, y: 0.58, side: 'front', text: 'The joystick barely moves.' },
      { x: 0.35, y: 0.6, side: 'back', text: 'Sticky gunk around the stick base.' },
    ],
    decoy: [
      { x: 0.5, y: 0.08, side: 'front', text: 'The marquee bulb flickers. Fine.' },
      { x: 0.8, y: 0.75, side: 'back', text: 'Old coins rattle in the box.' },
      { x: 0.15, y: 0.75, side: 'front', text: 'Side art is a bit faded.' },
    ],
  },
};

/** Builds the clue spots of a job: both relevant clues of its damage plus two harmless ones. */
export function cluesFor(category: Category, damage: DamageId, seed: number): Clue[] {
  const spots = CLUE_SPOTS[category];
  const relevant = (spots[damage] ?? []).map((s) => ({ ...s, relevant: true }));
  const decoys = spots.decoy.map((s) => ({ ...s, relevant: false }));
  const a = decoys[seed % decoys.length];
  const b = decoys[(seed + 1) % decoys.length];
  return [...relevant, a, b];
}

/** Category of every task (for the repair screen). */
export const TASK_CATEGORY: Record<TaskKind, Category> = {
  wires: 'radio',
  battery: 'radio',
  dial: 'radio',
  chain: 'bicycle',
  bolt: 'bicycle',
  pump: 'bicycle',
  wheel: 'bicycle',
  circuit: 'robot',
  robotBattery: 'robot',
  symbols: 'robot',
  cooling: 'robot',
  tune: 'instrument',
  restring: 'instrument',
  pegs: 'instrument',
  lens: 'camera',
  spring: 'camera',
  rings: 'camera',
  flash: 'camera',
  power: 'arcade',
  buttons: 'arcade',
  pixels: 'arcade',
  joystick: 'arcade',
};

export const TASK_TITLE: Record<TaskKind, { title: string; help: string }> = {
  wires: { title: 'Connect the wires', help: 'Drag each wire to the terminal with the same colour and symbol.' },
  battery: { title: 'Replace the battery', help: 'Drag the new battery into the clips. Tap it to flip it so + meets +.' },
  dial: { title: 'Tune the dial', help: 'Turn the knob until the needle sits on the glowing station, then hold.' },
  chain: { title: 'Fit the chain', help: 'Drag the chain along the path onto both gears.' },
  bolt: { title: 'Tighten the bolt', help: 'Draw circles around the bolt to turn it. Stop in the green zone.' },
  pump: { title: 'Pump the tyre', help: 'Swipe up and down to pump. Stop when the gauge is in the green.' },
  wheel: { title: 'True the wheel', help: 'Drag the wheel until the rim lines up with the guide, then let go.' },
  circuit: { title: 'Connect the circuit', help: 'Link each glowing node to its twin. Keep the heat low!' },
  robotBattery: { title: 'Insert the power cell', help: 'Drag the power cell into the hatch, + side up.' },
  symbols: { title: 'Restore the memory', help: 'Flip the tiles and match the symbol pairs.' },
  cooling: { title: 'Cool the core', help: 'Hold the fan button to cool the core into the green zone. Don’t overcool!' },
  tune: { title: 'Tune the strings', help: 'Turn each peg until its needle rests in the green zone.' },
  restring: { title: 'Fit a new string', help: 'Drag the new string from the bridge up to the peg.' },
  pegs: { title: 'Tighten the pegs', help: 'Draw circles on each loose peg to tighten it.' },
  lens: { title: 'Polish the lens', help: 'Rub the lens in small circles until it sparkles.' },
  spring: { title: 'Replace the shutter spring', help: 'Drag the new spring into the shutter slot.' },
  rings: { title: 'Align the focus rings', help: 'Turn each ring until its mark lines up with the arrow.' },
  flash: { title: 'Test the flash', help: 'Tap the button when the charge needle is in the green.' },
  power: { title: 'Connect the power', help: 'Drag the plug into the socket with the matching shape.' },
  buttons: { title: 'Replace the buttons', help: 'Drag each new button onto the socket of its colour.' },
  pixels: { title: 'Fix the screen', help: 'Tap every dead pixel to revive it.' },
  joystick: { title: 'Test the joystick', help: 'Swipe in the direction of each arrow.' },
};
