import { Player } from '../core/types';

/**
 * Minion math shared by the engine (which fires the drones) and the pause screen
 * (which reports the resulting numbers). Keeping it here is what stops the UI from
 * silently drifting away from the engine's rules.
 */
export function carrierDamageMult(player: Player, isCarrier: boolean): number {
  return isCarrier ? (player.isSkillActive ? 1.8 : 1.35) : 1.0;
}

/** Effective ms between interceptor shots, including carrier overdrive cadence. */
export function interceptorInterval(player: Player, isCarrier: boolean): number {
  const base = player.droneFireInterval / player.droneRateScale;
  return Math.round(isCarrier ? base * (player.isSkillActive ? 0.45 : 0.7) : base);
}

/** Effective ms between railgun shots, including carrier overdrive cadence. */
export function railgunInterval(player: Player, isCarrier: boolean): number {
  const base = player.railgunInterval / player.droneRateScale;
  return Math.round(isCarrier ? base * (player.isSkillActive ? 0.5 : 0.75) : base);
}

export function interceptorShotDamage(player: Player, isCarrier: boolean): number {
  return Math.round(
    player.bulletDamage * 0.45 * player.droneDamageScale * carrierDamageMult(player, isCarrier)
  );
}

export function missileShotDamage(player: Player, isCarrier: boolean): number {
  return Math.round(
    player.bulletDamage *
      player.droneMissileDamageScale *
      carrierDamageMult(player, isCarrier)
  );
}

export function railgunShotDamage(player: Player, isCarrier: boolean): number {
  return Math.round(
    player.bulletDamage * player.railgunDamageScale * carrierDamageMult(player, isCarrier)
  );
}
