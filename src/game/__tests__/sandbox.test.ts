import { describe, expect, it } from 'vitest';
import { runHeadless } from './headlessEngine';

describe('sandbox mode', () => {
  it('never spawns waves or bosses on its own', () => {
    const run = runHeadless({ character: 'alpha_prism', gameMode: 'sandbox' });
    try {
      run.step(600);
      expect(run.engine.enemies).toHaveLength(0);
      expect(run.engine.bossWarningActive).toBe(false);
    } finally {
      run.restore();
    }
  });

  it('places exactly the requested type and count, and clears the field', () => {
    const run = runHeadless({ character: 'alpha_prism', gameMode: 'sandbox' });
    try {
      run.engine.spawnTestEnemies('sniper', 5);
      expect(run.engine.enemies).toHaveLength(5);
      expect(run.engine.enemies.every((e) => e.type === 'sniper')).toBe(true);

      run.engine.spawnTestEnemies('boss', 1);
      expect(run.engine.enemies).toHaveLength(6);
      expect(run.engine.enemies[5].isBoss).toBe(true);

      run.engine.clearTestField();
      expect(run.engine.enemies).toHaveLength(0);
      expect(run.engine.enemyProjectiles).toHaveLength(0);
      expect(run.engine.gems).toHaveLength(0);
    } finally {
      run.restore();
    }
  });

  it('keeps every test API inert outside the sandbox', () => {
    const run = runHeadless({ character: 'alpha_prism', gameMode: 'standard' });
    try {
      run.engine.spawnTestEnemies('boss', 3);
      expect(run.engine.enemies).toHaveLength(0);

      run.engine.setDevInvincible(true);
      expect(run.engine.devInvincible).toBe(false);
    } finally {
      run.restore();
    }
  });

  it('god mode holds HP against a point-blank enemy', () => {
    const run = runHeadless({
      character: 'alpha_prism',
      gameMode: 'sandbox',
      setup: (engine) => {
        engine.spawnTestEnemies('chaser', 1);
        const enemy = engine.enemies[0];
        enemy.hp = 1e9;
        enemy.maxHp = 1e9;
        enemy.x = engine.player.x;
        enemy.y = engine.player.y;
        engine.setDevInvincible(true);
      },
    });
    try {
      run.step(60);
      expect(run.engine.player.hp).toBe(run.engine.player.maxHp);
    } finally {
      run.restore();
    }
  });

  it('without god mode the same point-blank enemy still lands a hit', () => {
    const run = runHeadless({
      character: 'alpha_prism',
      gameMode: 'sandbox',
      setup: (engine) => {
        engine.spawnTestEnemies('chaser', 1);
        const enemy = engine.enemies[0];
        enemy.hp = 1e9;
        enemy.maxHp = 1e9;
        enemy.x = engine.player.x;
        enemy.y = engine.player.y;
      },
    });
    try {
      run.step(60);
      expect(run.engine.player.hp).toBeLessThan(run.engine.player.maxHp);
    } finally {
      run.restore();
    }
  });
});
