import { Player } from '../core/types';

/**
 * Gate of Babylon (王之财宝 · 万象剑阵)
 *
 * Spawns an ethereal golden hexagonal gate lattice behind the player, from which
 * an overwhelming barrage of geometric swords and spears cascades forward,
 * impaling targets and detonating in secondary micro-bursts.
 *
 * All calculations here are pure functions and testable headless.
 */

export const LVL_BABYLON_COUNT = [16, 22, 30];
export const LVL_BABYLON_INTERVAL = [8.0, 6.5, 5.0];
export const LVL_BABYLON_DAMAGE_SCALE = [4.0, 6.5, 9.5];
export const BABYLON_SWORD_PIERCE = 3;

export const BABYLON_SWORD_SPEED = 24;
export const BABYLON_SWORD_LENGTH = 34;
export const BABYLON_SWORD_WIDTH = 12;
export const BABYLON_BURST_RADIUS = 48;
export const BABYLON_BURST_DAMAGE_SHARE = 0.6;
export const BABYLON_GATE_WIDTH = 220;

export interface BabylonSword {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  damage: number;
  life: number;
  maxLife: number;
  pierce: number;
  stuck: boolean;
  stuckTimer: number;
  detonated: boolean;
  hitEnemies: Set<number>;
}

export interface BabylonGate {
  id: number;
  originX: number;
  originY: number;
  angle: number;
  totalSwords: number;
  swordsSpawned: number;
  spawnTimer: number;
  spawnInterval: number;
  elapsed: number;
  duration: number;
  active: boolean;
}

export function babylonDamage(player: Player, level: number = 1): number {
  const scale = LVL_BABYLON_DAMAGE_SCALE[Math.min(LVL_BABYLON_DAMAGE_SCALE.length, Math.max(1, level)) - 1];
  return Math.max(1, Math.round(player.bulletDamage * scale));
}

/** Computes the gate slot position offset along the gate axis perpendicular to aiming angle. */
export function calculateGateSlotPosition(
  originX: number,
  originY: number,
  angle: number,
  offsetIndex: number,
  totalSlots: number,
  gateWidth: number = BABYLON_GATE_WIDTH
): { x: number; y: number } {
  // Gate axis is perpendicular to firing direction
  const perpAngle = angle + Math.PI / 2;
  const spreadT = totalSlots > 1 ? (offsetIndex / (totalSlots - 1) - 0.5) : 0;
  const dist = spreadT * gateWidth;
  return {
    x: originX + Math.cos(perpAngle) * dist - Math.cos(angle) * 35,
    y: originY + Math.sin(perpAngle) * dist - Math.sin(angle) * 35,
  };
}

/** Check if sword hits enemy during flight. */
export function swordHitsEnemy(
  swordX: number,
  swordY: number,
  enemyX: number,
  enemyY: number,
  enemyRadius: number
): boolean {
  const dist = Math.hypot(enemyX - swordX, enemyY - swordY);
  return dist <= enemyRadius + BABYLON_SWORD_WIDTH;
}
