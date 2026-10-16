import { CharacterId, Drone, GameMode, Player } from './types';
import { getCharacterDef } from './characters';
import { isPaired, modeOf } from './modes';

/**
 * Builds the mutable state for a run. A linked pair flies as ONE player object:
 * hit points pool, speed and pickup range take the better wing, and each chassis
 * keeps its own weapon profile (see getPilotWeaponStats).
 *
 * Position and the drone fire clock start at zero; the engine places the vessel
 * and owns the clock.
 */
export function createPlayer(
  charId: CharacterId = 'alpha_prism',
  gameMode: GameMode = 'standard',
  twinPilotId?: CharacterId
): Player {
  const def1 = getCharacterDef(charId);
  const isTwin = isPaired({ gameMode, twinPilotId });
  const def2 = isTwin ? getCharacterDef(twinPilotId!) : null;

  const stats1 = def1.baseStats;
  const stats2 = def2 ? def2.baseStats : null;
  const poolsHp = modeOf(gameMode).pooledHp;

  // Shared stats: HP pools when the mode says so, the better wing wins the rest.
  const combinedHp = stats2 && poolsHp ? stats1.hp + stats2.hp : stats1.hp;
  const combinedSpeed = stats2 ? (stats1.speed + stats2.speed) / 2 : stats1.speed;
  const combinedMagnet = stats2 ? Math.max(stats1.magnetRadius, stats2.magnetRadius) : stats1.magnetRadius;
  const combinedCrit = stats2 ? Math.max(stats1.critChance, stats2.critChance) : stats1.critChance;
  const combinedCritMult = stats2 ? Math.max(stats1.critMultiplier, stats2.critMultiplier) : stats1.critMultiplier;

  const hasPhalanx = charId === 'beta_phalanx' || (isTwin && twinPilotId === 'beta_phalanx');
  const hasAurora = charId === 'zeta_aurora' || (isTwin && twinPilotId === 'zeta_aurora');

  const carrierDrones: Drone[] = [];
  if (charId === 'epsilon_carrier') {
    carrierDrones.push({
      id: 1,
      type: 'interceptor',
      angle: 0,
      dist: 55,
      rotSpeed: 2.2,
      lastFireTime: 0,
    });
  }
  if (isTwin && twinPilotId === 'epsilon_carrier') {
    carrierDrones.push({
      id: 2,
      type: 'interceptor',
      angle: Math.PI,
      dist: 55,
      rotSpeed: -2.2,
      lastFireTime: 0,
    });
  }

  const initialUpgradeLevels: Record<string, number> = {};
  const initialActiveSlots: string[] = [];
  if (carrierDrones.length > 0) {
    initialActiveSlots.push('summon_drone');
    initialUpgradeLevels['summon_drone'] = carrierDrones.length;
  }

  const maxSkillCooldown = def2
    ? Math.max(def1.activeSkill.cooldown, def2.activeSkill.cooldown)
    : def1.activeSkill.cooldown;

  const maxSkillDuration = def2
    ? Math.max(def1.activeSkill.duration || 0, def2.activeSkill.duration || 0)
    : (def1.activeSkill.duration || 0);

  return {
    characterId: charId,
    // A link request without a second pilot is just a solo run.
    gameMode: isTwin ? 'twin_link' : 'standard',
    twinPilotId: isTwin ? twinPilotId : undefined,
    pilot2LastFireTime: 0,
    pilot2Angle: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 18,
    hp: combinedHp,
    maxHp: combinedHp,
    speed: combinedSpeed,
    fireRate: stats1.fireRate,
    lastFireTime: 0,
    bulletCount: stats1.bulletCount,
    bulletDamage: stats1.bulletDamage,
    bulletPierce: stats1.bulletPierce,
    bulletSpeed: 11,
    magnetRadius: combinedMagnet,
    level: 1,
    xp: 0,
    nextLevelXp: 18,
    angle: 0,
    kills: 0,
    score: 0,
    totalDamageDealt: 0,
    orbitSatellites: stats1.orbitSatellites || 0,
    novaTimer: 0,
    novaInterval: 0,
    critChance: combinedCrit,
    critMultiplier: combinedCritMult,
    shieldRegenRate: hasPhalanx ? 7.0 : 3.5, // Out-of-combat self-repair rate
    invincibleTimer: 0,
    timeSinceLastDamage: 99.0, // Starts fully out-of-combat
    // Synergies & specials
    // Base values for the scaling fields the engine reads; upgrades.ts overwrites
    // them level by level once the matching card is taken.
    bouncingBullets: hasAurora ? 1 : 0,
    clusterBombs: false,
    clusterBombFragments: 3,
    clusterBombDamageScale: 0.4,
    cryoSlow: hasAurora ? true : false,
    cryoSlowMultiplier: 0.65,
    cryoVulnerability: 0.2,
    chainLightning: false,
    chainLightningTargets: 3,
    chainLightningDamageScale: 0.6,
    chainLightningStun: 0,
    repulsionField: false,
    repulsionTimer: 0,
    repulsionInterval: 6.0,
    repulsionRadius: 160,
    retaliationThorns: false,
    thornsCount: 8,
    thornsDamageScale: 0.9,
    thornsPierce: 2,
    naniteShield: false,
    naniteShieldActive: false,
    naniteShieldTimer: 0,
    naniteShieldCooldown: 4.0,
    naniteBreakWaveRadius: 80,
    executioner: false,
    executionerThreshold: 0.25,
    glassCannon: false,
    gravitySiphon: false,
    gravitySiphonWave: false,
    gemPullSpeedScale: 1,
    // Drones
    drones: carrierDrones,
    droneCount: carrierDrones.length,
    droneRailgun: false,
    railgunInterval: 3400,
    railgunDamageScale: 2.8,
    railgunWidthScale: 1,
    droneOverclock: false,
    droneFireInterval: 460,
    droneRateScale: 1,
    droneDamageScale: 1,
    droneMissiles: false,
    droneMissileInterval: 2400,
    droneMissileDamageScale: 1.5,
    droneShield: false,
    droneShieldReduction: 0.15,
    droneShieldSpinScale: 1,
    // Meta & deckbuilding
    rerollCount: 2,
    activeSlots: initialActiveSlots,
    upgradeLevels: initialUpgradeLevels,
    // Active skill
    skillCooldown: 0,
    skillMaxCooldown: maxSkillCooldown,
    skillActiveTimer: 0,
    skillMaxDuration: maxSkillDuration,
    isSkillActive: false,
  };
}
