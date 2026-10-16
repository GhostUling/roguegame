import { describe, expect, it } from 'vitest';
import { CharacterId } from '../types';
import { CHARACTERS, drawCharacterShip, getCharacterDef } from './index';

/** Every chassis the type union allows, in hangar order. */
const EXPECTED_IDS: CharacterId[] = [
  'alpha_prism',
  'beta_phalanx',
  'gamma_viper',
  'delta_chronos',
  'epsilon_carrier',
  'zeta_aurora',
];

/**
 * Canvas stub: property writes are stored, every method call is a no-op.
 * Enough to run a drawer end to end without a real canvas.
 */
function stubCtx(): CanvasRenderingContext2D {
  const store: Record<string, unknown> = {};
  return new Proxy(store, {
    get: (target, prop) => (prop in target ? target[prop as string] : () => undefined),
    set: (target, prop, value) => {
      target[prop as string] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

describe('character registry', () => {
  it('lists every chassis exactly once, in hangar order', () => {
    expect(CHARACTERS.map((c) => c.id)).toEqual(EXPECTED_IDS);
  });

  it('declares each hull with the identity its id promises', () => {
    for (const def of CHARACTERS) {
      expect(def.name.length).toBeGreaterThan(0);
      expect(def.nameZh.length).toBeGreaterThan(0);
      expect(def.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(def.accentColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(def.baseStats.hp).toBeGreaterThan(0);
      expect(def.baseStats.fireRate).toBeGreaterThan(0);
      expect(def.passive.desc.length).toBeGreaterThan(0);
      expect(def.activeSkill.cooldown).toBeGreaterThan(0);
    }
  });

  it('gives every chassis its own active skill id', () => {
    const skillIds = CHARACTERS.map((c) => c.activeSkill.id);
    expect(new Set(skillIds).size).toBe(skillIds.length);
  });

  it('resolves each id to its own definition', () => {
    for (const def of CHARACTERS) {
      expect(getCharacterDef(def.id)).toBe(def);
    }
  });

  it('falls back to the first chassis for an unknown id', () => {
    expect(getCharacterDef('not_a_ship' as CharacterId)).toBe(CHARACTERS[0]);
  });

  it('has a wired drawer for every chassis, and none of them throw', () => {
    for (const def of CHARACTERS) {
      const ctx = stubCtx();
      expect(() => drawCharacterShip(ctx, def.id, 18, 0.7, 1.4), def.id).not.toThrow();
    }
  });
});
