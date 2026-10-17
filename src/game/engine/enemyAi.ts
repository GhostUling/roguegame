import { Enemy } from '../core/types';

/**
 * The swarm's three tactical brains: sniper, charger and boss.
 *
 * Only the brain lives here. Which wing an enemy chases, the soft separation
 * between bodies, contact damage and the kill/drop path all stay in the engine
 * loop, so this file can be driven in a unit test with a bare Enemy.
 *
 * It reports what it would fire and which cue it wants instead of pushing
 * projectiles or playing audio; the engine turns those into side effects.
 */

export type EnemyAiCue =
  | 'sniper-aim'
  | 'sniper-lock'
  | 'laser-shot'
  | 'charger-dash'
  | 'boss-burst';

/** Offset from the enemy to the wing it is chasing. */
export interface EnemyAim {
  dx: number;
  dy: number;
  dist: number;
}

/** An enemy round, described relative to the enemy that fires it. */
export interface EnemyBolt {
  angle: number;
  speed: number;
  damage: number;
  radius: number;
  color: string;
  maxLife: number;
}

export interface EnemyAiStep {
  cues: EnemyAiCue[];
  bolt?: EnemyBolt;
  barrage?: EnemyBolt[];
}

// Sniper: hold a 200–300px band, track for 0.7s, then lock the line for 0.5s.
const SNIPER_RETREAT_RANGE = 200;
const SNIPER_APPROACH_RANGE = 300;
const SNIPER_FIRE_RANGE = 380;
const SNIPER_TRACK_SECONDS = 0.7;
const SNIPER_LOCK_SECONDS = 1.2;
const SNIPER_COOLDOWN_SECONDS = 3.2;
const SNIPER_HOVER_DRAG = 0.9;
const SNIPER_BOLT_SPEED = 11;
const SNIPER_BOLT_RADIUS = 4.5;
const SNIPER_BOLT_LIFE = 2.0;
const SNIPER_BOLT_COLOR = '#38bdf8';

// Charger: close to 240px, wind up for 0.8s, then dash for 0.5s at 3.8x.
const CHARGER_CHARGE_RANGE = 240;
const CHARGER_WINDUP_SECONDS = 0.8;
const CHARGER_DASH_SECONDS = 0.5;
const CHARGER_DASH_MULTIPLIER = 3.8;
const CHARGER_COOLDOWN_SECONDS = 0.9;
const CHARGER_ATTACK_COOLDOWN_SECONDS = 2.4;
const CHARGER_COOLDOWN_DRAG = 0.8;

// Boss: a 16-round ring every 4.2s, independent of contact damage.
const BOSS_RING_COOLDOWN_SECONDS = 4.2;
const BOSS_RING_COUNT = 16;
const BOSS_RING_SPEED = 5.5;
const BOSS_RING_DAMAGE = 18;
const BOSS_RING_RADIUS = 5;
const BOSS_RING_LIFE = 3.5;
const BOSS_RING_COLOR = '#ff0077';

/**
 * Advances one enemy's brain by `dt` and writes the velocity it wants. Every
 * other type just chases. `slow` folds every slow/stun source into one number.
 */
export function stepEnemyAi(e: Enemy, aim: EnemyAim, dt: number, slow: number): EnemyAiStep {
  const { dx, dy, dist } = aim;
  const step: EnemyAiStep = { cues: [] };

  if (e.type === 'sniper') {
    if (dist < SNIPER_RETREAT_RANGE) {
      e.vx = -(dx / dist) * e.speed * slow;
      e.vy = -(dy / dist) * e.speed * slow;
    } else if (dist > SNIPER_APPROACH_RANGE) {
      e.vx = (dx / dist) * e.speed * slow;
      e.vy = (dy / dist) * e.speed * slow;
    } else {
      e.vx *= SNIPER_HOVER_DRAG;
      e.vy *= SNIPER_HOVER_DRAG;
    }

    if (e.state === 'idle' && e.attackCooldown && e.attackCooldown <= 0 && dist < SNIPER_FIRE_RANGE) {
      e.state = 'charging';
      e.stateTimer = 0;
      e.aimLocked = false;
      step.cues.push('sniper-aim');
    } else if (e.state === 'charging') {
      e.stateTimer = (e.stateTimer || 0) + dt;

      // Phase 1 tracks the player; phase 2 freezes the line and gives the
      // player the remaining 0.5s to step off it.
      if (e.stateTimer < SNIPER_TRACK_SECONDS) {
        e.aimAngle = Math.atan2(dy, dx);
        e.aimLocked = false;
      } else if (!e.aimLocked) {
        e.aimLocked = true;
        step.cues.push('sniper-lock');
      }

      if (e.stateTimer >= SNIPER_LOCK_SECONDS) {
        e.state = 'idle';
        e.stateTimer = 0;
        e.aimLocked = false;
        e.attackCooldown = SNIPER_COOLDOWN_SECONDS;
        step.cues.push('laser-shot');
        step.bolt = {
          angle: e.aimAngle ?? Math.atan2(dy, dx),
          speed: SNIPER_BOLT_SPEED,
          damage: e.damage,
          radius: SNIPER_BOLT_RADIUS,
          color: SNIPER_BOLT_COLOR,
          maxLife: SNIPER_BOLT_LIFE,
        };
      }
    }

    return step;
  }

  if (e.type === 'charger') {
    if (e.state === 'idle') {
      e.vx = (dx / dist) * e.speed * slow;
      e.vy = (dy / dist) * e.speed * slow;

      if (dist < CHARGER_CHARGE_RANGE && e.attackCooldown && e.attackCooldown <= 0) {
        e.state = 'charging';
        e.stateTimer = 0;
        e.chargeDir = { x: dx / dist, y: dy / dist };
        e.vx = 0;
        e.vy = 0;
      }
    } else if (e.state === 'charging') {
      e.stateTimer = (e.stateTimer || 0) + dt;
      if (e.stateTimer >= CHARGER_WINDUP_SECONDS) {
        e.state = 'firing';
        e.stateTimer = 0;
        step.cues.push('charger-dash');
      }
    } else if (e.state === 'firing') {
      e.stateTimer = (e.stateTimer || 0) + dt;
      const dashSpeed = e.speed * CHARGER_DASH_MULTIPLIER * slow;
      e.vx = (e.chargeDir?.x || 0) * dashSpeed;
      e.vy = (e.chargeDir?.y || 0) * dashSpeed;

      if (e.stateTimer >= CHARGER_DASH_SECONDS) {
        e.state = 'cooldown';
        e.stateTimer = 0;
        e.vx = 0;
        e.vy = 0;
      }
    } else if (e.state === 'cooldown') {
      e.stateTimer = (e.stateTimer || 0) + dt;
      e.vx *= CHARGER_COOLDOWN_DRAG;
      e.vy *= CHARGER_COOLDOWN_DRAG;
      if (e.stateTimer >= CHARGER_COOLDOWN_SECONDS) {
        e.state = 'idle';
        e.attackCooldown = CHARGER_ATTACK_COOLDOWN_SECONDS;
      }
    }

    return step;
  }

  if (e.type === 'boss') {
    const angle = Math.atan2(dy, dx);
    e.vx = Math.cos(angle) * e.speed * slow;
    e.vy = Math.sin(angle) * e.speed * slow;

    if (e.attackCooldown && e.attackCooldown <= 0) {
      e.attackCooldown = BOSS_RING_COOLDOWN_SECONDS;
      step.cues.push('boss-burst');
      step.barrage = [];
      for (let b = 0; b < BOSS_RING_COUNT; b++) {
        step.barrage.push({
          angle: (b * Math.PI * 2) / BOSS_RING_COUNT + e.rotation,
          speed: BOSS_RING_SPEED,
          damage: BOSS_RING_DAMAGE,
          radius: BOSS_RING_RADIUS,
          color: BOSS_RING_COLOR,
          maxLife: BOSS_RING_LIFE,
        });
      }
    }

    return step;
  }

  const angle = Math.atan2(dy, dx);
  e.vx = Math.cos(angle) * e.speed * slow;
  e.vy = Math.sin(angle) * e.speed * slow;
  return step;
}
