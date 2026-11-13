import { Player } from '../core/types';
import { ALL_UPGRADES, UpgradeDefinition, atLevel } from './upgrades';

/**
 * Super weapon keys that define the God Arsenal / Resonance mode.
 * All 7 super weapons are imported directly from ALL_UPGRADES to maintain
 * a single source of truth for their stats and effects (Rule 3).
 */
const SUPER_WEAPON_KEYS = new Set([
  'gaster_blasters',
  'void_iaijutsu',
  'gate_of_babylon',
  'singularity_meteor',
  'divine_ion_beam',
  'prism_aegis',
  'mirage_blades',
]);

export const RESONANCE_SUPER_WEAPONS: UpgradeDefinition[] = ALL_UPGRADES.filter((u) =>
  SUPER_WEAPON_KEYS.has(u.key)
);

/**
 * Mode-exclusive support enhancements designed specifically to empower
 * the 7 super-weapons against hyper-dense, high-HP swarms.
 */
export const RESONANCE_EXCLUSIVE_UPGRADES: UpgradeDefinition[] = [
  {
    id: 'resonance_overclock',
    key: 'resonance_overclock',
    name: 'Resonance Overclock',
    nameZh: '神核超频 · 极速回转',
    desc: '超阶共鸣核心极速回转！所有超阶神兵（龙骨炮、居合、剑阵、陨星、天罚、剑雨）的发动冷却时间缩短 28% / 45% / 62%！',
    category: 'tactical',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (_p: Player, lvl = 1) =>
      `全超阶神兵冷却缩短 -${atLevel([28, 45, 62], lvl)}%`,
    apply: (p: Player, lvl: number) => {
      const mult = atLevel([0.72, 0.55, 0.38], lvl);
      if (p.gasterInterval > 0) p.gasterInterval = Math.max(1.0, p.gasterInterval * mult);
      if (p.voidIaijutsuInterval > 0) p.voidIaijutsuInterval = Math.max(0.9, p.voidIaijutsuInterval * mult);
      if (p.babylonInterval > 0) p.babylonInterval = Math.max(1.0, p.babylonInterval * mult);
      if (p.meteorInterval > 0) p.meteorInterval = Math.max(1.4, p.meteorInterval * mult);
      if (p.ionInterval > 0) p.ionInterval = Math.max(1.2, p.ionInterval * mult);
      if (p.mirageInterval > 0) p.mirageInterval = Math.max(0.45, p.mirageInterval * mult);
      p.fireRate = Math.max(80, Math.round(p.fireRate * 0.8));
    },
  },
  {
    id: 'cataclysm_matrix',
    key: 'cataclysm_matrix',
    name: 'Cataclysm Matrix',
    nameZh: '天灾矩阵 · 湮灭增幅',
    desc: '展开高维毁伤矩阵！机体基础杀伤力巨幅提升 50% / 100% / 160%，使所有超阶武装的毁灭伤害呈指数级倍增！',
    category: 'energy',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (_p: Player, lvl = 1) =>
      `基础杀伤力提升 +${atLevel([50, 100, 160], lvl)}%`,
    apply: (p: Player, lvl: number) => {
      const mult = atLevel([1.5, 2.0, 2.6], lvl);
      p.bulletDamage = Math.max(1, Math.round(p.bulletDamage * mult));
    },
  },
  {
    id: 'titan_hyper_shield',
    key: 'titan_hyper_shield',
    name: 'Titan Hyper Shield',
    nameZh: '泰坦金身 · 绝对装甲',
    desc: '面对狂暴怪潮构筑绝对防御：生命上限大幅增加 150 / 300 / 500 点，同时提升常驻生命恢复速度与脱战自愈速率！',
    category: 'defense',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (_p: Player, lvl = 1) =>
      `最大生命 +${atLevel([150, 300, 500], lvl)} // 生命恢复 +${atLevel([8, 16, 26], lvl)}/s (脱战 +${atLevel([10, 20, 30], lvl)}/s)`,
    apply: (p: Player, lvl: number) => {
      const hpAdd = atLevel([150, 300, 500], lvl);
      const hpRegenAdd = atLevel([8, 16, 26], lvl);
      const shieldRegenAdd = atLevel([10, 20, 30], lvl);
      p.maxHp += hpAdd;
      p.hp += hpAdd;
      p.hpRegenRate = (p.hpRegenRate || 0) + hpRegenAdd;
      p.shieldRegenRate = (p.shieldRegenRate || 0) + shieldRegenAdd;
    },
  },
];

/**
 * The full card pool for Resonance Mode.
 * Players directly draw and level up the 7 God-tier super-weapons alongside
 * the 3 dedicated resonance core enhancements.
 */
export const RESONANCE_UPGRADES: UpgradeDefinition[] = [
  ...RESONANCE_SUPER_WEAPONS,
  ...RESONANCE_EXCLUSIVE_UPGRADES,
];
