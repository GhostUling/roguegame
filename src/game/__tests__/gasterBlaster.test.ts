import { describe, expect, it } from 'vitest';
import {
  GASTER_BEAM_LENGTH,
  GASTER_BEAM_WIDTH,
  GASTER_FIRE_STAGGER,
  GASTER_RADIUS,
  GASTER_WINDUP_SECONDS,
  LVL_GASTER_COUNT,
  LVL_GASTER_DAMAGE_SCALE,
  beamHitsCircle,
  createBlasterUnits,
  gasterBeamDamage,
  gasterTotalDuration,
} from '../systems/gasterBlaster';
import { createPlayer } from '../core/player';

describe('gasterBlaster geometry & formation', () => {
  it('creates the requested count of blasters positioned on a circle', () => {
    const targetX = 500;
    const targetY = 300;
    const units = createBlasterUnits(targetX, targetY, 8);
    expect(units).toHaveLength(8);

    for (const u of units) {
      const dist = Math.hypot(u.x - targetX, u.y - targetY);
      expect(dist).toBeCloseTo(GASTER_RADIUS, 1);
      // Aim angle should point directly inward toward the center
      const expectedAim = Math.atan2(targetY - u.y, targetX - u.x);
      // Wrap difference to [-PI, PI]
      const diff = Math.atan2(Math.sin(u.aimAngle - expectedAim), Math.cos(u.aimAngle - expectedAim));
      expect(Math.abs(diff)).toBeLessThan(0.01);
    }
  });

  it('orders blaster fire delays sequentially with stagger', () => {
    const units = createBlasterUnits(100, 100, 6);
    for (let i = 0; i < units.length; i++) {
      expect(units[i].fireDelay).toBeCloseTo(GASTER_WINDUP_SECONDS + i * GASTER_FIRE_STAGGER, 4);
    }
  });

  it('computes positive total duration longer than windup plus all shots', () => {
    const duration = gasterTotalDuration(8);
    expect(duration).toBeGreaterThan(GASTER_WINDUP_SECONDS + 8 * GASTER_FIRE_STAGGER);
  });
});

describe('gasterBlaster damage & ray intersection', () => {
  it('scales damage across levels according to table', () => {
    const p = createPlayer('alpha_prism');
    p.bulletDamage = 20;

    const dmg1 = gasterBeamDamage(p, 1);
    const dmg2 = gasterBeamDamage(p, 2);
    const dmg3 = gasterBeamDamage(p, 3);

    expect(dmg1).toBe(Math.round(20 * LVL_GASTER_DAMAGE_SCALE[0]));
    expect(dmg2).toBe(Math.round(20 * LVL_GASTER_DAMAGE_SCALE[1]));
    expect(dmg3).toBe(Math.round(20 * LVL_GASTER_DAMAGE_SCALE[2]));
    expect(dmg3).toBeGreaterThan(dmg2);
    expect(dmg2).toBeGreaterThan(dmg1);
  });

  it('detects when an enemy is within the laser beam corridor', () => {
    const originX = 100;
    const originY = 100;
    const aimAngle = 0; // Pointing right (+X)
    const beamLength = 400;
    const beamWidth = 24;

    // Enemy directly along the beam axis
    expect(beamHitsCircle(originX, originY, aimAngle, beamLength, beamWidth, 250, 100, 15)).toBe(true);

    // Enemy slightly off axis but within width + radius
    expect(beamHitsCircle(originX, originY, aimAngle, beamLength, beamWidth, 250, 115, 10)).toBe(true);

    // Enemy too far off perpendicular axis
    expect(beamHitsCircle(originX, originY, aimAngle, beamLength, beamWidth, 250, 150, 10)).toBe(false);

    // Enemy behind the blaster
    expect(beamHitsCircle(originX, originY, aimAngle, beamLength, beamWidth, 50, 100, 10)).toBe(false);

    // Enemy beyond the beam length
    expect(beamHitsCircle(originX, originY, aimAngle, beamLength, beamWidth, 600, 100, 10)).toBe(false);
  });
});
