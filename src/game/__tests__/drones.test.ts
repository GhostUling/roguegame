import { describe, expect, it } from 'vitest';
import { createPlayer } from '../player';
import { ALL_UPGRADES } from '../upgrades';
import {
  interceptorInterval,
  interceptorShotDamage,
  missileShotDamage,
  railgunInterval,
  railgunShotDamage,
} from '../drones';

const applyUpgrade = (p: ReturnType<typeof createPlayer>, key: string, level: number) => {
  ALL_UPGRADES.find((u) => u.key === key)!.apply(p, level);
};

describe('drone cadence', () => {
  it('uses the base cadence until overclock is taken', () => {
    const p = createPlayer('alpha_prism');
    expect(interceptorInterval(p, false)).toBe(460);
    expect(railgunInterval(p, false)).toBe(3400);
  });

  it('speeds the whole swarm up as overclock levels', () => {
    const p = createPlayer('alpha_prism');
    applyUpgrade(p, 'drone_overclock', 1);
    expect(interceptorInterval(p, false)).toBe(Math.round(460 / 1.35));
    applyUpgrade(p, 'drone_overclock', 3);
    expect(interceptorInterval(p, false)).toBe(240); // the promised floor
  });

  it('lets the carrier overdrive shorten every cadence', () => {
    const p = createPlayer('epsilon_carrier');
    const idle = interceptorInterval(p, true);
    p.isSkillActive = true;
    expect(interceptorInterval(p, true)).toBeLessThan(idle);
    expect(interceptorInterval(p, true)).toBe(Math.round((460 / 1) * 0.45));
  });

  it('multiplies the railgun cadence by the same overclock rate', () => {
    const p = createPlayer('alpha_prism');
    applyUpgrade(p, 'summon_railgun', 2);
    applyUpgrade(p, 'drone_overclock', 3);
    expect(railgunInterval(p, false)).toBe(Math.round(2500 / 1.92));
  });
});

describe('drone damage', () => {
  it('scales the interceptor shot with overclock level two', () => {
    const p = createPlayer('alpha_prism');
    const before = interceptorShotDamage(p, false);
    applyUpgrade(p, 'drone_overclock', 2);
    expect(interceptorShotDamage(p, false)).toBe(Math.round(before * 1.25));
  });

  it('carries the carrier passive into every minion', () => {
    const p = createPlayer('epsilon_carrier');
    expect(interceptorShotDamage(p, true)).toBe(Math.round(p.bulletDamage * 0.45 * 1.35));
    p.isSkillActive = true;
    expect(interceptorShotDamage(p, true)).toBe(Math.round(p.bulletDamage * 0.45 * 1.8));
  });

  it('heavies the missile and the railgun by their own ladders', () => {
    const p = createPlayer('alpha_prism');
    applyUpgrade(p, 'drone_missiles', 2);
    applyUpgrade(p, 'summon_railgun', 2);
    expect(missileShotDamage(p, false)).toBe(Math.round(p.bulletDamage * 2.1));
    expect(railgunShotDamage(p, false)).toBe(Math.round(p.bulletDamage * 4.2));
  });
});
