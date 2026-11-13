import { UpgradeDefinition, atLevel } from './upgrades';

/**
 * Monster Upgrade Pool for Predator Mode.
 *
 * 25 unique upgrades divided into two families:
 * - Apex Dominion (主宰异化): 13 cards focusing on the pilot monster (damage, survivability, active ult mutations)
 * - Swarm Coordination (虫群统御): 12 cards focusing on the soldier army (count, acid death blast, bite slow, frenzy)
 *
 * All keys are strictly unique across standard, overflow and monster pools.
 */

// Per-level scaling tables (Apex)
const LVL_NEURO_SLOW = [0.18, 0.28, 0.38];
const LVL_REND_BONUS = [0.20, 0.35, 0.50];
const LVL_CARAPACE_HP = [0.40, 0.80, 1.20];
const LVL_CARAPACE_GATE = [0.40, 0.30, 0.25];
const LVL_BLOODLUST_CAP = [4, 6, 8];
const LVL_AURA_RADIUS = [140, 180, 220];
const LVL_AURA_DAMAGE = [10, 20, 35];
const LVL_REAPING_LEECH = [0.25, 0.40, 0.60];
const LVL_REAPING_REFUND = [1.0, 1.5, 2.0];
const LVL_PHASE_INVULN = [1.0, 1.8, 2.7];
const LVL_OVERCHARGE_DMG = [0.35, 0.70, 1.10];
const LVL_OVERCHARGE_LOCK = [0.25, 0.40, 0.55];
const LVL_CRUSH_RADIUS = [0.40, 0.75, 1.20];
const LVL_CRUSH_DMG = [0.30, 0.60, 0.90];
const LVL_BROOD_EXTRA = [2, 4, 6];
const LVL_EXECUTIONER_BONUS = [0.50, 0.90, 1.40];
const LVL_FRENZY_RATE = [0.04, 0.07, 0.10];
const LVL_ADAPTIVE_BITE = [0.30, 0.60, 0.90];

// Per-level scaling tables (Swarm)
const LVL_CORPSE_RADIUS = [60, 90, 120];
const LVL_CORPSE_DMG = [20, 40, 70];
const LVL_SPORE_DURATION = [2.5, 3.5, 5.0];
const LVL_SPORE_SLOW = [0.25, 0.45, 0.70];
const LVL_SWARM_CAP = [40, 80, 120];
const LVL_SWARM_SPAWN = [0.40, 0.80, 1.20];
const LVL_PACK_DAMAGE = [0.04, 0.07, 0.10];
const LVL_CHITIN_HP = [0.50, 1.00, 1.60];
const LVL_SWARM_LEECH = [0.20, 0.35, 0.50];
const LVL_PINCER_CRIT = [1.8, 2.4, 3.0];
const LVL_ADRENAL_SPEED = [0.40, 0.70, 1.00];
const LVL_ACID_BITE = [0.30, 0.60, 0.90];
const LVL_BEACON_BONUS = [0.35, 0.60, 0.90];
const LVL_MINE_CHANCE = [0.25, 0.50, 0.75];
const LVL_MINE_DMG = [35, 65, 100];
const LVL_ELITE_CHANCE = [0.30, 0.60, 1.00];

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export const MONSTER_UPGRADES: UpgradeDefinition[] = [
  // ==========================================================================
  // 主宰异化 (Apex Dominion) —— 强化自身形态与操控质变
  // ==========================================================================
  {
    id: 'apex_neurotoxin',
    key: 'apex_neurotoxin',
    name: 'Neurotoxin Jaws',
    nameZh: '神经毒素',
    desc: '撕咬注入强效神经毒素，使猎物移动速度大幅减缓 2 秒。',
    category: 'tactical',
    rarity: 'common',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) => `撕咬减速 ${pct(atLevel(LVL_NEURO_SLOW, lvl))}`,
    apply: (player, lvl) => {
      player.pilotNeuroSlow = atLevel(LVL_NEURO_SLOW, lvl);
      player.pilotNeuroDuration = 2.0;
    },
  },
  {
    id: 'apex_kinetic_rend',
    key: 'apex_kinetic_rend',
    name: 'Kinetic Rupture',
    nameZh: '动能撕裂',
    desc: '大招突进或冲锋命中撕裂猎物护甲，使其在 3 秒内受到的全伤害大幅增加。',
    category: 'tactical',
    rarity: 'rare',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) => `撕裂易伤 +${pct(atLevel(LVL_REND_BONUS, lvl))}`,
    apply: (player, lvl) => {
      player.pilotRendBonus = atLevel(LVL_REND_BONUS, lvl);
      player.pilotRendDuration = 3.0;
    },
  },
  {
    id: 'apex_carapace',
    key: 'apex_carapace',
    name: 'Reinforced Carapace',
    nameZh: '硬化骨板',
    desc: '大幅强化怪物体型与生命上限，并限制单次受到的最大伤害比例。',
    category: 'defense',
    rarity: 'common',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) =>
      `形态HP +${pct(atLevel(LVL_CARAPACE_HP, lvl))} / 单次受创上限 ${pct(atLevel(LVL_CARAPACE_GATE, lvl))}`,
    apply: (player, lvl) => {
      player.pilotMaxHpScale = atLevel(LVL_CARAPACE_HP, lvl);
      player.pilotDamageReductionMax = atLevel(LVL_CARAPACE_GATE, lvl);
    },
  },
  {
    id: 'apex_bloodlust',
    key: 'apex_bloodlust',
    name: 'Feral Bloodlust',
    nameZh: '血腥狂奔',
    desc: '撕咬猎物叠加移动速度，使主宰在围攻拉扯中愈战愈迅捷。',
    category: 'tactical',
    rarity: 'common',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) => `每次命中 +8% 移速，上限 ${atLevel(LVL_BLOODLUST_CAP, lvl)} 层`,
    apply: (player, lvl) => {
      player.pilotBloodlustCap = atLevel(LVL_BLOODLUST_CAP, lvl);
    },
  },
  {
    id: 'apex_corrosive_aura',
    key: 'apex_corrosive_aura',
    name: 'Corrosive Cloud',
    nameZh: '腐蚀光环',
    desc: '主宰周身产生强酸腐蚀力场，猎物靠近时每 0.5 秒受到持续酸蚀伤害。',
    category: 'energy',
    rarity: 'rare',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) =>
      `光环半径 ${atLevel(LVL_AURA_RADIUS, lvl)}px / 秒伤 ${atLevel(LVL_AURA_DAMAGE, lvl) * 2}`,
    apply: (player, lvl) => {
      player.pilotAuraRadius = atLevel(LVL_AURA_RADIUS, lvl);
      player.pilotAuraDamage = atLevel(LVL_AURA_DAMAGE, lvl);
    },
  },
  {
    id: 'apex_reaping_maw',
    key: 'apex_reaping_maw',
    name: 'Vampiric Bite',
    nameZh: '饕餮之吻',
    desc: '近身撕咬命中时按比例吸取生命值，并直接返还大招冷却时间。',
    category: 'tactical',
    rarity: 'rare',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) =>
      `吸取伤害 ${pct(atLevel(LVL_REAPING_LEECH, lvl))} / 大招CD -${atLevel(LVL_REAPING_REFUND, lvl)}s`,
    apply: (player, lvl) => {
      player.pilotLeechRate = atLevel(LVL_REAPING_LEECH, lvl);
      player.pilotUltCooldownRefund = atLevel(LVL_REAPING_REFUND, lvl);
    },
  },
  {
    id: 'apex_phase_shift',
    key: 'apex_phase_shift',
    name: 'Ethereal Rebirth',
    nameZh: '虚空相位',
    desc: '延长死亡换怪后的无敌保护时间，并在无敌期间获得 50% 移速加成。',
    category: 'defense',
    rarity: 'common',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) => `重生无敌延长 +${atLevel(LVL_PHASE_INVULN, lvl).toFixed(1)}s`,
    apply: (player, lvl) => {
      player.pilotExtraInvuln = atLevel(LVL_PHASE_INVULN, lvl);
    },
  },
  {
    id: 'apex_overcharge',
    key: 'apex_overcharge',
    name: 'Lethal Projectiles',
    nameZh: '死线过载',
    desc: '大幅强化狙击手与首领形态的弹幕伤害，并显著缩短蓄力锁定耗时。',
    category: 'ballistic',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) =>
      `远程伤害 +${pct(atLevel(LVL_OVERCHARGE_DMG, lvl))} / 蓄力耗时 -${pct(atLevel(LVL_OVERCHARGE_LOCK, lvl))}`,
    apply: (player, lvl) => {
      player.pilotRangeDamageScale = atLevel(LVL_OVERCHARGE_DMG, lvl);
      player.pilotLockSpeedScale = atLevel(LVL_OVERCHARGE_LOCK, lvl);
    },
  },
  {
    id: 'apex_crush_impact',
    key: 'apex_crush_impact',
    name: 'Seismic Shock',
    nameZh: '重踏震荡',
    desc: '增强重装者震地冲击与冲锋角的践踏破坏力，扩大冲击影响范围。',
    category: 'ballistic',
    rarity: 'rare',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) =>
      `冲击范围 +${pct(atLevel(LVL_CRUSH_RADIUS, lvl))} / 接触伤害 +${pct(atLevel(LVL_CRUSH_DMG, lvl))}`,
    apply: (player, lvl) => {
      player.pilotSlamRadiusScale = atLevel(LVL_CRUSH_RADIUS, lvl);
      player.pilotSlamDamageScale = atLevel(LVL_CRUSH_DMG, lvl);
    },
  },
  {
    id: 'apex_spore_nursery',
    key: 'apex_spore_nursery',
    name: 'Brood Genesis',
    nameZh: '母体菌囊',
    desc: '裂殖母巢大招裂解出的士兵数量倍增，且幼体移速更快。',
    category: 'summon',
    rarity: 'rare',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) => `额外分裂士兵 +${atLevel(LVL_BROOD_EXTRA, lvl)} 只`,
    apply: (player, lvl) => {
      player.pilotBroodExtra = atLevel(LVL_BROOD_EXTRA, lvl);
    },
  },
  {
    id: 'apex_executioner',
    key: 'apex_executioner',
    name: 'Apex Cull',
    nameZh: '终末绞杀',
    desc: '当猎物血量跌入 35% 背水阶段时，主宰对其造成的所有伤害产生毁灭性增幅。',
    category: 'tactical',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) => `猎物背水时增伤 +${pct(atLevel(LVL_EXECUTIONER_BONUS, lvl))}`,
    apply: (player, lvl) => {
      player.pilotDesperateDamageBonus = atLevel(LVL_EXECUTIONER_BONUS, lvl);
    },
  },
  {
    id: 'apex_frenzy_rage',
    key: 'apex_frenzy_rage',
    name: 'Berserk Reaction',
    nameZh: '激怒反应',
    desc: '主宰自身受创越重狂暴程度越高，每损失 10% 生命获得移速与接触伤害提升。',
    category: 'tactical',
    rarity: 'common',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) => `每损 10% HP 增益 +${pct(atLevel(LVL_FRENZY_RATE, lvl))}`,
    apply: (player, lvl) => {
      player.pilotFrenzyBonus = atLevel(LVL_FRENZY_RATE, lvl);
    },
  },
  {
    id: 'apex_adaptive_flesh',
    key: 'apex_adaptive_flesh',
    name: 'Predatory Prowess',
    nameZh: '狂暴本能',
    desc: '全形态基础接触撕咬伤害获得大幅度直接提升。',
    category: 'tactical',
    rarity: 'common',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) => `基础咬合伤害 +${pct(atLevel(LVL_ADAPTIVE_BITE, lvl))}`,
    apply: (player, lvl) => {
      player.pilotContactScale = atLevel(LVL_ADAPTIVE_BITE, lvl);
    },
  },

  // ==========================================================================
  // 虫群统御 (Swarm Coordination) —— 强化同族士兵与集群战术
  // ==========================================================================
  {
    id: 'swarm_corpse_blast',
    key: 'swarm_corpse_blast',
    name: 'Volatile Brood',
    nameZh: '尸爆殉爆',
    desc: '士兵被猎物消灭时产生剧烈酸液爆裂，对周围猎物造成高额反噬伤害。',
    category: 'summon',
    rarity: 'common',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) =>
      `死后自爆范围 ${atLevel(LVL_CORPSE_RADIUS, lvl)}px / 伤害 ${atLevel(LVL_CORPSE_DMG, lvl)}`,
    apply: (player, lvl) => {
      player.swarmCorpseBlastRadius = atLevel(LVL_CORPSE_RADIUS, lvl);
      player.swarmCorpseBlastDamage = atLevel(LVL_CORPSE_DMG, lvl);
    },
  },
  {
    id: 'swarm_spore_cloud',
    key: 'swarm_spore_cloud',
    name: 'Asphyxiating Spores',
    nameZh: '窒息孢子',
    desc: '士兵死亡留下有毒孢子迷雾，进入迷雾的猎物武器开火间隔大幅延长。',
    category: 'summon',
    rarity: 'rare',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) =>
      `孢子留存 ${atLevel(LVL_SPORE_DURATION, lvl).toFixed(1)}s / 猎物射频降低 ${pct(atLevel(LVL_SPORE_SLOW, lvl))}`,
    apply: (player, lvl) => {
      player.swarmSporeCloudDuration = atLevel(LVL_SPORE_DURATION, lvl);
      player.swarmSporeCloudSlow = atLevel(LVL_SPORE_SLOW, lvl);
    },
  },
  {
    id: 'swarm_overwhelming',
    key: 'swarm_overwhelming',
    name: 'Endless Tide',
    nameZh: '虫潮翻涌',
    desc: '同屏士兵容纳上限大幅提高，且每波刷出的兵潮数量显著增加。',
    category: 'summon',
    rarity: 'rare',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) =>
      `士兵上限 +${atLevel(LVL_SWARM_CAP, lvl)} / 刷新数量 +${pct(atLevel(LVL_SWARM_SPAWN, lvl))}`,
    apply: (player, lvl) => {
      player.swarmCapBonus = atLevel(LVL_SWARM_CAP, lvl);
      player.swarmSpawnScaleBonus = atLevel(LVL_SWARM_SPAWN, lvl);
    },
  },
  {
    id: 'swarm_pack_mandible',
    key: 'swarm_pack_mandible',
    name: 'Pack Coordination',
    nameZh: '集群咬合',
    desc: '猎物身边的士兵越多，所有士兵的撕咬破坏力协同成倍上升。',
    category: 'summon',
    rarity: 'common',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) => `每只临近士兵增伤 +${pct(atLevel(LVL_PACK_DAMAGE, lvl))}`,
    apply: (player, lvl) => {
      player.swarmPackDamageBonus = atLevel(LVL_PACK_DAMAGE, lvl);
    },
  },
  {
    id: 'swarm_chitin_shield',
    key: 'swarm_chitin_shield',
    name: 'Chitin Lattice',
    nameZh: '甲壳共振',
    desc: '硬化所有同族士兵的生命甲壳，使其能承受猎物更多波次的弹幕射击。',
    category: 'defense',
    rarity: 'common',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) => `士兵生命上限 +${pct(atLevel(LVL_CHITIN_HP, lvl))}`,
    apply: (player, lvl) => {
      player.swarmHpScale = atLevel(LVL_CHITIN_HP, lvl);
    },
  },
  {
    id: 'swarm_leech_link',
    key: 'swarm_leech_link',
    name: 'Synaptic Leech',
    nameZh: '生命反哺',
    desc: '士兵对猎物造成的每一次有效咬噬，都将部分生命精华反馈输送给主宰。',
    category: 'summon',
    rarity: 'rare',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) => `撕咬伤害 ${pct(atLevel(LVL_SWARM_LEECH, lvl))} 反哺为主宰生命`,
    apply: (player, lvl) => {
      player.swarmLeechShare = atLevel(LVL_SWARM_LEECH, lvl);
    },
  },
  {
    id: 'swarm_pincer_trap',
    key: 'swarm_pincer_trap',
    name: 'Pincer Ambush',
    nameZh: '围猎夹击',
    desc: '当猎物被 3 只以上士兵围堵时，主宰对其发起的撕咬必定触发暴击。',
    category: 'tactical',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) => `包夹暴击倍率 ${atLevel(LVL_PINCER_CRIT, lvl).toFixed(1)}x`,
    apply: (player, lvl) => {
      player.swarmPincerCritMultiplier = atLevel(LVL_PINCER_CRIT, lvl);
    },
  },
  {
    id: 'swarm_adrenal_surge',
    key: 'swarm_adrenal_surge',
    name: 'Adrenal Surge',
    nameZh: '肾上腺激涌',
    desc: '主宰释放大招时，信息素激荡促使全场同族士兵移速暴涨 3.5 秒。',
    category: 'summon',
    rarity: 'common',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) => `大招后士兵移速 +${pct(atLevel(LVL_ADRENAL_SPEED, lvl))}`,
    apply: (player, lvl) => {
      player.swarmAdrenalSpeedBonus = atLevel(LVL_ADRENAL_SPEED, lvl);
    },
  },
  {
    id: 'swarm_acid_blood',
    key: 'swarm_acid_blood',
    name: 'Caustic Fangs',
    nameZh: '强酸尖牙',
    desc: '士兵撕咬附带高浓度酸蚀效果，造成的基础接触伤害大幅提升。',
    category: 'summon',
    rarity: 'common',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) => `士兵撕咬伤害 +${pct(atLevel(LVL_ACID_BITE, lvl))}`,
    apply: (player, lvl) => {
      player.swarmBiteDamageScale = atLevel(LVL_ACID_BITE, lvl);
    },
  },
  {
    id: 'swarm_relay_beacon',
    key: 'swarm_relay_beacon',
    name: 'Pheromone Mark',
    nameZh: '信标追猎',
    desc: '主宰咬中猎物后留下 4 秒高能信息素，所有士兵狂暴扑向该猎物并获得移速加成。',
    category: 'tactical',
    rarity: 'rare',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) => `追猎狂暴移速 +${pct(atLevel(LVL_BEACON_BONUS, lvl))}`,
    apply: (player, lvl) => {
      player.swarmBeaconBonus = atLevel(LVL_BEACON_BONUS, lvl);
    },
  },
  {
    id: 'swarm_spore_mine',
    key: 'swarm_spore_mine',
    name: 'Organic Landmine',
    nameZh: '潜伏地雷',
    desc: '士兵死亡时有概率在地面遗留高爆生物地雷，猎物踏入引发猛烈爆炸。',
    category: 'summon',
    rarity: 'rare',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) =>
      `遗留概率 ${pct(atLevel(LVL_MINE_CHANCE, lvl))} / 地雷伤害 ${atLevel(LVL_MINE_DMG, lvl)}`,
    apply: (player, lvl) => {
      player.swarmMineChance = atLevel(LVL_MINE_CHANCE, lvl);
      player.swarmMineDamage = atLevel(LVL_MINE_DMG, lvl);
    },
  },
  {
    id: 'swarm_brood_evolution',
    key: 'swarm_brood_evolution',
    name: 'Elite Strain',
    nameZh: '精锐异化',
    desc: '促使虫群基因突变，每波刷新出高阶精锐兵种（疾行者、重装者、角怪）的几率大幅提高。',
    category: 'summon',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (_, lvl = 1) => `高阶士兵刷新率 +${pct(atLevel(LVL_ELITE_CHANCE, lvl))}`,
    apply: (player, lvl) => {
      player.swarmEliteChance = atLevel(LVL_ELITE_CHANCE, lvl);
    },
  },
];
