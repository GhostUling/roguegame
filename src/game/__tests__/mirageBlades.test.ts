import { describe, expect, it } from 'vitest';
import {
  MAX_MIRAGE_BLOOMS,
  MIRAGE_BLOOM_MIN_SPACING,
  MIRAGE_OFFSCREEN_MARGIN,
  MIRAGE_ORBIT_RADIUS,
  calculateBladeHomingVelocity,
  calculateBladeOrbitPos,
  canSpawnMirageBloom,
  clampBladeToOffscreenRim,
  isBladeOutsideScreen,
  mirageDamage,
} from '../systems/mirageBlades';
import { createPlayer } from '../core/player';

describe('mirageBlades orbit & homing', () => {
  it('positions blades around player at orbit radius', () => {
    const playerX = 200;
    const playerY = 200;
    const angle = 0;

    const pos = calculateBladeOrbitPos(playerX, playerY, angle, MIRAGE_ORBIT_RADIUS);
    expect(pos.x).toBe(playerX + MIRAGE_ORBIT_RADIUS);
    expect(pos.y).toBe(playerY);
  });

  it('calculates homing velocity and angle aimed directly at target', () => {
    const bladeX = 100;
    const bladeY = 100;
    const targetX = 300;
    const targetY = 100;

    const vel = calculateBladeHomingVelocity(bladeX, bladeY, targetX, targetY, 20);
    expect(vel.vx).toBeCloseTo(20);
    expect(vel.vy).toBeCloseTo(0);
    expect(vel.dist).toBe(200);
    expect(vel.angle).toBeCloseTo(0);
  });

  it('detects screen exit and clamps blade onto the off-screen wait rim', () => {
    const w = 1280;
    const h = 800;

    expect(isBladeOutsideScreen(500, 400, w, h, MIRAGE_OFFSCREEN_MARGIN)).toBe(false);
    expect(isBladeOutsideScreen(w + MIRAGE_OFFSCREEN_MARGIN + 5, 400, w, h, MIRAGE_OFFSCREEN_MARGIN)).toBe(true);

    const clamped = clampBladeToOffscreenRim(2400, -300, w, h, MIRAGE_OFFSCREEN_MARGIN);
    expect(clamped.x).toBe(w + MIRAGE_OFFSCREEN_MARGIN);
    expect(clamped.y).toBe(-MIRAGE_OFFSCREEN_MARGIN);
  });

  it('caps active lotus blooms and deduplicates nearby hits', () => {
    const existing = [{ x: 100, y: 100 }];
    expect(canSpawnMirageBloom(existing, 100 + MIRAGE_BLOOM_MIN_SPACING * 0.5, 100)).toBe(false);
    expect(canSpawnMirageBloom(existing, 100 + MIRAGE_BLOOM_MIN_SPACING + 2, 100)).toBe(true);

    const fullPool = Array.from({ length: MAX_MIRAGE_BLOOMS }, (_, i) => ({ x: i * 100, y: 0 }));
    expect(canSpawnMirageBloom(fullPool, 99999, 99999)).toBe(false);
  });

  it('scales damage monotonically with levels', () => {
    const p = createPlayer('gamma_viper');
    p.bulletDamage = 25;
    expect(mirageDamage(p, 3)).toBeGreaterThan(mirageDamage(p, 2));
    expect(mirageDamage(p, 2)).toBeGreaterThan(mirageDamage(p, 1));
  });
});
