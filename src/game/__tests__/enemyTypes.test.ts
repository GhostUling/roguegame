import { describe, expect, it } from 'vitest';
import { ENEMY_TYPES, enemyHpFor, pickEnemyType } from './enemyTypes';

const ALL_TYPES = ['boss', 'charger', 'chaser', 'hive', 'sniper', 'speeder', 'tank'];

/** Every type the wave table can produce, sampled across the whole roll range. */
function spawnedTypesAt(elapsedSeconds: number): Set<string> {
  const seen = new Set<string>();
  for (let roll = 0; roll < 1; roll += 0.005) {
    seen.add(pickEnemyType(elapsedSeconds, roll));
  }
  return seen;
}

describe('enemy stat table', () => {
  it('defines every enemy type, boss included', () => {
    expect(Object.keys(ENEMY_TYPES).sort()).toEqual(ALL_TYPES);
  });

  it('gives the boss the steepest growth curve', () => {
    const slopes = Object.values(ENEMY_TYPES).map((d) => d.hpGrowthPerMin);
    expect(ENEMY_TYPES.boss.hpGrowthPerMin).toBe(Math.max(...slopes));
  });

  it('never spawns a boss from the wave table', () => {
    for (const t of [0, 44, 45, 89, 90, 149, 150, 600]) {
      expect(spawnedTypesAt(t).has('boss')).toBe(false);
    }
  });
});

describe('wave composition brackets', () => {
  it('opens with only chasers and speeders', () => {
    for (const t of [0, 10, 30, 44.9]) {
      expect([...spawnedTypesAt(t)].sort()).toEqual(['chaser', 'speeder']);
    }
  });

  it('unlocks chargers and tanks at 45s', () => {
    expect([...spawnedTypesAt(45)].sort()).toEqual(['charger', 'chaser', 'speeder', 'tank']);
  });

  it('unlocks snipers and hives at 90s, dropping tanks', () => {
    expect([...spawnedTypesAt(90)].sort()).toEqual(['charger', 'chaser', 'hive', 'sniper', 'speeder']);
  });

  it('swaps speeders out for tanks from 150s', () => {
    expect([...spawnedTypesAt(150)].sort()).toEqual(['charger', 'chaser', 'hive', 'sniper', 'tank']);
    expect([...spawnedTypesAt(600)].sort()).toEqual(['charger', 'chaser', 'hive', 'sniper', 'tank']);
  });

  it('treats the threshold as an upper bound on the roll', () => {
    expect(pickEnemyType(0, 0.7499)).toBe('chaser');
    expect(pickEnemyType(0, 0.75)).toBe('speeder');
    expect(pickEnemyType(0, 0.999)).toBe('speeder');
  });
});

describe('enemyHpFor', () => {
  const chaser = ENEMY_TYPES.chaser;

  it('returns the base value at the start of a run', () => {
    expect(enemyHpFor(chaser, 0)).toBe(chaser.hp);
  });

  it('adds the documented share of base hp every two minutes', () => {
    expect(enemyHpFor(chaser, 120)).toBeCloseTo(chaser.hp * 1.7);
    expect(enemyHpFor(chaser, 240)).toBeCloseTo(chaser.hp * 2.4);
  });

  it('steepens the curve by the growth scale', () => {
    expect(enemyHpFor(chaser, 120, 1.5)).toBeCloseTo(chaser.hp * 2.05);
    expect(enemyHpFor(ENEMY_TYPES.boss, 240, 1.5)).toBeCloseTo(ENEMY_TYPES.boss.hp * 3.7);
  });
});
