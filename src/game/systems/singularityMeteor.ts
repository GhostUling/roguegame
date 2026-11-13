import { Player } from '../core/types';

/**
 * Singularity Meteor (天动万象 · 坍缩陨星)
 *
 * Summons an astronomical negative-space super-gravity core from above that
 * drags all nearby enemies inward, before crashing and causing a world-shaking
 * inverted monochrome implosion shockwave.
 *
 * Pure functions, testable headless.
 */

export const LVL_METEOR_DAMAGE_SCALE = [8.0, 13.0, 20.0];
export const LVL_METEOR_INTERVAL = [10.0, 8.0, 6.0];
export const LVL_METEOR_PULL_RADIUS = [260, 320, 400];

export const METEOR_FALL_DURATION = 1.2;
export const METEOR_EXPLOSION_RADIUS = 220;
export const METEOR_PULL_SPEED = 240; // px per second inward
export const METEOR_CRATER_DURATION = 2.4;
export const METEOR_AFTERSHOCK_DELAY = 1.15;
export const METEOR_AFTERSHOCK_DAMAGE_SHARE = 0.45;
export const METEOR_CRATER_TICK_RATE = 0.35;
export const METEOR_CRATER_TICK_DAMAGE_SHARE = 0.16;

export interface SingularityMeteor {
  id: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  altitude: number; // 1 at spawn, 0 at impact
  elapsed: number;
  duration: number;
  damage: number;
  pullRadius: number;
  impacted: boolean;
  impactTimer: number;
  aftershockTriggered: boolean;
  tickTimer: number;
}

export function meteorDamage(player: Player, level: number = 1): number {
  const scale = LVL_METEOR_DAMAGE_SCALE[Math.min(LVL_METEOR_DAMAGE_SCALE.length, Math.max(1, level)) - 1];
  return Math.max(1, Math.round(player.bulletDamage * scale));
}

/** Deterministic pseudo-random radial ground fissure lines for the impact crater. */
export function generateCraterCracks(
  seed: number,
  count: number = 12
): Array<{ angle: number; lengthScale: number; bendAngle: number; width: number }> {
  const cracks: Array<{ angle: number; lengthScale: number; bendAngle: number; width: number }> = [];
  for (let i = 0; i < count; i++) {
    const s = (seed * 1664525 + i * 1013904223 + 22695477) >>> 0;
    const baseAngle = (i / count) * Math.PI * 2;
    const jitter = (((s % 200) / 100) - 1) * 0.22;
    const lengthScale = 0.65 + ((s >>> 8) % 35) / 100;
    const bendAngle = ((((s >>> 16) % 200) / 100) - 1) * 0.35;
    const width = 1.5 + ((s >>> 24) % 20) / 10;
    cracks.push({
      angle: baseAngle + jitter,
      lengthScale,
      bendAngle,
      width,
    });
  }
  return cracks;
}

/** Calculates pull vector for an enemy toward the meteor target. */
export function calculateMeteorPull(
  meteorX: number,
  meteorY: number,
  enemyX: number,
  enemyY: number,
  pullRadius: number,
  pullSpeed: number = METEOR_PULL_SPEED
): { pullX: number; pullY: number; inRange: boolean } {
  const dx = meteorX - enemyX;
  const dy = meteorY - enemyY;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0 || dist > pullRadius) {
    return { pullX: 0, pullY: 0, inRange: false };
  }
  // Stronger pull closer to core
  const strength = (1 - dist / pullRadius) * pullSpeed;
  return {
    pullX: (dx / dist) * strength,
    pullY: (dy / dist) * strength,
    inRange: true,
  };
}

/** Check if enemy is within explosion blast radius on impact. */
export function enemyInMeteorBlast(
  impactX: number,
  impactY: number,
  enemyX: number,
  enemyY: number,
  enemyRadius: number,
  blastRadius: number = METEOR_EXPLOSION_RADIUS
): boolean {
  const dist = Math.hypot(enemyX - impactX, enemyY - impactY);
  return dist <= blastRadius + enemyRadius;
}

/**
 * Finds the densest cluster of enemies by evaluating neighbor density within searchRadius.
 * Returns the center-of-mass (centroid) of the best cluster, or null if empty.
 */
export function findDensestEnemyCluster(
  enemies: Array<{ x: number; y: number }>,
  searchRadius: number = 220
): { targetX: number; targetY: number } | null {
  if (!enemies || enemies.length === 0) return null;
  if (enemies.length === 1) return { targetX: enemies[0].x, targetY: enemies[0].y };

  const r2 = searchRadius * searchRadius;
  let bestCount = -1;
  let bestClusterIndices: number[] = [];

  for (let i = 0; i < enemies.length; i++) {
    const e1 = enemies[i];
    const neighbors: number[] = [i];
    for (let j = 0; j < enemies.length; j++) {
      if (i === j) continue;
      const e2 = enemies[j];
      const d2 = (e1.x - e2.x) ** 2 + (e1.y - e2.y) ** 2;
      if (d2 <= r2) {
        neighbors.push(j);
      }
    }
    if (neighbors.length > bestCount) {
      bestCount = neighbors.length;
      bestClusterIndices = neighbors;
    }
  }

  // Calculate centroid of the densest cluster
  let sumX = 0;
  let sumY = 0;
  for (const idx of bestClusterIndices) {
    sumX += enemies[idx].x;
    sumY += enemies[idx].y;
  }

  return {
    targetX: Math.round(sumX / bestClusterIndices.length),
    targetY: Math.round(sumY / bestClusterIndices.length),
  };
}
