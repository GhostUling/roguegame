import { describe, expect, it } from 'vitest';
import { afterDroneShield, statusDamageMultiplier } from '../engine/damage';

describe('statusDamageMultiplier', () => {
  const player = { cryoVulnerability: 0.2 };

  it('leaves a clean enemy alone, expired statuses included', () => {
    expect(statusDamageMultiplier({ frozenTimer: 0, markedTimer: 0 }, player)).toBe(1);
    expect(statusDamageMultiplier({ frozenTimer: -0.5, markedTimer: -1 }, player)).toBe(1);
  });

  it('applies cryo vulnerability and the mark separately', () => {
    expect(statusDamageMultiplier({ frozenTimer: 0.4, markedTimer: 0 }, player)).toBeCloseTo(1.2);
    expect(statusDamageMultiplier({ frozenTimer: 0, markedTimer: 0.4 }, player)).toBeCloseTo(1.25);
  });

  it('stacks both multiplicatively', () => {
    expect(statusDamageMultiplier({ frozenTimer: 0.4, markedTimer: 0.4 }, player)).toBeCloseTo(1.5);
  });
});

describe('afterDroneShield', () => {
  it('passes damage through when the guardian drone is gone', () => {
    expect(afterDroneShield(20, { droneShield: false, droneShieldReduction: 0.3 })).toBe(20);
  });

  it('rounds the reduction and never bows below 1', () => {
    expect(afterDroneShield(20, { droneShield: true, droneShieldReduction: 0.3 })).toBe(14);
    expect(afterDroneShield(1, { droneShield: true, droneShieldReduction: 1 })).toBe(1);
  });
});
