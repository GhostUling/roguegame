import { Enemy, EnemyType } from './types';
import { ENEMY_TYPES, enemyHpFor, unlockedEnemyTypes } from './enemyTypes';

/**
 * The forms you wear in Predator, and what each one can do.
 *
 * A form *is* the monster: HP, speed and contact damage all come from
 * `ENEMY_TYPES`, so the thing you pilot and the thing your soldiers are made of
 * never drift apart. This file only holds the pilot-side multipliers and the
 * ult spec — no engine state, no constants duplicated in the loop.
 */

/**
 * You are one of the swarm: a pilot has exactly the HP a soldier of the same
 * type has at this moment, on the same growth curve. 1 keeps that parity
 * literal — squishy is the point, and morphing is free.
 */
export const PILOT_HP_SCALE = 1;

/** Monster speeds are tuned for a swarm, not for one steered unit. */
export const PILOT_SPEED_FLOOR = 3.2;
export const PILOT_SPEED_CEIL = 6;

// Ult: 扑咬突进 — a short lunge that lands one heavy contact.
export const ULT_LUNGE_SHARE = 1.6;
export const ULT_LUNGE_DISTANCE = 180;
export const ULT_LUNGE_SECONDS = 0.18;

// Ult: 相位穿影 — ignore collisions for a beat.
export const ULT_PHASE_SECONDS = 0.25;

// Ult: 震地 — shove everything nearby off and hold it.
export const ULT_SLAM_RADIUS = 120;
export const ULT_SLAM_STUN = 0.4;
export const ULT_SLAM_SHOVE = 60;

// Ult: 蓄力锁线 — the sniper's own timeline, reused verbatim.
export const ULT_LOCK_TRACK = 0.7;
export const ULT_LOCK_HOLD = 0.5;
export const ULT_LOCK_SHARE = 2.4;
export const ULT_LOCK_SPEED = 11;

// Ult: 三段冲锋 — the charger's dash, on a button.
export const ULT_CHARGE_MULT = 3.8;
export const ULT_CHARGE_SECONDS = 0.5;

// Ult: 裂解 — spit out soldiers on the spot.
export const ULT_BROOD_COUNT = 3;

// Ult: 十六环 — the boss' ring, at a share of your own bite.
export const ULT_RING_COUNT = 16;
export const ULT_RING_SPEED = 5.5;
export const ULT_RING_SHARE = 0.6;

/**
 * The boss form only enters the respawn roster this late. Before it, there is
 * nothing to bind; after it, it stays bindable for the rest of the hunt.
 */
export const BOSS_FORM_AFTER = 180;

/** Seconds of invulnerability after taking a new form. */
export const MORPH_INVULN = 0.8;

/** Seconds between your own bites on the prey. */
export const PILOT_BITE_COOLDOWN = 0.5;

export type FormUltKind = 'lunge' | 'phase' | 'slam' | 'lockshot' | 'charge' | 'brood' | 'ring';

export interface FormDef {
  kind: FormUltKind;
  ultNameZh: string;
  ultDesc: string;
  /** Seconds between uses. */
  ultCooldown: number;
}

export const FORMS: Record<EnemyType, FormDef> = {
  chaser: {
    kind: 'lunge',
    ultNameZh: '扑咬突进',
    ultDesc: '向前扑 180px，路径上第一口咬下 1.6 倍接触伤害。',
    ultCooldown: 4,
  },
  speeder: {
    kind: 'phase',
    ultNameZh: '相位穿影',
    ultDesc: '0.25 秒内无视体积，直接从猎物的弹幕与人墙里穿过去。',
    ultCooldown: 3,
  },
  tank: {
    kind: 'slam',
    ultNameZh: '震地',
    ultDesc: '120px 内一切被推开并僵停 0.4 秒。',
    ultCooldown: 6,
  },
  sniper: {
    kind: 'lockshot',
    ultNameZh: '蓄力锁线',
    ultDesc: '0.7 秒跟踪、0.5 秒锁线，沿定死的那条线打出 2.4 倍伤害。',
    ultCooldown: 5,
  },
  charger: {
    kind: 'charge',
    ultNameZh: '锁定冲锋',
    ultDesc: '朝锁定方向以 3.8 倍速撞出去，中途不减速。',
    ultCooldown: 6,
  },
  hive: {
    kind: 'brood',
    ultNameZh: '裂解',
    ultDesc: '原地裂出 3 只同族士兵，立刻加入围咬。',
    ultCooldown: 8,
  },
  boss: {
    kind: 'ring',
    ultNameZh: '十六环',
    ultDesc: '打出一整圈 16 发弹幕，单发为你接触伤害的六成。',
    ultCooldown: 7,
  },
};

export function formOf(type: EnemyType): FormDef {
  return FORMS[type];
}

/** HP of a freshly worn form, on the same growth curve the swarm uses. */
export function pilotHpFor(type: EnemyType, elapsed: number, growthScale = 1): number {
  return Math.round(enemyHpFor(ENEMY_TYPES[type], elapsed, growthScale) * PILOT_HP_SCALE);
}

/** Movement speed, clamped: monsters crawl, and a slow tank is unfun to drive. */
export function pilotSpeedFor(type: EnemyType, speedScale: number): number {
  const raw = ENEMY_TYPES[type].speed * speedScale;
  return Math.min(PILOT_SPEED_CEIL, Math.max(PILOT_SPEED_FLOOR, raw));
}

/** Contact damage per bite. */
export function pilotContactFor(type: EnemyType, contactScale: number): number {
  return Math.max(1, Math.round(ENEMY_TYPES[type].damage * contactScale));
}

export interface PilotCreate {
  x: number;
  y: number;
  elapsed: number;
  speedScale: number;
  contactScale: number;
  growthScale?: number;
}

/** A fresh pilot: form stats resolved from the tables, no engine state read. */
export function createPilot(type: EnemyType, spec: PilotCreate) {
  const def = ENEMY_TYPES[type];
  const hp = pilotHpFor(type, spec.elapsed, spec.growthScale ?? 1);
  return {
    form: type,
    x: spec.x,
    y: spec.y,
    vx: 0,
    vy: 0,
    radius: def.radius,
    hp,
    maxHp: hp,
    speed: pilotSpeedFor(type, spec.speedScale),
    contactDamage: pilotContactFor(type, spec.contactScale),
    invulnTimer: MORPH_INVULN,
    ultTimer: 0,
    phaseTimer: 0,
    dashTimer: 0,
    dashDirX: 0,
    dashDirY: 0,
    aimAngle: 0,
    aimLocked: false,
    lockTimer: 0,
    angle: 0,
    rotation: 0,
    rotSpeed: (def.sides % 2 === 0 ? 1 : -1) * 1.2,
  };
}

/**
 * Forms you may bind to a respawn slot: whatever the wave table has unlocked by
 * now, plus the boss form once the hunt is late enough to be worth it.
 */
export function bindableForms(elapsed: number): EnemyType[] {
  const forms: EnemyType[] = unlockedEnemyTypes(elapsed).slice();
  if (elapsed >= BOSS_FORM_AFTER) forms.push('boss');
  return forms;
}

/**
 * Which form you wake up as the moment your hull breaks. Death is not a screen:
 * the engine rolls straight from the three slots you chose in the corner.
 *
 * It never hands back the form you just lost when another slot is available —
 * that is the whole point of binding several. An empty slot list (you never
 * opened the panel) falls back to a random unlocked form.
 */
export function pickRespawnForm(
  queue: EnemyType[],
  lost: EnemyType,
  elapsed: number,
  roll: () => number
): EnemyType {
  const bound = queue.filter((form) => form !== lost);
  if (bound.length > 0) return bound[Math.floor(roll() * bound.length)];
  if (queue.includes(lost)) return lost;

  const roster = bindableForms(elapsed).filter((form) => form !== lost);
  if (roster.length === 0) return lost;
  return roster[Math.floor(roll() * roster.length)];
}

/** Does this soldier bite the prey right now? One shared rule for the loop. */
export function soldierCanBite(e: Pick<Enemy, 'contactCooldown'>): boolean {
  return (e.contactCooldown ?? 0) <= 0;
}
