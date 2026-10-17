import { describe, expect, it } from 'vitest';
import {
  LANCE_LIFETIME,
  LANCE_SPEED,
  MAX_RIFTS,
  RIFT_LIFETIME,
  RIFT_SPACING,
  RIFT_TICK_SECONDS,
  lanceDamage,
  riftBranch,
  riftNodePath,
  riftTickDamage,
} from '../systems/riftLance';
import { findUpgrade } from '../cards/upgradePools';
import { createPlayer } from '../core/player';

describe('rift lance numbers', () => {
  it('flies fast enough to read as a thrown spear, not a shot', () => {
    // It has to outrun every bullet in the game, or the throw reads as a slow
    // projectile rather than something going through the field.
    expect(LANCE_SPEED).toBeGreaterThan(11); // the player's bullet speed
    expect(LANCE_SPEED * 60 * LANCE_LIFETIME).toBeGreaterThan(800);
  });

  it('holds a whole seam, and outlives the spear by a wide margin', () => {
    // A seam is one continuous line: refusing the newest node at the cap would
    // leave a hole in the middle of it, so the cap must fit a full flight.
    const perFlight = Math.ceil((LANCE_SPEED * 60 * LANCE_LIFETIME) / RIFT_SPACING);
    expect(MAX_RIFTS).toBeGreaterThanOrEqual(perFlight);

    expect(RIFT_TICK_SECONDS).toBeGreaterThan(0);
    expect(RIFT_TICK_SECONDS).toBeLessThan(RIFT_LIFETIME);
    // The tear is the point of the card, so it must outlast the spear itself.
    expect(RIFT_LIFETIME).toBeGreaterThan(LANCE_LIFETIME);
  });
});

describe('riftBranch', () => {
  it('is stable per node, so the crack does not shimmer', () => {
    for (const id of [1, 2, 7, 40, 139]) {
      expect(riftBranch(id)).toEqual(riftBranch(id));
    }
  });

  it('keeps offshoots short and off-axis', () => {
    for (let id = 1; id <= 140; id++) {
      const branch = riftBranch(id);
      expect(Math.abs(branch.angle)).toBeLessThanOrEqual(0.5);
      expect(branch.length).toBeGreaterThan(5);
      expect(branch.length).toBeLessThan(RIFT_SPACING);
    }
  });
});

describe('riftNodePath', () => {
  it('lays nodes no further apart than the spacing', () => {
    // The widest single step is the 3x-speed one, and it must still leave the
    // seam continuous — this is what stops the spear tunnelling past a body.
    const threeXSpeedStep = LANCE_SPEED * 0.24 * 60;
    const nodes = riftNodePath(0, 0, threeXSpeedStep, 0);

    let previous = 0;
    for (const node of nodes) {
      expect(node.x - previous).toBeLessThanOrEqual(RIFT_SPACING);
      previous = node.x;
    }
    expect(previous).toBeCloseTo(threeXSpeedStep);
  });

  it('ends exactly where the lance is going', () => {
    for (const [dx, dy] of [
      [0, 0],
      [RIFT_SPACING, 0],
      [RIFT_SPACING * 2.5, 0],
      [30, -70],
    ]) {
      const nodes = riftNodePath(10, 20, 10 + dx, 20 + dy);
      expect(nodes.length).toBeGreaterThanOrEqual(1);
      const last = nodes[nodes.length - 1];
      expect(last.x).toBeCloseTo(10 + dx);
      expect(last.y).toBeCloseTo(20 + dy);
    }
  });

  it('puts every node on the segment, not off to one side', () => {
    const nodes = riftNodePath(0, 0, 120, 60);
    for (const node of nodes) {
      // Cross product of the travel vector and the node offset stays zero.
      expect(Math.abs(120 * node.y - 60 * node.x)).toBeLessThan(1e-6);
    }
  });
});

describe('rift lance card', () => {
  it('stays off until the card is taken, then arms on its own clock', () => {
    const def = findUpgrade('rift_lance');
    expect(def).toBeDefined();

    const p = createPlayer('alpha_prism');
    expect(p.lanceInterval).toBe(0); // the engine's gate for the whole system

    def!.apply(p, 1);
    expect(p.lanceInterval).toBe(6);
    expect(p.lanceTimer).toBe(p.lanceInterval);
  });

  it('throws sooner, spears harder and tears deeper on every rung', () => {
    const def = findUpgrade('rift_lance')!;
    const p = createPlayer('alpha_prism'); // 26 damage
    const intervals: number[] = [];
    const spear: number[] = [];
    const seam: number[] = [];
    for (let lvl = 1; lvl <= def.maxLevel; lvl++) {
      def.apply(p, lvl);
      intervals.push(p.lanceInterval);
      spear.push(lanceDamage(p));
      seam.push(riftTickDamage(p));
    }
    expect(intervals).toEqual([6, 4.5, 3]);
    expect(spear).toEqual([65, 78, 91]); // 26 × 2.5 / 3 / 3.5
    expect(seam).toEqual([6, 7, 9]); // 26 × 0.22 / 0.28 / 0.34
  });

  it('never deals zero, so the seam always cuts', () => {
    const p = createPlayer('alpha_prism');
    p.bulletDamage = 1;
    p.riftDamageScale = 0.01;
    expect(riftTickDamage(p)).toBe(1);
  });
});
