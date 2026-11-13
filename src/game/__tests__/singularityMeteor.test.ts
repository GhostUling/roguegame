import { describe, expect, it } from 'vitest';
import {
  METEOR_EXPLOSION_RADIUS,
  calculateMeteorPull,
  enemyInMeteorBlast,
  meteorDamage,
  findDensestEnemyCluster,
  generateCraterCracks,
} from '../systems/singularityMeteor';
import { createPlayer } from '../core/player';

describe('singularityMeteor geometry & forces', () => {
  it('pulls enemies in range towards meteor center', () => {
    const meteorX = 500;
    const meteorY = 500;
    const enemyX = 400;
    const enemyY = 500;
    const pullRadius = 300;

    const pull = calculateMeteorPull(meteorX, meteorY, enemyX, enemyY, pullRadius);
    expect(pull.inRange).toBe(true);
    expect(pull.pullX).toBeGreaterThan(0); // pulls right towards meteorX
    expect(pull.pullY).toBeCloseTo(0);
  });

  it('ignores enemies outside pull radius', () => {
    const pull = calculateMeteorPull(500, 500, 1000, 500, 300);
    expect(pull.inRange).toBe(false);
    expect(pull.pullX).toBe(0);
    expect(pull.pullY).toBe(0);
  });

  it('determines blast radius hit correctly', () => {
    expect(enemyInMeteorBlast(500, 500, 550, 500, 15, METEOR_EXPLOSION_RADIUS)).toBe(true);
    expect(enemyInMeteorBlast(500, 500, 900, 500, 15, METEOR_EXPLOSION_RADIUS)).toBe(false);
  });

  it('scales damage monotonically with levels', () => {
    const p = createPlayer('zeta_aurora');
    p.bulletDamage = 25;
    expect(meteorDamage(p, 3)).toBeGreaterThan(meteorDamage(p, 2));
    expect(meteorDamage(p, 2)).toBeGreaterThan(meteorDamage(p, 1));
  });

  it('finds the densest enemy cluster centroid', () => {
    const isolated = { x: 100, y: 100 };
    // Dense mob cluster around (600, 600)
    const cluster = [
      { x: 590, y: 590 },
      { x: 610, y: 600 },
      { x: 600, y: 610 },
      { x: 595, y: 605 },
    ];
    const enemies = [isolated, ...cluster];
    const res = findDensestEnemyCluster(enemies, 100);
    expect(res).not.toBeNull();
    // Centroid should be very close to (600, 600)
    expect(res!.targetX).toBeGreaterThanOrEqual(590);
    expect(res!.targetX).toBeLessThanOrEqual(610);
    expect(res!.targetY).toBeGreaterThanOrEqual(590);
    expect(res!.targetY).toBeLessThanOrEqual(610);
  });

  it('generates consistent deterministic crater fissures with given seed', () => {
    const a = generateCraterCracks(7, 12);
    const b = generateCraterCracks(7, 12);
    expect(a).toEqual(b);
    expect(a).toHaveLength(12);
    for (const c of a) {
      expect(c.lengthScale).toBeGreaterThanOrEqual(0.65);
      expect(c.lengthScale).toBeLessThanOrEqual(1);
    }
  });
});
