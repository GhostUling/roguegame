import { describe, expect, it } from 'vitest';
import { runHeadless } from './headlessEngine';

describe('derived bullets', () => {
  it('fires the omni ring and splits a round on hit', () => {
    let sawOmni = 0;
    let sawSecondary = 0;

    const run = runHeadless({
      character: 'alpha_prism',
      gameMode: 'overflow',
      build: { omni_barrage: 1, spawnshotter: 1 },
      seed: 7,
      watch: (engine) => {
        sawOmni = Math.max(sawOmni, engine.projectiles.filter((p) => p.color === '#fca5a5').length);
        sawSecondary = Math.max(sawSecondary, engine.projectiles.filter((p) => p.isSecondary).length);
      },
    });
    try {
      run.step(600);
      expect(sawOmni).toBeGreaterThanOrEqual(6);
      expect(sawSecondary).toBeGreaterThan(0);
    } finally {
      run.restore();
    }
  });
});
