import { describe, expect, it } from 'vitest';
import {
  ALLY_DAMAGE_SCALE,
  ALLY_LIFETIME,
  ALLY_SPEED_SCALE,
  MAX_ALLIES,
  allyFromEnemy,
} from '../allies';
import { findUpgrade } from '../upgradePools';
import { createPlayer } from '../player';
import { Enemy } from '../types';

/** A corpse shaped like something killEnemy would hand over. */
const corpse = (over: Partial<Enemy> = {}): Enemy => ({
  id: 1,
  type: 'chaser',
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 12,
  hp: 0,
  maxHp: 40,
  speed: 2.4,
  damage: 10,
  fillColor: '#1a0a0a',
  strokeColor: '#ef4444',
  points: 4,
  sides: 4,
  rotation: 0,
  rotSpeed: 1,
  hitFlashTimer: 0,
  expValue: 1,
  ...over,
});

describe('necro fleet numbers', () => {
  it('keeps the army bounded and the units temporary', () => {
    // The design sketch said "no cap"; the cap is the one deliberate deviation,
    // because revived units are actors with their own targeting and draw.
    expect(MAX_ALLIES).toBeGreaterThan(0);
    expect(ALLY_LIFETIME).toBeGreaterThan(1);
    expect(ALLY_DAMAGE_SCALE).toBeGreaterThan(0);
    expect(ALLY_DAMAGE_SCALE).toBeLessThanOrEqual(1);
    expect(ALLY_SPEED_SCALE).toBeGreaterThan(1);
  });

  it('inherits the shape and most of the bite of the corpse', () => {
    const stats = allyFromEnemy(corpse());
    expect(stats.radius).toBeCloseTo(12 * 0.9);
    expect(stats.sides).toBe(4);
    expect(stats.speed).toBeCloseTo(2.4 * ALLY_SPEED_SCALE);
    expect(stats.damage).toBe(8); // 10 × 0.8
    expect(stats.strokeColor).toBe('#ef4444');
  });

  it('never revives something too small to see or too weak to matter', () => {
    const speck = allyFromEnemy(corpse({ radius: 2, damage: 1 }));
    expect(speck.radius).toBe(6);
    expect(speck.damage).toBe(1);
  });

  it('stays off until the card is taken', () => {
    const def = findUpgrade('necro_fleet');
    expect(def).toBeDefined();

    const p = createPlayer('alpha_prism');
    expect(p.necroChance).toBe(0); // the engine's gate for revives

    def!.apply(p, 1);
    expect(p.necroChance).toBe(0.25);
  });

  it('revives more often on every rung', () => {
    const def = findUpgrade('necro_fleet')!;
    const p = createPlayer('alpha_prism');
    const seen: number[] = [];
    for (let lvl = 1; lvl <= def.maxLevel; lvl++) {
      def.apply(p, lvl);
      seen.push(p.necroChance);
    }
    expect(seen).toEqual([0.25, 0.35, 0.5]);
  });
});
