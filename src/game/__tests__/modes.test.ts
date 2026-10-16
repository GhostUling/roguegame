import { describe, expect, it } from 'vitest';
import { GAME_MODES, isPaired, modeForPilots, modeOf, modeOfPlayer } from '../modes';

describe('game mode table', () => {
  it('gives every mode a unique id matching its key', () => {
    for (const [key, def] of Object.entries(GAME_MODES)) {
      expect(def.id).toBe(key);
    }
  });

  it('keeps every tuning knob in a sane range', () => {
    for (const def of Object.values(GAME_MODES)) {
      expect(def.pilotSlots).toBeGreaterThanOrEqual(1);
      expect(def.wingSpacing).toBeGreaterThanOrEqual(0);
      expect(def.spawnMultiplier).toBeGreaterThanOrEqual(1);
      expect(def.maxAlive).toBeGreaterThan(def.spawnMultiplier);
      expect(def.growthScale).toBeGreaterThanOrEqual(1);
      expect(def.name.length).toBeGreaterThan(0);
      expect(def.desc.length).toBeGreaterThan(0);
    }
  });

  it('only spreads a formation across wings when the mode flies two pilots', () => {
    for (const def of Object.values(GAME_MODES)) {
      if (def.pilotSlots === 1) expect(def.wingSpacing).toBe(0);
      if (def.pilotSlots === 2) expect(def.wingSpacing).toBeGreaterThan(0);
    }
  });

  it('makes twin link the harder, denser mode', () => {
    const solo = GAME_MODES.standard;
    const twin = GAME_MODES.twin_link;
    expect(twin.spawnMultiplier).toBeGreaterThan(solo.spawnMultiplier);
    expect(twin.maxAlive).toBeGreaterThan(solo.maxAlive);
    expect(twin.growthScale).toBeGreaterThan(solo.growthScale);
    expect(twin.pooledHp).toBe(true);
    expect(solo.pooledHp).toBe(false);
  });

  it('falls back to the standard run for an unknown mode id', () => {
    expect(modeOf(undefined)).toBe(GAME_MODES.standard);
    expect(modeOf('standard')).toBe(GAME_MODES.standard);
    expect(modeOf('twin_link')).toBe(GAME_MODES.twin_link);
  });
});

describe('isPaired', () => {
  it('needs both the mode and a second pilot', () => {
    expect(isPaired({ gameMode: 'twin_link', twinPilotId: 'beta_phalanx' })).toBe(true);
    expect(isPaired({ gameMode: 'twin_link' })).toBe(false);
    expect(isPaired({ gameMode: 'standard', twinPilotId: 'beta_phalanx' })).toBe(false);
    expect(isPaired({})).toBe(false);
  });
});

describe('modeOfPlayer', () => {
  it('reports the linked descriptor only for a real pair', () => {
    expect(modeOfPlayer({ gameMode: 'twin_link', twinPilotId: 'gamma_viper' })).toBe(
      GAME_MODES.twin_link
    );
    // A link request with no second pilot must not inherit the twin knobs.
    expect(modeOfPlayer({ gameMode: 'twin_link' })).toBe(GAME_MODES.standard);
    expect(modeOfPlayer({ gameMode: 'standard' })).toBe(GAME_MODES.standard);
  });
});

describe('modeForPilots', () => {
  it('links the run only when a second pilot was picked', () => {
    expect(modeForPilots('zeta_aurora')).toBe('twin_link');
    expect(modeForPilots()).toBe('standard');
  });
});
