import { describe, expect, it } from 'vitest';
import {
  GEM_CAP,
  advanceLevel,
  bankGem,
  gemDropFor,
  gemPullSpeed,
  killScore,
  nextLevelXp,
} from '../engine/drops';

describe('killScore', () => {
  it('pays a flat boss bounty and scales normal kills with max HP', () => {
    expect(killScore({ isBoss: true, maxHp: 850 })).toBe(1500);
    expect(killScore({ isBoss: false, maxHp: 40 })).toBe(80);
    expect(killScore({ maxHp: 33 })).toBe(66);
  });
});

describe('gemDropFor', () => {
  it('drops one gem worth the enemy EXP', () => {
    expect(gemDropFor({ expValue: 3 })).toEqual({
      count: 1,
      value: 3,
      radius: 5,
      color: '#00ffaa',
      scatter: 8,
    });
  });

  it('scatters six richer gems from a boss', () => {
    expect(gemDropFor({ isBoss: true, expValue: 25 })).toEqual({
      count: 6,
      value: 5,
      radius: 7,
      color: '#00e5ff',
      scatter: 30,
    });
  });
});

describe('XP curve', () => {
  it('grows 28% per level from the level-2 bar', () => {
    expect(nextLevelXp(2)).toBe(25);
    expect(nextLevelXp(3)).toBe(32);
    expect(nextLevelXp(4)).toBe(41);
    expect(nextLevelXp(5)).toBe(53);
  });

  it('banks a gem and reports a fill at the threshold', () => {
    const player = { xp: 10, nextLevelXp: 18 };
    expect(bankGem(player, 7)).toBe(false);
    expect(player.xp).toBe(17);
    expect(bankGem(player, 1)).toBe(true);
    expect(player.xp).toBe(18);
  });

  it('advances one level, carries the overflow and raises the bar', () => {
    const player = { level: 1, xp: 25, nextLevelXp: 18 };
    advanceLevel(player);
    expect(player.level).toBe(2);
    expect(player.xp).toBe(7);
    expect(player.nextLevelXp).toBe(25);
  });
});

describe('gemPullSpeed', () => {
  it('caps the pull at 18 and fades to 5 at the edge of the field', () => {
    expect(gemPullSpeed(0, 120, 1)).toBe(18);
    expect(gemPullSpeed(110, 120, 1)).toBe(12);
    expect(gemPullSpeed(220, 120, 1)).toBe(5);
  });

  it('applies the pickup-speed card after the cap', () => {
    expect(gemPullSpeed(0, 120, 2)).toBe(36);
  });
});

describe('GEM_CAP', () => {
  it('is the merge threshold the loop uses', () => {
    expect(GEM_CAP).toBe(90);
  });
});
