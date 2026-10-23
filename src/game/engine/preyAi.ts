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
const SKILL_ENGULFED = 6;
/** Seconds between flips of the strafe direction. */
const STRAFE_PERIOD = 1.4;
/** How much of the order is sideways drift, so it never runs straight at you. */
const STRAFE_SHARE = 0.45;

/** 16 directional sectors (every 22.5°) evaluate escape corridors through dense swarms. */
const ESCAPE_SECTORS = 16;

export interface EscapeGap {
  dirX: number;
  dirY: number;
}

export interface PreyHostile {
  x: number;
  y: number;
  hp?: number;
  maxHp?: number;
  speed?: number;
}

/**
 * Priority score for the prey to pick which hostile to focus down first.
 * Distance bands establish urgency (immediate face-to-face threats take precedence),
 * while within each distance band, higher speed and lower HP yield a significantly
 * higher priority so the prey eliminates fast, fragile threats (e.g. speeders,
 * wounded pursuers) before heavier, slower targets.
 */
export function preyHostilePriority(hp: number, speed: number, dist: number): number {
  const safeHp = Math.max(10, hp);
  const safeSpeed = Math.max(0.5, speed);
  const tierMult = dist <= 160 ? 1000 : dist <= 350 ? 25 : 1;
  const intraScore = (safeSpeed * 100) / (Math.pow(safeHp, 0.5) * Math.max(40, dist));
  return tierMult * intraScore;
}

/**
 * Finds the clearest escape corridor through hostiles and away from walls.
 * Uses a directional sector histogram (VFH) to evaluate the density of nearby
 * hostiles, boundary walls, and open clear ground across 16 headings, picking
 * the clearest gap.
 */
export function findEscapeDirection(
  x: number,
  y: number,
  width: number,
  height: number,
  hostiles: PreyHostile[],
  crowdCentreX?: number,
  crowdCentreY?: number
): EscapeGap {
  const bins = new Float32Array(ESCAPE_SECTORS);
  const sectorAngle = (Math.PI * 2) / ESCAPE_SECTORS;

  // 1. Hostile pressure on each sector
  for (const h of hostiles) {
    const dx = h.x - x;
    const dy = h.y - y;
    const distSq = dx * dx + dy * dy;
    if (distSq > 0 && distSq < PRESSURE_RADIUS * PRESSURE_RADIUS) {
      const dist = Math.sqrt(distSq);
      const angle = Math.atan2(dy, dx);
      const normAngle = angle < 0 ? angle + Math.PI * 2 : angle;
      const bin = Math.floor(normAngle / sectorAngle) % ESCAPE_SECTORS;

      // Closer hostiles cast a much wider and heavier shadow
      const weight = ((PRESSURE_RADIUS - dist) / PRESSURE_RADIUS) ** 2 * 3;
      bins[bin] += weight;
      const prev = (bin - 1 + ESCAPE_SECTORS) % ESCAPE_SECTORS;
      const next = (bin + 1) % ESCAPE_SECTORS;
      bins[prev] += weight * 0.45;
      bins[next] += weight * 0.45;
    }
  }

  // 2. Crowd bias: if a global swarm centre is provided, add weight in that direction
  if (crowdCentreX !== undefined && crowdCentreY !== undefined) {
    const cdx = crowdCentreX - x;
    const cdy = crowdCentreY - y;
    const cDist = Math.hypot(cdx, cdy);
    if (cDist > 1 && cDist < PRESSURE_RADIUS * 2) {
      const cAngle = Math.atan2(cdy, cdx);
      const normAngle = cAngle < 0 ? cAngle + Math.PI * 2 : cAngle;
      const bin = Math.floor(normAngle / sectorAngle) % ESCAPE_SECTORS;
      bins[bin] += 1.0;
      bins[(bin - 1 + ESCAPE_SECTORS) % ESCAPE_SECTORS] += 0.5;
      bins[(bin + 1) % ESCAPE_SECTORS] += 0.5;
    }
  }

  // 3. Open ground attraction & wall penalties
  const PROBE_DIST = 220;
  for (let b = 0; b < ESCAPE_SECTORS; b++) {
    const a = (b + 0.5) * sectorAngle;
    const px = x + Math.cos(a) * PROBE_DIST;
    const py = y + Math.sin(a) * PROBE_DIST;

    // Boundary penalty
    let wallPenalty = 0;
    if (px < EDGE_MARGIN) wallPenalty += (EDGE_MARGIN - px) / EDGE_MARGIN;
    if (px > width - EDGE_MARGIN) wallPenalty += (px - (width - EDGE_MARGIN)) / EDGE_MARGIN;
    if (py < EDGE_MARGIN) wallPenalty += (EDGE_MARGIN - py) / EDGE_MARGIN;
    if (py > height - EDGE_MARGIN) wallPenalty += (py - (height - EDGE_MARGIN)) / EDGE_MARGIN;

    if (wallPenalty > 0) {
      bins[b] += wallPenalty * 5.0;
    } else {
      // Inside bounds: check how empty this prospective ground is
      let mobsNearProbe = 0;
      for (const h of hostiles) {
        if ((h.x - px) ** 2 + (h.y - py) ** 2 < 180 * 180) mobsNearProbe++;
      }
      if (mobsNearProbe === 0) {
        // Completely clear open ground: strong positive draw
        bins[b] -= 3.0;
      } else if (mobsNearProbe === 1) {
        bins[b] -= 1.0;
      } else if (mobsNearProbe >= 3) {
        bins[b] += mobsNearProbe * 0.7;
      }
    }
  }

  // 4. Find the sector with lowest density/threat (most open ground)
  let bestBin = 0;
  let minThreat = bins[0];
  for (let b = 1; b < ESCAPE_SECTORS; b++) {
    if (bins[b] < minThreat) {
      minThreat = bins[b];
      bestBin = b;
    }
  }

  const bestAngle = (bestBin + 0.5) * sectorAngle;
  return {
    dirX: Math.cos(bestAngle),
    dirY: Math.sin(bestAngle),
  };
}

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
  /**
   * Optional local hostiles list within awareness range.
   * When provided, the prey uses directional gap-finding to escape through the
   * clearest corridor instead of oscillating on single closest hostiles.
   */
  nearbyHostiles?: PreyHostile[];
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
    // 1. Survival.
    if (view.nearbyHostiles && view.nearbyHostiles.length > 0) {
      // Swarm multi-body avoidance: find the gap corridor through the pack
      const escape = findEscapeDirection(
        view.x,
        view.y,
        view.width,
        view.height,
        view.nearbyHostiles,
        view.swarmCentreX,
        view.swarmCentreY
      );
      dirX = escape.dirX;
      dirY = escape.dirY;
    } else {
      // Single threat fallback: back off from the nearest body, avoiding the crowd
      const awayX = -threatDx / threatDist;
      const awayY = -threatDy / threatDist;
      const crowdWeight = crowdDist < PRESSURE_RADIUS * 2 ? 0.6 : 0.2;
      dirX = awayX - (crowdDx / crowdDist) * crowdWeight;
      dirY = awayY - (crowdDy / crowdDist) * crowdWeight;
      const len = Math.hypot(dirX, dirY) || 1;
      dirX /= len;
      dirY /= len;
    }
    drive = 1;
  } else if (!wounded && threatDist > ENGAGE_RANGE) {
    // 2. Safe and healthy and nothing in reach: close the gap, so the fight ends.
    dirX = threatDx / threatDist;
    dirY = threatDy / threatDist;
    drive = 0.85;
  } else {
    // 3. Hold the ring: neither charge in nor run away, just keep the distance.
    // Evaluate clockwise vs counter-clockwise tangent: pick the direction leading to open ground!
    const tan1X = -threatDy / threatDist;
    const tan1Y = threatDx / threatDist;
    const tan2X = threatDy / threatDist;
    const tan2Y = -threatDx / threatDist;

    let chosenTanX = tan1X;
    let chosenTanY = tan1Y;

    if (view.nearbyHostiles && view.nearbyHostiles.length > 0) {
      // Probe 140px in each tangent direction to see which side has fewer hostiles
      const p1x = view.x + tan1X * 140;
      const p1y = view.y + tan1Y * 140;
      const p2x = view.x + tan2X * 140;
      const p2y = view.y + tan2Y * 140;

      let score1 = 0;
      let score2 = 0;
      for (const h of view.nearbyHostiles) {
        if ((h.x - p1x) ** 2 + (h.y - p1y) ** 2 < 140 * 140) score1++;
        if ((h.x - p2x) ** 2 + (h.y - p2y) ** 2 < 140 * 140) score2++;
      }
      // Wall penalty for probes
      if (p1x < EDGE_MARGIN || p1x > view.width - EDGE_MARGIN || p1y < EDGE_MARGIN || p1y > view.height - EDGE_MARGIN) score1 += 4;
      if (p2x < EDGE_MARGIN || p2x > view.width - EDGE_MARGIN || p2y < EDGE_MARGIN || p2y > view.height - EDGE_MARGIN) score2 += 4;

      if (score2 < score1) {
        chosenTanX = tan2X;
        chosenTanY = tan2Y;
      }
    }

    // Blend tangent with open ground pull (away from crowd centre)
    const openPullWeight = 0.25;
    dirX = chosenTanX - (crowdDx / crowdDist) * openPullWeight;
    dirY = chosenTanY - (crowdDy / crowdDist) * openPullWeight;
    const len = Math.hypot(dirX, dirY) || 1;
    dirX /= len;
    dirY /= len;
    drive = 0.8;
  }

  // Circle: the sideways component flips on a timer, halved once wounded.
  let strafeTimer = view.strafeTimer + dt;
  let strafeSign = view.strafeSign || 1;
  if (strafeTimer >= STRAFE_PERIOD) {
    strafeTimer -= STRAFE_PERIOD;
    strafeSign = -strafeSign;
  }
  // When swarmed and actively escaping, reduce strafe wobble so it commits to the gap corridor
  const strafeDamp = (tooClose || hurtAndCrowded) && view.pressure >= 3 ? 0.2 : 1;
  const strafe = strafeSign * (wounded ? STRAFE_SHARE * 0.5 : STRAFE_SHARE) * strafeDamp;

  let vx = (dirX - dirY * strafe) * speed * drive;
  let vy = (dirY + dirX * strafe) * speed * drive;

  // Never trade the corner of the arena for anything.
  // Smoothly deflect inward and slide along walls instead of stalling.
  const inwardX = view.x < EDGE_MARGIN ? 1 : view.x > view.width - EDGE_MARGIN ? -1 : 0;
  const inwardY = view.y < EDGE_MARGIN ? 1 : view.y > view.height - EDGE_MARGIN ? -1 : 0;
  if (inwardX !== 0 || inwardY !== 0) {
    const push = speed * 1.2;
    if (inwardX !== 0 && inwardY === 0) {
      // Near vertical wall: stop penetrating the wall and redirect into vertical slide
      const blockedX = (inwardX > 0 && vx < 0) ? -vx : (inwardX < 0 && vx > 0) ? vx : 0;
      vx = vx * 0.35 + inwardX * push;
      const slideDir = view.threatY !== null && view.threatY < view.y ? 1 : (dirY >= 0 ? 1 : -1);
      vy += slideDir * (blockedX * 0.85 + speed * 0.5);
    } else if (inwardY !== 0 && inwardX === 0) {
      // Near horizontal wall: stop penetrating the wall and redirect into horizontal slide
      const blockedY = (inwardY > 0 && vy < 0) ? -vy : (inwardY < 0 && vy > 0) ? vy : 0;
      vy = vy * 0.35 + inwardY * push;
      const slideDir = view.threatX !== null && view.threatX < view.x ? 1 : (dirX >= 0 ? 1 : -1);
      vx += slideDir * (blockedY * 0.85 + speed * 0.5);
    } else {
      // Corner: push both axes inward to escape the dead end
      vx = vx * 0.35 + inwardX * push;
      vy = vy * 0.35 + inwardY * push;
    }

    const curSpeed = Math.hypot(vx, vy);
    const maxSpeed = speed * 1.15;
    if (curSpeed > maxSpeed) {
      vx = (vx / curSpeed) * maxSpeed;
      vy = (vy / curSpeed) * maxSpeed;
    }
  }

  // Its skill is an escape, not a salute: only to break contact or to answer a
  // swarm that is actually on top of it.
  const castSkill =
    view.threatX !== null &&
    (view.pressure >= SKILL_ENGULFED || (wounded && threatDist < CLOSE_QUARTERS * 2));

  return { vx, vy, castSkill, strafeTimer, strafeSign };
}
