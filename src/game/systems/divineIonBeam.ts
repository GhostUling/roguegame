import { Player } from '../core/types';

/**
 * Divine Ion Beam (神圣天谴 · 离子天罚)
 *
 * Pinpoints high-threat targets with laser sights, calls down a massive
 * vertical ion pillar covering the screen, and leaves a crackling plasma
 * discharge web on the ground that continues to electrocute and stun.
 *
 * Pure functions, testable headless.
 */

export const LVL_ION_DAMAGE_SCALE = [6.0, 9.5, 14.0];
export const LVL_ION_INTERVAL = [9.0, 7.0, 5.0];
export const LVL_ION_WIDTH = [70, 90, 120];

export const ION_TARGETING_TIME = 0.75;
export const ION_PILLAR_DURATION = 0.35;
export const ION_GROUND_DURATION = 4.5;
export const ION_GROUND_TICK_RATE = 0.24; // sustained high-frequency arc tick
export const ION_GROUND_RADIUS = 110;
export const ION_GROUND_DAMAGE_SHARE = 0.32;

export interface DivineIonStrike {
  id: number;
  targetX: number;
  targetY: number;
  beamWidth: number;
  elapsed: number;
  damage: number;
  phase: 'targeting' | 'pillar' | 'ground' | 'done';
  groundTimer: number;
  groundTickTimer: number;
  hitEnemies: Set<number>;
}

export function ionDamage(player: Player, level: number = 1): number {
  const scale = LVL_ION_DAMAGE_SCALE[Math.min(LVL_ION_DAMAGE_SCALE.length, Math.max(1, level)) - 1];
  return Math.max(1, Math.round(player.bulletDamage * scale));
}

/** Check if enemy is within the vertical ion column during pillar strike. */
export function enemyInIonPillar(
  targetX: number,
  beamWidth: number,
  enemyX: number,
  enemyRadius: number
): boolean {
  return Math.abs(enemyX - targetX) <= beamWidth / 2 + enemyRadius;
}

/** Check if enemy is inside the residual plasma ground patch. */
export function enemyInIonGround(
  groundX: number,
  groundY: number,
  groundRadius: number,
  enemyX: number,
  enemyY: number,
  enemyRadius: number
): boolean {
  const dist = Math.hypot(enemyX - groundX, enemyY - groundY);
  return dist <= groundRadius + enemyRadius;
}
