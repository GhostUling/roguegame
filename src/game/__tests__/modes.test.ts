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
      expect(def.threatScale).toBeGreaterThanOrEqual(0);
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

  it('makes overflow the densest mode, and the only one whose enemies bite harder', () => {
    const solo = GAME_MODES.standard;
    const overflow = GAME_MODES.overflow;
    expect(overflow.spawnMultiplier).toBeGreaterThan(solo.spawnMultiplier);
    expect(overflow.maxAlive).toBeGreaterThan(GAME_MODES.twin_link.maxAlive);
    expect(overflow.growthScale).toBeGreaterThan(solo.growthScale);
    expect(overflow.threatScale).toBeGreaterThan(0);
    expect(overflow.pilotSlots).toBe(1);
  });

  it('holds enemy damage and speed flat in every mode that predates the curves', () => {
    // threatScale is what gates the per-type damage/speed growth rates, so these
    // two have to stay at 0 or the standard and twin runs would quietly get
    // harder the longer they lasted.
    expect(GAME_MODES.standard.threatScale).toBe(0);
    expect(GAME_MODES.twin_link.threatScale).toBe(0);
  });

  it('draws every mode but Overflow from the standard card table', () => {
    for (const [key, def] of Object.entries(GAME_MODES)) {
      if (key === 'overflow') {
        expect(def.cardPool).toBe('overflow');
      } else {
        expect(def.cardPool, key).toBe('standard');
      }
    }
  });

  it('falls back to the standard run for an unknown mode id', () => {
    expect(modeOf(undefined)).toBe(GAME_MODES.standard);
    expect(modeOf('standard')).toBe(GAME_MODES.standard);
    expect(modeOf('twin_link')).toBe(GAME_MODES.twin_link);
    expect(modeOf('overflow')).toBe(GAME_MODES.overflow);
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

  it('reports a solo mode that is not standard from the run it recorded', () => {
    // Without this the engine reads standard's knobs for an Overflow run, and
    // the mode silently does nothing.
    expect(modeOfPlayer({ gameMode: 'overflow' })).toBe(GAME_MODES.overflow);
    expect(modeOfPlayer({ gameMode: 'overflow', twinPilotId: 'gamma_viper' })).toBe(
      GAME_MODES.overflow
    );
  });
});

describe('modeForPilots', () => {
  it('links the run only when a second pilot was picked and no mode was chosen', () => {
    expect(modeForPilots(undefined, 'zeta_aurora')).toBe('twin_link');
    expect(modeForPilots()).toBe('standard');
  });

  it('never overrides the mode the title screen picked', () => {
    expect(modeForPilots('overflow')).toBe('overflow');
    expect(modeForPilots('overflow', 'zeta_aurora')).toBe('overflow');
    expect(modeForPilots('standard', 'zeta_aurora')).toBe('standard');
  });
});
