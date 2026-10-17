import { describe, expect, it } from 'vitest';
import { circlesTouch, firstWingHit, roundHitsEnemy } from '../engine/collision';

describe('circlesTouch', () => {
  it('treats the exact radius sum as a miss', () => {
    expect(circlesTouch(8.99, 2, 1)).toBe(true);
    expect(circlesTouch(9, 2, 1)).toBe(false);
    expect(circlesTouch(100, 2, 1)).toBe(false);
  });
});

describe('roundHitsEnemy', () => {
  const enemy = { x: 100, y: 100, radius: 14 };

  it('hits inside the combined radius and misses outside it', () => {
    expect(roundHitsEnemy(100, 100, 4, enemy)).toBe(true);
    expect(roundHitsEnemy(117, 100, 4, enemy)).toBe(true);
    expect(roundHitsEnemy(119, 100, 4, enemy)).toBe(false);
    expect(roundHitsEnemy(113, 113, 4, enemy)).toBe(false);
  });

  it('keeps the original 32px axis reject, bosses included', () => {
    // The fast path predates the boss (radius 46). A round 40px away on one
    // axis would overlap its circle but is rejected by the box. Pinned here so
    // widening the boss hit box has to be a deliberate change.
    const boss = { x: 0, y: 0, radius: 46 };
    expect(roundHitsEnemy(40, 0, 4, boss)).toBe(false);
    expect(roundHitsEnemy(31, 0, 4, boss)).toBe(true);
  });
});

describe('firstWingHit', () => {
  const wings = { p1: { x: 100, y: 100 }, p2: { x: 200, y: 100 } };

  it('reports the port wing, and the starboard one only when paired', () => {
    expect(firstWingHit(100, 100, 8, wings, false, 10)).toEqual(wings.p1);
    expect(firstWingHit(200, 100, 8, wings, true, 10)).toEqual(wings.p2);
    expect(firstWingHit(200, 100, 8, wings, false, 10)).toBeNull();
  });

  it('misses when the round is clear of both hulls', () => {
    expect(firstWingHit(50, 50, 8, wings, true, 10)).toBeNull();
  });

  it('gives the tie to the port wing', () => {
    // With a 60px hull radius both wings overlap a round in the middle.
    expect(firstWingHit(150, 100, 8, wings, true, 60)).toEqual(wings.p1);
  });
});
