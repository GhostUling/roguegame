import { describe, expect, it } from 'vitest';
import {
  SOLDIER_BITE_SHARE,
  soldierBiteDamage,
  soldierWaveCount,
  swarmAround,
  swarmCentre,
  swarmNearby,
} from '../engine/swarm';

describe('soldierWaveCount', () => {
  it('stops the moment the field is full', () => {
    expect(soldierWaveCount(1, 1.5, 260, 260)).toBe(0);
    expect(soldierWaveCount(1, 1.5, 259, 260)).toBeGreaterThan(0);
  });

  it('always sends at least one, and grows with the multiplier', () => {
    expect(soldierWaveCount(0.1, 0.1, 0, 260)).toBe(1);
    expect(soldierWaveCount(1, 3, 0, 260)).toBeGreaterThan(soldierWaveCount(1, 1, 0, 260));
  });
});

describe('soldierBiteDamage', () => {
  it('is a share of the soldier’s own contact damage', () => {
    expect(soldierBiteDamage({ damage: 20 })).toBe(Math.round(20 * SOLDIER_BITE_SHARE));
    expect(soldierBiteDamage({ damage: 1 })).toBe(1);
  });
});

describe('swarm geometry', () => {
  const swarm = [
    { x: 100, y: 100 },
    { x: 200, y: 300 },
  ];

  it('reports the centre of mass, and nothing for an empty field', () => {
    expect(swarmCentre(swarm)).toEqual({ x: 150, y: 200, count: 2 });
    expect(swarmCentre([])).toEqual({ x: 0, y: 0, count: 0 });
  });

  it('counts the soldiers inside a radius of a point', () => {
    expect(swarmAround(swarm, 100, 100, 1)).toBe(1);
    expect(swarmAround(swarm, 150, 200, 120)).toBe(2);
    expect(swarmAround(swarm, 900, 900, 50)).toBe(0);
  });

  it('collects the soldiers inside a radius of a point', () => {
    expect(swarmNearby(swarm, 100, 100, 1)).toEqual([{ x: 100, y: 100 }]);
    expect(swarmNearby(swarm, 150, 200, 120)).toHaveLength(2);
    expect(swarmNearby(swarm, 900, 900, 50)).toEqual([]);
  });
});

