import { CharacterId, Player } from './types';
import { getCharacterDef } from './characters';

export interface PilotWeaponStats {
  charId: CharacterId;
  fireRate: number;
  bulletCount: number;
  bulletDamage: number;
  bulletPierce: number;
  critChance: number;
  critMultiplier: number;
}

/**
 * Effective weapon profile for one wing of a Twin Link pair.
 *
 * Pilot 1 owns the live mutable stats on `player`. Pilot 2 mirrors this run's
 * upgrades as deltas on top of its own chassis, so a shared upgrade level-up
 * benefits both vessels while each keeps its original weapon character.
 */
export function getPilotWeaponStats(player: Player, index: 0 | 1): PilotWeaponStats {
  if (index === 0 || !player.twinPilotId) {
    return {
      charId: player.characterId,
      fireRate: player.fireRate,
      bulletCount: player.bulletCount,
      bulletDamage: player.bulletDamage,
      bulletPierce: player.bulletPierce,
      critChance: player.critChance,
      critMultiplier: player.critMultiplier,
    };
  }

  const base1 = getCharacterDef(player.characterId).baseStats;
  const base2 = getCharacterDef(player.twinPilotId).baseStats;
  const dmgScale = base1.bulletDamage > 0 ? player.bulletDamage / base1.bulletDamage : 1;
  const rateScale = base1.fireRate > 0 ? player.fireRate / base1.fireRate : 1;

  return {
    charId: player.twinPilotId,
    fireRate: Math.max(80, Math.round(base2.fireRate * rateScale)),
    bulletCount: Math.max(
      1,
      Math.min(6, base2.bulletCount + (player.bulletCount - base1.bulletCount))
    ),
    bulletDamage: Math.round(base2.bulletDamage * dmgScale),
    bulletPierce: Math.max(0, base2.bulletPierce + (player.bulletPierce - base1.bulletPierce)),
    critChance: Math.max(
      0,
      Math.min(0.9, base2.critChance + (player.critChance - base1.critChance))
    ),
    critMultiplier: Math.max(
      1,
      base2.critMultiplier + (player.critMultiplier - base1.critMultiplier)
    ),
  };
}
