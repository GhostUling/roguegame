import { describe, expect, it } from 'vitest';
import {
  GRID_CELL,
  GRID_FLASH,
  GRID_STUN,
  gridLineDistance,
  gridVerdictDamage,
} from '../systems/gridVerdict';
import { findUpgrade } from '../cards/upgradePools';
import { createPlayer } from '../core/player';

describe('gridLineDistance', () => {
  it('is zero exactly on a line, and peaks halfway between two', () => {
    expect(gridLineDistance(0)).toBe(0);
    expect(gridLineDistance(GRID_CELL)).toBe(0);
    expect(gridLineDistance(GRID_CELL * 3)).toBe(0);
    expect(gridLineDistance(GRID_CELL / 2)).toBe(GRID_CELL / 2);
    expect(gridLineDistance(GRID_CELL * 1.5)).toBe(GRID_CELL / 2);
  });

  it('measures from the nearer side, whichever side that is', () => {
    expect(gridLineDistance(1)).toBe(1);
    expect(gridLineDistance(GRID_CELL - 1)).toBe(1);
  });

  it('is symmetric about zero, so off-screen coordinates still measure', () => {
    expect(gridLineDistance(-1)).toBe(1);
    expect(gridLineDistance(-GRID_CELL - 2)).toBe(2);
  });

  it('never reports more than half a cell', () => {
    for (let v = -200; v <= 200; v += 0.5) {
      const d = gridLineDistance(v);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(GRID_CELL / 2);
    }
  });
});

describe('grid verdict tuning', () => {
  it('keeps the cell and the timings positive', () => {
    expect(GRID_CELL).toBeGreaterThan(0);
    expect(GRID_FLASH).toBeGreaterThan(0);
    expect(GRID_STUN).toBeGreaterThan(0);
  });
});

describe('grid verdict card', () => {
  it('stays off until taken, then arms on its own cadence', () => {
    const def = findUpgrade('grid_verdict');
    expect(def).toBeDefined();

    const p = createPlayer('alpha_prism');
    expect(p.gridInterval).toBe(0); // the engine's gate for the whole scan

    def!.apply(p, 1);
    expect(p.gridInterval).toBe(10);
    // The first verdict lands a full cycle in, not on the frame the card is
    // picked, so taking it mid-fight cannot instantly clear the screen.
    expect(p.gridTimer).toBe(p.gridInterval);
  });

  it('deals a multiple of the player shot', () => {
    const p = createPlayer('alpha_prism'); // 26 damage
    p.gridDamageScale = 2;
    expect(gridVerdictDamage(p)).toBe(52);
  });

  it('never deals zero, so a verdict always registers', () => {
    const p = createPlayer('alpha_prism');
    p.bulletDamage = 1;
    p.gridDamageScale = 0.1;
    expect(gridVerdictDamage(p)).toBe(1);
  });
});
