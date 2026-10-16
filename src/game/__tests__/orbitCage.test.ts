import { describe, expect, it } from 'vitest';
import {
  ORBIT_REHIT_FLOOR_MS,
  ORBIT_SHELL_RADIUS,
  orbitRehitMs,
  orbitShellCount,
} from '../orbitCage';
import { findUpgrade } from '../upgradePools';
import { createPlayer } from '../player';

describe('orbit cage numbers', () => {
  it('gives one shell per barrel and never zero', () => {
    const p = createPlayer('alpha_prism');

    p.bulletCount = 0;
    expect(orbitShellCount(p)).toBe(1);

    p.bulletCount = 5;
    expect(orbitShellCount(p)).toBe(5);

    // The cage is bounded by the barrel cap, which is what keeps a
    // never-expiring set from ever outgrowing the projectile budget.
    p.bulletCount = 99;
    expect(orbitShellCount(p)).toBe(16);
  });

  it('gates re-hits on the player fire interval, with a floor', () => {
    const p = createPlayer('alpha_prism');

    p.fireRate = 400;
    expect(orbitRehitMs(p)).toBe(400);

    // A 40ms build must not be able to machine-gun one enemy through the cage.
    p.fireRate = 40;
    expect(orbitRehitMs(p)).toBe(ORBIT_REHIT_FLOOR_MS);
  });

  it('draws a shell big enough to see', () => {
    expect(ORBIT_SHELL_RADIUS).toBeGreaterThan(0);
  });
});

describe('orbit cage card', () => {
  it('leaves the straight volley alone until it is taken', () => {
    const def = findUpgrade('orbit_cage');
    expect(def).toBeDefined();

    const p = createPlayer('alpha_prism');
    expect(p.orbitShellRadius).toBe(0); // 0 means "bullets still fly straight"

    def!.apply(p, 1);
    expect(p.orbitShellRadius).toBe(70);
  });

  it('widens the orbit on every rung', () => {
    const def = findUpgrade('orbit_cage')!;
    const p = createPlayer('alpha_prism');
    const seen: number[] = [];
    for (let lvl = 1; lvl <= def.maxLevel; lvl++) {
      def.apply(p, lvl);
      seen.push(p.orbitShellRadius);
    }
    expect(seen).toEqual([70, 110, 150]);
  });
});
