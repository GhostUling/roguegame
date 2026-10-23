import { describe, expect, it } from 'vitest';
import {
  PREY_BUFF_CALLOUT,
  PREY_BUFF_INTERVAL,
  PREY_EXCLUDED_KEYS,
  pickPreyUpgrade,
  preyBuffCountdown,
  preyUpgradeCandidates,
} from '../engine/preyBuff';
import { ALL_UPGRADES } from '../cards/upgrades';
import { poolForMode } from '../cards/upgradePools';
import { GAME_MODES } from '../core/modes';
import { Player } from '../core/types';

const levels = (record: Record<string, number>): Pick<Player, 'upgradeLevels'> => ({
  upgradeLevels: record,
});

/** Every card pushed to its own ceiling. */
const allMaxed = (): Record<string, number> =>
  Object.fromEntries(ALL_UPGRADES.map((def) => [def.key, def.maxLevel]));

describe('prey escalation draws the run pool', () => {
  it('the hunt draws from the standard card table, not a second one', () => {
    expect(poolForMode(GAME_MODES.predator)).toBe(ALL_UPGRADES);
  });

  it('lands one free level every 30 seconds', () => {
    expect(PREY_BUFF_INTERVAL).toBe(30);
    expect(preyBuffCountdown(0)).toBe(30);
    expect(preyBuffCountdown(12)).toBe(18);
    // Clamped, so a HUD never counts into negative seconds.
    expect(preyBuffCountdown(31)).toBe(0);
    expect(PREY_BUFF_CALLOUT).toBeLessThan(PREY_BUFF_INTERVAL);
  });
});

describe('preyUpgradeCandidates', () => {
  it('offers the pool minus the two crystal-economy cards', () => {
    expect(preyUpgradeCandidates(ALL_UPGRADES, levels({}))).toHaveLength(
      ALL_UPGRADES.length - PREY_EXCLUDED_KEYS.length
    );
  });

  it('never offers a card the prey cannot possibly feel working', () => {
    const keys = preyUpgradeCandidates(ALL_UPGRADES, levels({})).map((def) => def.key);
    for (const excluded of PREY_EXCLUDED_KEYS) {
      expect(keys).not.toContain(excluded);
    }
    expect(keys).toContain('fire_rate');
  });

  it('drops a card once the hull has it maxed', () => {
    const maxed = ALL_UPGRADES.find((def) => !PREY_EXCLUDED_KEYS.includes(def.key))!;
    const eligible = preyUpgradeCandidates(
      ALL_UPGRADES,
      levels({ [maxed.key]: maxed.maxLevel })
    );
    expect(eligible).toHaveLength(ALL_UPGRADES.length - PREY_EXCLUDED_KEYS.length - 1);
    expect(eligible.some((def) => def.key === maxed.key)).toBe(false);
  });

  it('still offers a card that has levels left', () => {
    const card = ALL_UPGRADES.find((def) => def.maxLevel > 1 && !PREY_EXCLUDED_KEYS.includes(def.key))!;
    const eligible = preyUpgradeCandidates(ALL_UPGRADES, levels({ [card.key]: card.maxLevel - 1 }));
    expect(eligible.map((def) => def.key)).toContain(card.key);
  });
});

describe('pickPreyUpgrade', () => {
  const rolling = (value: number) => () => value;

  it('never hands out a maxed card', () => {
    const maxed = ALL_UPGRADES[0];
    const holder = levels({ [maxed.key]: maxed.maxLevel });
    for (const value of [0, 0.25, 0.5, 0.9999]) {
      expect(pickPreyUpgrade(ALL_UPGRADES, holder, rolling(value))!.key).not.toBe(maxed.key);
    }
  });

  it('stays inside the pool for any roll', () => {
    for (const value of [0, 0.33, 0.5, 0.98]) {
      const picked = pickPreyUpgrade(ALL_UPGRADES, levels({}), rolling(value));
      expect(ALL_UPGRADES.map((def) => def.key)).toContain(picked?.key);
    }
  });

  it('runs out — and says so — once the whole pool is maxed', () => {
    expect(preyUpgradeCandidates(ALL_UPGRADES, levels(allMaxed()))).toHaveLength(0);
    expect(pickPreyUpgrade(ALL_UPGRADES, levels(allMaxed()), rolling(0.5))).toBeUndefined();
  });
});
