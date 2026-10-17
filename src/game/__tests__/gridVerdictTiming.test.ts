import { describe, expect, it } from 'vitest';
import { runHeadless } from './headlessEngine';

describe('grid verdict timing', () => {
  it('cuts only after the lattice has assembled and charged', () => {
    const run = runHeadless({
      character: 'alpha_prism',
      gameMode: 'sandbox',
      build: { grid_verdict: 1 },
      setup: (engine) => {
        engine.player.gridTimer = 0.01;
        engine.spawnTestEnemies('tank', 1);
        const enemy = engine.enemies[0];
        // The screen centre sits on a lattice line with the 1920x1080 stub.
        enemy.x = engine.player.x;
        enemy.y = engine.player.y;
        enemy.speed = 0;
        enemy.hp = 1e9;
        enemy.maxHp = 1e9;
      },
    });

    try {
      run.step(20); // ~0.33s: the sweep is still travelling
      expect(run.engine.player.gridAnim).toBeGreaterThanOrEqual(0);
      expect(run.engine.player.gridFlash).toBe(0);
      expect(run.engine.enemies[0].stunTimer || 0).toBe(0);

      run.step(25); // ~0.75s total: past GRID_STRIKE_AT
      expect(run.engine.player.gridAnim).toBe(-1);
      expect(run.engine.player.gridFlash).toBeGreaterThan(0);
      expect(run.engine.enemies[0].stunTimer || 0).toBeGreaterThan(0);
    } finally {
      run.restore();
    }
  });
});
