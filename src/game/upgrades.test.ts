import { describe, expect, it } from 'vitest';
import { ALL_UPGRADES, getRandomUpgrades } from './upgrades';
import { createPlayer } from './player';

describe('upgrade table', () => {
  it('keeps ids and keys unique', () => {
    expect(new Set(ALL_UPGRADES.map((u) => u.id)).size).toBe(ALL_UPGRADES.length);
    expect(new Set(ALL_UPGRADES.map((u) => u.key)).size).toBe(ALL_UPGRADES.length);
  });

  it('gives every upgrade a real level ceiling and readable copy', () => {
    for (const u of ALL_UPGRADES) {
      expect(u.maxLevel, u.key).toBeGreaterThan(0);
      expect(u.nameZh.length, u.key).toBeGreaterThan(0);
      expect(u.desc.length, u.key).toBeGreaterThan(0);
    }
  });

  it('applies every upgrade without throwing', () => {
    for (const u of ALL_UPGRADES) {
      const p = createPlayer('alpha_prism');
      expect(() => u.apply(p, 1), u.key).not.toThrow();
    }
  });

  it('survives being applied past its own ceiling', () => {
    for (const u of ALL_UPGRADES) {
      const p = createPlayer('alpha_prism');
      for (let i = 0; i < u.maxLevel + 3; i++) {
        expect(() => u.apply(p, i), u.key).not.toThrow();
      }
    }
  });

  it('describes the step it is about to take', () => {
    for (const u of ALL_UPGRADES) {
      const p = createPlayer('alpha_prism');
      expect(u.statDiffText(p, 1).length, u.key).toBeGreaterThan(0);
    }
  });
});

describe('upgrade caps', () => {
  it('holds multi-shot at six barrels', () => {
    const p = createPlayer('alpha_prism');
    const multi = ALL_UPGRADES.find((u) => u.key === 'multi_shot')!;
    for (let i = 0; i < 10; i++) multi.apply(p, i);
    expect(p.bulletCount).toBe(6);
  });

  it('holds the fire interval at the 80ms floor', () => {
    const p = createPlayer('alpha_prism');
    const rate = ALL_UPGRADES.find((u) => u.key === 'fire_rate')!;
    for (let i = 0; i < 12; i++) rate.apply(p, i);
    expect(p.fireRate).toBeGreaterThanOrEqual(80);
  });

  it('holds crit chance at 90%', () => {
    const p = createPlayer('gamma_viper');
    const crit = ALL_UPGRADES.find((u) => u.key === 'critical_core')!;
    for (let i = 0; i < 12; i++) crit.apply(p, i);
    expect(p.critChance).toBeLessThanOrEqual(0.9);
  });

  it('keeps the damage ladder strictly increasing', () => {
    const p = createPlayer('alpha_prism');
    const dmg = ALL_UPGRADES.find((u) => u.key === 'damage')!;
    let previous = p.bulletDamage;
    for (let i = 0; i < dmg.maxLevel; i++) {
      dmg.apply(p, i);
      expect(p.bulletDamage).toBeGreaterThan(previous);
      previous = p.bulletDamage;
    }
  });
});

describe('getRandomUpgrades', () => {
  it('deals a hand of distinct, unmaxed options', () => {
    const p = createPlayer('alpha_prism');
    for (let i = 0; i < 40; i++) {
      const hand = getRandomUpgrades(p, {});
      expect(hand).toHaveLength(3);
      expect(new Set(hand.map((o) => o.key)).size).toBe(hand.length);
    }
  });

  it('falls back to the emergency repair card once everything is maxed', () => {
    const p = createPlayer('alpha_prism');
    const maxed: Record<string, number> = {};
    for (const u of ALL_UPGRADES) maxed[u.key] = u.maxLevel;

    const hand = getRandomUpgrades(p, maxed);
    expect(hand).toHaveLength(1);
    expect(hand[0].key).toBe('emergency_repair');
    expect(hand[0].apply).toBeTypeOf('function');
  });

  it('still deals a hand when some upgrades are maxed', () => {
    const p = createPlayer('alpha_prism');
    const levels = { multi_shot: ALL_UPGRADES.find((u) => u.key === 'multi_shot')!.maxLevel };
    const hand = getRandomUpgrades(p, levels);
    expect(hand).toHaveLength(3);
    expect(hand.map((o) => o.key)).not.toContain('multi_shot');
  });
});
