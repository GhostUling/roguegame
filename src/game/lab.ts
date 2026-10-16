import { LabUpgrades, Player } from './types';
export type { LabUpgrades };

const LAB_STORAGE_KEY = 'geom_overload_lab';
const SHARDS_STORAGE_KEY = 'geom_overload_shards';

export const DEFAULT_LAB: LabUpgrades = {
  speedLevel: 0,
  damageLevel: 0,
  healthLevel: 0,
  cooldownLevel: 0,
  magnetLevel: 0,
  reviveLevel: 0,
};

export interface LabUpgradeConfig {
  key: keyof LabUpgrades;
  nameZh: string;
  nameEn: string;
  desc: string;
  iconName: string;
  maxLevel: number;
  baseCost: number;
  costMult: number;
  effectText: (level: number) => string;
}

export const LAB_CONFIGS: LabUpgradeConfig[] = [
  {
    key: 'damageLevel',
    nameZh: '高能反应堆',
    nameEn: 'Reactor Overclock',
    desc: '强化全体机体输出功率，永久提升全武器基础伤害。',
    iconName: 'Flame',
    maxLevel: 5,
    baseCost: 120,
    costMult: 1.8,
    effectText: (lvl) => `全局伤害 +${lvl * 8}%`,
  },
  {
    key: 'healthLevel',
    nameZh: '量子度规装甲',
    nameEn: 'Quantum Hull',
    desc: '增强机体致密几何外壳，永久提升全局初始生命上限。',
    iconName: 'Shield',
    maxLevel: 5,
    baseCost: 100,
    costMult: 1.7,
    effectText: (lvl) => `生命上限 +${lvl * 20} HP`,
  },
  {
    key: 'speedLevel',
    nameZh: '矢量推进器',
    nameEn: 'Thruster Tuning',
    desc: '优化几何流线动力学，永久提升机动移动速度。',
    iconName: 'Zap',
    maxLevel: 5,
    baseCost: 100,
    costMult: 1.6,
    effectText: (lvl) => `基础移速 +${lvl * 5}%`,
  },
  {
    key: 'cooldownLevel',
    nameZh: '时空谐振器',
    nameEn: 'Chrono Harmonizer',
    desc: '加快机体技能微观冷却循环，永久减少主动技能冷却时长。',
    iconName: 'Clock',
    maxLevel: 5,
    baseCost: 150,
    costMult: 1.9,
    effectText: (lvl) => `技能冷却 -${lvl * 4}%`,
  },
  {
    key: 'magnetLevel',
    nameZh: '引力聚能环',
    nameEn: 'Magnetic Core',
    desc: '扩大机体周围引力场域，永久增加经验晶体吸附距离。',
    iconName: 'Magnet',
    maxLevel: 5,
    baseCost: 80,
    costMult: 1.6,
    effectText: (lvl) => `吸附半径 +${lvl * 12}%`,
  },
  {
    key: 'reviveLevel',
    nameZh: '紧急量子重构',
    nameEn: 'Emergency Protocol',
    desc: '机体受损自毁时，立即触发全屏湮灭脉冲并以 50% 生命复活！',
    iconName: 'RotateCcw',
    maxLevel: 2,
    baseCost: 400,
    costMult: 3.0,
    effectText: (lvl) => `当局复活次数: ${lvl} 次`,
  },
];

export function getStoredShards(): number {
  try {
    return parseInt(localStorage.getItem(SHARDS_STORAGE_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function saveStoredShards(shards: number) {
  try {
    localStorage.setItem(SHARDS_STORAGE_KEY, Math.max(0, Math.floor(shards)).toString());
  } catch {
    // Ignore
  }
}

export function addShards(amount: number): number {
  const current = getStoredShards();
  const next = current + Math.max(0, Math.floor(amount));
  saveStoredShards(next);
  return next;
}

export function getStoredLab(): LabUpgrades {
  try {
    const raw = localStorage.getItem(LAB_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LAB };
    return { ...DEFAULT_LAB, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_LAB };
  }
}

export function saveStoredLab(lab: LabUpgrades) {
  try {
    localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(lab));
  } catch {
    // Ignore
  }
}

export function getUpgradeCost(cfg: LabUpgradeConfig, currentLevel: number): number {
  return Math.round(cfg.baseCost * Math.pow(cfg.costMult, currentLevel));
}

export function applyLabBonusesToPlayer(player: Player, lab: LabUpgrades) {
  // Damage bonus
  if (lab.damageLevel > 0) {
    const mult = 1 + lab.damageLevel * 0.08;
    player.bulletDamage = Math.round(player.bulletDamage * mult);
  }
  // Health bonus
  if (lab.healthLevel > 0) {
    const addHp = lab.healthLevel * 20;
    player.maxHp += addHp;
    player.hp += addHp;
  }
  // Speed bonus
  if (lab.speedLevel > 0) {
    player.speed *= 1 + lab.speedLevel * 0.05;
  }
  // Skill cooldown reduction
  if (lab.cooldownLevel > 0) {
    const cdr = 1 - lab.cooldownLevel * 0.04;
    player.skillMaxCooldown = Math.max(3, player.skillMaxCooldown * cdr);
  }
  // Magnet bonus
  if (lab.magnetLevel > 0) {
    player.magnetRadius *= 1 + lab.magnetLevel * 0.12;
  }
  // Revives
  player.maxRevives = lab.reviveLevel;
  player.revivesRemaining = lab.reviveLevel;
}
