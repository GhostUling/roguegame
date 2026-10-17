import { Player } from '../core/types';

/**
 * Mirror Self's double. The engine owns where a clone walks and when it fires;
 * what a clone *is* — how long it lasts, where it holds station, how hard it
 * hits — lives here, so the card copy and the engine cannot disagree.
 */

/** How long a clone lasts, in seconds. */
export const CLONE_LIFETIME = 15;

/** How many clones may stand at once. */
export const MAX_CLONES = 2;

/** How far to the side of the hull a clone holds station, in px. */
export const CLONE_STATION_DIST = 52;

/** How far behind the hull a clone trails, in px. */
export const CLONE_STATION_DROP = 18;

/**
 * Station offset for clone `index`, relative to the hull. Clones alternate sides
 * and step further out in pairs, so two of them never sit on top of each other.
 */
export function cloneStationOffset(index: number): { x: number; y: number } {
  const side = index % 2 === 0 ? -1 : 1;
  const tier = Math.floor(index / 2);
  return {
    x: side * (CLONE_STATION_DIST + tier * 14),
    y: CLONE_STATION_DROP + tier * 12,
  };
}

/** Damage one clone round carries: a share of the player's own shot. */
export function cloneShotDamage(player: Player): number {
  return Math.max(1, Math.round(player.bulletDamage * player.cloneDamageScale));
}
