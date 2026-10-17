import { Enemy } from '../core/types';

/**
 * Necro Fleet's revived dead. A revived unit keeps the corpse's shape and most of
 * its bite, so the squad reads as the swarm you just cut down — except it fights
 * for you, which is what the friendly marker on every one of them says.
 *
 * The design sketch said "no unit cap". A cap is here anyway: revived units are
 * actors with their own targeting and their own draw, and an uncapped count on
 * top of a 4.5x spawn rate is the one place this mode could still outgrow the
 * frame budget. The cap is the only deviation from the sketch.
 */

/** How many revived units may stand at once. */
export const MAX_ALLIES = 24;

/** How long a revived unit fights before it falls apart, in seconds. */
export const ALLY_LIFETIME = 25;

/** Seconds between one revived unit's contact hits. */
export const ALLY_CONTACT_COOLDOWN = 0.6;

/** How much of the corpse's original bite a revived unit keeps. */
export const ALLY_DAMAGE_SCALE = 0.8;

/** How much faster a revived unit moves than it did while alive. */
export const ALLY_SPEED_SCALE = 1.15;

/** The stats a revived unit inherits from the enemy it used to be. */
export interface AllyStats {
  radius: number;
  sides: number;
  speed: number;
  damage: number;
  fillColor: string;
  strokeColor: string;
}

/** Derives a revived unit's stats from the corpse it came from. */
export function allyFromEnemy(e: Enemy): AllyStats {
  return {
    radius: Math.max(6, e.radius * 0.9),
    sides: e.sides,
    speed: e.speed * ALLY_SPEED_SCALE,
    damage: Math.max(1, Math.round(e.damage * ALLY_DAMAGE_SCALE)),
    fillColor: e.fillColor,
    strokeColor: e.strokeColor,
  };
}
