/**
 * What the prey wants this frame.
 *
 * It does **not** know you are the pilot. It reads one thing: the closest hostile
 * body around its hull — a soldier or you, whichever happens to be nearer — plus
 * how many of them are leaning on it. So diving in is what gets you shot at, and
 * hanging back keeps you anonymous.
 *
 * Survival is the first directive, which orders the policy: break contact when
 * something is on it or its hull is low, refuse to be cornered, otherwise hold a
 * ring where it can still shoot, and only push in when there is nobody near and
 * its hull is healthy. Pure — it reads a snapshot and returns an order. Firing,
 * cooldowns and damage stay in the loop.
 */

/** Inside this, something is in its face and the answer is to leave. */
const CLOSE_QUARTERS = 150;
/** How close to a wall before it turns inward. */
const EDGE_MARGIN = 90;
/** Hostiles are counted inside this radius; the engine uses it for the count. */
export const PRESSURE_RADIUS = 220;
/** This many hostiles leaning on it and it breaks contact. */
const FLEE_PRESSURE = 4;
/** Below this hull fraction it never pushes in, and runs from twice as far. */
const WOUNDED_HULL = 0.5;
/** Wounded, it treats this distance as a threat already too close for comfort. */
const WOUNDED_GAP = 320;
/** Healthy and nothing closer than this, so it closes the gap to keep fighting. */
const ENGAGE_RANGE = 460;
/** How many hostiles inside `PRESSURE_RADIUS` make its skill worth popping. */
const SKILL_ENGULFED = 8;
/** Seconds between flips of the strafe direction. */
const STRAFE_PERIOD = 1.4;
/** How much of the order is sideways drift, so it never runs straight at you. */
const STRAFE_SHARE = 0.45;

export interface PreyView {
  x: number;
  y: number;
  /**
   * The nearest hostile body — a soldier or the pilot, the prey is not told
   * which. Null when nothing is on the field at all.
   */
  threatX: number | null;
  threatY: number | null;
  /** Hostiles within `PRESSURE_RADIUS`, itself-centred. */
  pressure: number;
  /** Where the crowd is, so fleeing never means running into it. */
  swarmCentreX: number;
  swarmCentreY: number;
  /** Its own hull, 0…1. The survival driver. */
  hpFrac: number;
  width: number;
  height: number;
  /** Seconds since the last strafe flip, and which way it is leaning. */
  strafeTimer: number;
  strafeSign: number;
}

export interface PreyOrder {
  /** Desired velocity, px/frame — the same units the hull's own movement uses. */
  vx: number;
  vy: number;
  castSkill: boolean;
  strafeTimer: number;
  strafeSign: number;
}

export function stepPreyAi(view: PreyView, speed: number, dt: number): PreyOrder {
  const wounded = view.hpFrac < WOUNDED_HULL;

  const threatDx = view.threatX === null ? 0 : view.threatX - view.x;
  const threatDy = view.threatY === null ? 0 : view.threatY - view.y;
  const threatDist = view.threatX === null ? Infinity : Math.hypot(threatDx, threatDy) || 1;

  const crowdDx = view.swarmCentreX - view.x;
  const crowdDy = view.swarmCentreY - view.y;
  const crowdDist = Math.hypot(crowdDx, crowdDy) || 1;

  const tooClose = threatDist < CLOSE_QUARTERS || view.pressure >= FLEE_PRESSURE;
  const hurtAndCrowded = wounded && threatDist < WOUNDED_GAP;

  let dirX: number;
  let dirY: number;
  let drive: number;

  if (view.threatX === null) {
    // Nobody to fight: hold the middle of the arena, the safest ground there is.
    const toCentreX = view.width / 2 - view.x;
    const toCentreY = view.height / 2 - view.y;
    const centreLen = Math.hypot(toCentreX, toCentreY) || 1;
    dirX = toCentreX / centreLen;
    dirY = toCentreY / centreLen;
    drive = 0.6;
  } else if (tooClose || hurtAndCrowded) {
    // 1. Survival. Back off from the nearest body, and never into the crowd.
    const awayX = -threatDx / threatDist;
    const awayY = -threatDy / threatDist;
    const crowdWeight = crowdDist < PRESSURE_RADIUS * 2 ? 0.6 : 0.2;
    dirX = awayX - (crowdDx / crowdDist) * crowdWeight;
    dirY = awayY - (crowdDy / crowdDist) * crowdWeight;
    const len = Math.hypot(dirX, dirY) || 1;
    dirX /= len;
    dirY /= len;
    drive = 1;
  } else if (!wounded && threatDist > ENGAGE_RANGE) {
    // 2. Safe and healthy and nothing in reach: close the gap, so the fight ends.
    dirX = threatDx / threatDist;
    dirY = threatDy / threatDist;
    drive = 0.85;
  } else {
    // 3. Hold the ring: neither charge in nor run away, just keep the distance.
    dirX = -threatDy / threatDist;
    dirY = threatDx / threatDist;
    drive = 0.8;
  }

  // Circle: the sideways component flips on a timer, halved once wounded.
  let strafeTimer = view.strafeTimer + dt;
  let strafeSign = view.strafeSign || 1;
  if (strafeTimer >= STRAFE_PERIOD) {
    strafeTimer -= STRAFE_PERIOD;
    strafeSign = -strafeSign;
  }
  const strafe = strafeSign * (wounded ? STRAFE_SHARE * 0.5 : STRAFE_SHARE);

  let vx = (dirX - dirY * strafe) * speed * drive;
  let vy = (dirY + dirX * strafe) * speed * drive;

  // Never trade the corner of the arena for anything.
  const inwardX = view.x < EDGE_MARGIN ? 1 : view.x > view.width - EDGE_MARGIN ? -1 : 0;
  const inwardY = view.y < EDGE_MARGIN ? 1 : view.y > view.height - EDGE_MARGIN ? -1 : 0;
  if (inwardX !== 0 || inwardY !== 0) {
    const push = speed * 1.2;
    vx = vx * 0.35 + inwardX * push;
    vy = vy * 0.35 + inwardY * push;
  }

  // Its skill is an escape, not a salute: only to break contact or to answer a
  // swarm that is actually on top of it.
  const castSkill =
    view.threatX !== null &&
    (view.pressure >= SKILL_ENGULFED || (wounded && threatDist < CLOSE_QUARTERS * 2));

  return { vx, vy, castSkill, strafeTimer, strafeSign };
}
