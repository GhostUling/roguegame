import { UpgradeDefinition, atLevel } from './upgrades';
import { MAX_TURRETS, TURRET_LIFETIME } from './turrets';
import { GRID_CELL, GRID_STUN } from './gridVerdict';
import { CLONE_LIFETIME, MAX_CLONES } from './clones';
import { MAX_ALLIES, ALLY_LIFETIME } from './allies';

/**
 * The Overflow card pool. Deliberately its own table, never merged into
 * ALL_UPGRADES: the cards here are tuned for spectacle, not for balance, and the
 * ones that reset a build or lock max HP to 1 would wreck a standard run if they
 * ever entered its draw.
 *
 * House rules are the same as the standard pool (four-character Chinese name, an
 * English name, per-level values in a table shared by statDiffText and apply, and
 * every rung has to change the player state), but the numbers are not asked to be
 * equivalent to anything.
 *
 * `key` must stay unique across BOTH pools: the run keeps one upgradeLevels
 * record, so a collision would merge two cards' levels into one.
 */

const LVL_OMNI_COUNT = [6, 9, 12];
const LVL_STORM_COUNT = [5, 8, 12];
const LVL_KILOPRISM_PIERCE = [2, 3, 4];
const LVL_KILOPRISM_BOUNCE = [2, 4, 6];
const LVL_MASS_ROUNDS = [2, 3, 4];
const LVL_STUTTER_INTERVAL = [6, 4.5, 3];
const LVL_DELAYED_FUSE = [0.4, 0.6, 0.8];
const LVL_CRIT_FREEZE = [0.06, 0.1, 0.15];
const LVL_VERDICT_INTERVAL = [8, 6, 5];
const LVL_VERDICT_TIME = [0.8, 1.0, 1.4];
const LVL_COMBO_RATE = [0.08, 0.12, 0.16, 0.2, 0.24];
const LVL_OVERDRIVE_SPEED = [1.35, 1.6, 1.9];
const LVL_GAMBLER_ROLLS = [1, 2, 3];
const LVL_HYPERCRIT = [0.15, 0.2, 0.25];
const LVL_SPAWN_SHOT = [1, 2, 3];
const LVL_TURRET_INTERVAL = [25, 20, 15];
const LVL_TURRET_DAMAGE = [0.8, 1.0, 1.2];
const LVL_GRID_INTERVAL = [10, 7];
const LVL_GRID_DAMAGE = [2.0, 3.0];
const LVL_CLONE_INTERVAL = [40, 30, 20];
const LVL_CLONE_DAMAGE = [0.5, 0.6, 0.7];
const LVL_NECRO_CHANCE = [0.25, 0.35, 0.5];

/** Damage scale the Overflow cards apply to their own secondary payloads. */
const OMNI_DAMAGE_SCALE = 0.6;
const STORM_DAMAGE_SCALE = 0.5;
const SPAWN_SHOT_DAMAGE_SCALE = 0.5;
/** What a Hypercrit upgrades a crit into. The engine reads it to size the hit. */
export const HYPERCRIT_MULTIPLIER = 20;

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export const OVERFLOW_UPGRADES: UpgradeDefinition[] = [
  // ==========================================================================
  // 必备三张 —— 爽池的基准倍率本身就是暴力的
  // ==========================================================================
  {
    id: 'overcharge_amp',
    key: 'overcharge_amp',
    name: 'Overcharge Amp',
    nameZh: '超载增幅',
    desc: '反应堆增幅器解除一切限流阀，基础伤害直接翻倍以上。',
    category: 'ballistic',
    rarity: 'common',
    maxLevel: 5,
    statDiffText: (p) => `普攻: ${Math.round(p.bulletDamage)} → ${Math.round(p.bulletDamage * 2.2)}`,
    apply: (p) => {
      p.bulletDamage = Math.round(p.bulletDamage * 2.2);
    },
  },
  {
    id: 'overclock_clock',
    key: 'overclock_clock',
    name: 'Overclock Clock',
    nameZh: '爆速时钟',
    desc: '把开火时钟推进到物理极限，射速以 40% 的幅度逐级压缩。',
    category: 'ballistic',
    rarity: 'common',
    maxLevel: 5,
    statDiffText: (p) =>
      `开火间隔: ${Math.round(p.fireRate)}ms → ${Math.max(40, Math.round(p.fireRate * 0.6))}ms`,
    apply: (p) => {
      p.fireRate = Math.max(40, Math.round(p.fireRate * 0.6));
    },
  },
  {
    id: 'infinite_fan',
    key: 'infinite_fan',
    name: 'Infinite Fan',
    nameZh: '无限扇面',
    desc: '弹道基座强行扩容，每次射击额外分裂两路矢量，上限推到十六发。',
    category: 'ballistic',
    rarity: 'rare',
    maxLevel: 8,
    statDiffText: (p) => `弹道数量: ${p.bulletCount} 发 → ${Math.min(16, p.bulletCount + 2)} 发`,
    apply: (p) => {
      p.bulletCount = Math.min(16, p.bulletCount + 2);
    },
  },

  // ==========================================================================
  // 数量爆炸
  // ==========================================================================
  {
    id: 'omni_barrage',
    key: 'omni_barrage',
    name: 'Omni Barrage',
    nameZh: '全向倾泻',
    desc: '每次开火额外补射一圈全向弹幕，伤害为普通弹的六成。',
    category: 'ballistic',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (_p, lvl = 1) =>
      `每次开火额外 360° 补射 ${atLevel(LVL_OMNI_COUNT, lvl)} 发（伤害 ${pct(OMNI_DAMAGE_SCALE)}）`,
    apply: (p, lvl) => {
      p.omniBarrageCount = atLevel(LVL_OMNI_COUNT, lvl);
      p.omniBarrageDamageScale = OMNI_DAMAGE_SCALE;
    },
  },
  {
    id: 'shard_storm',
    key: 'shard_storm',
    name: 'Shard Storm',
    nameZh: '碎片风暴',
    desc: '每一只碎裂的几何体都会向外喷出一圈高速残片，连锁撕开整片怪潮。',
    category: 'ballistic',
    rarity: 'rare',
    maxLevel: 3,
    statDiffText: (_p, lvl = 1) =>
      `击杀喷出 ${atLevel(LVL_STORM_COUNT, lvl)} 枚碎片（伤害 ${pct(STORM_DAMAGE_SCALE)}）`,
    apply: (p, lvl) => {
      p.shardStormCount = atLevel(LVL_STORM_COUNT, lvl);
      p.shardStormDamageScale = STORM_DAMAGE_SCALE;
    },
  },
  {
    id: 'kiloprism',
    key: 'kiloprism',
    name: 'Kiloprism',
    nameZh: '千棱镜',
    desc: '棱镜阵列同时强化贯穿与弹射两条物理链路，收益双向叠加。',
    category: 'ballistic',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (_p, lvl = 1) =>
      `穿透 +${atLevel(LVL_KILOPRISM_PIERCE, lvl)} 次 · 弹射 +${atLevel(LVL_KILOPRISM_BOUNCE, lvl)} 次`,
    apply: (p, lvl) => {
      p.bulletPierce += atLevel(LVL_KILOPRISM_PIERCE, lvl);
      p.bouncingBullets = (p.bouncingBullets || 0) + atLevel(LVL_KILOPRISM_BOUNCE, lvl);
    },
  },
  {
    id: 'spawnshotter',
    key: 'spawnshotter',
    name: 'Spawnshotter',
    nameZh: '子弹繁殖',
    desc: '子弹命中后会自行分裂出新的子弹。分裂出的子弹不再分裂，否则整块屏幕会在两秒内消失。',
    category: 'ballistic',
    rarity: 'legendary',
    maxLevel: 3,
    statDiffText: (_p, lvl = 1) =>
      `命中分裂 ${atLevel(LVL_SPAWN_SHOT, lvl)} 颗（伤害 ${pct(SPAWN_SHOT_DAMAGE_SCALE)}）`,
    apply: (p, lvl) => {
      p.spawnShotCount = atLevel(LVL_SPAWN_SHOT, lvl);
      p.spawnShotDamageScale = SPAWN_SHOT_DAMAGE_SCALE;
    },
  },
  {
    id: 'pinball_hell',
    key: 'pinball_hell',
    name: 'Pinball Hell',
    nameZh: '弹球地狱',
    desc: '边界反射器全功率运转，子弹在屏幕四壁上反复乱弹，越乱越强。',
    category: 'ballistic',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (p) =>
      `弹射次数: ${p.bouncingBullets || 0} 次 → ${(p.bouncingBullets || 0) + 8} 次`,
    apply: (p, lvl) => {
      p.bouncingBullets = (p.bouncingBullets || 0) + 8;
    },
  },

  // ==========================================================================
  // 质变与打击感
  // ==========================================================================
  {
    id: 'grid_verdict',
    key: 'grid_verdict',
    name: 'Grid Verdict',
    nameZh: '网格裁决',
    desc: `周期性把整片战场切成 ${GRID_CELL}px 网格：任何压在网格线上的几何体当场被切开并僵停。`,
    category: 'energy',
    rarity: 'legendary',
    maxLevel: 2,
    statDiffText: (_p, lvl = 1) =>
      `每 ${atLevel(LVL_GRID_INTERVAL, lvl)}s 裁决一次（伤害 ×${atLevel(LVL_GRID_DAMAGE, lvl).toFixed(1)} · 僵停 ${GRID_STUN}s）`,
    apply: (p, lvl) => {
      p.gridInterval = atLevel(LVL_GRID_INTERVAL, lvl);
      p.gridTimer = atLevel(LVL_GRID_INTERVAL, lvl);
      p.gridDamageScale = atLevel(LVL_GRID_DAMAGE, lvl);
    },
  },
  {
    id: 'delayed_detonation',
    key: 'delayed_detonation',
    name: 'Delayed Detonation',
    nameZh: '延迟殉爆',
    desc: '弹头命中后不再湮灭，而是钉在原地燃烧引信，随后炸开一圈。',
    category: 'ballistic',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (_p, lvl = 1) =>
      `命中后滞留 ${atLevel(LVL_DELAYED_FUSE, lvl)}s 再引爆（伤害 ×1.5）`,
    apply: (p, lvl) => {
      p.delayedFuse = atLevel(LVL_DELAYED_FUSE, lvl);
    },
  },
  {
    id: 'phase_stutter',
    key: 'phase_stutter',
    name: 'Phase Stutter',
    nameZh: '相位闪烁',
    desc: '跃迁引擎失控，机体会自行跳变位置，落点爆发一圈冲击。',
    category: 'tactical',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (_p, lvl = 1) =>
      `每 ${atLevel(LVL_STUTTER_INTERVAL, lvl)}s 自动瞬移 160px，落点 120 半径爆炸（伤害 ×1.5）`,
    apply: (p, lvl) => {
      p.stutterInterval = atLevel(LVL_STUTTER_INTERVAL, lvl);
      p.stutterTimer = atLevel(LVL_STUTTER_INTERVAL, lvl);
    },
  },
  {
    id: 'crit_freeze',
    key: 'crit_freeze',
    name: 'Crit Freeze',
    nameZh: '暴击停帧',
    desc: '每一次暴击都会让全场几何体僵停一瞬。伤害没有变，但每一次都会被看见。',
    category: 'tactical',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (_p, lvl = 1) => `暴击时全场静止 ${atLevel(LVL_CRIT_FREEZE, lvl)}s`,
    apply: (p, lvl) => {
      p.critFreezeTime = atLevel(LVL_CRIT_FREEZE, lvl);
    },
  },
  {
    id: 'chrono_verdict',
    key: 'chrono_verdict',
    name: 'Chrono Verdict',
    nameZh: '定时圣裁',
    desc: '以固定周期冻结整个战场。它不造成任何伤害，只是让你拿回场面的主导权。',
    category: 'tactical',
    rarity: 'legendary',
    maxLevel: 3,
    statDiffText: (_p, lvl = 1) =>
      `每 ${atLevel(LVL_VERDICT_INTERVAL, lvl)}s 全场时停 ${atLevel(LVL_VERDICT_TIME, lvl)}s`,
    apply: (p, lvl) => {
      p.verdictInterval = atLevel(LVL_VERDICT_INTERVAL, lvl);
      p.verdictTimer = atLevel(LVL_VERDICT_INTERVAL, lvl);
      p.verdictFreezeTime = atLevel(LVL_VERDICT_TIME, lvl);
    },
  },
  {
    id: 'momentum',
    key: 'momentum',
    name: 'Momentum',
    nameZh: '连击加速',
    desc: '击杀越高频，开火越狂暴。连击没有上限，但两秒的停顿就会让它归零。',
    category: 'ballistic',
    rarity: 'rare',
    maxLevel: 5,
    statDiffText: (_p, lvl = 1) =>
      `每 10 连击射速 +${pct(atLevel(LVL_COMBO_RATE, lvl))}（无上限）· 2s 无击杀清零`,
    apply: (p, lvl) => {
      p.comboRatePerTen = atLevel(LVL_COMBO_RATE, lvl);
    },
  },
  {
    id: 'mass_rounds',
    key: 'mass_rounds',
    name: 'Mass Rounds',
    nameZh: '质量子弹',
    desc: '弹体质量随能量注入同步膨胀：你有多强，命中判定就有多大。',
    category: 'ballistic',
    rarity: 'rare',
    maxLevel: 3,
    statDiffText: (_p, lvl = 1) =>
      `每 100 点伤害 +${atLevel(LVL_MASS_ROUNDS, lvl)}px 弹体半径（命中判定同步变大）`,
    apply: (p, lvl) => {
      p.massRoundScale = atLevel(LVL_MASS_ROUNDS, lvl);
    },
  },
  {
    id: 'hypercrit',
    key: 'hypercrit',
    name: 'Hypercrit',
    nameZh: '超暴击',
    desc: '极小概率把一次暴击升级成二十倍超暴击，触发时整块屏幕闪白。',
    category: 'energy',
    rarity: 'legendary',
    maxLevel: 3,
    statDiffText: (_p, lvl = 1) =>
      `暴击有 ${pct(atLevel(LVL_HYPERCRIT, lvl))} 几率升级为 ×${HYPERCRIT_MULTIPLIER} 超暴击`,
    apply: (p, lvl) => {
      p.hypercritChance = atLevel(LVL_HYPERCRIT, lvl);
    },
  },

  // ==========================================================================
  // 军团
  // ==========================================================================
  {
    id: 'prism_turret',
    key: 'prism_turret',
    name: 'Prism Turret',
    nameZh: '棱镜塔',
    desc: `在机体停留过的地方留下自动索敌的棱镜炮台，自己开火、自己消失，场上最多 ${MAX_TURRETS} 座。`,
    category: 'summon',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (_p, lvl = 1) =>
      `每 ${atLevel(LVL_TURRET_INTERVAL, lvl)}s 部署一座 · 伤害 ×${atLevel(LVL_TURRET_DAMAGE, lvl).toFixed(1)} · 存在 ${TURRET_LIFETIME}s`,
    apply: (p, lvl) => {
      p.turretInterval = atLevel(LVL_TURRET_INTERVAL, lvl);
      p.turretTimer = atLevel(LVL_TURRET_INTERVAL, lvl);
      p.turretDamageScale = atLevel(LVL_TURRET_DAMAGE, lvl);
    },
  },
  {
    id: 'mirror_self',
    key: 'mirror_self',
    name: 'Mirror Self',
    nameZh: '镜像分身',
    desc: `分出一个与你同频开火的分身，自动跟随走位、自己索敌，最多同时 ${MAX_CLONES} 个。`,
    category: 'summon',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (_p, lvl = 1) =>
      `每 ${atLevel(LVL_CLONE_INTERVAL, lvl)}s 分出一个分身 · 伤害 ×${atLevel(LVL_CLONE_DAMAGE, lvl).toFixed(1)} · 存在 ${CLONE_LIFETIME}s`,
    apply: (p, lvl) => {
      p.cloneInterval = atLevel(LVL_CLONE_INTERVAL, lvl);
      p.cloneTimer = atLevel(LVL_CLONE_INTERVAL, lvl);
      p.cloneDamageScale = atLevel(LVL_CLONE_DAMAGE, lvl);
    },
  },
  {
    id: 'necro_fleet',
    key: 'necro_fleet',
    name: 'Necro Fleet',
    nameZh: '亡者编队',
    desc: `被你击碎的几何体有几率原地转生，保留生前的体型与咬合力替你作战。`,
    category: 'summon',
    rarity: 'legendary',
    maxLevel: 3,
    statDiffText: (_p, lvl = 1) =>
      `${pct(atLevel(LVL_NECRO_CHANCE, lvl))} 击杀转生为友军 · 存活 ${ALLY_LIFETIME}s · 场上最多 ${MAX_ALLIES} 个`,
    apply: (p, lvl) => {
      p.necroChance = atLevel(LVL_NECRO_CHANCE, lvl);
    },
  },

  // ==========================================================================
  // 风险换爽
  // ==========================================================================
  {
    id: 'glass_storm',
    key: 'glass_storm',
    name: 'Glass Storm',
    nameZh: '玻璃风暴',
    desc: '把全部结构强度换成火力：最大生命锁为一，伤害乘以八。一次失误就是终局，这是实验里最锋利的一张牌。',
    category: 'tactical',
    rarity: 'legendary',
    maxLevel: 1,
    statDiffText: (p) => `最大生命: ${Math.round(p.maxHp)} → 1 ｜ 伤害: ${Math.round(p.bulletDamage)} → ${Math.round(p.bulletDamage * 8)}`,
    apply: (p) => {
      p.bulletDamage = Math.round(p.bulletDamage * 8);
      p.maxHp = 1;
      p.hp = 1;
    },
  },
  {
    id: 'overdrive_engine',
    key: 'overdrive_engine',
    name: 'Overdrive Engine',
    nameZh: '过载引擎',
    desc: '速度既是机动也是火力，代价是它必须一直转着：停下来就会开始烧蚀自己的结构。',
    category: 'tactical',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (_p, lvl = 1) =>
      `移速 ×${atLevel(LVL_OVERDRIVE_SPEED, lvl)} · 伤害按速度加成（上限 ×3）· 静止每秒掉 3% 最大生命`,
    apply: (p, lvl) => {
      p.overdriveScale = atLevel(LVL_OVERDRIVE_SPEED, lvl);
    },
  },
  {
    id: 'gambler_pact',
    key: 'gambler_pact',
    name: "Gambler's Pact",
    nameZh: '赌徒协议',
    desc: '每一次升级都额外掷一次骰子：随机让一条已有强化免费进阶。赌徒没有退路，只有更多的骰子。',
    category: 'tactical',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (_p, lvl = 1) => `每次升级额外免费进阶 ${atLevel(LVL_GAMBLER_ROLLS, lvl)} 条已有强化`,
    apply: (p, lvl) => {
      p.gamblerRolls = atLevel(LVL_GAMBLER_ROLLS, lvl);
    },
  },
];
