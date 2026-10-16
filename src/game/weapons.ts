import { Player, WeaponId, WeaponInstance, UpgradeOption } from './types';

export interface WeaponDef {
  id: WeaponId;
  nameZh: string;
  nameEn: string;
  desc: string;
  maxLevel: number;
  baseCooldown: number; // ms
  baseDamage: number;
  isSuper?: boolean;
  requiredWeapon?: WeaponId;
  requiredPassive?: string;
}

export const WEAPON_DEFS: Record<WeaponId, WeaponDef> = {
  plasma_blaster: {
    id: 'plasma_blaster',
    nameZh: '等离子脉冲炮',
    nameEn: 'Plasma Blaster',
    desc: '机体主武器系统，向最近敌人群倾泻高频等离子能量弹。',
    maxLevel: 5,
    baseCooldown: 400,
    baseDamage: 25,
  },
  laser_drone: {
    id: 'laser_drone',
    nameZh: '光子浮游炮',
    nameEn: 'Laser Drone',
    desc: '周期性向敌军最密集区域投射持续贯穿的高能切割激光束。',
    maxLevel: 5,
    baseCooldown: 3200,
    baseDamage: 45,
  },
  void_mine: {
    id: 'void_mine',
    nameZh: '虚空地雷',
    nameEn: 'Void Mine',
    desc: '沿机动移动轨迹周期性布设自转几何地雷，引爆大范围冲击震波。',
    maxLevel: 5,
    baseCooldown: 2800,
    baseDamage: 60,
  },
  bouncing_glaive: {
    id: 'bouncing_glaive',
    nameZh: '全息飞刃',
    nameEn: 'Bouncing Glaive',
    desc: '发射在战场边缘与敌方阵列之间高速折射弹跳的能量棱镜飞刃。',
    maxLevel: 5,
    baseCooldown: 2400,
    baseDamage: 38,
  },
  plasma_ring: {
    id: 'plasma_ring',
    nameZh: '离子风暴环',
    nameEn: 'Plasma Ring',
    desc: '周期性向外扩散并收缩高能电浆能量环，对触碰单位造成双重割裂。',
    maxLevel: 5,
    baseCooldown: 3800,
    baseDamage: 55,
  },
  // Super Evolved Weapons
  deathstar_ray: {
    id: 'deathstar_ray',
    nameZh: '死星裂变阵',
    nameEn: 'Deathstar Ray',
    desc: '【终极超武】等离子脉冲与质能暴击融合，向全屏扫射毁灭性死星等离子光瀑！',
    maxLevel: 1,
    baseCooldown: 1200,
    baseDamage: 120,
    isSuper: true,
    requiredWeapon: 'plasma_blaster',
    requiredPassive: 'critical_core',
  },
  orbital_railgun: {
    id: 'orbital_railgun',
    nameZh: '奇点轨道炮',
    nameEn: 'Orbital Railgun',
    desc: '【终极超武】共振棱镜与推进优化融合，超光速自转绞杀并向外喷射光刺！',
    maxLevel: 1,
    baseCooldown: 1500,
    baseDamage: 85,
    isSuper: true,
    requiredWeapon: 'plasma_ring', // or satellites
    requiredPassive: 'speed',
  },
  event_horizon: {
    id: 'event_horizon',
    nameZh: '坍缩事件视界',
    nameEn: 'Event Horizon',
    desc: '【终极超武】吸合力场与折射护盾融合，在机体周身形成持续蒸发敌怪的暗能视界！',
    maxLevel: 1,
    baseCooldown: 500,
    baseDamage: 70,
    isSuper: true,
    requiredPassive: 'shield',
  },
  dimensional_laser: {
    id: 'dimensional_laser',
    nameZh: '超维毁灭阵列',
    nameEn: 'Dimensional Obliterator',
    desc: '【终极超武】光子浮游炮与超载频射融合，双联装全屏死亡激光不间断精准切割！',
    maxLevel: 1,
    baseCooldown: 1500,
    baseDamage: 140,
    isSuper: true,
    requiredWeapon: 'laser_drone',
    requiredPassive: 'fire_rate',
  },
};

export function getAvailableEvolutionUpgrades(
  player: Player,
  upgradeLevels: Record<string, number>
): UpgradeOption[] {
  const evos: UpgradeOption[] = [];

  // 1. Deathstar Ray
  const hasCritCore = (upgradeLevels['critical_core'] || 0) >= 1;
  const isMultiShotMax = player.bulletCount >= 4 || (upgradeLevels['multi_shot'] || 0) >= 3;
  if (hasCritCore && isMultiShotMax && !player.weapons.has('deathstar_ray')) {
    evos.push({
      id: 'evo_deathstar_ray',
      key: 'deathstar_ray',
      name: 'Deathstar Ray',
      nameZh: '死星裂变阵',
      desc: '【终极超武融合】脉冲机炮与质能暴击发生超维共振，子弹化身全屏贯穿死星能量光幕！',
      rarity: 'evolved',
      level: 1,
      maxLevel: 1,
      isWeapon: true,
      isEvolved: true,
      statDiffText: () => '★ 解锁终极死星贯穿能量幕',
      apply: (p) => {
        p.weapons.set('deathstar_ray', {
          id: 'deathstar_ray',
          nameZh: '死星裂变阵',
          level: 1,
          maxLevel: 1,
          isEvolved: true,
          lastFireTime: 0,
          cooldown: 1200,
          damage: Math.round(p.bulletDamage * 2.2),
        });
      },
    });
  }

  // 2. Orbital Railgun
  const hasSpeed = (upgradeLevels['speed'] || 0) >= 2;
  const hasSatellites = player.orbitSatellites >= 2;
  if (hasSpeed && hasSatellites && !player.weapons.has('orbital_railgun')) {
    evos.push({
      id: 'evo_orbital_railgun',
      key: 'orbital_railgun',
      name: 'Orbital Railgun',
      nameZh: '奇点轨道炮',
      desc: '【终极超武融合】共振棱镜与极速推进融合，棱镜转速翻倍并在转动中向外高速散射等离子飞刺！',
      rarity: 'evolved',
      level: 1,
      maxLevel: 1,
      isWeapon: true,
      isEvolved: true,
      statDiffText: () => '★ 棱镜转速翻倍 + 自动向外抛射光刺',
      apply: (p) => {
        p.weapons.set('orbital_railgun', {
          id: 'orbital_railgun',
          nameZh: '奇点轨道炮',
          level: 1,
          maxLevel: 1,
          isEvolved: true,
          lastFireTime: 0,
          cooldown: 800,
          damage: Math.round(p.bulletDamage * 1.5),
        });
      },
    });
  }

  // 3. Event Horizon
  const hasMagnet = (upgradeLevels['magnet'] || 0) >= 3;
  const hasShield = (upgradeLevels['shield'] || 0) >= 2;
  if (hasMagnet && hasShield && !player.weapons.has('event_horizon')) {
    evos.push({
      id: 'evo_event_horizon',
      key: 'event_horizon',
      name: 'Event Horizon',
      nameZh: '坍缩事件视界',
      desc: '【终极超武融合】引力磁场与度规护盾引发引力坍缩，在机体周身生成常驻暗能视界，靠近即蒸发！',
      rarity: 'evolved',
      level: 1,
      maxLevel: 1,
      isWeapon: true,
      isEvolved: true,
      statDiffText: () => '★ 解锁常驻近身暗能湮灭力场',
      apply: (p) => {
        p.weapons.set('event_horizon', {
          id: 'event_horizon',
          nameZh: '坍缩事件视界',
          level: 1,
          maxLevel: 1,
          isEvolved: true,
          lastFireTime: 0,
          cooldown: 300,
          damage: Math.round(p.bulletDamage * 1.2),
        });
      },
    });
  }

  // 4. Dimensional Obliterator
  const droneWp = player.weapons.get('laser_drone');
  const hasFireRate = (upgradeLevels['fire_rate'] || 0) >= 3;
  if (droneWp && droneWp.level >= 3 && hasFireRate && !player.weapons.has('dimensional_laser')) {
    evos.push({
      id: 'evo_dimensional_laser',
      key: 'dimensional_laser',
      name: 'Dimensional Obliterator',
      nameZh: '超维毁灭阵列',
      desc: '【终极超武融合】浮游炮与极速超载交融，双联装全屏死亡激光不间断追踪扫荡！',
      rarity: 'evolved',
      level: 1,
      maxLevel: 1,
      isWeapon: true,
      isEvolved: true,
      statDiffText: () => '★ 升级为双联装全屏死亡追踪光束',
      apply: (p) => {
        p.weapons.set('dimensional_laser', {
          id: 'dimensional_laser',
          nameZh: '超维毁灭阵列',
          level: 1,
          maxLevel: 1,
          isEvolved: true,
          lastFireTime: 0,
          cooldown: 1400,
          damage: Math.round(p.bulletDamage * 2.5),
        });
      },
    });
  }

  return evos;
}
