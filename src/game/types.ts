export interface Vector2 {
  x: number;
  y: number;
}

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

export type GameMode = 'standard' | 'twin_link';

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
  markedTimer?: number; // Lance Kappa mark: takes +25% damage while it burns down
  burnTimer?: number; // Fusion Iota burn: seconds of damage over time left
  burnDps?: number;
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
  isClusterSub?: boolean;
  isRefractionShard?: boolean;
  /** Fusion Iota overload shell: every sixth round, detonates far wider. */
  isIotaBomb?: boolean;
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
}

/** A Fusion Iota melt core: primed where it lands, detonates when the fuse ends. */
export interface MeltCore {
  id: number;
  x: number;
  y: number;
  timer: number;
  fuse: number;
}

export interface Satellite {
  angle: number;
  distance: number;
  radius: number;
  damage: number;
  rotation: number;
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
