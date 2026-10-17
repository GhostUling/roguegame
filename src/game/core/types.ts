export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Who dealt a blow. Only `'weapon'` kills feed the on-kill cards, and the
 * distinction is not academic: an ability that refunded its own cooldown from
 * kills it caused itself would never stop firing.
 */
export type DamageSource = 'weapon' | 'skill' | 'ally';

export type CharacterId =
  | 'alpha_prism'
  | 'beta_phalanx'
  | 'gamma_viper'
  | 'delta_chronos'
  | 'epsilon_carrier'
  | 'zeta_aurora'
  | 'eta_siphon'
  | 'theta_aegis'
  | 'iota_fusion'
  | 'kappa_lance';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  nameZh: string;
  title: string;
  desc: string;
  color: string;
  accentColor: string;
  baseStats: {
    hp: number;
    speed: number;
    fireRate: number;
    bulletDamage: number;
    bulletCount: number;
    bulletPierce: number;
    magnetRadius: number;
    critChance: number;
    critMultiplier: number;
    orbitSatellites?: number;
  };
  passive: {
    name: string;
    nameZh: string;
    desc: string;
  };
  activeSkill: {
    id: string;
    name: string;
    nameZh: string;
    desc: string;
    cooldown: number; // in seconds
    duration?: number; // active duration if buff
  };
}

export interface SingularityVortex {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  damagePerSec: number;
  /** True when the vortex came out of the ultimate rather than a card. */
  fromSkill?: boolean;
}

export interface Drone {
  id: number;
  type: 'interceptor' | 'railgun' | 'guardian' | 'missile';
  angle: number;
  dist: number;
  rotSpeed: number;
  lastFireTime: number;
  lastMissileTime?: number;
}

export type GameMode = 'standard' | 'twin_link' | 'overflow' | 'sandbox';

export interface Player {
  characterId: CharacterId;
  gameMode?: GameMode;
  twinPilotId?: CharacterId; // 2nd pilot if twin_link mode
  pilot2LastFireTime?: number;
  pilot2Angle?: number; // 2nd pilot's facing/aim direction
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  fireRate: number; // ms interval between shots
  lastFireTime: number;
  bulletCount: number; // 1 ~ 6
  bulletDamage: number;
  bulletPierce: number;
  bulletSpeed: number;
  magnetRadius: number;
  level: number;
  xp: number;
  nextLevelXp: number;
  angle: number;
  kills: number;
  score: number;
  totalDamageDealt: number;

  // Synergies & specials
  orbitSatellites: number;
  novaTimer: number;
  novaInterval: number;
  critChance: number;
  critMultiplier: number;
  shieldRegenRate: number;
  invincibleTimer: number;
  timeSinceLastDamage: number; // Out-of-combat timer for health recovery

  // Expanded Roguelite Synergies
  // The `*Scale`/`*Radius`/`*Count` fields below are written level-by-level in
  // upgrades.ts and read by the engine, which is how a multi-level upgrade keeps
  // scaling after level 1. Flag-only booleans mean "unlocked"; these mean "how much".
  bouncingBullets: number; // 0, 1, 2, 3
  clusterBombs: boolean; // splits into mini shells
  clusterBombFragments: number;
  clusterBombDamageScale: number; // fraction of the parent bullet's damage
  cryoSlow: boolean; // slows by 35% + 20% vulnerability
  cryoSlowMultiplier: number; // enemy speed multiplier while frozen
  cryoVulnerability: number; // extra damage taken while frozen
  chainLightning: boolean; // arcs to 3 nearby enemies on crit
  chainLightningTargets: number;
  chainLightningDamageScale: number;
  chainLightningStun: number; // seconds of stun applied by each arc
  repulsionField: boolean; // periodic pushback wave
  repulsionTimer: number;
  repulsionInterval: number; // seconds between waves
  repulsionRadius: number;
  retaliationThorns: boolean; // 360 spikes on damaged
  thornsCount: number;
  thornsDamageScale: number;
  thornsPierce: number;
  naniteShield: boolean; // absorbs 1 hit after 4s without damage
  naniteShieldActive: boolean;
  naniteShieldTimer: number;
  naniteShieldCooldown: number; // seconds to recharge
  naniteBreakWaveRadius: number; // shockwave radius when the shield breaks
  executioner: boolean; // execute enemies < 25% HP
  executionerThreshold: number; // fraction of max HP that triggers the execution
  glassCannon: boolean; // +60% dmg, -20% max HP
  gravitySiphon: boolean; // suck all gems on level up
  gravitySiphonWave: boolean; // also release a knockback wave on level up
  gemPullSpeedScale: number; // gem attraction speed multiplier

  // Drone Summons
  drones: Drone[];
  droneCount: number;
  droneRailgun: boolean;
  railgunInterval: number; // ms between railgun shots
  railgunDamageScale: number; // multiplier on the player's bullet damage
  railgunWidthScale: number; // beam width multiplier
  droneOverclock: boolean;
  droneFireInterval: number; // base ms between interceptor shots
  droneRateScale: number; // overclock speed multiplier; also divides the railgun interval
  droneDamageScale: number;
  droneMissiles?: boolean;
  droneMissileInterval: number; // ms between missile volleys
  droneMissileDamageScale: number;
  droneShield?: boolean;
  droneShieldReduction: number; // collision damage reduction, 0..1
  droneShieldSpinScale: number;

  // Chassis passives (each field belongs to the hull named beside it)
  siphonHasteTimer: number; // Siphon Eta: seconds of stacked +15% fire rate, caps at 3
  tempShield: number; // Siphon Eta skill: ablative points soaked before HP
  chargeTimer: number; // Aegis Theta skill: seconds left of the invincible ram dash
  chargeDirX: number;
  chargeDirY: number;
  kappaShotCharge: number; // Lance Kappa: shots fired since the last piercing ray
  iotaShotCharge: number; // Fusion Iota: shells fired since the last overload blast

  // Overflow card pool (see overflowUpgrades.ts). Only the Overflow mode draws
  // these cards, so a standard or twin run leaves every one of them at its base.
  omniBarrageCount: number;
  omniBarrageDamageScale: number;
  shardStormCount: number;
  shardStormDamageScale: number;
  spawnShotCount: number;
  spawnShotDamageScale: number;
  delayedFuse: number; // seconds a landed shell lingers before it detonates
  stutterInterval: number; // seconds between involuntary blinks, 0 = off
  stutterTimer: number;
  critFreezeTime: number; // seconds the world stops on a crit, 0 = off
  freezeTimer: number; // the shared freeze clock both stopping cards feed
  verdictInterval: number; // seconds between chrono verdicts, 0 = off
  verdictTimer: number;
  verdictFreezeTime: number;
  comboRatePerTen: number; // fire-rate bonus per 10 combo, 0 = off
  comboCount: number;
  comboTimer: number;
  turretInterval: number; // seconds between turret deployments, 0 = card not taken
  turretTimer: number;
  turretDamageScale: number; // share of the player's shot each turret round carries
  gridInterval: number; // seconds between grid verdicts, 0 = card not taken
  gridTimer: number;
  gridDamageScale: number;
  gridFlash: number; // seconds the lattice stays lit, drives the renderer
  cloneInterval: number; // seconds between mirror clones, 0 = card not taken
  cloneTimer: number;
  cloneDamageScale: number;
  necroChance: number; // chance a kill revives on the player's side, 0 = off
  echoDelay: number; // seconds before a volley replays, 0 = card not taken
  echoDamageScale: number;
  skillRefundPerKill: number; // seconds taken off the ultimate per weapon kill
  lanceInterval: number; // seconds between thrown lances, 0 = card not taken
  lanceTimer: number;
  lanceDamageScale: number;
  riftDamageScale: number; // damage one seam tick deals to a mob
  massRoundScale: number; // px added to the hit radius per 100 damage
  hypercritChance: number;
  hypercritFlash: number; // seconds of white-out left after a ×20 hit
  overdriveScale: number; // speed multiplier while overdriving, 0 = off
  overdriveIdle: number; // seconds spent standing still while overdriving
  gamblerRolls: number; // free upgrade advances rolled on each level-up

  // Meta deckbuilding & reroll
  rerollCount: number;
  activeSlots: string[]; // max 6 distinct categories/keys
  upgradeLevels: Record<string, number>; // current level of all upgrades

  // Character Active Skill state
  skillCooldown: number; // current remaining CD in seconds
  skillMaxCooldown: number;
  skillActiveTimer: number; // e.g. for barrage or time dilation
  skillMaxDuration: number;
  isSkillActive: boolean;
}

export type EnemyType =
  | 'chaser' // 暗红追击者 (4边菱形) - 均衡追击
  | 'speeder' // 橙黄刺客 (3边锐角) - 极速近战
  | 'tank' // 紫黑重装 (5边度规) - 缓慢高防
  | 'sniper' // 天蓝光棱射手 (6边体) - 远距激光蓄力预警射击
  | 'charger' // 亮金冲锋角锥 (尖角星) - 锁定蓄力后极速冲锋
  | 'hive' // 翡翠裂殖母巢 (7边盘) - 击杀时爆散出 3 只微型飞星
  | 'boss'; // 混沌星型统领 (8角八边体) - 环形弹幕风暴与跃迁

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  fillColor: string;
  strokeColor: string;
  points: number;
  sides: number;
  rotation: number;
  rotSpeed: number;
  hitFlashTimer: number;
  expValue: number;
  isBoss?: boolean;

  // Tactical AI State Machine
  state?: 'idle' | 'charging' | 'firing' | 'cooldown';
  stateTimer?: number;
  aimAngle?: number;
  aimLocked?: boolean;
  chargeDir?: { x: number; y: number };
  attackCooldown?: number;
  frozenTimer?: number; // Cryo slow status
  stunTimer?: number; // A hard hold: movement goes to zero, unlike the cryo slow
  markedTimer?: number; // Lance Kappa mark: takes +25% damage while it burns down
  burnTimer?: number; // Fusion Iota burn: seconds of damage over time left
  burnDps?: number;
  burnSource?: DamageSource; // who lit the burn, so its kill is credited correctly
  /**
   * Who landed the last blow on this body. The on-kill cards read it, so an
   * enemy taken down by the ultimate does not pay out to the cards.
   */
  lastDamageSource?: DamageSource;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  pierce: number;
  radius: number;
  color: string;
  trail: Array<{ x: number; y: number; alpha: number }>;
  isCrit: boolean;
  life: number;
  maxLife: number;
  hitEnemyIds: Set<number>;
  bouncesRemaining?: number;
  /**
   * This round did not come out of the player's own weapon — a drone missile, a
   * cluster fragment, a refraction shard, a split round. Every card that spawns
   * more bullets *on hit* skips secondaries, so no second bullet source can
   * cascade; without the flag a single spawned round would multiply itself.
   */
  isSecondary?: boolean;
  /**
   * This round came out of the active skill rather than the hull's own gun. It
   * still hurts, but its kills must not pay the on-kill cards, so the damage
   * source travels with the round instead of being guessed at the hit.
   */
  fromSkill?: boolean;
  /** Fusion Iota overload shell: every sixth round, detonates far wider. */
  isIotaBomb?: boolean;
  /** Overflow's Delayed Detonation: an armed shell has stopped and counts down. */
  delayedFuse?: number;
}

export interface EnemyProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface Gem {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  radius: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  attracted: boolean;
}

export interface DebrisParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  sides: number;
  rotation: number;
  rotSpeed: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
  scale: number;
  isCrit: boolean;
}

export interface Shockwave {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  width: number;
  life: number;
  maxLife: number;
}

/** A straight energy line (Lance Kappa's piercing ray and annihilation spear). */
export interface Beam {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
  life: number;
  maxLife: number;
  fromSkill?: boolean;
}

/** A Fusion Iota melt core: primed where it lands, detonates when the fuse ends. */
export interface MeltCore {
  id: number;
  x: number;
  y: number;
  timer: number;
  fuse: number;
  fromSkill?: boolean;
}

/**
 * One volley waiting to be replayed from the spot it was fired from. It carries
 * the whole volley — angle, barrel count, spread — so a replay does not have to
 * know which wing fired it or what the stats were at the time.
 */
export interface EchoVolley {
  id: number;
  x: number;
  y: number;
  angle: number;
  count: number;
  spreadAngle: number;
  damage: number;
  timer: number;
}

/**
 * A thrown spear: it flies, it pierces, and it tears a seam through the floor
 * behind it. It carries no trail of its own — the tear is the only thing it
 * leaves, and a motion streak on top of that reads as a projectile instead.
 */
export interface Lance {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  damage: number;
  life: number;
  maxLife: number;
  hitEnemyIds: Set<number>;
  fromSkill?: boolean;
}

/** One node of a torn seam: it holds for a moment and cuts whatever crosses it. */
export interface Rift {
  id: number;
  x: number;
  y: number;
  angle: number;
  radius: number;
  life: number;
  maxLife: number;
  tickTimer: number;
}

export interface Satellite {
  angle: number;
  distance: number;
  radius: number;
  damage: number;
  rotation: number;
}

/**
 * A deployed prism turret: parked where it was dropped, targeting on its own,
 * and gone when its timer runs out. Overflow's Prism Turret card is its only
 * source, so a run without that card never allocates one.
 */
export interface Turret {
  id: number;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  lastFireTime: number;
  aimAngle: number;
}

/** A Mirror Self double: holds station on the hull, fires on its own beat. */
export interface Clone {
  id: number;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  lastFireTime: number;
  aimAngle: number;
}

/** A revived enemy fighting on the player's side. */
export interface Ally {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  sides: number;
  speed: number;
  damage: number;
  fillColor: string;
  strokeColor: string;
  rotation: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  attackCooldown: number;
}

export type UpgradeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type UpgradeCategory = 'ballistic' | 'energy' | 'defense' | 'summon' | 'tactical';

export interface UpgradeOption {
  id: string;
  key: string;
  name: string;
  nameZh: string;
  desc: string;
  category: UpgradeCategory;
  rarity: UpgradeRarity;
  level: number;
  maxLevel: number;
  statDiffText: (player: Player, currentLvl?: number) => string;
  apply: (player: Player, currentLvl: number) => void;
}

export type GameState = 'title' | 'character_select' | 'playing' | 'paused' | 'levelup' | 'gameover' | 'victory';

export interface GameStats {
  survivedTime: number; // in seconds
  finalLevel: number;
  enemiesKilled: number;
  damageDealt: number;
  score: number;
  upgradesTaken: string[];
  gameMode?: GameMode;
  twinPilotId?: CharacterId;
}
