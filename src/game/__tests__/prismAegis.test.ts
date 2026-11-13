import { describe, expect, it } from 'vitest';
import {
  aegisBurstDamage,
  calculateReflectedVelocity,
  projectileHitsAegisBarrier,
} from '../systems/prismAegis';
import { createPlayer } from '../core/player';

describe('prismAegis barrier detection & deflection', () => {
  it('detects projectile at perimeter distance', () => {
    const playerX = 300;
    const playerY = 300;
    const radius = 150;

    // Bullet on the barrier rim
    expect(projectileHitsAegisBarrier(playerX, playerY, radius, 450, 300, 15)).toBe(true);
    // Bullet far away
    expect(projectileHitsAegisBarrier(playerX, playerY, radius, 600, 300, 15)).toBe(false);
    // Bullet inside close to player
    expect(projectileHitsAegisBarrier(playerX, playerY, radius, 320, 300, 15)).toBe(false);
  });

  it('reflects velocity outward with increased speed', () => {
    const playerX = 100;
    const playerY = 100;
    const projX = 200;
    const projY = 100;

    const res = calculateReflectedVelocity(playerX, playerY, projX, projY, 5, 2.0);
    expect(res.vx).toBeGreaterThan(0); // travels outward to the right
    expect(res.vy).toBeCloseTo(0);
    expect(Math.hypot(res.vx, res.vy)).toBeGreaterThanOrEqual(10);
  });

  it('scales burst damage with levels', () => {
    const p = createPlayer('theta_aegis');
    p.bulletDamage = 20;
    expect(aegisBurstDamage(p, 3)).toBeGreaterThan(aegisBurstDamage(p, 2));
    expect(aegisBurstDamage(p, 2)).toBeGreaterThan(aegisBurstDamage(p, 1));
  });
});
