import { describe, expect, it } from 'vitest';
import {
  BABYLON_GATE_WIDTH,
  BABYLON_SWORD_PIERCE,
  LVL_BABYLON_COUNT,
  LVL_BABYLON_DAMAGE_SCALE,
  babylonDamage,
  calculateGateSlotPosition,
  swordHitsEnemy,
} from '../systems/gateOfBabylon';
import { createPlayer } from '../core/player';

describe('gateOfBabylon geometry & damage', () => {
  it('spaces slots evenly across gate width', () => {
    const originX = 200;
    const originY = 200;
    const angle = 0; // facing right, gate is vertical
    const totalSlots = 5;

    const slot0 = calculateGateSlotPosition(originX, originY, angle, 0, totalSlots, BABYLON_GATE_WIDTH);
    const slot4 = calculateGateSlotPosition(originX, originY, angle, 4, totalSlots, BABYLON_GATE_WIDTH);

    expect(slot0.x).toBeCloseTo(slot4.x);
    expect(Math.abs(slot4.y - slot0.y)).toBeCloseTo(BABYLON_GATE_WIDTH);
  });

  it('detects sword collision with enemy and supports multi-target pierce', () => {
    expect(swordHitsEnemy(100, 100, 105, 100, 12)).toBe(true);
    expect(swordHitsEnemy(100, 100, 150, 100, 12)).toBe(false);
    expect(BABYLON_SWORD_PIERCE).toBeGreaterThanOrEqual(3);
  });

  it('scales damage monotonically with levels', () => {
    const p = createPlayer('beta_phalanx');
    p.bulletDamage = 30;

    const dmg1 = babylonDamage(p, 1);
    const dmg2 = babylonDamage(p, 2);
    const dmg3 = babylonDamage(p, 3);

    expect(dmg1).toBe(Math.round(30 * LVL_BABYLON_DAMAGE_SCALE[0]));
    expect(dmg2).toBe(Math.round(30 * LVL_BABYLON_DAMAGE_SCALE[1]));
    expect(dmg3).toBe(Math.round(30 * LVL_BABYLON_DAMAGE_SCALE[2]));
    expect(dmg3).toBeGreaterThan(dmg2);
    expect(dmg2).toBeGreaterThan(dmg1);
  });
});
