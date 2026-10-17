import { Player } from '../core/types';

/**
 * Prism turret numbers. The engine owns when a turret is deployed and what it
 * shoots at; everything about what a turret *is* lives here, so the card copy
 * and the engine cannot disagree about how long one stands or how many may.
 */

/** How long a deployed turret stands, in seconds. */
export const TURRET_LIFETIME = 12;

/** ms between one turret's own shots. */
export const TURRET_FIRE_INTERVAL = 700;

/** How many turrets may stand at once. */
export const MAX_TURRETS = 3;

/** Seconds before expiry at which the turret starts blinking out. */
export const TURRET_FADE = 1.5;

/** Damage one turret round carries: a share of the player's own shot. */
export function turretShotDamage(player: Player): number {
  return Math.max(1, Math.round(player.bulletDamage * player.turretDamageScale));
}
