import { describe, expect, it } from 'vitest';
import { PRESSURE_RADIUS, PreyView, preyHostilePriority, stepPreyAi } from '../engine/preyAi';

const SPEED = 4.4;

function view(over: Partial<PreyView> = {}): PreyView {
  return {
    x: 960,
    y: 540,
    // A hostile body 340px above it — a soldier or the pilot, it is not told.
    threatX: 960,
    threatY: 200,
    pressure: 0,
    swarmCentreX: 100,
    swarmCentreY: 100,
    hpFrac: 1,
    width: 1920,
    height: 1080,
    strafeTimer: 0,
    strafeSign: 1,
    ...over,
  };
}

describe('stepPreyAi — survival first', () => {
  it('breaks contact when something is in its face', () => {
    const order = stepPreyAi(view({ threatX: 960, threatY: 470 }), SPEED, 1 / 60);
    expect(order.vy).toBeGreaterThan(0);
  });

  it('breaks contact when enough bodies lean on it, even at arm’s length', () => {
    const crowded = stepPreyAi(view({ pressure: 4 }), SPEED, 1 / 60);
    expect(crowded.vy).toBeGreaterThan(0);
  });

  it('runs from the crowd rather than into it', () => {
    // Nearest body above, the swarm bunched below-right: it leaves upward and
    // leans away from the crowd, not through it.
    const order = stepPreyAi(
      view({ threatX: 960, threatY: 470, swarmCentreX: 1100, swarmCentreY: 900 }),
      SPEED,
      1 / 60
    );
    expect(order.vy).toBeGreaterThan(0);
    expect(order.vx).toBeLessThan(0);
  });

  it('closes the gap only when it is healthy and nothing is near', () => {
    const order = stepPreyAi(view({ threatX: 960, threatY: 60 }), SPEED, 1 / 60);
    expect(order.vy).toBeLessThan(0);
    expect(Math.abs(order.vy)).toBeGreaterThan(Math.abs(order.vx));
  });

  it('a wounded hull refuses to close, even on the same geometry', () => {
    const order = stepPreyAi(view({ threatX: 960, threatY: 60, hpFrac: 0.3 }), SPEED, 1 / 60);
    // Wounded and beyond its comfort gap, so the answer is the ring: sideways.
    expect(Math.abs(order.vx)).toBeGreaterThan(Math.abs(order.vy));
  });

  it('wounded, it flees from twice as far out', () => {
    // 250px away: healthy this would be ring-holding, wounded it is already leaving.
    const order = stepPreyAi(view({ threatX: 960, threatY: 290, hpFrac: 0.3 }), SPEED, 1 / 60);
    expect(order.vy).toBeGreaterThan(0);
  });

  it('holds the ring at the distance it chose', () => {
    const order = stepPreyAi(view(), SPEED, 1 / 60);
    // Threat directly above, 340px: neither charging nor running, so the order
    // is sideways and the closing component is only the strafe lean.
    expect(Math.abs(order.vx)).toBeGreaterThan(Math.abs(order.vy));
  });

  it('drifts to open ground when there is nobody on the field', () => {
    const order = stepPreyAi(view({ x: 300, y: 300, threatX: null, threatY: null }), SPEED, 1 / 60);
    expect(order.vx).toBeGreaterThan(0);
    expect(order.vy).toBeGreaterThan(0);
  });

  it('refuses the corner', () => {
    const order = stepPreyAi(view({ x: 20, y: 40, threatX: 20, threatY: 0 }), SPEED, 1 / 60);
    expect(order.vx).toBeGreaterThan(0);
    expect(order.vy).toBeGreaterThan(0);
  });

  it('flips the strafe on a timer', () => {
    const order = stepPreyAi(view({ strafeTimer: 1.39 }), SPEED, 0.02);
    expect(order.strafeSign).toBe(-1);
    expect(order.strafeTimer).toBeCloseTo(0.01, 5);
  });

  it('spends the skill on escape, not on opportunity', () => {
    // Swarmed: worth popping.
    expect(stepPreyAi(view({ pressure: 8 }), SPEED, 1 / 60).castSkill).toBe(true);
    // Wounded and something on it: worth popping.
    expect(stepPreyAi(view({ threatY: 470, hpFrac: 0.3 }), SPEED, 1 / 60).castSkill).toBe(true);
    // A healthy hull with room around it: hold it.
    expect(stepPreyAi(view(), SPEED, 1 / 60).castSkill).toBe(false);
    // Nothing to escape from at all.
    expect(stepPreyAi(view({ threatX: null, threatY: null, pressure: 0 }), SPEED, 1 / 60).castSkill).toBe(
      false
    );
  });

  it('counts pressure inside the radius the engine passes to swarmAround', () => {
    expect(PRESSURE_RADIUS).toBeGreaterThan(150);
    expect(PRESSURE_RADIUS).toBeLessThan(460);
  });

  it('escapes through the gap when surrounded by multiple hostiles on three sides', () => {
    // Hostiles on the top, left, and bottom: only the right (east) is clear
    const hostiles = [
      { x: 960, y: 460 }, // above
      { x: 880, y: 540 }, // left
      { x: 960, y: 620 }, // below
    ];
    const order = stepPreyAi(
      view({
        pressure: 3,
        threatX: 880,
        threatY: 540,
        nearbyHostiles: hostiles,
      }),
      SPEED,
      1 / 60
    );
    // Must escape to the right through the clear corridor
    expect(order.vx).toBeGreaterThan(0);
  });

  it('slides along a wall rather than stalling when pressed against an edge', () => {
    // Backed against the left wall, threat directly in front and slightly above
    const order = stepPreyAi(
      view({
        x: 40,
        y: 500,
        threatX: 120,
        threatY: 480,
        pressure: 2,
      }),
      SPEED,
      1 / 60
    );
    // Must move down along the wall away from the threat above, not stall
    expect(order.vy).toBeGreaterThan(0);
    // Keeps strong momentum along the wall
    expect(Math.abs(order.vy)).toBeGreaterThan(SPEED * 0.5);
  });

  it('prioritizes fast, low-HP speeders over slow, high-HP tanks', () => {
    // Speeder (HP 16, Speed 3.8, dist 100) vs Tank (HP 120, Speed 1.15, dist 100)
    const speederScore = preyHostilePriority(16, 3.8, 100);
    const tankScore = preyHostilePriority(120, 1.15, 100);
    expect(speederScore).toBeGreaterThan(tankScore * 3);

    // Wounded tank (HP 5, Speed 1.15, dist 100) gains high priority
    const woundedTankScore = preyHostilePriority(5, 1.15, 100);
    expect(woundedTankScore).toBeGreaterThan(tankScore * 2);
  });

  it('gravitates towards open ground when holding the ring', () => {
    // Threat is 300px above. Clockwise orbit would head right (x+), counter-clockwise would head left (x-).
    // Hostiles block the right side at (1100, 540). Left side (960 - 150 = 810) is open.
    const hostiles = [
      { x: 1100, y: 540 },
      { x: 1120, y: 520 },
      { x: 1080, y: 560 },
    ];
    const order = stepPreyAi(
      view({
        threatX: 960,
        threatY: 240, // 300px above, in engagement ring
        nearbyHostiles: hostiles,
      }),
      SPEED,
      1 / 60
    );
    // Should choose the open left side (vx < 0) rather than walking into the hostiles on the right
    expect(order.vx).toBeLessThan(0);
  });
});


