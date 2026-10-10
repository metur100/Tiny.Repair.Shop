import type { Upgrade } from './types';

/** Stations and improvements, roughly in the order the player can afford them. */
export const UPGRADES: Upgrade[] = [
  { id: 'cleaningStation', name: 'Cleaning station', description: 'A sink and soft brushes. Your cleaning brush is 35% bigger.', cost: 120, reputation: 0, effect: { kind: 'cleaningBrush', scale: 1.35 } },
  { id: 'toolBench', name: 'Pro tool bench', description: 'Quality tools make dials, timing and alignment more forgiving.', cost: 220, reputation: 10, effect: { kind: 'repairHelp', tolerance: 0.25 } },
  { id: 'robotStation', name: 'Robot repair station', description: 'Diagnostics rig and soldering arm. Unlocks robot jobs.', cost: 320, reputation: 40, effect: { kind: 'unlockCategory', category: 'robot' } },
  { id: 'cameraBench', name: 'Camera bench', description: 'Loupes, lens tissue and tiny screwdrivers. Unlocks camera jobs.', cost: 360, reputation: 45, effect: { kind: 'unlockCategory', category: 'camera' } },
  { id: 'paintStation', name: 'Paint station', description: 'Spray booth and stencils. Unlocks patterns, finishes and stickers.', cost: 300, reputation: 30, effect: { kind: 'paintOptions' } },
  { id: 'electronicsTable', name: 'Electronics table', description: 'A circuit tester that makes wires and nodes easier to match.', cost: 420, reputation: 60, effect: { kind: 'repairHelp', tolerance: 0.15 } },
  { id: 'musicCorner', name: 'Music repair corner', description: 'Tuners and spare strings. Unlocks instrument jobs.', cost: 520, reputation: 85, effect: { kind: 'unlockCategory', category: 'instrument' } },
  { id: 'waitingArea', name: 'Customer waiting area', description: 'Comfy chairs and cocoa. Customers are happier.', cost: 380, reputation: 70, effect: { kind: 'happiness', bonus: 8 } },
  { id: 'arcadeRoom', name: 'Arcade restoration room', description: 'Space for big cabinets. Unlocks arcade machine jobs.', cost: 780, reputation: 140, effect: { kind: 'unlockCategory', category: 'arcade' } },
  { id: 'displayShelves', name: 'Display shelves', description: 'Show off your best repairs. +5% on every payout.', cost: 600, reputation: 120, effect: { kind: 'display' } },
  { id: 'storefront', name: 'Outdoor storefront', description: 'A painted sign and flower boxes. +15% on every payout.', cost: 1100, reputation: 200, effect: { kind: 'payout', multiplier: 1.15 } },
];

/** Stations the shop starts with (the basic bench and a bike stand). */
export const STARTING_STATIONS = ['basicBench', 'bikeStand'];

export function upgradeById(id: string): Upgrade | undefined {
  return UPGRADES.find((u) => u.id === id);
}
