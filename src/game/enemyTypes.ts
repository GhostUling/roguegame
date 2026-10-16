import { EnemyType } from './types';

/** Every enemy except the boss can appear in the wave spawn table. */
export type SpawnableEnemyType = Exclude<EnemyType, 'boss'>;

export interface EnemyTypeDef {
  /** Base hit points before the per-minute growth curve is applied. */
  hp: number;
  /** Fraction of base HP added per two minutes of elapsed run time. */
  hpGrowthPerMin: number;
  speed: number;
  damage: number;
  radius: number;
  sides: number;
  fillColor: string;
  strokeColor: string;
  expValue: number;
}

/**
 * Single source of truth for enemy statistics. Adding a variant means adding a
 * row here; nothing else in the codebase should hardcode enemy numbers.
 */
export const ENEMY_TYPES: Record<EnemyType, EnemyTypeDef> = {
  chaser: {
    hp: 40,
    hpGrowthPerMin: 0.7,
    speed: 2.0,
    damage: 12,
    radius: 14,
    sides: 4,
    fillColor: '#160507',
    strokeColor: '#ff2b47',
    expValue: 1,
  },
  speeder: {
    hp: 22,
    hpGrowthPerMin: 0.7,
    speed: 3.6,
    damage: 9,
    radius: 12,
    sides: 3,
    fillColor: '#180a03',
    strokeColor: '#ff8800',
    expValue: 1,
  },
  tank: {
    hp: 120,
    hpGrowthPerMin: 0.7,
    speed: 1.15,
    damage: 22,
    radius: 24,
    sides: 5,
    fillColor: '#12051b',
    strokeColor: '#ba38ff',
    expValue: 3,
  },
  sniper: {
    hp: 35,
    hpGrowthPerMin: 0.7,
    speed: 1.7,
    damage: 16,
    radius: 16,
    sides: 6,
    fillColor: '#031826',
    strokeColor: '#38bdf8',
    expValue: 2,
  },
  charger: {
    hp: 50,
    hpGrowthPerMin: 0.7,
    speed: 2.0,
    damage: 20,
    radius: 15,
    sides: 4,
    fillColor: '#221603',
    strokeColor: '#eab308',
    expValue: 2,
  },
  hive: {
    hp: 85,
    hpGrowthPerMin: 0.7,
    speed: 1.35,
    damage: 15,
    radius: 22,
    sides: 7,
    fillColor: '#052010',
    strokeColor: '#22c55e',
    expValue: 4,
  },
  boss: {
    hp: 850,
    hpGrowthPerMin: 0.9,
    speed: 1.35,
    damage: 32,
    radius: 46,
    sides: 8,
    fillColor: '#090212',
    strokeColor: '#ff0077',
    expValue: 25,
  },
};

/**
 * Wave composition by elapsed run time. Each row applies until `until` seconds,
 * and `picks` holds cumulative probability thresholds: the first entry whose
 * threshold exceeds the roll wins.
 */
const SPAWN_BRACKETS: { until: number; picks: [SpawnableEnemyType, number][] }[] = [
  { until: 45, picks: [['chaser', 0.75], ['speeder', 1]] },
  {
    until: 90,
    picks: [['chaser', 0.4], ['speeder', 0.65], ['charger', 0.85], ['tank', 1]],
  },
  {
    until: 150,
    picks: [['chaser', 0.25], ['speeder', 0.45], ['charger', 0.65], ['sniper', 0.85], ['hive', 1]],
  },
  {
    until: Infinity,
    picks: [['chaser', 0.2], ['charger', 0.4], ['sniper', 0.6], ['hive', 0.8], ['tank', 1]],
  },
];

export function pickEnemyType(elapsedSeconds: number, roll: number): SpawnableEnemyType {
  const bracket =
    SPAWN_BRACKETS.find((b) => elapsedSeconds < b.until) ??
    SPAWN_BRACKETS[SPAWN_BRACKETS.length - 1];

  for (const [type, threshold] of bracket.picks) {
    if (roll < threshold) return type;
  }
  return bracket.picks[bracket.picks.length - 1][0];
}

/**
 * Hit points a freshly spawned enemy of this type gets, given the run's elapsed
 * time. `growthScale` steepens the curve for modes that need a harder late game.
 */
export function enemyHpFor(
  def: EnemyTypeDef,
  elapsedSeconds: number,
  growthScale: number = 1
): number {
  return def.hp * (1 + (elapsedSeconds / 120) * def.hpGrowthPerMin * growthScale);
}
