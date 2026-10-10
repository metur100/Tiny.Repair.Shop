import { CleaningEngine } from '@/game/cleaning/CleaningEngine';

function scrubAll(engine: CleaningEngine, passes: number): void {
  for (let p = 0; p < passes; p++) {
    for (let v = 0.02; v < 1; v += 0.04) for (let u = 0.02; u < 1; u += 0.04) engine.scrub(u, v, 0.08, 0.5);
  }
}

describe('CleaningEngine', () => {
  it('starts dirty with 0% coverage and the requested amount of dirt', () => {
    const e = new CleaningEngine({ cols: 20, rows: 20, seed: 7, amount: 0.5, kind: 'dust' });
    expect(e.coverage).toBe(0);
    const dirty = Array.from(e.dirt).filter((d) => d > 0).length;
    expect(dirty).toBe(200);
  });

  it('is deterministic for a seed', () => {
    const a = new CleaningEngine({ cols: 16, rows: 16, seed: 42, amount: 0.6, kind: 'mud' });
    const b = new CleaningEngine({ cols: 16, rows: 16, seed: 42, amount: 0.6, kind: 'mud' });
    expect(Array.from(a.dirt)).toEqual(Array.from(b.dirt));
  });

  it('coverage rises as the player scrubs and reaches 100%', () => {
    const e = new CleaningEngine({ cols: 20, rows: 20, seed: 3, amount: 0.7, kind: 'dust' });
    e.scrub(0.5, 0.5, 0.2, 0.5);
    const partial = e.coverage;
    scrubAll(e, 6);
    expect(e.coverage).toBeGreaterThanOrEqual(partial);
    expect(e.coverage).toBe(1);
  });

  it('stubborn dirt (rust) needs more passes than dust', () => {
    const dust = new CleaningEngine({ cols: 20, rows: 20, seed: 9, amount: 0.8, kind: 'dust' });
    const rust = new CleaningEngine({ cols: 20, rows: 20, seed: 9, amount: 0.8, kind: 'rust' });
    // Same dirt layout, same single stroke: rust gives up less.
    const a = dust.scrub(0.5, 0.5, 0.3, 0.4).removed;
    const b = rust.scrub(0.5, 0.5, 0.3, 0.4).removed;
    expect(b).toBeLessThan(a);
    expect(rust.coverage).toBeLessThan(dust.coverage);
  });

  it('only puts dirt inside the object mask', () => {
    const e = new CleaningEngine({ cols: 10, rows: 10, seed: 1, amount: 1, kind: 'grease', mask: (u) => u < 0.5 });
    for (let r = 0; r < 10; r++) for (let c = 5; c < 10; c++) expect(e.dirt[r * 10 + c]).toBe(0);
  });

  it('reports sparkle regions once they are clean and finish() polishes everything', () => {
    const e = new CleaningEngine({ cols: 8, rows: 8, seed: 5, amount: 1, kind: 'dust', region: 4 });
    let sparkles = 0;
    for (let i = 0; i < 6; i++) sparkles += e.scrub(0.25, 0.25, 0.3, 1).sparkleRegions.length;
    expect(sparkles).toBeGreaterThan(0);
    e.finish();
    expect(e.coverage).toBe(1);
  });
});
