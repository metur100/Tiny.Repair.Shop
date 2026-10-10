import { CATEGORIES, DAMAGE_INFO } from '@/data/objects';
import type { Clue, DamageId, Job } from '@/data/types';
import { createRng, hashString } from '@/utils/dateSeed';

export interface DiagnosisOption {
  damage: DamageId;
  name: string;
}

/** Relevant clues the player must find before the diagnosis can be made. */
export function requiredClues(job: Pick<Job, 'clues'>): number {
  return Math.min(2, job.clues.filter((c) => c.relevant).length);
}

/** Inspection state after tapping some clue spots. */
export interface InspectionState {
  found: Set<number>;
  wrongTaps: number;
}

export function tapClue(state: InspectionState, clues: Clue[], index: number): { state: InspectionState; relevant: boolean; isNew: boolean } {
  const clue = clues[index];
  const isNew = !state.found.has(index);
  const found = new Set(state.found);
  found.add(index);
  const wrongTaps = state.wrongTaps + (clue.relevant || !isNew ? 0 : 1);
  return { state: { found, wrongTaps }, relevant: clue.relevant, isNew };
}

export function relevantFound(state: InspectionState, clues: Clue[]): number {
  let n = 0;
  for (const i of state.found) if (clues[i]?.relevant) n++;
  return n;
}

export function canDiagnose(state: InspectionState, job: Pick<Job, 'clues'>): boolean {
  return relevantFound(state, job.clues) >= requiredClues(job);
}

/** Three choices: the real damage and two others of the same category, in a stable shuffled order. */
export function diagnosisOptions(job: Pick<Job, 'id' | 'category' | 'damage'>): DiagnosisOption[] {
  const others = CATEGORIES[job.category].damages.filter((d) => d !== job.damage);
  const rng = createRng(hashString(job.id));
  const picks = [...others].sort(() => rng() - 0.5).slice(0, 2);
  const all = [job.damage, ...picks].sort(() => rng() - 0.5);
  return all.map((damage) => ({ damage, name: DAMAGE_INFO[damage].name }));
}

export function isCorrectDiagnosis(job: Pick<Job, 'damage'>, choice: DamageId): boolean {
  return job.damage === choice;
}
