export interface SynergyInfo {
  targetKey: string;
  nameZh: string;
  synergyTitle: string;
  description: string;
}

export interface CodexDetail {
  key: string;
  quote: string;
  primaryRole: string;
  recommendedArchetype: string;
  levels: {
    level: number;
    title: string;
    description: string;
    isMax?: boolean;
  }[];
  synergies: SynergyInfo[];
  tacticalTip: string;
}

export const CODEX_DETAILS: Record<string, CodexDetail> = {
  // ----------------------------------------------------
  // 弹道工程 (Ballistic)
  // ----------------------------------------------------
  fire_rate: {
    key: 'fire_rate',
    quote: '极致的射频是歼灭几何蜂群最原始也最有效的解药。',
    primaryRole: '持续 DPS 爆发 / 压制防线',
    recommendedArchetype: '高频风暴流 / 极限速射',
    levels: [
      { level: 1, title: '一级超频时钟', description: '开火间隔减少 22%（基准 250ms → 195ms，秒射速由 4.0 次提升至 5.1 次）' },
      { level: 2, title: '二级相位振荡', description: '开火间隔再减 22%（195ms → 152ms，秒射速达到 6.6 次）' },
      { level: 3, title: '三级等离子涌流', description: '开火间隔再减 22%（152ms → 118ms，秒射速达到 8.5 次）' },
      { level: 4, title: '四级谐振同步', description: '开火间隔再减 22%（118ms → 92ms，秒射速突破 10.8 次）' },
      { level: 5, title: '极速射频极限 [MAX]', description: '达到极速下限 80ms（秒射速高达 12.5 次！正面形成连续等离子激光帷幕）', isMax: true },
    ],
    synergies: [
      { targetKey: 'multi_shot', nameZh: '散弹扇面', synergyTitle: '弹幕风暴', description: '多弹道叠加极高射速，瞬间铺满全屏几何弹幕。' },
      { targetKey: 'critical_core', nameZh: '质能暴击', synergyTitle: '高频裂变', description: '超高攻击频率大幅提升暴击与特斯拉闪电触发期望。' },
      { targetKey: 'cluster_bombs', nameZh: '集束裂变', synergyTitle: '碎片地毯', description: '高频命中源源不断产生次级破片，范围压制力成倍暴涨。' },
    ],
    tacticalTip: '配合散弹或暴击流派能产生质变提升；对单体 Boss 和贴脸集群都有极强的击退定身效果。',
  },

  multi_shot: {
    key: 'multi_shot',
    quote: '单向矢量不过是点，散射扇面方能织成死亡之网。',
    primaryRole: '扇形范围覆盖 / 阻击蜂拥群怪',
    recommendedArchetype: '散弹爆轰流 / 重装防空网',
    levels: [
      { level: 1, title: '双联矢量', description: '发射弹道增至 2 发，呈 12° 夹角交叉覆盖前沿' },
      { level: 2, title: '三阶扇面', description: '发射弹道增至 3 发，扇面覆盖扩大至 25°' },
      { level: 3, title: '四角齐射', description: '发射弹道增至 4 发，弹幕密集度翻倍，近身全中爆发惊人' },
      { level: 4, title: '五芒散射', description: '发射弹道增至 5 发，几乎封锁正前方 60° 扇区' },
      { level: 5, title: '六维全域散弹 [MAX]', description: '发射弹道达到极限 6 发齐射，正前方无盲区灭顶打击', isMax: true },
    ],
    synergies: [
      { targetKey: 'damage', nameZh: '高能撞击', synergyTitle: '全弹齐射秒杀', description: '贴脸时 6 发高伤子弹同时命中单个精英怪，爆发输出毁天灭地。' },
      { targetKey: 'pierce', nameZh: '贯穿动能', synergyTitle: '扇面贯通', description: '每颗散弹都能穿透多层怪堆，直接撕裂外围围拢的包围圈。' },
      { targetKey: 'bouncing_blades', nameZh: '弹射矩阵', synergyTitle: '密室弹幕', description: '多发子弹在边缘反复折射，屏幕内常驻几十颗高能反弹弹丸。' },
    ],
    tacticalTip: '面对精英怪和 Boss 时，在保证自身安全前提下稍微拉近距离，能让所有扇面子弹全额命中同个目标！',
  },

  damage: {
    key: 'damage',
    quote: '在纯几何的世界里，质量与动能的乘积就是真理。',
    primaryRole: '全维度伤害放大 / 快速破甲',
    recommendedArchetype: '重炮毁灭流 / 单发点杀流',
    levels: [
      { level: 1, title: '动能强化 I', description: '基础伤害提升 35%（暴击伤害等比例成倍上升）' },
      { level: 2, title: '动能强化 II', description: '基础伤害再次提升 35%（累计相当于初值约 1.82 倍）' },
      { level: 3, title: '动能强化 III', description: '基础伤害再次提升 35%（累计相当于初值约 2.46 倍）' },
      { level: 4, title: '动能强化 IV', description: '基础伤害再次提升 35%（累计相当于初值约 3.32 倍）' },
      { level: 5, title: '超导等离子极化 [MAX]', description: '基础伤害达到初值 4.48 倍！一发子弹即可清空一条直线普通杂兵', isMax: true },
    ],
    synergies: [
      { targetKey: 'critical_core', nameZh: '质能暴击', synergyTitle: '指数倍率核弹', description: '高基伤配合暴击伤害倍率（最高 4.0x），单发打出上千伤害！' },
      { targetKey: 'summon_drone', nameZh: '自律拦截飞梭', synergyTitle: '僚机火力同调', description: '伴飞无人机的单发伤害基于主机伤害的 45%，主机越强无人机越狠。' },
      { targetKey: 'glass_cannon', nameZh: '过载核心', synergyTitle: '极限爆发', description: '牺牲生命上限换取额外 60% 乘算伤害，纯粹的毁灭机器。' },
    ],
    tacticalTip: '基石级属性！不管走任何流派，基础伤害的提升都会无条件传导至无人机、暴击、次级破片和反击荆棘。',
  },

  pierce: {
    key: 'pierce',
    quote: '锋锐的矢量能切开一切阻挡之物。',
    primaryRole: '贯通突防 / 群怪串烧',
    recommendedArchetype: '直线破阵流 / 贯通弹幕',
    levels: [
      { level: 1, title: '锐化弹头', description: '子弹穿透次数 +1（击中首个敌人后不销毁，继续贯穿后排 1 只目标）' },
      { level: 2, title: '高能穿甲', description: '穿透次数累计 +2，可一口气串透前中后三排怪堆' },
      { level: 3, title: '超导相位突防', description: '穿透次数累计 +3，直接洞穿中型几何冲锋阵列' },
      { level: 4, title: '无尽虚空穿刺 [MAX]', description: '穿透次数累计 +4，单发子弹可持续穿透 5 个目标，群怪不再是阻挡弹道的肉盾', isMax: true },
    ],
    synergies: [
      { targetKey: 'cryo_freeze', nameZh: '绝对零度', synergyTitle: '冻结冰霜带', description: '穿透子弹沿途为整条线上的怪全部施加冰霜减速与易伤。' },
      { targetKey: 'cluster_bombs', nameZh: '集束裂变', synergyTitle: '穿行爆破', description: '每次穿透击中敌人都释放一圈次级碎弹，造成多重爆炸。' },
      { targetKey: 'bouncing_blades', nameZh: '弹射矩阵', synergyTitle: '无限折射网', description: '既能穿怪又能反弹，子弹在怪群内来回折射多次贯通。' },
    ],
    tacticalTip: '中后期怪潮涌现时的救命技能，能有效防止自机被前排炮灰挡住弹道而让后排高危怪靠近。',
  },

  bouncing_blades: {
    key: 'bouncing_blades',
    quote: '边界不是阻碍，而是重整弹道的反射透镜。',
    primaryRole: '弹道利用率倍增 / 盲区收割',
    recommendedArchetype: '反弹弹幕流 / 密闭封杀',
    levels: [
      { level: 1, title: '弹性动能', description: '子弹撞击屏幕边缘或障碍时反弹 1 次，重新射向战场中央' },
      { level: 2, title: '二阶全反射', description: '反弹次数累计 +2，未命中敌人的射失子弹具有二次杀敌价值' },
      { level: 3, title: '镜面共振矩阵 [MAX]', description: '反弹次数累计 +3，整个战局边缘如同包覆了高弹力力场，子弹在场内飞射漫游', isMax: true },
    ],
    synergies: [
      { targetKey: 'multi_shot', nameZh: '散弹扇面', synergyTitle: '几何激光房', description: '一次发射 6 发反弹散弹，几轮射击后场内布满回弹的激光网。' },
      { targetKey: 'pierce', nameZh: '贯穿动能', synergyTitle: '贯穿折射', description: '穿透怪群撞击边界再反弹回来穿透第二遍，输出利用率翻倍。' },
    ],
    tacticalTip: '当身处角落或靠近边缘时，反弹弹道的利用效率达到峰值，可以借由墙壁反弹射击身后的敌人。',
  },

  cluster_bombs: {
    key: 'cluster_bombs',
    quote: '一化为三，三生万象，高能破片让虚空沸腾。',
    primaryRole: '范围清杂 / 区域二阶爆破',
    recommendedArchetype: '爆轰收割流 / 破片风暴',
    levels: [
      { level: 1, title: '集束引信', description: '子弹命中时解体爆发出 3 枚高能微型散弹向周围飞溅' },
      { level: 2, title: '增压破片', description: '次级微型散弹伤害提升 50%，扩散速度更快' },
      { level: 3, title: '饱和裂解核 [MAX]', description: '次级散弹附带微型爆轰冲击，群怪密集时引发连锁破片殉爆', isMax: true },
    ],
    synergies: [
      { targetKey: 'multi_shot', nameZh: '散弹扇面', synergyTitle: '漫天破片', description: '6 发主弹各裂变 3 枚破片，单轮射击产生 24 枚弹药！' },
      { targetKey: 'fire_rate', nameZh: '超载频射', synergyTitle: '破片地毯轰炸', description: '极速射频不断引爆次级破片，怪群连靠近的机会都没有。' },
    ],
    tacticalTip: '面对成群结队蜂拥而来的小型三角怪和菱形怪有极其恐怖的毁灭清场效率。',
  },

  cryo_freeze: {
    key: 'cryo_freeze',
    quote: '将熵减降至极点，几何体在绝对零度中凝固碎裂。',
    primaryRole: '强力群控 / 团队易伤增伤',
    recommendedArchetype: '控场风筝流 / 极寒领域',
    levels: [
      { level: 1, title: '低温凝光', description: '子弹命中造成 35% 减速，并使敌人受到全部伤害提升 20%' },
      { level: 2, title: '极寒深冻', description: '减速幅度提升至 45%，易伤效果提升至 30%' },
      { level: 3, title: '绝对零度奇点 [MAX]', description: '减速幅度达到 55%，高危怪陷入龟速漫游，易伤提升至 40%（全伤害增幅）', isMax: true },
    ],
    synergies: [
      { targetKey: 'executioner', nameZh: '终决处刑', synergyTitle: '冰封斩杀', description: '被减速的怪物无法逃脱，一旦血量低于阈值瞬间崩碎。' },
      { targetKey: 'summon_drone', nameZh: '自律拦截飞梭', synergyTitle: '靶向猎杀', description: '怪群移速减半后，无人机命中率与集火效率提升至极致。' },
    ],
    tacticalTip: '高波次怪群移速极快，减速效果是保命风筝的核心法宝，40% 的全域易伤对无人机和激光炮同样生效！',
  },

  // ----------------------------------------------------
  // 高维能量 (Energy)
  // ----------------------------------------------------
  critical_core: {
    key: 'critical_core',
    quote: '在能量坍缩的瞬间，概率收敛于毁灭。',
    primaryRole: '概率暴击 / 几何级伤害提升',
    recommendedArchetype: '暴击流 / 特斯拉电荷爆发',
    levels: [
      { level: 1, title: '裂变暴击 I', description: '暴击率 +15%，暴击伤害倍率提升至 2.0x' },
      { level: 2, title: '裂变暴击 II', description: '暴击率累计 +30%，暴击伤害倍率提升至 2.5x' },
      { level: 3, title: '裂变暴击 III', description: '暴击率累计 +45%，暴击伤害倍率提升至 3.0x' },
      { level: 4, title: '质能湮灭奇点 [MAX]', description: '暴击率累计 +60%（配合机体最高达 90%！），暴击伤害倍率高达 3.5x~4.0x', isMax: true },
    ],
    synergies: [
      { targetKey: 'chain_lightning', nameZh: '特斯拉电弧', synergyTitle: '雷暴连锁', description: '暴击是特斯拉电弧的触发前提，暴击率越高雷暴越密集。' },
      { targetKey: 'damage', nameZh: '高能撞击', synergyTitle: '百万暴击', description: '高基伤配合 3.5x 暴击倍率，单发数字极为震撼。' },
    ],
    tacticalTip: '选了暴击之后务必尽快寻找特斯拉电弧或高能撞击，能直接让单体点伤转化为连锁全屏群伤。',
  },

  chain_lightning: {
    key: 'chain_lightning',
    quote: '超导特斯拉电浆，在暴击的火花中跃迁传导。',
    primaryRole: '中距离自动跳跃群伤',
    recommendedArchetype: '电弧雷暴流 / 自动清屏',
    levels: [
      { level: 1, title: '特斯拉感应', description: '暴击命中时释放高压电浆，自动向周围最多 3 只敌人跳跃传导' },
      { level: 2, title: '高压电网', description: '跳跃传导目标增至 4 只，连锁电弧伤害提升 40%' },
      { level: 3, title: '雷霆过载穹顶 [MAX]', description: '跳跃目标增至 5 只，电弧带有短暂微眩晕定身，暴击时全屏蓝白闪电交织', isMax: true },
    ],
    synergies: [
      { targetKey: 'critical_core', nameZh: '质能暴击', synergyTitle: '永续雷暴', description: '高暴击率让几乎每一发子弹都能唤醒连锁特斯拉闪电。' },
      { targetKey: 'fire_rate', nameZh: '超载频射', synergyTitle: '高频电离', description: '每秒打出 10+ 发子弹，雷暴连续不断宛若全屏电离子云。' },
    ],
    tacticalTip: '电弧能够穿透地形和掩体，直接命中藏在怪堆深处的投射型精英怪，清理烦人的远程怪有奇效。',
  },

  orbit_satellite: {
    key: 'orbit_satellite',
    quote: '超导几何棱镜环绕回旋，构成最不可逾越的护身刀轮。',
    primaryRole: '近身自动绞杀 / 贴脸自保',
    recommendedArchetype: '护航棱镜绞杀流 / 贴身反击',
    levels: [
      { level: 1, title: '单芒护航', description: '部署 1 枚超导棱镜以中速环绕机体运转，接触即造成高额能量碾压' },
      { level: 2, title: '双子共振', description: '棱镜增至 2 枚，形成对称防御环，转速提升 20%' },
      { level: 3, title: '三角回旋', description: '棱镜增至 3 枚，近身绞杀无死角' },
      { level: 4, title: '四象天基刀环 [MAX]', description: '棱镜增至 4 枚！转速翻倍，任何试图贴脸自爆或冲锋的怪均被瞬间碾成碎屑', isMax: true },
    ],
    synergies: [
      { targetKey: 'repulsion_field', nameZh: '排斥震波', synergyTitle: '震退回斩', description: '排斥波将敌人推向外圈，正好撞入高速旋转的棱镜绞杀带。' },
      { targetKey: 'shield', nameZh: '折射护盾', synergyTitle: '重装绞肉机', description: '高坦度配合近战棱镜，敢于主动冲入怪堆中收割经验晶体。' },
    ],
    tacticalTip: '当被大量快速小怪近身包围走投无路时，顺着棱镜旋转方向原地小幅转圈，可以把贴脸怪全数绞碎。',
  },

  nova_pulse: {
    key: 'nova_pulse',
    quote: '超新星坍缩后释放的引力环，是全屏几何体的灾难。',
    primaryRole: '全屏周期性爆震 / 救场解围',
    recommendedArchetype: '新星重力流 / 危机解围',
    levels: [
      { level: 1, title: '引力波源', description: '解锁每 5.0 秒向外爆发一次全屏环形冲击波，强力击退并重创周围所有敌人' },
      { level: 2, title: '高频聚变', description: '脉冲释放周期由 5.0s 缩短至 4.0s，冲击波冲击半径与伤害 +35%' },
      { level: 3, title: '超新星大崩灭 [MAX]', description: '脉冲释放周期缩短至 2.5s！全场每隔两秒半震荡一次，波纹扫过之处杂兵尽灭', isMax: true },
    ],
    synergies: [
      { targetKey: 'executioner', nameZh: '终决处刑', synergyTitle: '全图冲击斩', description: '超新星冲击波伤害将残血怪打入 25% 阈值，引发全屏同时处刑即死！' },
      { targetKey: 'cryo_freeze', nameZh: '绝对零度', synergyTitle: '寒冰震荡波', description: '冲击波与减速配合，让全场敌人永远保持在安全射程之外。' },
    ],
    tacticalTip: '高难度下被蜂群死死合围时的顶级救命神技，2.5 秒一次的全屏强推能为你开辟撤退安全走廊。',
  },

  // ----------------------------------------------------
  // 装甲护盾与机体自愈 (Defense)
  // ----------------------------------------------------
  shield: {
    key: 'shield',
    quote: '坚固的度规几何外壳，配合纳米修复液带来持久续航。',
    primaryRole: '血量上限扩张 / 立即急救 / 脱战自愈',
    recommendedArchetype: '永动自愈装甲 / 容错保障',
    levels: [
      { level: 1, title: '度规护盾 I', description: '生命上限 +25，立即恢复 40 点生命，脱战自愈速率 +2.0 HP/s' },
      { level: 2, title: '度规护盾 II', description: '生命上限再 +25 (累计 +50)，立愈 +40 HP，脱战自愈增至 4.0 HP/s' },
      { level: 3, title: '度规护盾 III', description: '生命上限再 +25 (累计 +75)，立愈 +40 HP，脱战自愈增至 6.0 HP/s' },
      { level: 4, title: '度规护盾 IV', description: '生命上限再 +25 (累计 +100)，立愈 +40 HP，脱战自愈增至 8.0 HP/s' },
      { level: 5, title: '纳米超相装甲 [MAX]', description: '生命上限累计 +125！立愈 +40 HP，脱战自愈高达 10.0 HP/s，脱战几秒即可回满整条血！', isMax: true },
    ],
    synergies: [
      { targetKey: 'nanite_aegis', nameZh: '纳米充能盾', synergyTitle: '双重防护体系', description: '纳米硬盾免疫单次高额偷袭，脱战自愈稳步抚平消耗磨血。' },
      { targetKey: 'retaliation_thorns', nameZh: '复仇荆棘', synergyTitle: '荆棘反伤坦克', description: '高额血量池支撑反伤流承受打击，随后脱战自愈补满血量。' },
    ],
    tacticalTip: '注意“脱战自愈”机制：只要连续 3 秒不受到任何伤害，机体便会以极快速度自动回血，残血时务必拉开距离避战 3 秒！',
  },

  speed: {
    key: 'speed',
    quote: '天下武功，唯快不破；只要速度够快，几何弹幕便如静止。',
    primaryRole: '走位机动 / 规避弹幕 / 冲刺捡宝石',
    recommendedArchetype: '超音速巡航 / 极限风筝',
    levels: [
      { level: 1, title: '矢量喷口 I', description: '基础移动速度提升 15%（拉扯走位更加轻盈灵动）' },
      { level: 2, title: '矢量喷口 II', description: '移动速度再提升 15%（累计相当于初值约 1.32 倍）' },
      { level: 3, title: '矢量喷口 III', description: '移动速度再提升 15%（累计相当于初值约 1.52 倍）' },
      { level: 4, title: '曲率跃迁推进 [MAX]', description: '移动速度达到初值 1.75 倍！速度凌驾于全场所有敌人，进退自如', isMax: true },
    ],
    synergies: [
      { targetKey: 'magnet', nameZh: '吸合力场', synergyTitle: '全场宝石速掠', description: '高航速快速全图巡航，配合大磁铁瞬间集齐海量经验。' },
      { targetKey: 'summon_drone', nameZh: '自律拦截飞梭', synergyTitle: '母舰巡航放风筝', description: '自机只需全速转圈规避弹幕，由无人机代劳索敌开火。' },
    ],
    tacticalTip: '移速是高波次避免被快速冲锋怪和高速激光锁死的关键软实力，至少点出 1~2 级能极大降低操作压力。',
  },

  repulsion_field: {
    key: 'repulsion_field',
    quote: '任何逾越雷池的几何体，都将被斥力震飞百米之外。',
    primaryRole: '贴身防冲锋 / 定期全向推开怪群',
    recommendedArchetype: '近身拒止流 / 阵地维持',
    levels: [
      { level: 1, title: '斥力发电机', description: '解锁每 6 秒一次的主动斥力冲击环，将贴身 150 像素内的怪群强力击退' },
      { level: 2, title: '增幅线圈', description: '冷却时间缩短至 4.5 秒，击退距离增至 200 像素' },
      { level: 3, title: '绝对排斥穹顶 [MAX]', description: '冷却时间缩短至 3.0 秒！近身几乎形成永久斥力缓冲层，怪群无法近身合围', isMax: true },
    ],
    synergies: [
      { targetKey: 'multi_shot', nameZh: '散弹扇面', synergyTitle: '推后轰杀', description: '斥力环将聚集的怪群推成一圈，正好处于散弹最佳轰炸距离。' },
      { targetKey: 'orbit_satellite', nameZh: '共振棱镜', synergyTitle: '排斥绞杀', description: '将贴脸怪精准推入卫星棱镜轨道，造成无缝持续碾压。' },
    ],
    tacticalTip: '对付突然加速冲锋的红色尖刺三角怪有奇效，能在怪撞击到战机的一瞬间将其强行弹开。',
  },

  retaliation_thorns: {
    key: 'retaliation_thorns',
    quote: '受创不是终点，而是向全方位迸发复仇死光的号角。',
    primaryRole: '受击被动全向反制 / 绝地反杀',
    recommendedArchetype: '复仇刺猬流 / 卖血流',
    levels: [
      { level: 1, title: '复仇尖刺', description: '受到伤害时，瞬间向 360° 全向射出 8 根复仇光刺反击贴脸怪' },
      { level: 2, title: '淬毒晶刺', description: '反击光刺数量增至 12 根，伤害提升 50%，穿透 1 次' },
      { level: 3, title: '亿万光芒殉爆 [MAX]', description: '反击光刺增至 16 根全向齐射！受创时周围怪群瞬间被光刺全数清空', isMax: true },
    ],
    synergies: [
      { targetKey: 'shield', nameZh: '折射护盾', synergyTitle: '血厚刺痛', description: '丰厚的血量储备支撑承受伤害触发反击，脱战自愈后满血复活。' },
      { targetKey: 'cluster_bombs', nameZh: '集束裂变', synergyTitle: '反击连锁碎屑', description: '反击光刺同样享有击中爆炸特性，一次受击引发漫天连锁反炸。' },
    ],
    tacticalTip: '在怪潮极其密集避无可避时，与其慌乱转圈，不如直接借由一次轻微碰伤触发 16 根全向光刺瞬间炸出一条生路！',
  },

  nanite_aegis: {
    key: 'nanite_aegis',
    quote: '一层看似薄如蝉翼的硬质凝光，足以吸收毁灭性的致命一击。',
    primaryRole: '绝对免伤护盾 / 防单发高伤暴毙',
    recommendedArchetype: '高容错保命 / 越级挑战',
    levels: [
      { level: 1, title: '纳米晶核', description: '连续 4.0 秒未受伤害凝聚一层硬质能量盾，绝对抵消下一次任意伤害' },
      { level: 2, title: '快速重构', description: '护盾充能冷却由 4.0 秒缩短至 3.2 秒' },
      { level: 3, title: '金刚不坏力场 [MAX]', description: '护盾充能冷却仅需 2.5 秒！且护盾被打破瞬间释放 200px 冲击波推开敌人', isMax: true },
    ],
    synergies: [
      { targetKey: 'shield', nameZh: '折射护盾', synergyTitle: '双重复苏', description: '脱战自愈（3s）与纳米硬盾（2.5s）完美同步，每次拉开距离都重获满状态。' },
      { targetKey: 'glass_cannon', nameZh: '过载核心', synergyTitle: '玻璃大炮保命符', description: '过载核心削减了生命上限，纳米硬盾正是防止被意外秒杀的最佳答案。' },
    ],
    tacticalTip: '对付 Boss 的重型高伤狙击光束和秒杀级炸弹的神器，能完全吃下一记致死伤害而不掉一滴血。',
  },

  // ----------------------------------------------------
  // 智械机群与母舰构型 (Summon)
  // ----------------------------------------------------
  summon_drone: {
    key: 'summon_drone',
    quote: '我们不是单独一艘战机，我们是一整支翱翔于虚空的无人母舰蜂群。',
    primaryRole: '独立伴飞巡航 / 自动索敌集火 / 护卫',
    recommendedArchetype: '航母召唤流 / 全自动托管流',
    levels: [
      { level: 1, title: '单机编队', description: '部署 1 架伴随主机的自律攻击飞梭，独立巡航自动瞄准攻击附近敌人（攻击间隔 460ms）' },
      { level: 2, title: '双子伴飞', description: '无人机数量增至 2 架，双联齐射形成前沿交叉火力' },
      { level: 3, title: '三维僚机', description: '无人机数量增至 3 架，巡航盘旋半径与索敌范围扩大' },
      { level: 4, title: '四象蜂巢', description: '无人机数量增至 4 架，自动分工攻击不同方位的袭来敌军' },
      { level: 5, title: '五星母舰阵列 [MAX]', description: '无人机增至 5 架（配合航母角色被动可突破至 8 架！），单发伤害为本体 45%，形成毁灭性自律机群', isMax: true },
    ],
    synergies: [
      { targetKey: 'drone_overclock', nameZh: '母舰蜂群超频', synergyTitle: '极速超频蜂群', description: '全体飞梭攻击频率提升 40%，且飞梭命中附带 20% 易伤。' },
      { targetKey: 'drone_missiles', nameZh: '蜂群制导飞弹', synergyTitle: '导弹蜂群母舰', description: '所有 5 架飞梭全部挂载追踪飞弹，战场化身狂轰滥炸。' },
      { targetKey: 'damage', nameZh: '高能撞击', synergyTitle: '基伤继承', description: '无人机单发伤害完全继承主机基础攻击力，主机越强僚机越猛。' },
    ],
    tacticalTip: '召唤流核心基石！每一架无人机都是独立的射击源，配合「母舰蜂群超频」与「蜂群制导飞弹」能彻底解放走位，安心躲避。',
  },

  drone_missiles: {
    key: 'drone_missiles',
    quote: '给伴飞的微型僚机插上高爆飞弹的翅膀，小飞梭亦能打出核武级轰炸。',
    primaryRole: '无人机火力质变 / 追踪爆轰清屏',
    recommendedArchetype: '全弹发射流 / 蜂群地毯轰炸',
    levels: [
      { level: 1, title: '微型飞弹舱', description: '所有伴飞无人机加装高爆追踪飞弹，每隔 2.4 秒向怪群发射追踪导弹引发爆轰' },
      { level: 2, title: '增程火箭引信', description: '导弹装药量强化，爆炸威力与范围提升 40%' },
      { level: 3, title: '集束多联导弹群 [MAX]', description: '发射间隔缩短至 1.8 秒，爆炸产生持续范围燃烧震波，无人机数量越多轰炸越凶猛', isMax: true },
    ],
    synergies: [
      { targetKey: 'summon_drone', nameZh: '自律拦截飞梭', synergyTitle: '多机联动轰击', description: '拥有的无人机数量越多，每 1.8 秒发射的追踪导弹总数就越多！' },
      { targetKey: 'cluster_bombs', nameZh: '集束裂变', synergyTitle: '全维度爆破', description: '主武器裂变散弹配合无人机追踪导弹，爆炸此起彼伏。' },
    ],
    tacticalTip: '追踪导弹具备自动规避障碍的智能航线，能绕过前排障碍直接炸碎后排脆弱的高威胁投掷怪。',
  },

  drone_shield: {
    key: 'drone_shield',
    quote: '最好的盾不是死板的铁板，而是始终替你挡子弹的忠诚机械。',
    primaryRole: '贴身硬质弹幕拦截 / 碰撞免伤',
    recommendedArchetype: '攻守兼备流 / 航母重甲流',
    levels: [
      { level: 1, title: '护卫编组', description: '编队新增 1 架硬质偏折护卫无人机，贴身环绕机体旋转，抵挡并湮灭敌方弹幕，提供 15% 碰撞免伤' },
      { level: 2, title: '磁阻偏折网', description: '护卫无人机旋转半径扩大，转速提升 35%，碰撞免伤提升至 25%' },
      { level: 3, title: '永恒守护光壁 [MAX]', description: '护卫机具备主动吸引仇恨能力，碰撞免伤提升至 35%，高密度弹幕中提供可靠安全掩护', isMax: true },
    ],
    synergies: [
      { targetKey: 'nanite_aegis', nameZh: '纳米充能盾', synergyTitle: '绝对领域', description: '护卫无人机吃下散射杂弹，保护纳米硬盾不被蹭掉，留给挡大招。' },
      { targetKey: 'orbit_satellite', nameZh: '共振棱镜', synergyTitle: '环绕双重防御', description: '卫星棱镜负责输出碾压，护卫无人机负责吃弹减伤，身旁密不透风。' },
    ],
    tacticalTip: '面对弹幕密集的中后期 Boss 时，贴近护卫无人机的背身方向走位，能让它吸收 70% 以上的敌方直射子弹。',
  },

  summon_railgun: {
    key: 'summon_railgun',
    quote: '死神不在身边，它静静漂浮在轨道之上，校准着下一次毁灭打击。',
    primaryRole: '超远程单体斩首 / 穿透高维重伤',
    recommendedArchetype: '轨道狙击流 / 精英点杀',
    levels: [
      { level: 1, title: '悬浮轨道激光炮', description: '部署 1 门悬浮轨道重型狙击炮，每 3.2 秒向全场血量最高目标轰出毁灭穿透激光' },
      { level: 2, title: '聚能光束管', description: '轨道炮装填冷却缩短至 2.5 秒，激光贯穿伤害提升 50%' },
      { level: 3, title: '神之惩戒天基死光 [MAX]', description: '装填冷却缩短至 1.8 秒！激光宽度翻倍并留下持续 1 秒的高温电浆裂隙', isMax: true },
    ],
    synergies: [
      { targetKey: 'cryo_freeze', nameZh: '绝对零度', synergyTitle: '定点毁灭', description: '绝对零度施加 40% 易伤，轨道重炮一发死光轰出天文数字伤害！' },
      { targetKey: 'executioner', nameZh: '终决处刑', synergyTitle: '秒杀连携', description: '轨道重炮一炮将巨型精英打成残血，立即触发处刑即死湮灭。' },
    ],
    tacticalTip: '轨道炮必定优先瞄准全场“血量最高”的单位（通常为 Boss 或重装装甲立方），是应对首领战的最强对单利器！',
  },

  drone_overclock: {
    key: 'drone_overclock',
    quote: '释放所有功率安全阀门，机群将绽放出超越极限的光芒。',
    primaryRole: '召唤机群终极大招 / 舍身挡死 / 伤害质变',
    recommendedArchetype: '终极航母流 / 召唤流灵魂核心',
    levels: [
      { level: 1, title: '功率解限', description: '机体受创时优先牺牲一架飞梭抵挡致命伤；所有无人机攻击频率提升 40%，且无人机命中时附加 20% 易伤' },
      { level: 2, title: '神经突触并联', description: '牺牲护主的无人机会在 12 秒后自动重新生产；所有无人机伤害再提升 25%' },
      { level: 3, title: '超载星舰母港 [MAX]', description: '无人机攻击间隔缩短至极致 240ms！僚机全速开火如同加特林机炮，全方位暴雨倾泻', isMax: true },
    ],
    synergies: [
      { targetKey: 'summon_drone', nameZh: '自律拦截飞梭', synergyTitle: '蜂群暴走', description: '将拦截飞梭升满后再点超频，5~8 架无人机瞬间化身 8 台重型加特林！' },
      { targetKey: 'drone_missiles', nameZh: '蜂群制导飞弹', synergyTitle: '飞弹狂潮', description: '攻速与易伤提升使导弹发射频率达到极限，全图爆炸火光不断。' },
    ],
    tacticalTip: '只要场上有无人机存活，受到致死打击时会“替死抵命”扣除 1 架无人机保留 1 血！这是召唤流最强保命底牌。',
  },

  // ----------------------------------------------------
  // 战术与高危对赌 (Tactical)
  // ----------------------------------------------------
  magnet: {
    key: 'magnet',
    quote: '让虚空中游离的每一颗几何结晶，都顺从引力的意志奔向机体。',
    primaryRole: '远距离经验收集 / 减少走位捡物风险',
    recommendedArchetype: '资源滚雪球 / 高速升级流',
    levels: [
      { level: 1, title: '微型磁棒', description: '经验晶体吸附半径提升 45%（无需以身犯险走入怪堆捡宝石）' },
      { level: 2, title: '电磁吸盘', description: '吸附半径再次提升 45%（累计达到初值约 2.1 倍）' },
      { level: 3, title: '引力漏斗', description: '吸附半径再次提升 45%（累计达到初值约 3.0 倍）' },
      { level: 4, title: '超导强磁力场', description: '吸附半径再次提升 45%（累计达到初值约 4.4 倍）' },
      { level: 5, title: '行星级引力源 [MAX]', description: '吸附半径覆盖几乎半个屏幕！人在安全区走，半屏经验宝石自动飞速汇入', isMax: true },
    ],
    synergies: [
      { targetKey: 'gravity_siphon', nameZh: '次元虹吸', synergyTitle: '全局经验榨取', description: '大磁铁吸近处，次元虹吸吸全图，保证一颗经验晶体都不会遗漏。' },
      { targetKey: 'speed', nameZh: '推进优化', synergyTitle: '全场割草速刷', description: '高速移动穿梭配合大范围磁吸，等级飞速提升。' },
    ],
    tacticalTip: '很多新手往往死于“贪图去怪堆里捡宝石”。点出 2 级磁铁后，你在安全外圈绕行就能吸光内圈所有宝石！',
  },

  executioner: {
    key: 'executioner',
    quote: '不必费力将敌人的残存生命彻底耗尽，在终决的红线前，一切归于尘土。',
    primaryRole: '低血量即死处刑 / 高难怪破血条',
    recommendedArchetype: '斩杀爆发流 / 快速清场',
    levels: [
      { level: 1, title: '斩决协议', description: '对生命值低于 25% 的非首领敌人直接触发即死粉碎湮灭，并额外迸发 1 颗经验晶体' },
      { level: 2, title: '阈值扩张', description: '处刑血线阈值提升至 32% 生命值，即死判定更加宽泛' },
      { level: 3, title: '死神收割敕令 [MAX]', description: '处刑血线阈值提升至 40%！相当于所有非 Boss 敌人的有效血量直接减少了 40%', isMax: true },
    ],
    synergies: [
      { targetKey: 'nova_pulse', nameZh: '超新星脉冲', synergyTitle: '冲击即处刑', description: '全屏脉冲扫过怪群将其血量震入 40% 斩杀线，全屏瞬间连锁引爆！' },
      { targetKey: 'summon_railgun', nameZh: '重型轨道激光炮', synergyTitle: '点射斩杀', description: '轨道炮重伤高血量精英怪，处刑直接补刀将其瞬间蒸发。' },
    ],
    tacticalTip: '对付后期拥有巨厚血量的装甲六棱怪和分裂怪是降维打击，无需辛苦把上万血量打完，打掉 60% 即刻秒杀。',
  },

  glass_cannon: {
    key: 'glass_cannon',
    quote: '唯有赌上全部防壁，方能将毁灭之火燃烧到极尽。',
    primaryRole: '极端对赌 / 牺牲血量换取终极伤害',
    recommendedArchetype: '极限走位 / 一击必杀流',
    levels: [
      { level: 1, title: '禁忌过载 I', description: '主武器单发伤害暴增 60%，但机体最大生命上限扣除 20%（高危高收益）' },
      { level: 2, title: '禁忌过载 II [MAX]', description: '单发伤害再次暴增 60%（累计翻倍！），生命上限再次扣除 20%（一击即是天灾）', isMax: true },
    ],
    synergies: [
      { targetKey: 'nanite_aegis', nameZh: '纳米充能盾', synergyTitle: '玻璃保护壳', description: '完美弥补血量被扣减的脆弱期，依靠纳米硬盾挡掉致命偷袭。' },
      { targetKey: 'speed', nameZh: '推进优化', synergyTitle: '高速幽灵', description: '依靠无双移速规避所有弹幕，将敌人在近身前全部蒸发。' },
    ],
    tacticalTip: '高手进阶必选！如果搭配了「折射护盾」和「纳米充能盾」，完全能够抵消扣血负面影响，白拿 120%+ 的巨额伤害增幅！',
  },

  gravity_siphon: {
    key: 'gravity_siphon',
    quote: '空间在升级的刹那折叠，宇宙边缘的微尘亦落入掌中。',
    primaryRole: '升级全图吸取 / 零损耗滚雪球',
    recommendedArchetype: '狂暴连锁升级 / 资源永动',
    levels: [
      { level: 1, title: '空间坍缩', description: '每次升级时立即释放全图引力脉冲，将全屏幕范围内所有的经验晶体瞬间吸入机体' },
      { level: 2, title: '共振震荡 [MAX]', description: '全图吸附的同时，全屏释放一次驱逐震波，推开所有敌人，并加速晶体吸附速度', isMax: true },
    ],
    synergies: [
      { targetKey: 'magnet', nameZh: '吸合力场', synergyTitle: '资源垄断', description: '两者相辅相成，升级时吸全图，平时吸身边，等级起飞快人一步。' },
      { targetKey: 'executioner', nameZh: '终决处刑', synergyTitle: '晶体爆发连锁', description: '处刑产生的额外晶体散落各处，升级时一键全部拉回，形成连续升级狂潮。' },
    ],
    tacticalTip: '在怪潮极其庞大不敢突进时，依靠远程击杀攒满升级条，一旦升级立即全图吸走成百上千颗宝石，往往能引发连续升级 2~3 次的狂暴节奏！',
  },
};
