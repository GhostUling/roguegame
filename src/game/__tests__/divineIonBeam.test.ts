import { describe, expect, it } from 'vitest';
import {
  enemyInIonGround,
  enemyInIonPillar,
  ionDamage,
} from '../systems/divineIonBeam';
import { createPlayer } from '../core/player';

describe('divineIonBeam geometry & damage', () => {
  it('hits targets in the vertical column regardless of Y position', () => {
    const targetX = 400;
    const beamWidth = 80;

    expect(enemyInIonPillar(targetX, beamWidth, 420, 10)).toBe(true);
    expect(enemyInIonPillar(targetX, beamWidth, 380, 10)).toBe(true);
    expect(enemyInIonPillar(targetX, beamWidth, 500, 10)).toBe(false);
  });

  it('detects residual plasma ground contact', () => {
    expect(enemyInIonGround(400, 400, 90, 450, 400, 10)).toBe(true);
    expect(enemyInIonGround(400, 400, 90, 600, 400, 10)).toBe(false);
  });

  it('scales damage monotonically with levels', () => {
    const p = createPlayer('kappa_lance');
    p.bulletDamage = 20;
    expect(ionDamage(p, 3)).toBeGreaterThan(ionDamage(p, 2));
    expect(ionDamage(p, 2)).toBeGreaterThan(ionDamage(p, 1));
  });
});
