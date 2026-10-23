import { Enemy } from '../core/types';

/**
 * The swarm that fights beside you in Predator: how many arrive per tick, how
 * hard one bites, and where they are bunched. Numbers only — the loop owns the
 * arrays and the side effects.
 *
 * A soldier's bite deliberately ignores the prey's i-frames. If it didn't, 200
 * of you would share one 0.45s window and the swarm would never matter; with a
 * per-soldier cooldown the prey can actually be chewed to death by mass.
 */

/** Seconds between two bites from the same soldier. */
export const SOLDIER_BITE_COOLDOWN = 1.0;

/** A bite lands for this share of the soldier's own contact damage. */
export const SOLDIER_BITE_SHARE = 0.3;

/** Soldiers a wave tick puts on the field, given how full it already is. */
export function soldierWaveCount(
  spawnMultiplier: number,
  swarmMultiplier: number,
  alive: number,
  cap: number
): number {
  if (alive >= cap) return 0;
  return Math.max(1, Math.round(spawnMultiplier * swarmMultiplier));
}

export function soldierBiteDamage(e: Pick<Enemy, 'damage'>): number {
  return Math.max(1, Math.round(e.damage * SOLDIER_BITE_SHARE));
}

export interface SwarmCentre {
  x: number;
  y: number;
  count: number;
}

/** Centre of mass of the swarm — the prey reads it as "where the danger is". */
export function swarmCentre(swarm: { x: number; y: number }[]): SwarmCentre {
  if (swarm.length === 0) return { x: 0, y: 0, count: 0 };
  let sx = 0;
  let sy = 0;
  for (const unit of swarm) {
    sx += unit.x;
    sy += unit.y;
  }
  return { x: sx / swarm.length, y: sy / swarm.length, count: swarm.length };
}

/** How many soldiers are within `radius` of a point. */
export function swarmAround(
  swarm: { x: number; y: number }[],
  x: number,
  y: number,
  radius: number
): number {
  const reachSq = radius * radius;
  let n = 0;
  for (const unit of swarm) {
    const dx = unit.x - x;
    const dy = unit.y - y;
    if (dx * dx + dy * dy < reachSq) n++;
  }
  return n;
}
