import { describe, expect, it } from 'vitest';
import { GAME_MODES } from '../core/modes';
import { poolForMode, EVERY_UPGRADE, findUpgrade } from '../cards/upgradePools';
import {
  RESONANCE_EXCLUSIVE_UPGRADES,
  RESONANCE_SUPER_WEAPONS,
  RESONANCE_UPGRADES,
} from '../cards/resonanceUpgrades';
import { getRandomUpgrades } from '../cards/upgrades';
import { createPlayer } from '../core/player';
import { ENEMY_TYPES, enemyHpFor } from '../core/enemyTypes';

describe('Resonance Mode (超阶共鸣模式)', () => {
  it('registers resonance mode with expected high-intensity parameters', () => {
    const res = GAME_MODES.resonance;
    expect(res).toBeDefined();
    expect(res.name).toBe('超阶共鸣');
    expect(res.tag).toBe('RESONANCE');
    expect(res.cardPool).toBe('resonance');
    expect(res.pilotSlots).toBe(1);
    expect(res.spawnMultiplier).toBeGreaterThanOrEqual(3);
    expect(res.maxAlive).toBeGreaterThanOrEqual(200);
    expect(res.growthScale).toBeGreaterThanOrEqual(2.5);
    expect(res.threatScale).toBeGreaterThan(0);
    expect(res.enemyHpMultiplier).toBe(2.2);
  });

  it('draws from RESONANCE_UPGRADES containing strictly the 7 super weapons and 3 resonance exclusives', () => {
    const pool = poolForMode(GAME_MODES.resonance);
    expect(pool).toBe(RESONANCE_UPGRADES);
    expect(pool).toHaveLength(RESONANCE_SUPER_WEAPONS.length + RESONANCE_EXCLUSIVE_UPGRADES.length);
    expect(pool).toHaveLength(10);

    const superKeys = [
      'gaster_blasters',
      'void_iaijutsu',
      'gate_of_babylon',
      'singularity_meteor',
      'divine_ion_beam',
      'prism_aegis',
      'mirage_blades',
    ];

    for (const key of superKeys) {
      const found = pool.find((u) => u.key === key);
      expect(found, `super weapon ${key} must be in resonance pool`).toBeDefined();
    }
  });

  it('guarantees at least 1 super-weapon offering in early resonance picks', () => {
    const player = createPlayer('alpha_prism', 'resonance');
    const hand = getRandomUpgrades(player, {}, 3, poolForMode(GAME_MODES.resonance));

    expect(hand.length).toBe(3);
    const superSet = new Set(RESONANCE_SUPER_WEAPONS.map((u) => u.key));
    expect(hand.some((opt) => superSet.has(opt.key))).toBe(true);
    for (const opt of hand) {
      const def = findUpgrade(opt.key);
      expect(def).toBeDefined();
      expect(RESONANCE_UPGRADES.some((u) => u.key === opt.key)).toBe(true);
    }
  });

  it('applies all resonance cards cleanly and boosts both maxHp and HP regen on titan_hyper_shield', () => {
    for (const def of RESONANCE_UPGRADES) {
      const player = createPlayer('alpha_prism', 'resonance');
      for (let lvl = 1; lvl <= def.maxLevel; lvl++) {
        expect(() => def.apply(player, lvl)).not.toThrow();
        const diff = def.statDiffText(player, lvl);
        expect(diff.length).toBeGreaterThan(0);
      }
    }

    const p = createPlayer('alpha_prism', 'resonance');
    const baseMaxHp = p.maxHp;
    const baseShieldRegen = p.shieldRegenRate;
    const hpCard = findUpgrade('titan_hyper_shield')!;
    hpCard.apply(p, 1);
    expect(p.maxHp).toBeGreaterThan(baseMaxHp);
    expect(p.hpRegenRate || 0).toBeGreaterThan(0);
    expect(p.shieldRegenRate).toBeGreaterThan(baseShieldRegen);
  });

  it('ensures all keys in EVERY_UPGRADE remain strictly unique', () => {
    const keys = EVERY_UPGRADE.map((u) => u.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it('applies enemyHpMultiplier scaling for more durable high-density resonance waves', () => {
    const def = ENEMY_TYPES.chaser;
    const baseHp = enemyHpFor(def, 0, 1);
    const resonanceHp = Math.round(
      enemyHpFor(def, 0, GAME_MODES.resonance.growthScale) * GAME_MODES.resonance.enemyHpMultiplier
    );
    expect(resonanceHp).toBeGreaterThanOrEqual(baseHp * 2);
  });
});
