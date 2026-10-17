import { describe, expect, it } from 'vitest';
import { CLONE_LIFETIME, MAX_CLONES, cloneShotDamage, cloneStationOffset } from '../systems/clones';
import { findUpgrade } from '../cards/upgradePools';
import { createPlayer } from '../core/player';

describe('mirror clone numbers', () => {
  it('lasts a while and stays capped', () => {
    expect(CLONE_LIFETIME).toBeGreaterThan(1);
    expect(MAX_CLONES).toBeGreaterThanOrEqual(1);
  });

  it('holds station clear of the hull, on alternating sides', () => {
    const first = cloneStationOffset(0);
    const second = cloneStationOffset(1);

    // A clone sitting on the hull would be invisible under the player's ship.
    expect(Math.hypot(first.x, first.y)).toBeGreaterThan(0);
    // Mirrored across the hull, and never on the same spot.
    expect(first.x).toBe(-second.x);
    expect(first.y).toBe(second.y);
    expect(cloneStationOffset(2)).not.toEqual(cloneStationOffset(0));
  });

  it('stays off until the card is taken, then deploys on its cadence', () => {
    const def = findUpgrade('mirror_self');
    expect(def).toBeDefined();

    const p = createPlayer('alpha_prism');
    expect(p.cloneInterval).toBe(0); // the engine's gate for the whole subsystem

    def!.apply(p, 1);
    expect(p.cloneInterval).toBe(40);
    expect(p.cloneTimer).toBe(p.cloneInterval);
  });

  it('carries a share of the player shot that grows with the card', () => {
    const def = findUpgrade('mirror_self')!;
    const p = createPlayer('alpha_prism'); // 26 damage
    const seen: number[] = [];
    for (let lvl = 1; lvl <= def.maxLevel; lvl++) {
      def.apply(p, lvl);
      seen.push(cloneShotDamage(p));
    }
    expect(seen).toEqual([13, 16, 18]); // 26 × 0.5 / 0.6 / 0.7
  });
});
