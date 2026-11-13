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

  it('settings invincible holds HP against enemies in non-sandbox modes', () => {
    const run = runHeadless({
      character: 'alpha_prism',
      gameMode: 'standard',
      setup: (engine) => {
        engine.setSettingsInvincible(true);
        engine.enemies.push({
          id: 999,
          type: 'chaser',
          x: engine.player.x,
          y: engine.player.y,
          vx: 0,
          vy: 0,
          radius: 16,
          hp: 1e9,
          maxHp: 1e9,
          speed: 0,
          damage: 25,
          expValue: 1,
          fillColor: '#fff',
          strokeColor: '#fff',
          points: 4,
          sides: 3,
          rotation: 0,
          rotSpeed: 0,
          hitFlashTimer: 0,
          isBoss: false,
        });
      },
    });
    try {
      run.step(60);
      expect(run.engine.settingsInvincible).toBe(true);
      expect(run.engine.player.hp).toBe(run.engine.player.maxHp);
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

  it('can equip and manually trigger Gaster Blasters and Void Iaijutsu in sandbox', () => {
    const run = runHeadless({ character: 'alpha_prism', gameMode: 'sandbox' });
    try {
      run.engine.spawnTestEnemies('tank', 3);
      expect(run.engine.enemies).toHaveLength(3);

      // Equip Gaster Blasters
      run.engine.testEquipGasterBlasters();
      expect(run.engine.player.gasterLevel).toBe(1);
      expect(run.engine.gasterRings.length).toBeGreaterThan(0);

      const originX = run.engine.player.x;
      const originY = run.engine.player.y;

      // Equip Void Iaijutsu (phantom dash should NOT teleport the player)
      run.engine.testEquipVoidIaijutsu();
      expect(run.engine.player.voidIaijutsuLevel).toBe(1);
      expect(run.engine.iaijutsuSlashes.length).toBeGreaterThan(0);
      expect(run.engine.player.x).toBe(originX);
      expect(run.engine.player.y).toBe(originY);

      // Step engine to let both systems animate and hit enemies (may damage or kill the tank)
      run.step(40);
      expect(run.engine.player.totalDamageDealt).toBeGreaterThan(0);
      expect(
        run.engine.enemies.length < 3 || run.engine.enemies.some((e) => e.hp < e.maxHp)
      ).toBe(true);

      // Equip Mirage Blades and verify all orbiting blades enter the rapid sequential salvo
      run.engine.testEquipMirageBlades();
      expect(run.engine.player.mirageLevel).toBe(1);
      expect(
        run.engine.mirageBlades.some((b) => b.state === 'queued' || b.state === 'outbound')
      ).toBe(true);

      // Keep targets alive across both outbound & return phases and toggle sandbox god mode
      // so the immortal tanks do not end the run while walking onto the stationary player
      run.engine.setDevInvincible(true);
      run.engine.spawnTestEnemies('tank', 2);
      for (const e of run.engine.enemies) {
        e.hp = 1e6;
        e.maxHp = 1e6;
      }

      // Step through sequential outbound -> offscreen wait -> simultaneous return convergence -> reform
      let sawWaiting = false;
      let sawReturning = false;
      let sawBlooms = false;
      for (let f = 0; f < 180; f++) {
        run.step(1);
        if (run.engine.mirageBlades.some((b) => b.state === 'waiting')) sawWaiting = true;
        if (run.engine.mirageBlades.some((b) => b.state === 'returning')) sawReturning = true;
        if (run.engine.mirageBlooms.length > 0) sawBlooms = true;
      }
      expect(sawWaiting).toBe(true);
      expect(sawReturning).toBe(true);
      expect(sawBlooms).toBe(true);
      // After full sweep offscreen, the orbiting halo replenishes back to 8 orbit blades
      expect(run.engine.mirageBlades.every((b) => b.state === 'orbit')).toBe(true);
      expect(run.engine.mirageBlades).toHaveLength(8);

      // Equip Singularity Meteor and verify lingering crater + delayed secondary collapse aftershock
      run.engine.testEquipSingularityMeteor();
      expect(run.engine.meteors).toHaveLength(1);
      // Fall duration is 1.2s (~72 frames) + aftershock delay is 1.15s (~69 frames)
      run.step(155);
      expect(run.engine.meteors.length).toBeGreaterThan(0);
      expect(run.engine.meteors[0].impacted).toBe(true);
      expect(run.engine.meteors[0].aftershockTriggered).toBe(true);

      // Clearing field clears active rings, slashes, meteors, and mirage blooms
      run.engine.clearTestField();
      expect(run.engine.gasterRings).toHaveLength(0);
      expect(run.engine.iaijutsuSlashes).toHaveLength(0);
      expect(run.engine.mirageBlooms).toHaveLength(0);
      expect(run.engine.meteors).toHaveLength(0);
    } finally {
      run.restore();
    }
  });

  it('handles Mirage Blades slaying 100+ dense hive enemies without crashing and enforces bloom cap', () => {
    const run = runHeadless({ character: 'alpha_prism', gameMode: 'sandbox' });
    try {
      run.engine.setDevInvincible(true);
      // Spawn 120 fragile hive enemies (each death splices & pushes 3 speeder children!)
      run.engine.spawnTestEnemies('hive', 120);
      for (const e of run.engine.enemies) {
        e.hp = 1;
        e.maxHp = 1;
        e.x = run.engine.player.x + 120;
        e.y = run.engine.player.y;
      }

      run.engine.testEquipMirageBlades();
      expect(() => run.step(120)).not.toThrow();
      expect(run.engine.mirageBlooms.length).toBeLessThanOrEqual(28);
      expect(run.engine.player.kills).toBeGreaterThan(20);
    } finally {
      run.restore();
    }
  });

  it('triggers cross-skill Resonance Synergies (meteor_ion, gaster_babylon, iaijutsu_mirage)', () => {
    const run = runHeadless({ character: 'alpha_prism', gameMode: 'sandbox' });
    try {
      run.engine.setDevInvincible(true);
      run.engine.spawnTestEnemies('tank', 4);
      for (const e of run.engine.enemies) {
        e.hp = 50000;
        e.maxHp = 50000;
      }

      // 1. gaster_babylon
      run.engine.player.babylonLevel = 1;
      run.engine.player.gasterLevel = 1;
      run.engine.triggerGasterBlasters();
      expect(run.engine.babylonSwords.length).toBeGreaterThanOrEqual(8);

      // 2. meteor_ion
      run.engine.player.meteorLevel = 1;
      run.engine.player.ionLevel = 1;
      run.engine.triggerSingularityMeteor();
      run.step(90); // Wait for meteor fall (1.2s = ~72 frames)
      expect(run.engine.ionStrikes.length).toBeGreaterThanOrEqual(1);

      // 3. iaijutsu_mirage
      run.engine.mirageBlooms = [];
      run.engine.player.voidIaijutsuLevel = 1;
      run.engine.player.mirageLevel = 1;
      run.engine.triggerVoidIaijutsu();
      run.step(20); // Wait for cut + sheath pause (~0.25s = ~15 frames)
      expect(run.engine.mirageBlooms.length).toBeGreaterThanOrEqual(1);
    } finally {
      run.restore();
    }
  });
});
