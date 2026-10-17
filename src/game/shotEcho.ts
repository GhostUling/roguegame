import { Player } from './types';

/**
 * Shot Echo's delayed replay. The engine queues one record per volley and fires
 * it again later from the same spot; what a replay *is* — how many may be
 * pending, how hard it hits — lives here so the card copy and the engine cannot
 * disagree.
 */

/**
 * How many volleys may be waiting to replay at once. This is the card's only
 * brake on itself: every echo doubles the rounds in the air, and the projectile
 * list is capped, so a very fast build must not be able to queue an unbounded
 * backlog of them.
 */
export const MAX_PENDING_ECHOES = 8;

/** Rounds one replayed volley deals, as a share of the shot it repeats. */
export function echoRoundDamage(player: Player): number {
  return Math.max(1, Math.round(player.bulletDamage * player.echoDamageScale));
}
