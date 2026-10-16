import { Player, UpgradeOption, UpgradeCategory, UpgradeRarity } from './types';

export interface UpgradeDefinition {
  id: string;
  key: string;
  name: string;
  nameZh: string;
  desc: string;
  category: UpgradeCategory;
  rarity: UpgradeRarity;
  maxLevel: number;
  statDiffText: (player: Player, currentLvl: number) => string;
  apply: (player: Player, currentLvl: number) => void;
}

export const ALL_UPGRADES: UpgradeDefinition[] = [
  // ==========================================
  // 1. 弹道与物理形变 (Ballistic)
  // ==========================================
  {
    id: 'fire_rate',
    key: 'fire_rate',
    name: 'Overclock Frequency',
    nameZh: '超载频射',
    desc: '优化开火时钟振荡器，开火间隔减少 22%，极大提升正面火力倾泻速率。',
    category: 'ballistic',
    rarity: 'common',
    maxLevel: 5,
    statDiffText: (p) => `开火间隔: ${Math.round(p.fireRate)}ms → ${Math.max(80, Math.round(p.fireRate * 0.78))}ms`,
    apply: (p) => {
      p.fireRate = Math.max(80, Math.round(p.fireRate * 0.78));
    },
  },
  {
    id: 'multi_shot',
    key: 'multi_shot',
    name: 'Multi-Vector Spread',
    nameZh: '散弹扇面',
    desc: '单次射击弹道数量 +1，以扇形发散覆盖更广阔的战场扇区。',
    category: 'ballistic',
    rarity: 'rare',
    maxLevel: 5,
    statDiffText: (p) => `弹道数量: ${p.bulletCount} 发 → ${p.bulletCount + 1} 发 (扇形发散)`,
    apply: (p) => {
      p.bulletCount = Math.min(6, p.bulletCount + 1);
    },
  },
  {
    id: 'damage',
    key: 'damage',
    name: 'High-Energy Impact',
    nameZh: '高能撞击',
    desc: '强化几何等离子子弹动能，基础伤害提升 35%（暴击伤害成倍增长）。',
    category: 'ballistic',
    rarity: 'common',
    maxLevel: 5,
    statDiffText: (p) => {
      const nextBase = Math.round(p.bulletDamage * 1.35);
      const nextCrit = Math.round(nextBase * p.critMultiplier);
      return `普攻: ${Math.round(p.bulletDamage)} → ${nextBase} | 暴击: ${Math.round(p.bulletDamage * p.critMultiplier)} → ${nextCrit}`;
    },
    apply: (p) => {
      p.bulletDamage = Math.round(p.bulletDamage * 1.35);
    },
  },
  {
    id: 'pierce',
    key: 'pierce',
    name: 'Kinetic Pierce',
    nameZh: '贯穿动能',
    desc: '子弹具备穿透几何体硬壳能力，单发子弹每次命中后穿透次数 +1。',
    category: 'ballistic',
    rarity: 'rare',
    maxLevel: 4,
    statDiffText: (p) => `穿透次数: ${p.bulletPierce} 次 → ${p.bulletPierce + 1} 次`,
    apply: (p) => {
      p.bulletPierce += 1;
    },
  },
  {
    id: 'bouncing_blades',
    key: 'bouncing_blades',
    name: 'Reflective Matrix',
    nameZh: '弹射矩阵',
    desc: '子弹触碰屏幕边缘或敌人物体时发生镜面弹性反射，大幅提升多重收割概率。',
    category: 'ballistic',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (p) => `弹射反弹: ${p.bouncingBullets} 次 → ${p.bouncingBullets + 1} 次 (屏幕边缘反弹)`,
    apply: (p) => {
      p.bouncingBullets = (p.bouncingBullets || 0) + 1;
    },
  },
  {
    id: 'cluster_bombs',
    key: 'cluster_bombs',
    name: 'Cluster Shards',
    nameZh: '集束裂变',
    desc: '子弹命中敌人时发生微型二阶爆破，向四周裂解出 3 枚高能微型散弹。',
    category: 'ballistic',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (p) => p.clusterBombs ? '裂变威力升级: 次级散弹伤害提升 50%' : '解锁命中二阶裂解散弹',
    apply: (p) => {
      p.clusterBombs = true;
    },
  },
  {
    id: 'cryo_freeze',
    key: 'cryo_freeze',
    name: 'Absolute Zero',
    nameZh: '绝对零度',
    desc: '子弹附带超低温冷冻磁场，命中敌人造成 35% 移速迟缓，并附加 20% 易伤。',
    category: 'ballistic',
    rarity: 'rare',
    maxLevel: 3,
    statDiffText: (p) => p.cryoSlow ? '冰霜冷冻力场效果加深至 45%' : '解锁子弹冰霜减速与易伤力场',
    apply: (p) => {
      p.cryoSlow = true;
    },
  },

  // ==========================================
  // 2. 能量共鸣与雷电 (Energy)
  // ==========================================
  {
    id: 'critical_core',
    key: 'critical_core',
    name: 'Critical Core Matrix',
    nameZh: '质能暴击',
    desc: '激发几何裂变反应，暴击几率 +15%，暴击伤害倍率提升 +0.5x。',
    category: 'energy',
    rarity: 'epic',
    maxLevel: 4,
    statDiffText: (p) =>
      `暴击率: ${Math.round(p.critChance * 100)}% → ${Math.round((p.critChance + 0.15) * 100)}% | 暴击倍率: ${p.critMultiplier.toFixed(1)}x → ${(p.critMultiplier + 0.5).toFixed(1)}x`,
    apply: (p) => {
      p.critChance = Math.min(0.9, p.critChance + 0.15);
      p.critMultiplier = Number((p.critMultiplier + 0.5).toFixed(1));
    },
  },
  {
    id: 'chain_lightning',
    key: 'chain_lightning',
    name: 'Tesla Resonance',
    nameZh: '特斯拉电弧',
    desc: '暴击命中时释放高压电浆，自动向周围最多 3 只敌人传导连锁闪电。',
    category: 'energy',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (p) => p.chainLightning ? '电弧威力加深: 传导伤害提升 40%' : '解锁暴击附带特斯拉连锁电弧',
    apply: (p) => {
      p.chainLightning = true;
    },
  },
  {
    id: 'orbit_satellite',
    key: 'orbit_satellite',
    name: 'Resonant Satellite',
    nameZh: '共振棱镜',
    desc: '激活环绕机体的超导几何棱镜，对贴近的敌方单位造成持续绞杀伤害。',
    category: 'energy',
    rarity: 'epic',
    maxLevel: 4,
    statDiffText: (p) => `护航棱镜: ${p.orbitSatellites} 枚 → ${p.orbitSatellites + 1} 枚 (环绕近战碾压)`,
    apply: (p) => {
      p.orbitSatellites += 1;
    },
  },
  {
    id: 'nova_pulse',
    key: 'nova_pulse',
    name: 'Supernova Pulse',
    nameZh: '超新星脉冲',
    desc: '周期性释放大范围冲击波纹，震退并撕裂身旁大群敌方几何体。',
    category: 'energy',
    rarity: 'legendary',
    maxLevel: 3,
    statDiffText: (p) =>
      p.novaInterval > 0
        ? `脉冲冷却: ${p.novaInterval / 1000}s → ${(p.novaInterval - 1000) / 1000}s`
        : `解锁全屏环形冲击波 (周期 5.0s)`,
    apply: (p) => {
      if (p.novaInterval === 0) {
        p.novaInterval = 5000;
      } else {
        p.novaInterval = Math.max(2500, p.novaInterval - 1000);
      }
    },
  },

  // ==========================================
  // 3. 防卫与生存力场 (Defense)
  // ==========================================
  {
    id: 'shield',
    key: 'shield',
    name: 'Refraction Shield',
    nameZh: '折射护盾',
    desc: '增强几何度规护盾，生命上限提升 25 点，立即恢复 40 点生命，且脱战自愈速度 +2.0 HP/s。',
    category: 'defense',
    rarity: 'rare',
    maxLevel: 5,
    statDiffText: (p) =>
      `生命: ${p.maxHp} → ${p.maxHp + 25} (立愈 +40, 脱战自愈 ${(p.shieldRegenRate).toFixed(1)} → ${(p.shieldRegenRate + 2.0).toFixed(1)} HP/s)`,
    apply: (p) => {
      p.maxHp += 25;
      p.shieldRegenRate += 2.0;
      p.hp = Math.min(p.maxHp, p.hp + 40);
    },
  },
  {
    id: 'speed',
    key: 'speed',
    name: 'Propulsion Optimizer',
    nameZh: '推进优化',
    desc: '优化核心矢量推进器，基础移动速度提升 15%。',
    category: 'defense',
    rarity: 'common',
    maxLevel: 4,
    statDiffText: (p) => `机动移速: ${p.speed.toFixed(1)} → ${(p.speed * 1.15).toFixed(1)}`,
    apply: (p) => {
      p.speed = Number((p.speed * 1.15).toFixed(2));
    },
  },
  {
    id: 'repulsion_field',
    key: 'repulsion_field',
    name: 'Repulsion Wave',
    nameZh: '排斥震波',
    desc: '每隔 6 秒从机体向外爆发一次强斥力冲击波，强力击退贴脸怪群 150 像素。',
    category: 'defense',
    rarity: 'rare',
    maxLevel: 3,
    statDiffText: (p) => p.repulsionField ? '排斥震波冷却缩短 1.5 秒' : '解锁每 6 秒一次的主动排斥环',
    apply: (p) => {
      p.repulsionField = true;
    },
  },
  {
    id: 'retaliation_thorns',
    key: 'retaliation_thorns',
    name: 'Retaliation Thorns',
    nameZh: '复仇荆棘',
    desc: '受到敌人攻击受创时，瞬间向 360° 全向射出 8 根复仇光刺反击。',
    category: 'defense',
    rarity: 'common',
    maxLevel: 3,
    statDiffText: (p) => p.retaliationThorns ? '复仇尖刺伤害提升 50%' : '解锁受创全向穿刺反击',
    apply: (p) => {
      p.retaliationThorns = true;
    },
  },
  {
    id: 'nanite_aegis',
    key: 'nanite_aegis',
    name: 'Nanite Aegis',
    nameZh: '纳米充能盾',
    desc: '若连续 4 秒未受攻击，机体凝聚一层硬质能量盾，可绝对抵消下一次任意伤害。',
    category: 'defense',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (p) => p.naniteShield ? '护盾充能时间由 4.0s 缩短至 2.8s' : '解锁抵消单次伤害的凝光硬盾',
    apply: (p) => {
      p.naniteShield = true;
    },
  },

  // ==========================================
  // 4. 自律构型无人机矩阵 (Summon)
  // ==========================================
  {
    id: 'summon_drone',
    key: 'summon_drone',
    name: 'Interceptor Drones',
    nameZh: '自律拦截飞梭',
    desc: '部署伴随主机的自律微型攻击飞梭，自动巡航锁定攻击附近敌人。每级数量 +1（最高 6 架）。',
    category: 'summon',
    rarity: 'common',
    maxLevel: 5,
    statDiffText: (p) => `无人机数量: ${p.droneCount} 架 → ${p.droneCount + 1} 架 (伴飞自律开火)`,
    apply: (p) => {
      p.droneCount = (p.droneCount || 0) + 1;
    },
  },
  {
    id: 'drone_missiles',
    key: 'drone_missiles',
    name: 'Swarm Micro-Missiles',
    nameZh: '蜂群制导飞弹',
    desc: '所有伴飞无人机加装微型高爆追踪飞弹，每隔 2.4 秒向怪群发射追踪导弹引发爆轰。',
    category: 'summon',
    rarity: 'rare',
    maxLevel: 3,
    statDiffText: (p) => p.droneMissiles ? '飞弹装药强化: 爆炸威力与半径提升 40%' : '解锁伴飞无人机群集束追踪飞弹',
    apply: (p) => {
      p.droneMissiles = true;
    },
  },
  {
    id: 'drone_shield',
    key: 'drone_shield',
    name: 'Guardian Aegis Drone',
    nameZh: '护卫偏折无人机',
    desc: '编队新增 1 架硬质偏折护卫无人机，贴身环绕机体旋转，抵挡并湮灭敌方弹幕，并提供 15% 碰撞免伤。',
    category: 'summon',
    rarity: 'rare',
    maxLevel: 3,
    statDiffText: (p) => p.droneShield ? '护卫无人机转速与偏折效率提升 50%' : '解锁抵消弹幕的贴身护卫无人机',
    apply: (p) => {
      p.droneShield = true;
    },
  },
  {
    id: 'summon_railgun',
    key: 'summon_railgun',
    name: 'Orbital Railgun Bit',
    nameZh: '重型轨道激光炮',
    desc: '部署 1 门悬浮轨道重型狙击炮，每隔 3.2 秒向全场血量最高目标轰出毁灭穿透激光。',
    category: 'summon',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (p) => p.droneRailgun ? '轨道炮攻击频率提升 30%，伤害提升 50%' : '解锁重型轨道狙击激光炮',
    apply: (p) => {
      p.droneRailgun = true;
    },
  },
  {
    id: 'drone_overclock',
    key: 'drone_overclock',
    name: 'Fleet Overclock',
    nameZh: '母舰蜂群超频',
    desc: '机体受创时优先牺牲一架飞梭抵挡致命伤；所有无人机攻击频率提升 40%，且无人机命中时附加 20% 易伤。',
    category: 'summon',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (p) => p.droneOverclock ? '超频功率加深: 伤害与射速再次提升 25%' : '解锁无人机护主献祭与全舰超频',
    apply: (p) => {
      p.droneOverclock = true;
    },
  },

  // ==========================================
  // 5. 战术与高危对赌 (Tactical)
  // ==========================================
  {
    id: 'magnet',
    key: 'magnet',
    name: 'Attraction Field',
    nameZh: '吸合力场',
    desc: '扩大核心能量磁场，经验晶体吸附半径提升 45%。',
    category: 'tactical',
    rarity: 'common',
    maxLevel: 5,
    statDiffText: (p) => `吸附半径: ${Math.round(p.magnetRadius)}px → ${Math.round(p.magnetRadius * 1.45)}px`,
    apply: (p) => {
      p.magnetRadius = Math.round(p.magnetRadius * 1.45);
    },
  },
  {
    id: 'executioner',
    key: 'executioner',
    name: 'Annihilation Protocol',
    nameZh: '终决处刑',
    desc: '对生命值低于 25% 的非首领敌人直接触发即死粉碎湮灭，并额外迸发经验晶体。',
    category: 'tactical',
    rarity: 'epic',
    maxLevel: 3,
    statDiffText: (p) => p.executioner ? '斩杀阈值提升至 32% 生命' : '解锁低血量非首领即死斩杀',
    apply: (p) => {
      p.executioner = true;
    },
  },
  {
    id: 'glass_cannon',
    key: 'glass_cannon',
    name: 'Overclock Reactor',
    nameZh: '过载核心',
    desc: '极端对赌词条：主炮伤害暴增 60%，但机体最大生命上限扣除 20%（高危高收益）。',
    category: 'tactical',
    rarity: 'legendary',
    maxLevel: 2,
    statDiffText: (p) => `单发伤害 +60% (生命上限 ${p.maxHp} → ${Math.round(p.maxHp * 0.8)})`,
    apply: (p) => {
      p.glassCannon = true;
      p.bulletDamage = Math.round(p.bulletDamage * 1.6);
      p.maxHp = Math.max(40, Math.round(p.maxHp * 0.8));
      p.hp = Math.min(p.hp, p.maxHp);
    },
  },
  {
    id: 'gravity_siphon',
    key: 'gravity_siphon',
    name: 'Dimensional Siphon',
    nameZh: '次元虹吸',
    desc: '每次升级时立即释放空间引力脉冲，将全图范围内所有的经验晶体瞬间吸入机体。',
    category: 'tactical',
    rarity: 'rare',
    maxLevel: 2,
    statDiffText: (p) => p.gravitySiphon ? '虹吸附带全图微型震波' : '升级瞬间全屏吸附所有宝石',
    apply: (p) => {
      p.gravitySiphon = true;
    },
  },
];

/**
 * Intelligent Tag-Weighted & Slot-Locking Algorithm
 * 1. Filter out already maxed upgrades
 * 2. 6-Slot Cap: if player owns 6 distinct categories/keys, only draw from those 6
 * 3. Tag-weighted synergy: categories player already holds get +40% weighting
 */
export function getRandomUpgrades(
  player: Player,
  upgradeLevels: Record<string, number>,
  count: number = 3
): UpgradeOption[] {
  // 1. Strict filter: exclude all maxed upgrades
  const availableDefs = ALL_UPGRADES.filter((u) => {
    const currentLvl = upgradeLevels[u.key] || 0;
    return currentLvl < u.maxLevel;
  });

  if (availableDefs.length === 0) {
    // Overcap fallback emergency card
    return [
      {
        id: 'emergency_repair',
        key: 'emergency_repair',
        name: 'Nanite Field Repair',
        nameZh: '全维度纳米自愈',
        desc: '所有科技模块已达全域超载！恢复 50 点生命值并爆发全屏驱逐震波。',
        category: 'defense',
        rarity: 'legendary',
        level: 1,
        maxLevel: 99,
        statDiffText: () => '立愈 +50 HP',
        apply: (p) => {
          p.hp = Math.min(p.maxHp, p.hp + 50);
        },
      },
    ];
  }

  // 2. Candidate Pool: All non-maxed upgrades are available!
  // No artificial slot locking: choosing a build only INCREASES probability, rather than locking out everything else.
  const activeKeys = Object.keys(upgradeLevels).filter((k) => (upgradeLevels[k] || 0) > 0);
  const activeCategories = new Set(
    activeKeys.map((k) => ALL_UPGRADES.find((u) => u.key === k)?.category).filter(Boolean)
  );

  const isCarrier = player.characterId === 'epsilon_carrier';
  const hasSummons = (player.droneCount || 0) > 0 || activeCategories.has('summon');

  // Core fundamental upgrades that every build benefits from
  const FUNDAMENTALS = new Set(['damage', 'fire_rate', 'multi_shot', 'shield', 'speed']);

  const weightedCandidates = availableDefs.map((def) => {
    let weight = 1.0;

    // Base rarity weight
    if (def.rarity === 'common') weight = 3.2;
    else if (def.rarity === 'rare') weight = 2.2;
    else if (def.rarity === 'epic') weight = 1.5;
    else if (def.rarity === 'legendary') weight = 0.8;

    // Fundamentals always maintain healthy presence in the pool
    if (FUNDAMENTALS.has(def.key)) {
      weight *= 1.3;
    }

    // Owned key bonus: slightly higher chance to level up already chosen upgrades, but never exclusive
    if (activeKeys.includes(def.key)) {
      weight *= 1.5;
    } else if (activeCategories.has(def.category)) {
      // Synergy category bonus: increased chance for related upgrades
      weight *= 1.6;
    }

    // Summon archetype synergy:
    // If player is Carrier or investing in summons, boost summon cards and especially drone count
    if (def.category === 'summon') {
      if (isCarrier) {
        weight *= 2.4;
      } else if (hasSummons) {
        weight *= 1.8;
      }

      // Prioritize basic Interceptor Drones if fleet is not yet at cap (6)
      if (def.key === 'summon_drone' && (player.droneCount || 0) < 6) {
        weight *= 1.6;
      }
    }

    return { def, weight };
  });

  // Pick weighted random items without duplication
  const selected: UpgradeOption[] = [];
  const pool = [...weightedCandidates];
  const targetCount = Math.min(count, pool.length);

  // Early-game archetype support: for Epsilon Carrier at early levels (<= 1 upgrade taken),
  // guarantee at least one summon upgrade appears in the first offering so the summon build starts cleanly.
  if (isCarrier && activeKeys.length <= 1) {
    const summonIdx = pool.findIndex((item) => item.def.category === 'summon');
    if (summonIdx >= 0) {
      const chosen = pool.splice(summonIdx, 1)[0].def;
      const currentLvl = upgradeLevels[chosen.key] || 0;
      selected.push({
        id: `${chosen.id}_${currentLvl + 1}`,
        key: chosen.key,
        name: chosen.name,
        nameZh: chosen.nameZh,
        desc: chosen.desc,
        category: chosen.category,
        rarity: chosen.rarity,
        level: currentLvl + 1,
        maxLevel: chosen.maxLevel,
        statDiffText: (p: Player) => chosen.statDiffText(p, currentLvl),
        apply: (p: Player) => chosen.apply(p, currentLvl),
      });
    }
  }

  while (selected.length < targetCount && pool.length > 0) {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    let chosenIdx = 0;

    for (let i = 0; i < pool.length; i++) {
      rand -= pool[i].weight;
      if (rand <= 0) {
        chosenIdx = i;
        break;
      }
    }

    const chosen = pool.splice(chosenIdx, 1)[0].def;
    const currentLvl = upgradeLevels[chosen.key] || 0;

    selected.push({
      id: `${chosen.id}_${currentLvl + 1}`,
      key: chosen.key,
      name: chosen.name,
      nameZh: chosen.nameZh,
      desc: chosen.desc,
      category: chosen.category,
      rarity: chosen.rarity,
      level: currentLvl + 1,
      maxLevel: chosen.maxLevel,
      statDiffText: (p: Player) => chosen.statDiffText(p, currentLvl),
      apply: (p: Player) => chosen.apply(p, currentLvl),
    });
  }

  return selected;
}
