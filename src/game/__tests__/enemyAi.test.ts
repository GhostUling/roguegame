import { describe, expect, it } from 'vitest';
import { Enemy } from '../core/types';
import { EnemyAim, stepEnemyAi } from '../engine/enemyAi';

function enemy(overrides: Partial<Enemy>): Enemy {
  return {
    id: 1,
    type: 'sniper',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 12,
    hp: 100,
    maxHp: 100,
    speed: 2,
    damage: 12,
    fillColor: '#fff',
    strokeColor: '#000',
    points: 4,
    sides: 4,
    rotation: 0,
    rotSpeed: 0,
    hitFlashTimer: 0,
    expValue: 1,
    state: 'idle',
    stateTimer: 0,
    // The loop only decrements positive cooldowns, so a cooled-down enemy sits
    // just below zero rather than exactly on it.
    attackCooldown: -0.01,
    ...overrides,
  };
}

const aim = (dx: number, dy: number): EnemyAim => ({ dx, dy, dist: Math.hypot(dx, dy) });
const FRAME = 1 / 60;

describe('sniper', () => {
  it('backs away inside 200px and closes beyond 300px', () => {
    const near = enemy({});
    stepEnemyAi(near, aim(-150, 0), FRAME, 1);
    expect(near.vx).toBeCloseTo(near.speed);
    expect(near.vy).toBeCloseTo(0);

    const far = enemy({});
    stepEnemyAi(far, aim(400, 0), FRAME, 1);
    expect(far.vx).toBeCloseTo(far.speed);
  });

  it('tracks for 0.7s, locks the line for 0.5s, then fires along the locked line', () => {
    const e = enemy({});
    const step = stepEnemyAi(e, aim(0, 250), FRAME, 1);
    expect(e.state).toBe('charging');
    expect(step.cues).toEqual(['sniper-aim']);

    stepEnemyAi(e, aim(0, 250), 0.6, 1);
    expect(e.aimAngle).toBeCloseTo(Math.PI / 2);
    expect(e.aimLocked).toBe(false);

    // The player steps to the side — the line must not follow any more.
    const locked = stepEnemyAi(e, aim(250, 0), 0.2, 1);
    expect(e.aimLocked).toBe(true);
    expect(e.aimAngle).toBeCloseTo(Math.PI / 2);
    expect(locked.cues).toEqual(['sniper-lock']);

    const fired = stepEnemyAi(e, aim(250, 0), 0.4, 1);
    expect(e.state).toBe('idle');
    expect(e.attackCooldown).toBe(3.2);
    expect(fired.cues).toEqual(['laser-shot']);
    expect(fired.bolt?.angle).toBeCloseTo(Math.PI / 2);
    expect(fired.bolt?.speed).toBe(11);
    expect(fired.bolt?.damage).toBe(e.damage);
  });

  it('does not start charging when the wing is out of range', () => {
    const e = enemy({});
    const step = stepEnemyAi(e, aim(0, 500), FRAME, 1);
    expect(e.state).toBe('idle');
    expect(step.cues).toEqual([]);
  });
});

describe('charger', () => {
  it('winds up, dashes at 3.8x along the locked direction, then cools down', () => {
    const e = enemy({ type: 'charger', speed: 3 });
    stepEnemyAi(e, aim(100, 0), FRAME, 1);
    expect(e.state).toBe('charging');
    expect(e.chargeDir).toEqual({ x: 1, y: 0 });

    const dash = stepEnemyAi(e, aim(100, 0), 0.8, 1);
    expect(e.state).toBe('firing');
    expect(dash.cues).toEqual(['charger-dash']);

    stepEnemyAi(e, aim(-1, 0), FRAME, 1);
    expect(e.vx).toBeCloseTo(3 * 3.8);
    expect(e.vy).toBeCloseTo(0);

    stepEnemyAi(e, aim(-1, 0), 0.5, 1);
    expect(e.state).toBe('cooldown');
    expect(e.vx).toBe(0);

    stepEnemyAi(e, aim(-1, 0), 0.9, 1);
    expect(e.state).toBe('idle');
    expect(e.attackCooldown).toBe(2.4);
  });
});

describe('boss', () => {
  it('fires a 16-round ring and keeps chasing', () => {
    const e = enemy({ type: 'boss', speed: 1.5, rotation: 0.1 });
    const step = stepEnemyAi(e, aim(0, 100), FRAME, 1);

    expect(step.cues).toEqual(['boss-burst']);
    expect(e.attackCooldown).toBe(4.2);
    expect(e.vy).toBeCloseTo(1.5);

    const ring = step.barrage ?? [];
    expect(ring).toHaveLength(16);
    expect(ring[0].angle).toBeCloseTo(0.1);
    expect(ring[1].angle).toBeCloseTo(0.1 + (Math.PI * 2) / 16);
    for (const bolt of ring) {
      expect(bolt.speed).toBe(5.5);
      expect(bolt.damage).toBe(18);
    }
  });
});

describe('everything else', () => {
  it('chases straight at its own speed, scaled by the slow factor', () => {
    const e = enemy({ type: 'speeder', speed: 4 });
    const step = stepEnemyAi(e, aim(3, 4), FRAME, 0.5);
    expect(e.vx).toBeCloseTo(4 * 0.5 * (3 / 5));
    expect(e.vy).toBeCloseTo(4 * 0.5 * (4 / 5));
    expect(step.cues).toEqual([]);
  });

  it('a hard hold freezes the dash instead of slowing it', () => {
    const e = enemy({ type: 'charger', state: 'firing', stateTimer: 0, chargeDir: { x: 1, y: 0 } });
    stepEnemyAi(e, aim(100, 0), FRAME, 0);
    expect(e.vx).toBe(0);
    expect(e.vy).toBe(0);
  });
});
