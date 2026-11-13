import { describe, expect, it } from 'vitest';
import {
  IAIJUTSU_CUT_DURATION,
  IAIJUTSU_CUT_WIDTH,
  LVL_IAIJUTSU_DAMAGE_SCALE,
  LVL_IAIJUTSU_DISTANCE,
  calculateIaijutsuDestination,
  calculateIaijutsuPhantomPos,
  cutHitsEnemy,
  generateRiftShards,
  iaijutsuDamage,
  pointToSegmentDistance,
} from '../systems/voidIaijutsu';
import { createPlayer } from '../core/player';

describe('voidIaijutsu spatial geometry', () => {
  it('interpolates phantom dash smoothly from start to end across cut duration', () => {
    const slash = { startX: 100, startY: 200, endX: 300, endY: 200, elapsed: 0 };
    const atStart = calculateIaijutsuPhantomPos(slash);
    expect(atStart.x).toBe(100);
    expect(atStart.y).toBe(200);
    expect(atStart.progress).toBe(0);

    const atMid = calculateIaijutsuPhantomPos({ ...slash, elapsed: IAIJUTSU_CUT_DURATION * 0.5 });
    expect(atMid.x).toBeGreaterThan(100);
    expect(atMid.x).toBeLessThan(300);
    expect(atMid.progress).toBeGreaterThan(0.5); // cubic ease-out bursts quickly

    const atEnd = calculateIaijutsuPhantomPos({ ...slash, elapsed: IAIJUTSU_CUT_DURATION });
    expect(atEnd.x).toBe(300);
    expect(atEnd.y).toBe(200);
    expect(atEnd.progress).toBe(1);
  });

  it('clamps destination within the boundary margin', () => {
    const width = 1000;
    const height = 800;
    const margin = 40;

    // Slashing to the right within bounds
    const normal = calculateIaijutsuDestination(200, 200, 0, 200, width, height, margin);
    expect(normal.endX).toBe(400);
    expect(normal.endY).toBe(200);

    // Slashing past the right edge
    const clampedRight = calculateIaijutsuDestination(950, 200, 0, 200, width, height, margin);
    expect(clampedRight.endX).toBe(width - margin);

    // Slashing past the top edge
    const clampedTop = calculateIaijutsuDestination(200, 50, -Math.PI / 2, 200, width, height, margin);
    expect(clampedTop.endY).toBe(margin);
  });

  it('correctly calculates point to segment distance', () => {
    // Horizontal segment from (0, 0) to (100, 0)
    // Point above midpoint (50, 20) -> distance is 20
    expect(pointToSegmentDistance(50, 20, 0, 0, 100, 0)).toBeCloseTo(20);

    // Point before start (-30, 0) -> distance to (0,0) is 30
    expect(pointToSegmentDistance(-30, 0, 0, 0, 100, 0)).toBeCloseTo(30);

    // Point after end (140, 30) -> distance to (100,0) is hypot(40, 30) = 50
    expect(pointToSegmentDistance(140, 30, 0, 0, 100, 0)).toBeCloseTo(50);
  });

  it('detects when an enemy is within the cut corridor', () => {
    const x1 = 100;
    const y1 = 100;
    const x2 = 400;
    const y2 = 100;
    const enemyRadius = 12;

    // Enemy on the cut line
    expect(cutHitsEnemy(x1, y1, x2, y2, 250, 100, enemyRadius)).toBe(true);

    // Enemy within corridor width
    const halfWidth = IAIJUTSU_CUT_WIDTH / 2;
    expect(cutHitsEnemy(x1, y1, x2, y2, 250, 100 + halfWidth + 5, enemyRadius)).toBe(true);

    // Enemy clearly outside
    expect(cutHitsEnemy(x1, y1, x2, y2, 250, 100 + halfWidth + 40, enemyRadius)).toBe(false);
  });

  it('generates consistent deterministic shards with given seed', () => {
    const shards1 = generateRiftShards(42, 8);
    const shards2 = generateRiftShards(42, 8);
    expect(shards1).toEqual(shards2);
    expect(shards1).toHaveLength(8);
  });
});

describe('voidIaijutsu damage scaling', () => {
  it('scales damage monotonically with levels', () => {
    const p = createPlayer('gamma_viper');
    p.bulletDamage = 25;

    const dmg1 = iaijutsuDamage(p, 1);
    const dmg2 = iaijutsuDamage(p, 2);
    const dmg3 = iaijutsuDamage(p, 3);

    expect(dmg1).toBe(Math.round(25 * LVL_IAIJUTSU_DAMAGE_SCALE[0]));
    expect(dmg2).toBe(Math.round(25 * LVL_IAIJUTSU_DAMAGE_SCALE[1]));
    expect(dmg3).toBe(Math.round(25 * LVL_IAIJUTSU_DAMAGE_SCALE[2]));
    expect(dmg3).toBeGreaterThan(dmg2);
    expect(dmg2).toBeGreaterThan(dmg1);
  });
});
