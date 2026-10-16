import { Player } from './types';

/**
 * Orbit Cage's shells.
 *
 * The card replaces the straight volley outright, so the shell set is bounded by
 * how many barrels the player has. That bound is the whole reason this card is
 * safe to ship: a never-expiring round that grew with every shot would fill the
 * projectile budget and then start evicting itself.
 *
 * The per-enemy re-hit gate is the player's own fire interval rather than a fixed
 * cooldown, which is what keeps the fire-rate cards meaningful in a build that
 * has no straight bullets left to speed up.
 */

/** Hard floor on the re-hit gate, in ms: a very fast build still cannot machine-gun one enemy. */
export const ORBIT_REHIT_FLOOR_MS = 120;

/** How fast a shell travels its orbit, in rad/s. */
export const ORBIT_ANGULAR_SPEED = 1.7;

/** Drawn radius of one shell, in px. */
export const ORBIT_SHELL_RADIUS = 6;

/** How many shells circle the hull: one per barrel, and never zero. */
export function orbitShellCount(player: Player): number {
  return Math.max(1, Math.min(16, player.bulletCount));
}

/** How long one shell must wait before it may hit the same enemy again, in ms. */
export function orbitRehitMs(player: Player): number {
  return Math.max(ORBIT_REHIT_FLOOR_MS, player.fireRate);
}
