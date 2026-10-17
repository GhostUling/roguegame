import { describe, expect, it } from 'vitest';
import {
  MAX_TURRETS,
  TURRET_FADE,
  TURRET_FIRE_INTERVAL,
  TURRET_LIFETIME,
  turretShotDamage,
} from '../systems/turrets';
import { findUpgrade } from '../cards/upgradePools';
import { createPlayer } from '../core/player';

describe('prism turret numbers', () => {
  it('stands for a while, fires on its own beat, and is capped', () => {
    expect(TURRET_LIFETIME).toBeGreaterThan(1);
    expect(TURRET_FIRE_INTERVAL).toBeGreaterThan(0);
    expect(MAX_TURRETS).toBeGreaterThanOrEqual(1);
    // The fade window has to fit inside the lifetime, or a turret blinks out
    // before it ever fires its first shot.
    expect(TURRET_FADE).toBeGreaterThan(0);
    expect(TURRET_FADE).toBeLessThan(TURRET_LIFETIME);
  });

  it('stays off until the card is taken, then deploys on its cadence', () => {
    const def = findUpgrade('prism_turret');
    expect(def).toBeDefined();

    const p = createPlayer('alpha_prism');
    expect(p.turretInterval).toBe(0); // the engine's gate for the whole subsystem

    def!.apply(p, 1);
    expect(p.turretInterval).toBeGreaterThan(0);
    // The first turret lands one full cadence in, not on the frame the card was
    // picked, so taking the card mid-fight does not drop a turret instantly.
    expect(p.turretTimer).toBe(p.turretInterval);
  });

  it('carries a share of the player shot that grows with the card', () => {
    const def = findUpgrade('prism_turret')!;
    const p = createPlayer('alpha_prism'); // 26 damage
    const seen: number[] = [];
    for (let lvl = 1; lvl <= def.maxLevel; lvl++) {
      def.apply(p, lvl);
      seen.push(turretShotDamage(p));
    }
    expect(seen).toEqual([21, 26, 31]); // 26 × 0.8 / 1.0 / 1.2
  });

  it('never deals zero, so a turret round always registers', () => {
    const p = createPlayer('alpha_prism');
    p.bulletDamage = 1;
    p.turretDamageScale = 0.01;
    expect(turretShotDamage(p)).toBe(1);
  });
});
