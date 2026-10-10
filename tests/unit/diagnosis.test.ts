import { JOBS } from '@/data/jobs';
import { canDiagnose, diagnosisOptions, isCorrectDiagnosis, relevantFound, requiredClues, tapClue, type InspectionState } from '@/game/inspection/diagnosis';
import { job } from '../helpers';

describe('inspection and diagnosis', () => {
  const j = job();
  const empty: InspectionState = { found: new Set(), wrongTaps: 0 };

  it('needs the relevant clues before diagnosing', () => {
    expect(canDiagnose(empty, j)).toBe(false);
    let state = empty;
    j.clues.forEach((c, i) => {
      if (c.relevant) state = tapClue(state, j.clues, i).state;
    });
    expect(relevantFound(state, j.clues)).toBe(j.clues.filter((c) => c.relevant).length);
    expect(canDiagnose(state, j)).toBe(true);
  });

  it('counts harmless spots as wrong taps once, and never double counts', () => {
    const decoy = j.clues.findIndex((c) => !c.relevant);
    const once = tapClue(empty, j.clues, decoy);
    expect(once.relevant).toBe(false);
    expect(once.state.wrongTaps).toBe(1);
    const twice = tapClue(once.state, j.clues, decoy);
    expect(twice.isNew).toBe(false);
    expect(twice.state.wrongTaps).toBe(1);
  });

  it('every job offers three options including the real fault, in a stable order', () => {
    for (const each of JOBS) {
      const options = diagnosisOptions(each);
      expect(options).toHaveLength(3);
      expect(options.filter((o) => isCorrectDiagnosis(each, o.damage))).toHaveLength(1);
      expect(diagnosisOptions(each)).toEqual(options);
      expect(requiredClues(each)).toBeGreaterThan(0);
    }
  });
});
