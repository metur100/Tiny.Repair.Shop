import type { DirtKind } from '@/data/types';
import { createRng } from '@/utils/dateSeed';

export interface CleaningOptions {
  cols: number;
  rows: number;
  seed: number;
  /** 0..1 share of the object that starts dirty. */
  amount: number;
  kind: DirtKind;
  /** Optional silhouette: only cells inside the object get dirt. u, v in 0..1. */
  mask?: (u: number, v: number) => boolean;
  /** Size of the sparkle regions in cells. */
  region?: number;
}

/** How many scrubs a full-strength cell needs, by dirt kind (grease and rust are stubborn). */
export const TOUGHNESS: Record<DirtKind, number> = { dust: 1, mud: 1.4, grease: 1.8, rust: 2.2 };

export interface ScrubResult {
  /** Dirt removed by this stroke (sum of cell amounts). */
  removed: number;
  /** Regions that became clean with this stroke (for the shine sparkle). */
  sparkleRegions: number[];
}

/**
 * The cleaning mini-game model: the object is covered by a grid of cells, each holding 0..1 dirt.
 * Scrubbing with a round brush removes dirt from the cells under it (stubborn dirt needs more passes).
 * Coverage is the share of the starting dirt that has been removed. Pure TypeScript – the canvas only
 * draws what this model says, and tests can drive it directly.
 */
export class CleaningEngine {
  readonly cols: number;
  readonly rows: number;
  readonly dirt: Float32Array;
  readonly initialTotal: number;
  readonly kind: DirtKind;
  private readonly region: number;
  private readonly regionClean: Uint8Array;
  private readonly regionHasDirt: Uint8Array;
  private total: number;
  /** Bumped on every change (render invalidation). */
  version = 0;

  constructor(opts: CleaningOptions) {
    this.cols = opts.cols;
    this.rows = opts.rows;
    this.kind = opts.kind;
    this.region = opts.region ?? 4;
    this.dirt = new Float32Array(opts.cols * opts.rows);
    const rng = createRng(opts.seed);
    // Blobby dirt: a few random centres grow patches until the target amount is covered.
    const inside: number[] = [];
    for (let r = 0; r < opts.rows; r++) {
      for (let c = 0; c < opts.cols; c++) {
        const u = (c + 0.5) / opts.cols;
        const v = (r + 0.5) / opts.rows;
        if (!opts.mask || opts.mask(u, v)) inside.push(r * opts.cols + c);
      }
    }
    const target = Math.round(inside.length * Math.max(0, Math.min(1, opts.amount)));
    const blobs = Math.max(3, Math.round(target / 30));
    const centres: [number, number, number][] = [];
    for (let i = 0; i < blobs; i++) {
      const idx = inside[Math.floor(rng() * inside.length)] ?? 0;
      centres.push([idx % opts.cols, Math.floor(idx / opts.cols), 2 + rng() * 5]);
    }
    const scored = inside.map((idx) => {
      const c = idx % opts.cols;
      const r = Math.floor(idx / opts.cols);
      let best = Infinity;
      for (const [cx, cy, rad] of centres) best = Math.min(best, Math.hypot(c - cx, r - cy) / rad);
      return { idx, d: best + rng() * 0.35 };
    });
    scored.sort((a, b) => a.d - b.d);
    let total = 0;
    for (let i = 0; i < target && i < scored.length; i++) {
      const v = 0.55 + 0.45 * (1 - Math.min(1, scored[i].d / 3)) * (0.7 + rng() * 0.3);
      this.dirt[scored[i].idx] = v;
      total += v;
    }
    this.initialTotal = total;
    this.total = total;
    const rc = Math.ceil(opts.cols / this.region) * Math.ceil(opts.rows / this.region);
    this.regionClean = new Uint8Array(rc);
    this.regionHasDirt = new Uint8Array(rc);
    for (let i = 0; i < this.dirt.length; i++) if (this.dirt[i] > 0) this.regionHasDirt[this.regionOf(i)] = 1;
  }

  private regionOf(i: number): number {
    const c = i % this.cols;
    const r = Math.floor(i / this.cols);
    const perRow = Math.ceil(this.cols / this.region);
    return Math.floor(r / this.region) * perRow + Math.floor(c / this.region);
  }

  /** Share of the starting dirt removed so far (0..1). */
  get coverage(): number {
    return this.initialTotal > 0 ? 1 - this.total / this.initialTotal : 1;
  }

  /** Remaining dirt amount (sum over cells). */
  get remaining(): number {
    return this.total;
  }

  /**
   * Scrubs at (u, v) in 0..1 with a brush of radius `radius` (in units of the grid width).
   * `strength` is how much dirt one pass removes from a cell at the brush centre.
   */
  scrub(u: number, v: number, radius: number, strength = 0.5): ScrubResult {
    const cx = u * this.cols;
    const cy = v * this.rows;
    const rc = radius * this.cols;
    const c0 = Math.max(0, Math.floor(cx - rc));
    const c1 = Math.min(this.cols - 1, Math.ceil(cx + rc));
    const r0 = Math.max(0, Math.floor(cy - rc));
    const r1 = Math.min(this.rows - 1, Math.ceil(cy + rc));
    const tough = TOUGHNESS[this.kind];
    let removed = 0;
    const touched = new Set<number>();
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const d = Math.hypot(c + 0.5 - cx, r + 0.5 - cy);
        if (d > rc) continue;
        const i = r * this.cols + c;
        const cur = this.dirt[i];
        if (cur <= 0) continue;
        const falloff = 1 - (d / rc) * 0.6;
        const next = Math.max(0, cur - (strength * falloff) / tough);
        // Tiny leftovers vanish so the object can reach 100%.
        const value = next < 0.06 ? 0 : next;
        removed += cur - value;
        this.dirt[i] = value;
        touched.add(this.regionOf(i));
      }
    }
    this.total = Math.max(0, this.total - removed);
    const sparkleRegions: number[] = [];
    for (const reg of touched) {
      if (this.regionClean[reg] || !this.regionHasDirt[reg]) continue;
      if (this.regionIsClean(reg)) {
        this.regionClean[reg] = 1;
        sparkleRegions.push(reg);
      }
    }
    if (removed > 0) this.version++;
    return { removed, sparkleRegions };
  }

  private regionIsClean(reg: number): boolean {
    const perRow = Math.ceil(this.cols / this.region);
    const rr = Math.floor(reg / perRow);
    const rcIdx = reg % perRow;
    for (let r = rr * this.region; r < Math.min(this.rows, (rr + 1) * this.region); r++) {
      for (let c = rcIdx * this.region; c < Math.min(this.cols, (rcIdx + 1) * this.region); c++) {
        if (this.dirt[r * this.cols + c] > 0) return false;
      }
    }
    return true;
  }

  /** Centre of a region in 0..1 (for placing sparkles). */
  regionCentre(reg: number): { u: number; v: number } {
    const perRow = Math.ceil(this.cols / this.region);
    const rr = Math.floor(reg / perRow);
    const rcIdx = reg % perRow;
    return { u: ((rcIdx + 0.5) * this.region) / this.cols, v: ((rr + 0.5) * this.region) / this.rows };
  }

  /** Clears every remaining speck (used by the "finish up" auto-polish at 97%+). */
  finish(): void {
    this.dirt.fill(0);
    this.total = 0;
    this.version++;
  }
}
