import { Player } from '../core/types';

/**
 * Super-Weapon Cross-Skill Resonance Synergies (超阶神兵专属联动)
 *
 * Pure rule table & query helpers shared by the Engine, UpgradeModal, and PauseModal.
 * Zero side effects, testable headless.
 */

export type ResonanceSynergyId =
  | 'meteor_ion'
  | 'iaijutsu_mirage'
  | 'gaster_babylon'
  | 'aegis_arsenal'
  | 'rift_judgment';

export interface ResonanceSynergyDef {
  id: ResonanceSynergyId;
  nameZh: string;
  tag: string;
  /** Every listed key on the left side requires at least one key from `pairB` to activate. */
  pairA: string[];
  pairB: string[];
  summary: string;
  accentColor: string;
}

export const RESONANCE_RIFT_BONUS_MULT = 1.45;
export const GASTER_BABYLON_RING_SWORDS = 8;
export const AEGIS_ARSENAL_RING_COUNT = 8;

export const RESONANCE_SYNERGIES: ResonanceSynergyDef[] = [
  {
    id: 'meteor_ion',
    nameZh: '星陨聚变',
    tag: 'METEOR × ION',
    pairA: ['singularity_meteor'],
    pairB: ['divine_ion_beam'],
    summary: '坍缩陨星砸落瞬间在落点中心垂直劈下神圣离子巨柱，双场共振电离全坑。',
    accentColor: '#c084fc',
  },
  {
    id: 'iaijutsu_mirage',
    nameZh: '断空引华',
    tag: 'IAIJUTSU × MIRAGE',
    pairA: ['void_iaijutsu'],
    pairB: ['mirage_blades'],
    summary: '次元居合空间裂隙引爆时，沿斩击轨迹对受创敌群直接绽放爆裂几何莲华。',
    accentColor: '#f472b6',
  },
  {
    id: 'gaster_babylon',
    nameZh: '王庭处刑',
    tag: 'GASTER × BABYLON',
    pairA: ['gaster_blasters'],
    pairB: ['gate_of_babylon'],
    summary: '龙骨炮环锁定目标时，炮环圆周同步洞开黄金裂门向圆心倾泻 8 柄贯穿金剑。',
    accentColor: '#fbbf24',
  },
  {
    id: 'aegis_arsenal',
    nameZh: '圣域万象',
    tag: 'AEGIS × BLADES',
    pairA: ['prism_aegis'],
    pairB: ['gate_of_babylon', 'mirage_blades'],
    summary: '棱镜圣域爆发排斥震波时，向 360° 全向发射贯穿黄金剑阵或极寒幻影飞刃。',
    accentColor: '#38bdf8',
  },
  {
    id: 'rift_judgment',
    nameZh: '裂界锁灭',
    tag: 'CONTROL × BEAM',
    pairA: ['gaster_blasters', 'divine_ion_beam'],
    pairB: ['void_iaijutsu', 'singularity_meteor'],
    summary: '龙骨光束与天罚光柱命中处于陨星引力或居合硬直中的敌人时，触发 +45% 碎裂暴击。',
    accentColor: '#a855f7',
  },
];

export type SuperWeaponPlayerState = Pick<
  Player,
  | 'gasterLevel'
  | 'voidIaijutsuLevel'
  | 'babylonLevel'
  | 'meteorLevel'
  | 'ionLevel'
  | 'aegisLevel'
  | 'mirageLevel'
>;

export function ownsSuperWeapon(player: SuperWeaponPlayerState, key: string): boolean {
  switch (key) {
    case 'gaster_blasters':
      return (player.gasterLevel || 0) > 0;
    case 'void_iaijutsu':
      return (player.voidIaijutsuLevel || 0) > 0;
    case 'gate_of_babylon':
      return (player.babylonLevel || 0) > 0;
    case 'singularity_meteor':
      return (player.meteorLevel || 0) > 0;
    case 'divine_ion_beam':
      return (player.ionLevel || 0) > 0;
    case 'prism_aegis':
      return (player.aegisLevel || 0) > 0;
    case 'mirage_blades':
      return (player.mirageLevel || 0) > 0;
    default:
      return false;
  }
}

export function hasResonanceSynergy(
  player: SuperWeaponPlayerState,
  synergyId: ResonanceSynergyId
): boolean {
  const def = RESONANCE_SYNERGIES.find((s) => s.id === synergyId);
  if (!def) return false;
  const hasA = def.pairA.some((k) => ownsSuperWeapon(player, k));
  const hasB = def.pairB.some((k) => ownsSuperWeapon(player, k));
  return hasA && hasB;
}

export function getActiveResonanceSynergies(player: SuperWeaponPlayerState): ResonanceSynergyDef[] {
  return RESONANCE_SYNERGIES.filter((s) => hasResonanceSynergy(player, s.id));
}

export interface CardSynergyHint {
  synergy: ResonanceSynergyDef;
  willComplete: boolean;
  alreadyActive: boolean;
}

/**
 * Returns synergy relationships a candidate upgrade card participates in:
 * - `willComplete`: picking this card unlocks the synergy immediately because the partner is owned
 * - `alreadyActive`: both halves are already owned
 */
export function getSynergyHintsForCard(
  player: SuperWeaponPlayerState,
  cardKey: string
): CardSynergyHint[] {
  const hints: CardSynergyHint[] = [];
  for (const syn of RESONANCE_SYNERGIES) {
    const inA = syn.pairA.includes(cardKey);
    const inB = syn.pairB.includes(cardKey);
    if (!inA && !inB) continue;

    const alreadyActive = hasResonanceSynergy(player, syn.id);
    const otherSideOwned = inA
      ? syn.pairB.some((k) => ownsSuperWeapon(player, k))
      : syn.pairA.some((k) => ownsSuperWeapon(player, k));

    hints.push({
      synergy: syn,
      willComplete: !alreadyActive && otherSideOwned,
      alreadyActive,
    });
  }
  return hints;
}

export interface SynergyLedgerItem {
  synergy: ResonanceSynergyDef;
  active: boolean;
  hasHalf: boolean;
}

/** Full status list for PauseModal ledger. */
export function getSynergyLedger(player: SuperWeaponPlayerState): SynergyLedgerItem[] {
  return RESONANCE_SYNERGIES.map((synergy) => {
    const hasA = synergy.pairA.some((k) => ownsSuperWeapon(player, k));
    const hasB = synergy.pairB.some((k) => ownsSuperWeapon(player, k));
    return {
      synergy,
      active: hasA && hasB,
      hasHalf: hasA || hasB,
    };
  });
}

/** Returns true if an enemy is under spatial stun or inside any active meteor gravity crater/pull field. */
export function isEnemyUnderSpatialControl(
  enemy: { x: number; y: number; stunTimer?: number },
  meteors: ReadonlyArray<{ targetX: number; targetY: number; pullRadius: number }>
): boolean {
  if ((enemy.stunTimer ?? 0) > 0) return true;
  for (const m of meteors) {
    const d2 = (enemy.x - m.targetX) ** 2 + (enemy.y - m.targetY) ** 2;
    if (d2 <= m.pullRadius * m.pullRadius) return true;
  }
  return false;
}
