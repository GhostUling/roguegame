import {
  Player,
  Pilot,
  Enemy,
  Projectile,
  EnemyProjectile,
  Gem,
  DebrisParticle,
  FloatingText,
  Shockwave,
  Satellite,
  SingularityVortex,
  Beam,
  MeltCore,
  Turret,
  Clone,
  Ally,
  Lance,
  Rift,
} from '../core/types';
import { drawCharacterShip, getCharacterDef } from '../characters';
import { drawResonanceArc } from './resonanceArc';
import { getTwinPositions, hasPilot } from '../core/pilots';
import { isPaired } from '../core/modes';
import { TURRET_FADE } from '../systems/turrets';
import {
  GRID_CELL,
  GRID_FLASH,
  GRID_WINDUP,
  gridGlowIntensity,
  gridLineFromStart,
  gridLineReveal,
} from '../systems/gridVerdict';
import { FRIENDLY_COLOR, drawFriendlyMarker } from './friendlyMarker';
import { LANCE_LENGTH, RIFT_SPACING, riftBranch } from '../systems/riftLance';
import { ENEMY_TYPES } from '../core/enemyTypes';
import { GasterRing, GASTER_BEAM_LENGTH, GASTER_BEAM_WIDTH, GASTER_WINDUP_SECONDS } from '../systems/gasterBlaster';
import {
  IaijutsuSlash,
  IAIJUTSU_CUT_DURATION,
  IAIJUTSU_SHEATH_PAUSE,
  IAIJUTSU_SHATTER_DURATION,
  calculateIaijutsuPhantomPos,
  generateRiftShards,
} from '../systems/voidIaijutsu';
import { BabylonGate, BabylonSword, BABYLON_SWORD_LENGTH, BABYLON_SWORD_WIDTH, BABYLON_BURST_RADIUS } from '../systems/gateOfBabylon';
import {
  SingularityMeteor,
  METEOR_EXPLOSION_RADIUS,
  METEOR_CRATER_DURATION,
  METEOR_AFTERSHOCK_DELAY,
  generateCraterCracks,
} from '../systems/singularityMeteor';
import { DivineIonStrike, ION_GROUND_RADIUS } from '../systems/divineIonBeam';
import {
  MirageBlade,
  MirageBloom,
  MIRAGE_BLOOM_RADIUS,
  MIRAGE_BLOOM_DURATION,
} from '../systems/mirageBlades';

/**
 * Everything the renderer reads. GameEngine satisfies this shape structurally, so
 * a frame object is passed straight in and no render pass can reach game logic.
 */
export interface RenderState {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  /** Predator: your form, null outside the mode (and while choosing one). */
  pilot: Pilot | null;
  pilotRounds: Projectile[];
  enemyProjectiles: EnemyProjectile[];
  gems: Gem[];
  particles: DebrisParticle[];
  floatingTexts: FloatingText[];
  shockwaves: Shockwave[];
  satellites: Satellite[];
  vortices: SingularityVortex[];
  beams: Beam[];
  meltCores: MeltCore[];
  turrets: Turret[];
  clones: Clone[];
  allies: Ally[];
  lances: Lance[];
  rifts: Rift[];
  gasterRings: GasterRing[];
  iaijutsuSlashes: IaijutsuSlash[];
  babylonGates: BabylonGate[];
  babylonSwords: BabylonSword[];
  meteors: SingularityMeteor[];
  ionStrikes: DivineIonStrike[];
  mirageBlades: MirageBlade[];
  mirageBlooms: MirageBloom[];
  width: number;
  height: number;
  pulseAnimTime: number;
  shakeOffset: { x: number; y: number };
  mouseX: number;
  mouseY: number;
  mouseInside: boolean;
  controlMode: 'keys' | 'mouse';
}

/** Offscreen glow sprites, keyed by colour and crit flag. */
const glowCache: Map<string, HTMLCanvasElement> = new Map();

export function renderScene(ctx: CanvasRenderingContext2D, frame: RenderState) {
  ctx.save();
  ctx.translate(frame.shakeOffset.x, frame.shakeOffset.y);

  // 1. Draw Background
  renderBackground(ctx, frame);

  // 2. Draw Singularity Vortices
  renderVortices(ctx, frame);

  // 3. Draw Shockwaves
  renderShockwaves(ctx, frame);

  // 4. Draw Ground Hazards (melt cores and rift seams, under everything that moves)
  renderMeltCores(ctx, frame);
  renderRifts(ctx, frame);

  // 5. Draw Drop Gems
  renderGems(ctx, frame);

  // 6. Draw Enemies & Telegraphs
  renderEnemies(ctx, frame);

  // 7. Draw Orbit Satellites & Drones
  renderSatellites(ctx, frame);
  renderDrones(ctx, frame);

  // 8. Draw Friendly Units (turrets, clones, allies — one marker for all three)
  renderTurrets(ctx, frame);
  renderClones(ctx, frame);
  renderAllies(ctx, frame);

  // 9. Draw Enemy Projectiles
  renderEnemyProjectiles(ctx, frame);

  // 10. Draw Player Projectiles (high-performance neon beam)
  renderProjectiles(ctx, frame);
  renderPilotRounds(ctx, frame);

  // 11. Draw Thrown Lances & Energy Rays
  renderLances(ctx, frame);
  renderBeams(ctx, frame);

  // 12. Draw Player
  renderPlayer(ctx, frame);
  renderPreyRing(ctx, frame);
  renderPilot(ctx, frame);

  // 13. Draw Debris & Spark Particles
  renderParticles(ctx, frame);

  // 14. Draw Floating Combat Text
  renderFloatingTexts(ctx, frame);

  // 15. Draw Pointer Reticle (mouse steering only)
  renderMouseCursor(ctx, frame);

  // 16. Overflow Grid Verdict Lattice (a screen-space overlay, so it sits late)
  renderGridVerdict(ctx, frame);

  // 17. Overflow Hypercrit White-Out (last, so it sits over everything)
  renderScreenFlash(ctx, frame);

  // 18. Draw Synergy Gaster Blasters
  renderGasterBlasters(ctx, frame);

  // 19. Draw Synergy Void Iaijutsu Slashes
  renderVoidIaijutsu(ctx, frame);

  // 20. Draw Synergy Gate of Babylon
  renderGateOfBabylon(ctx, frame);

  // 21. Draw Synergy Singularity Meteors
  renderSingularityMeteors(ctx, frame);

  // 22. Draw Synergy Divine Ion Strikes
  renderDivineIonStrikes(ctx, frame);

  // 23. Draw Synergy Prism Aegis Sanctuary
  renderPrismAegis(ctx, frame);

  // 24. Draw Synergy Mirage Blades
  renderMirageBlades(ctx, frame);

  ctx.restore();
}

/** Hypercrit's payoff frame: a full-screen white hit. */
export function renderScreenFlash(ctx: CanvasRenderingContext2D, frame: RenderState) {
  const t = frame.player.hypercritFlash;
  if (!t || t <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1, t / 0.18) * 0.55;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-60, -60, frame.width + 120, frame.height + 120);
  ctx.restore();
}

/** One path for the whole lattice; the scan cuts exactly these lines. */
function traceLattice(ctx: CanvasRenderingContext2D, frame: RenderState) {
  ctx.beginPath();
  for (let x = 0; x <= frame.width; x += GRID_CELL) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, frame.height);
  }
  for (let y = 0; y <= frame.height; y += GRID_CELL) {
    ctx.moveTo(0, y);
    ctx.lineTo(frame.width, y);
  }
}

/**
 * Grid Verdict's lattice, in three beats: lines sweep in unevenly from the
 * edges, the assembled grid charges white, then the cut lands.
 *
 * The cell size and the sweep timeline are the same constants the engine cuts
 * with, so a line the player can see is a line that bites.
 */
export function renderGridVerdict(ctx: CanvasRenderingContext2D, frame: RenderState) {
  const anim = frame.player.gridAnim;
  const flash = frame.player.gridFlash;
  if (anim < 0 && (!flash || flash <= 0)) return;

  ctx.save();
  ctx.lineCap = 'butt';

  if (anim >= 0) {
    const glowing = anim >= GRID_WINDUP;
    const glow = gridGlowIntensity(anim);

    if (!glowing) {
      // Beat 1 — each line crosses the field on its own delay and from its own
      // edge, which is what makes the sweep feel uneven instead of a wipe.
      const tips: { x: number; y: number; vertical: boolean }[] = [];
      ctx.beginPath();
      for (let x = 0, i = 0; x <= frame.width; x += GRID_CELL, i++) {
        const reveal = gridLineReveal(i, anim);
        if (reveal <= 0) continue;
        const fromTop = gridLineFromStart(i);
        const endY = fromTop ? frame.height * reveal : frame.height - frame.height * reveal;
        ctx.moveTo(x, fromTop ? 0 : frame.height);
        ctx.lineTo(x, endY);
        if (reveal < 1) tips.push({ x, y: endY, vertical: true });
      }
      for (let y = 0, i = 0; y <= frame.height; y += GRID_CELL, i++) {
        const seed = 1000 + i;
        const reveal = gridLineReveal(seed, anim);
        if (reveal <= 0) continue;
        const fromLeft = gridLineFromStart(seed);
        const endX = fromLeft ? frame.width * reveal : frame.width - frame.width * reveal;
        ctx.moveTo(fromLeft ? 0 : frame.width, y);
        ctx.lineTo(endX, y);
        if (reveal < 1) tips.push({ x: endX, y, vertical: false });
      }
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // A hot leading tip turns each line into a travelling cut, not a wipe.
      if (tips.length > 0) {
        ctx.beginPath();
        for (const tip of tips) {
          if (tip.vertical) {
            ctx.moveTo(tip.x, tip.y - 7);
            ctx.lineTo(tip.x, tip.y + 7);
          } else {
            ctx.moveTo(tip.x - 7, tip.y);
            ctx.lineTo(tip.x + 7, tip.y);
          }
        }
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = '#f5e8ff';
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }
    } else {
      // Beat 2 — the grid is whole and charging. A wide haze under a white core
      // reads as the lines lighting up rather than as a static picture.
      ctx.globalAlpha = 0.22 + glow * 0.4;
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 4 + glow * 3;
      traceLattice(ctx, frame);
      ctx.stroke();

      ctx.globalAlpha = 0.55 + glow * 0.45;
      ctx.strokeStyle = '#f5e8ff';
      ctx.lineWidth = 0.8 + glow * 1.4;
      traceLattice(ctx, frame);
      ctx.stroke();
    }
  }

  // Beat 3 — the cut: the whole lattice flashes white, then fades.
  if (flash > 0) {
    const fade = Math.min(1, flash / GRID_FLASH);

    ctx.globalAlpha = fade * 0.3;
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5 + fade * 3;
    traceLattice(ctx, frame);
    ctx.stroke();

    ctx.globalAlpha = fade * 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.9;
    traceLattice(ctx, frame);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * The seam a Rift Lance tore: a crack in the floor, not a streak in the air.
 *
 * Each node runs *along* the travel direction and is drawn wider than the gap
 * between nodes, so consecutive nodes join into one continuous fracture instead
 * of a comb of ticks. A dark core under a bright rim is what makes it read as a
 * hole in the ground rather than light lying on top of it, and stable offshoots
 * (derived from the node id) give it the branching a crack should have.
 */
export function renderRifts(ctx: CanvasRenderingContext2D, frame: RenderState) {
  if (frame.rifts.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';

  for (const r of frame.rifts) {
    const fade = 1 - r.life / r.maxLife;
    const along = RIFT_SPACING * 1.8;
    const branch = riftBranch(r.id);

    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.angle);

    // The gash itself: a dark core, so it looks cut into the field rather than
    // lit on top of it. Width is what makes it read as a tear and not a scratch.
    ctx.globalAlpha = fade * 0.9;
    ctx.strokeStyle = 'rgba(18, 3, 32, 0.95)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-along / 2, 0);
    ctx.lineTo(along / 2, 0);
    ctx.stroke();

    // Bright rims, split either side of the core so the cut has two edges.
    ctx.globalAlpha = fade * 0.85;
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-along / 2, -5);
    ctx.lineTo(along / 2, -5);
    ctx.moveTo(-along / 2, 5);
    ctx.lineTo(along / 2, 5);
    ctx.stroke();

    // One stable offshoot per node, so the fracture branches as it runs.
    ctx.globalAlpha = fade * 0.6;
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(branch.angle) * branch.length, Math.sin(branch.angle) * branch.length);
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

/**
 * A thrown Rift Lance, and deliberately nothing else: no streak, no afterimage.
 * The seam it gouges into the floor is the whole trace of its flight.
 */
export function renderLances(ctx: CanvasRenderingContext2D, frame: RenderState) {
  if (frame.lances.length === 0) return;

  ctx.save();

  for (const l of frame.lances) {
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate(l.angle);

    // A soft aura drawn *on* the head gives the spear mass. It sits at the spear
    // rather than behind it, so it reads as weight, not as a motion trail.
    ctx.globalAlpha = 0.9;
    ctx.drawImage(getGlowSprite('#a855f7', true), -32, -32);

    // Long, thick and narrow-headed: still unmistakably a spear in a single
    // frame at full speed.
    const back = -LANCE_LENGTH * 0.4;
    const halfWidth = 11;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(LANCE_LENGTH, 0);
    ctx.lineTo(0, -halfWidth);
    ctx.lineTo(back, 0);
    ctx.lineTo(0, halfWidth);
    ctx.closePath();
    ctx.fillStyle = 'rgba(168, 85, 247, 0.55)';
    ctx.fill();
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.stroke();

    // The spine: white-hot, so the eye catches the tip as it crosses.
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(LANCE_LENGTH * 0.95, 0);
    ctx.lineTo(back, 0);
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Prism Turrets: a hex emplacement with a barrel that tracks what it is shooting.
 * Everything on the player's side carries the same marker, so the turret itself
 * is drawn large enough to read as a structure rather than a passing round.
 */
export function renderTurrets(ctx: CanvasRenderingContext2D, frame: RenderState) {
  for (const t of frame.turrets) {
    // An expiring turret dims over its last moment so its loss is legible.
    const remaining = t.maxLife - t.life;
    const brightness = remaining < TURRET_FADE ? Math.max(0.15, remaining / TURRET_FADE) : 1;

    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.globalAlpha = 0.35 + 0.65 * brightness;

    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(t.aimAngle) * 22, Math.sin(t.aimAngle) * 22);
    ctx.stroke();

    ctx.beginPath();
    for (let s = 0; s < 6; s++) {
      const a = (s * Math.PI) / 3 + frame.pulseAnimTime * 0.8;
      const px = Math.cos(a) * 14;
      const py = Math.sin(a) * 14;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(125, 211, 252, 0.18)';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    drawFriendlyMarker(ctx, 14, frame.pulseAnimTime);
    ctx.restore();
  }
}

/** Mirror Clones: the player's own hull, ghosted, wearing the friendly marker. */
export function renderClones(ctx: CanvasRenderingContext2D, frame: RenderState) {
  for (const c of frame.clones) {
    const remaining = c.maxLife - c.life;
    const fading = remaining < 1.5 ? Math.max(0.2, remaining / 1.5) : 1;

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.globalAlpha = 0.45 * fading;
    drawCharacterShip(ctx, frame.player.characterId, 16, c.aimAngle, frame.pulseAnimTime);
    ctx.globalAlpha = fading;
    drawFriendlyMarker(ctx, 16, frame.pulseAnimTime);
    ctx.restore();
  }
}

/** Revived Allies: the corpse's own silhouette, edged and rung in the friendly hue. */
export function renderAllies(ctx: CanvasRenderingContext2D, frame: RenderState) {
  for (const a of frame.allies) {
    const remaining = a.maxLife - a.life;
    const fading = remaining < 2 ? Math.max(0.2, remaining / 2) : 1;

    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.globalAlpha = fading;

    ctx.rotate(a.rotation);
    ctx.beginPath();
    for (let s = 0; s < a.sides; s++) {
      const ang = (s * 2 * Math.PI) / a.sides;
      const px = Math.cos(ang) * a.radius;
      const py = Math.sin(ang) * a.radius;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = a.fillColor;
    ctx.fill();
    // The edge is recoloured but the body is not: the shape stays recognisable as
    // the thing the player just killed, which is the point of the card.
    ctx.strokeStyle = FRIENDLY_COLOR;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.rotate(-a.rotation);

    drawFriendlyMarker(ctx, a.radius, frame.pulseAnimTime);
    ctx.restore();
  }
}

export function renderMouseCursor(ctx: CanvasRenderingContext2D, frame: RenderState) {
  if (frame.controlMode !== 'mouse' || !frame.mouseInside) return;

  const x = frame.mouseX;
  const y = frame.mouseY;
  const pulse = 1 + Math.sin(frame.pulseAnimTime * 6) * 0.12;

  ctx.save();

  // Course line from the vessel to the reticle
  const dist = Math.hypot(frame.mouseX - frame.player.x, frame.mouseY - frame.player.y);
  if (dist > 8) {
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.22)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(frame.player.x, frame.player.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Chasing reticle: ring, four bearing ticks and a center pip
  ctx.translate(x, y);
  ctx.rotate(frame.pulseAnimTime * 2);
  ctx.strokeStyle = '#00ffcc';
  ctx.shadowColor = '#00ffcc';
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2;
  const r = 11 * pulse;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    ctx.moveTo(cos * r * 1.25, sin * r * 1.25);
    ctx.lineTo(cos * r * 1.75, sin * r * 1.75);
  }
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function renderBackground(ctx: CanvasRenderingContext2D, frame: RenderState) {
  ctx.fillStyle = '#05070d';
  ctx.fillRect(0, 0, frame.width, frame.height);

  const gridSize = 48;
  if (hasPilot(frame.player, 'delta_chronos') && frame.player.isSkillActive) {
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
  } else {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  }
  ctx.lineWidth = 1;

  ctx.beginPath();
  for (let x = 0; x <= frame.width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, frame.height);
  }
  for (let y = 0; y <= frame.height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(frame.width, y);
  }
  ctx.stroke();

  const grad = ctx.createRadialGradient(
    frame.width / 2,
    frame.height / 2,
    10,
    frame.width / 2,
    frame.height / 2,
    Math.max(frame.width, frame.height) * 0.75
  );
  grad.addColorStop(0, 'rgba(0, 255, 204, 0.025)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, frame.width, frame.height);
}

export function renderVortices(ctx: CanvasRenderingContext2D, frame: RenderState) {
  for (const v of frame.vortices) {
    ctx.save();
    ctx.translate(v.x, v.y);
    const rot = frame.pulseAnimTime * 6;
    ctx.rotate(rot);

    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.5;

    for (let r = 20; r < 90; r += 20) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 1.6);
      ctx.stroke();
    }

    ctx.fillStyle = '#0a0212';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

export function renderShockwaves(ctx: CanvasRenderingContext2D, frame: RenderState) {
  for (const s of frame.shockwaves) {
    const alpha = Math.max(0, 1 - s.life / s.maxLife);
    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = s.width * alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/** Primed Fusion Iota cores: a spinning diamond plus a fuse ring that closes in. */
export function renderMeltCores(ctx: CanvasRenderingContext2D, frame: RenderState) {
  for (const core of frame.meltCores) {
    const progress = 1 - Math.max(0, core.timer) / core.fuse;
    const pulse = 1 + Math.sin(frame.pulseAnimTime * 14) * 0.12;

    ctx.save();
    ctx.translate(core.x, core.y);
    ctx.rotate(frame.pulseAnimTime * 3);
    ctx.strokeStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 16;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let s = 0; s < 4; s++) {
      const a = (s * Math.PI) / 2;
      const px = Math.cos(a) * 12 * pulse;
      const py = Math.sin(a) * 12 * pulse;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(core.x, core.y, 4 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(core.x, core.y, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();
    ctx.restore();
  }
}

/** Lance Kappa's rays: additive white-hot lines with a coloured halo. */
export function renderBeams(ctx: CanvasRenderingContext2D, frame: RenderState) {
  if (frame.beams.length === 0) return;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';

  for (const beam of frame.beams) {
    const alpha = Math.max(0, 1 - beam.life / beam.maxLife);

    ctx.globalAlpha = alpha * 0.4;
    ctx.strokeStyle = beam.color;
    ctx.lineWidth = beam.width * 2;
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y1);
    ctx.lineTo(beam.x2, beam.y2);
    ctx.stroke();

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = beam.width * 0.5;
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y1);
    ctx.lineTo(beam.x2, beam.y2);
    ctx.stroke();
  }

  ctx.restore();
}

export function renderGems(ctx: CanvasRenderingContext2D, frame: RenderState) {
  for (const g of frame.gems) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.rotation);

    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.moveTo(0, -g.radius);
    ctx.lineTo(g.radius * 0.75, 0);
    ctx.lineTo(0, g.radius);
    ctx.lineTo(-g.radius * 0.75, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -g.radius * 0.4);
    ctx.lineTo(g.radius * 0.3, 0);
    ctx.lineTo(0, g.radius * 0.4);
    ctx.lineTo(-g.radius * 0.3, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

export function renderEnemies(ctx: CanvasRenderingContext2D, frame: RenderState) {
  for (const e of frame.enemies) {
    ctx.save();

    // ==========================================
    // TELEGRAPH LINES (SNIPER & CHARGER)
    // ==========================================
    if (e.type === 'sniper' && e.state === 'charging' && e.aimAngle !== undefined) {
      ctx.save();
      if (e.aimLocked) {
        // LOCKED STAGE: High-contrast solid red/amber laser with glowing aura
        ctx.strokeStyle = 'rgba(255, 100, 0, 0.35)';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(e.aimAngle) * 550, e.y + Math.sin(e.aimAngle) * 550);
        ctx.stroke();

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(e.aimAngle) * 550, e.y + Math.sin(e.aimAngle) * 550);
        ctx.stroke();

        // Lock-on target marker along locked path
        const lockDist = 200;
        const lx = e.x + Math.cos(e.aimAngle) * lockDist;
        const ly = e.y + Math.sin(e.aimAngle) * lockDist;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lx, ly, 7, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // TRACKING STAGE: Soft cyan-red dashed aim line
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(e.aimAngle) * 500, e.y + Math.sin(e.aimAngle) * 500);
        ctx.stroke();
      }
      ctx.restore();
    } else if (e.type === 'charger' && e.state === 'charging' && e.chargeDir) {
      // Gold warning cone
      ctx.save();
      ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
      ctx.lineWidth = 1.5;
      const cAngle = Math.atan2(e.chargeDir.y, e.chargeDir.x);
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.arc(e.x, e.y, 160, cAngle - 0.2, cAngle + 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.translate(e.x, e.y);
    ctx.rotate(e.rotation);

    const isHitFlash = e.hitFlashTimer > 0;
    const isFrozen = e.frozenTimer && e.frozenTimer > 0;

    if (isHitFlash) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff';
    } else if (isFrozen) {
      ctx.fillStyle = '#083344';
      ctx.strokeStyle = '#06b6d4';
    } else {
      ctx.fillStyle = e.fillColor;
      ctx.strokeStyle = e.strokeColor;
    }

    if (e.isBoss) {
      ctx.shadowColor = isHitFlash ? '#ffffff' : e.strokeColor;
      ctx.shadowBlur = 20;
    }

    ctx.lineWidth = e.isBoss ? 4 : 2.5;

    ctx.beginPath();
    if (e.type === 'boss') {
      const points = e.sides;
      const outerR = e.radius;
      const innerR = e.radius * 0.52;
      for (let p = 0; p < points * 2; p++) {
        const r = p % 2 === 0 ? outerR : innerR;
        const a = (p * Math.PI) / points;
        if (p === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
    } else {
      const sides = e.sides;
      for (let s = 0; s < sides; s++) {
        const a = (s * 2 * Math.PI) / sides;
        const px = Math.cos(a) * e.radius;
        const py = Math.sin(a) * e.radius;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (e.isBoss && !isHitFlash) {
      ctx.restore();
      ctx.save();
      ctx.translate(e.x, e.y - e.radius - 16);
      const hpBarW = 70;
      const hpPct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-hpBarW / 2, 0, hpBarW, 5);
      ctx.fillStyle = '#ff0066';
      ctx.fillRect(-hpBarW / 2, 0, hpBarW * hpPct, 5);
      ctx.restore();
      continue;
    }

    ctx.restore();
  }
}

export function renderSatellites(ctx: CanvasRenderingContext2D, frame: RenderState) {
  if (frame.player.orbitSatellites <= 0) return;

  for (const sat of frame.satellites) {
    const satX = frame.player.x + Math.cos(sat.angle) * sat.distance;
    const satY = frame.player.y + Math.sin(sat.angle) * sat.distance;

    ctx.save();
    ctx.translate(satX, satY);
    ctx.rotate(sat.rotation);

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(frame.player.x - satX, frame.player.y - satY);
    ctx.stroke();

    ctx.fillStyle = '#170624';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let s = 0; s < 3; s++) {
      const a = (s * 2 * Math.PI) / 3;
      const px = Math.cos(a) * sat.radius;
      const py = Math.sin(a) * sat.radius;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f3e8ff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export function renderDrones(ctx: CanvasRenderingContext2D, frame: RenderState) {
  for (const drone of frame.player.drones) {
    const dx = frame.player.x + Math.cos(drone.angle) * drone.dist;
    const dy = frame.player.y + Math.sin(drone.angle) * drone.dist;

    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(drone.angle + Math.PI / 2);

    if (drone.type === 'interceptor') {
      // Fast interceptor triangle drone
      ctx.fillStyle = '#082f49';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(5, 6);
      ctx.lineTo(-5, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (drone.type === 'railgun') {
      // Heavy diamond orbital railgun
      ctx.fillStyle = '#2e1065';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (drone.type === 'guardian') {
      // Hexagonal aegis drone with defensive emerald deflection field
      ctx.fillStyle = '#064e3b';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const a = (s * Math.PI) / 3;
        const px = Math.cos(a) * 7.5;
        const py = Math.sin(a) * 7.5;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#6ee7b7';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export function renderEnemyProjectiles(ctx: CanvasRenderingContext2D, frame: RenderState) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (const ep of frame.enemyProjectiles) {
    ctx.fillStyle = ep.color;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(ep.x, ep.y, ep.radius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.arc(ep.x, ep.y, ep.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function getGlowSprite(color: string, isCrit: boolean): HTMLCanvasElement {
  const key = `${color}_${isCrit}`;
  let sprite = glowCache.get(key);
  if (sprite) return sprite;

  const size = 64;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = size;
  offCanvas.height = size;
  const offCtx = offCanvas.getContext('2d')!;

  const center = size / 2;
  const radius = isCrit ? 6 : 4.5;
  const blur = isCrit ? 22 : 14;

  offCtx.shadowColor = color;
  offCtx.shadowBlur = blur;
  offCtx.fillStyle = isCrit ? '#ffffff' : color;
  offCtx.beginPath();
  offCtx.arc(center, center, radius, 0, Math.PI * 2);
  offCtx.fill();

  offCtx.fillStyle = '#ffffff';
  offCtx.shadowColor = '#ffffff';
  offCtx.shadowBlur = 8;
  offCtx.beginPath();
  offCtx.arc(center, center, radius * 0.45, 0, Math.PI * 2);
  offCtx.fill();

  glowCache.set(key, offCanvas);
  return offCanvas;
}

export function renderProjectiles(ctx: CanvasRenderingContext2D, frame: RenderState) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (const p of frame.projectiles) {
    if (p.trail.length > 1) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.radius * 2.2;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.35;

      ctx.beginPath();
      ctx.moveTo(p.trail[0].x, p.trail[0].y);
      for (let t = 1; t < p.trail.length; t++) {
        ctx.lineTo(p.trail[t].x, p.trail[t].y);
      }
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = p.radius * 0.9;
      ctx.globalAlpha = 0.85;
      ctx.stroke();
    }

    const sprite = getGlowSprite(p.color, p.isCrit);
    ctx.globalAlpha = 1.0;
    ctx.drawImage(sprite, p.x - 32, p.y - 32);
  }

  ctx.restore();
}

/** Predator: the red lock ring on the hull you are hunting. */
export function renderPreyRing(ctx: CanvasRenderingContext2D, frame: RenderState) {
  if (!frame.pilot) return;

  ctx.save();
  ctx.translate(frame.player.x, frame.player.y);
  ctx.rotate(frame.pilot.rotation * 0.6);
  ctx.strokeStyle = 'rgba(251, 113, 133, 0.85)';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.arc(0, 0, frame.player.radius + 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const tip = frame.player.radius + 18;
  ctx.fillStyle = '#fb7185';
  ctx.beginPath();
  ctx.moveTo(tip, 0);
  ctx.lineTo(tip + 9, -6);
  ctx.lineTo(tip + 9, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Predator: your monster form, drawn from the table the soldiers use. */
export function renderPilot(ctx: CanvasRenderingContext2D, frame: RenderState) {
  const pilot = frame.pilot;
  if (!pilot) return;

  const def = ENEMY_TYPES[pilot.form];
  ctx.save();
  ctx.translate(pilot.x, pilot.y);
  ctx.rotate(pilot.rotation);

  const blink = pilot.invulnTimer > 0 && Math.floor(pilot.invulnTimer * 20) % 2 === 0;
  ctx.globalAlpha = blink ? 0.45 : 1;
  ctx.beginPath();
  for (let i = 0; i < def.sides; i++) {
    const a = (i / def.sides) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * pilot.radius;
    const py = Math.sin(a) * pilot.radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = def.fillColor;
  ctx.fill();
  ctx.strokeStyle = def.strokeColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // The leader ring: you are one of the swarm, and the one being steered.
  ctx.rotate(-pilot.rotation);
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.9)';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.arc(0, 0, pilot.radius + 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  if (pilot.phaseTimer > 0) {
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#a5f3fc';
    ctx.beginPath();
    ctx.arc(0, 0, pilot.radius + 13, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** Your ult rounds: brighter and heavier than the swarm's own bolts. */
export function renderPilotRounds(ctx: CanvasRenderingContext2D, frame: RenderState) {
  if (frame.pilotRounds.length === 0) return;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const r of frame.pilotRounds) {
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.radius * 1.6;
    ctx.beginPath();
    ctx.moveTo(r.x - r.vx * 0.9, r.y - r.vy * 0.9);
    ctx.lineTo(r.x, r.y);
    ctx.stroke();

    ctx.fillStyle = '#fff1f2';
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function renderPlayer(ctx: CanvasRenderingContext2D, frame: RenderState) {
  ctx.save();
  ctx.translate(frame.player.x, frame.player.y);

  const breath = 1.0 + Math.sin(frame.pulseAnimTime * 3) * 0.04;
  ctx.scale(breath, breath);

  if (frame.player.invincibleTimer > 0) {
    if (Math.floor(frame.player.invincibleTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }
  }

  // Magnet ring
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, frame.player.magnetRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Nanite Shield Hex Envelope
  if (frame.player.naniteShieldActive) {
    ctx.save();
    ctx.rotate(-frame.pulseAnimTime * 1.5);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    for (let s = 0; s < 6; s++) {
      const a = (s * 2 * Math.PI) / 6;
      const px = Math.cos(a) * (frame.player.radius * 1.6);
      const py = Math.sin(a) * (frame.player.radius * 1.6);
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // Siphon Eta's banked blood shield, an octagon of its own
  if (frame.player.tempShield > 0) {
    ctx.save();
    ctx.rotate(frame.pulseAnimTime * 2.2);
    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#fda4af';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    for (let s = 0; s < 8; s++) {
      const a = (s * Math.PI) / 4;
      const px = Math.cos(a) * (frame.player.radius * 1.35);
      const py = Math.sin(a) * (frame.player.radius * 1.35);
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  const twinId = isPaired(frame.player) ? frame.player.twinPilotId : undefined;  const wings = getTwinPositions(frame.player);
  const offX = wings.p1.x - frame.player.x;
  const offY = wings.p1.y - frame.player.y;

  ctx.save();
  ctx.translate(offX, offY);
  drawCharacterShip(
    ctx,
    frame.player.characterId,
    frame.player.radius,
    frame.player.angle,
    frame.pulseAnimTime
  );
  ctx.restore();

  if (twinId) {
    ctx.save();
    ctx.translate(-offX, -offY);
    drawCharacterShip(
      ctx,
      twinId,
      frame.player.radius,
      frame.player.pilot2Angle || 0,
      frame.pulseAnimTime
    );
    ctx.restore();

    renderTwinArc(ctx, frame, wings.p1, wings.p2);
  }

  ctx.restore();
}

/** Crackling resonance tether that links the two wings of a Twin Link pair. */
export function renderTwinArc(
  ctx: CanvasRenderingContext2D,
  frame: RenderState,
  a: { x: number; y: number },
  b: { x: number; y: number }
) {
  drawResonanceArc(
    ctx,
    a.x - frame.player.x,
    a.y - frame.player.y,
    b.x - frame.player.x,
    b.y - frame.player.y,
    frame.pulseAnimTime,
    frame.player.radius * 1.05
  );
}

export function renderParticles(ctx: CanvasRenderingContext2D, frame: RenderState) {
  for (const p of frame.particles) {
    const alpha = Math.max(0, 1 - p.life / p.maxLife);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;

    ctx.beginPath();
    for (let s = 0; s < p.sides; s++) {
      const a = (s * 2 * Math.PI) / p.sides;
      const px = Math.cos(a) * p.size;
      const py = Math.sin(a) * p.size;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

export function renderFloatingTexts(ctx: CanvasRenderingContext2D, frame: RenderState) {
  for (const t of frame.floatingTexts) {
    const alpha = Math.max(0, 1 - t.life / t.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = t.isCrit
      ? '800 16px "JetBrains Mono", monospace'
      : '600 12px "JetBrains Mono", monospace';
    ctx.fillStyle = t.color;
    ctx.textAlign = 'center';
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  }
}

export function renderGasterBlasters(ctx: CanvasRenderingContext2D, frame: RenderState) {
  if (!frame.gasterRings || frame.gasterRings.length === 0) return;
  for (const ring of frame.gasterRings) {
    ctx.save();
    // 1. Target reticle
    const reticleAlpha = Math.max(0, 1 - ring.elapsed / ring.totalDuration);
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = reticleAlpha * 0.45;
    ctx.beginPath();
    ctx.arc(ring.targetX, ring.targetY, 18, 0, Math.PI * 2);
    ctx.stroke();
    // Rotating crosshair dashes
    const rot = ring.elapsed * 2;
    for (let i = 0; i < 4; i++) {
      const a = rot + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(ring.targetX + Math.cos(a) * 12, ring.targetY + Math.sin(a) * 12);
      ctx.lineTo(ring.targetX + Math.cos(a) * 24, ring.targetY + Math.sin(a) * 24);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Individual Blaster units
    for (const b of ring.blasters) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.aimAngle);

      // Skull plate (geometric faceted dragon skull)
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, -14);
      ctx.lineTo(-16, -10);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-16, 10);
      ctx.lineTo(-8, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Mandible jaws (upper & lower)
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-4, -12);
      ctx.lineTo(8, -10);
      ctx.lineTo(14, -4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-4, 12);
      ctx.lineTo(8, 10);
      ctx.lineTo(14, 4);
      ctx.stroke();

      // Glowing Eye (Center pupil)
      const chargeGlow = Math.min(1, ring.elapsed / GASTER_WINDUP_SECONDS);
      ctx.fillStyle = b.fired ? '#ffffff' : '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = b.fired ? 12 : 6 * chargeGlow;
      ctx.beginPath();
      ctx.arc(-2, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();

      // 3. Firing high-intensity laser beam
      if (b.fired && b.fireProgress > 0 && b.fireProgress < 1) {
        const beamFade = Math.sin(b.fireProgress * Math.PI);
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.aimAngle);

        const currentWidth = GASTER_BEAM_WIDTH * beamFade;

        // Outer neon aura
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = currentWidth * 1.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(GASTER_BEAM_LENGTH, 0);
        ctx.stroke();

        // Inner piercing core
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = currentWidth * 0.7;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(GASTER_BEAM_LENGTH, 0);
        ctx.stroke();

        // Energy shock rings along the beam
        for (let r = 80; r < GASTER_BEAM_LENGTH; r += 110) {
          ctx.strokeStyle = '#bae6fd';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(r, 0, 6, currentWidth * 0.6, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }
    }
    ctx.restore();
  }
}

export function renderVoidIaijutsu(ctx: CanvasRenderingContext2D, frame: RenderState) {
  if (!frame.iaijutsuSlashes || frame.iaijutsuSlashes.length === 0) return;
  const sheathEnd = IAIJUTSU_CUT_DURATION + IAIJUTSU_SHEATH_PAUSE;

  for (const s of frame.iaijutsuSlashes) {
    ctx.save();

    const phantom =
      s.phase === 'cut'
        ? calculateIaijutsuPhantomPos(s)
        : { x: s.endX, y: s.endY, progress: 1 };

    // 1. Cut line (Razor dimension seam extends progressively as phantom dashes across)
    const seamEndX = s.phase === 'cut' ? phantom.x : s.endX;
    const seamEndY = s.phase === 'cut' ? phantom.y : s.endY;
    const lineAlpha =
      s.phase === 'shatter'
        ? Math.max(0, 1 - (s.elapsed - sheathEnd) / IAIJUTSU_SHATTER_DURATION)
        : 1;

    ctx.save();
    ctx.globalAlpha = lineAlpha;

    // Dark rift shadow
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = s.phase === 'cut' ? 10 : 8;
    ctx.beginPath();
    ctx.moveTo(s.startX, s.startY);
    ctx.lineTo(seamEndX, seamEndY);
    ctx.stroke();

    // Vivid neon core
    ctx.strokeStyle = s.phase === 'sheath' ? '#ffffff' : '#c084fc';
    ctx.lineWidth = s.phase === 'sheath' ? 3.5 : 2.5;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(s.startX, s.startY);
    ctx.lineTo(seamEndX, seamEndY);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // 2. Purple-tinted phantom clone of the player's actual ship dashing & sheathing
    const shatterFade =
      s.phase === 'shatter' ? Math.max(0, 1 - (s.elapsed - sheathEnd) / 0.12) : 1;

    if (s.phase === 'cut' || s.phase === 'sheath' || shatterFade > 0) {
      const dx = s.endX - s.startX;
      const dy = s.endY - s.startY;
      const shipRadius = frame.player.radius || 14;

      // Trailing phantom afterimages along the slash path
      const trailOffsets = s.phase === 'cut' ? [0.28, 0.18, 0.09] : [0.14, 0.06];
      for (let tIdx = 0; tIdx < trailOffsets.length; tIdx++) {
        const trailT = Math.max(0, phantom.progress - trailOffsets[tIdx]);
        if (trailT <= 0.01) continue;
        const tx = s.startX + dx * trailT;
        const ty = s.startY + dy * trailT;

        ctx.save();
        ctx.translate(tx, ty);
        ctx.globalAlpha = (0.14 + tIdx * 0.08) * shatterFade;

        // Soft purple phantom haze
        ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, shipRadius * 1.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = '#9333ea';
        ctx.shadowBlur = 14;
        drawCharacterShip(ctx, frame.player.characterId, shipRadius, s.angle, frame.pulseAnimTime);
        ctx.restore();
      }

      // Main phantom ship (same ship design as player, with purple spectral tint & aura)
      ctx.save();
      ctx.translate(phantom.x, phantom.y);
      ctx.globalAlpha = 0.82 * shatterFade;

      // Spectral purple aura disc & contour glow behind the ship hull
      const auraGrad = ctx.createRadialGradient(0, 0, shipRadius * 0.2, 0, 0, shipRadius * 1.9);
      auraGrad.addColorStop(0, 'rgba(192, 132, 252, 0.45)');
      auraGrad.addColorStop(0.6, 'rgba(147, 51, 234, 0.22)');
      auraGrad.addColorStop(1, 'rgba(147, 51, 234, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, shipRadius * 1.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 20;
      drawCharacterShip(ctx, frame.player.characterId, shipRadius, s.angle, frame.pulseAnimTime);

      // Subtle purple spectral overlay wash so every hull color reads unmistakably as a violet phantom
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(168, 85, 247, 0.48)';
      ctx.fillRect(-shipRadius * 2.5, -shipRadius * 2.5, shipRadius * 5, shipRadius * 5);
      ctx.globalCompositeOperation = 'source-over';

      // Slash shock crescent ahead of the dashing phantom nose during cut
      if (s.phase === 'cut') {
        ctx.rotate(s.angle);
        ctx.strokeStyle = '#f5d0fe';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#e879f9';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(4, 0, shipRadius + 10, -Math.PI * 0.42, Math.PI * 0.42);
        ctx.stroke();
      }
      ctx.restore();

      // Star sparkle at the phantom's sheathing stop point
      if (s.phase === 'sheath') {
        ctx.save();
        ctx.translate(s.endX, s.endY);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#e879f9';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(2.5, -2.5);
        ctx.lineTo(16, 0);
        ctx.lineTo(2.5, 2.5);
        ctx.lineTo(0, 16);
        ctx.lineTo(-2.5, 2.5);
        ctx.lineTo(-16, 0);
        ctx.lineTo(-2.5, -2.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // 3. Dimensional Shatter glass fractures
    if (s.phase === 'shatter') {
      const shatterProgress = Math.min(1, Math.max(0, (s.elapsed - sheathEnd) / IAIJUTSU_SHATTER_DURATION));
      const shatterAlpha = 1 - shatterProgress;
      const shards = generateRiftShards(s.id, 12);
      const dx = s.endX - s.startX;
      const dy = s.endY - s.startY;

      ctx.save();
      ctx.globalAlpha = shatterAlpha;
      ctx.strokeStyle = '#e9d5ff';
      ctx.fillStyle = 'rgba(192, 132, 252, 0.25)';
      ctx.lineWidth = 1.5;

      for (const shard of shards) {
        const cx =
          s.startX +
          dx * shard.t +
          Math.cos(s.angle + Math.PI / 2) * shard.offset * (1 + shatterProgress * 1.5);
        const cy =
          s.startY +
          dy * shard.t +
          Math.sin(s.angle + Math.PI / 2) * shard.offset * (1 + shatterProgress * 1.5);
        const len = shard.length * (1 - shatterProgress * 0.3);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(shard.angle) * len, cy + Math.sin(shard.angle) * len);
        ctx.lineTo(
          cx + Math.cos(shard.angle + 1) * (len * 0.6),
          cy + Math.sin(shard.angle + 1) * (len * 0.6)
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }
}

export function renderGateOfBabylon(ctx: CanvasRenderingContext2D, frame: RenderState) {
  // 1. Draw Golden Gates
  if (frame.babylonGates && frame.babylonGates.length > 0) {
    for (const g of frame.babylonGates) {
      if (!g.active) continue;
      ctx.save();
      ctx.translate(g.originX, g.originY);
      ctx.rotate(g.angle);

      const alpha = Math.min(1, (g.duration - g.elapsed) * 2);
      ctx.globalAlpha = Math.max(0, alpha);

      // Golden gate hex portal
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 15;

      // Draw horizontal portal lattice
      ctx.beginPath();
      ctx.moveTo(-20, -110);
      ctx.lineTo(10, -80);
      ctx.lineTo(20, 0);
      ctx.lineTo(10, 80);
      ctx.lineTo(-20, 110);
      ctx.stroke();

      // Rippling golden portal circles
      const wave = Math.sin(frame.pulseAnimTime * 8) * 4;
      for (let y = -80; y <= 80; y += 40) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.beginPath();
        ctx.arc(0, y, 12 + wave, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // 2. Draw Fired Golden Swords
  if (frame.babylonSwords && frame.babylonSwords.length > 0) {
    for (const s of frame.babylonSwords) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);

      // Golden sword geometry (blade, hilt, glowing point)
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#d97706';
      ctx.shadowBlur = s.stuck ? 8 : 12;

      ctx.beginPath();
      ctx.moveTo(BABYLON_SWORD_LENGTH / 2, 0); // Point
      ctx.lineTo(-BABYLON_SWORD_LENGTH / 4, -BABYLON_SWORD_WIDTH / 2);
      ctx.lineTo(-BABYLON_SWORD_LENGTH / 2, -BABYLON_SWORD_WIDTH / 4);
      ctx.lineTo(-BABYLON_SWORD_LENGTH / 2, BABYLON_SWORD_WIDTH / 4);
      ctx.lineTo(-BABYLON_SWORD_LENGTH / 4, BABYLON_SWORD_WIDTH / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Crossguard
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-BABYLON_SWORD_LENGTH / 3, -BABYLON_SWORD_WIDTH, 4, BABYLON_SWORD_WIDTH * 2);

      // Secondary burst sparks if detonating
      if (s.stuck) {
        const detAlpha = Math.max(0, 1 - s.stuckTimer / 0.3);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.globalAlpha = detAlpha;
        ctx.beginPath();
        ctx.arc(0, 0, BABYLON_BURST_RADIUS * (1 - detAlpha), 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }
}

export function renderSingularityMeteors(ctx: CanvasRenderingContext2D, frame: RenderState) {
  if (!frame.meteors || frame.meteors.length === 0) return;
  for (const m of frame.meteors) {
    ctx.save();

    // 1. Pre-impact targeting reticle & falling super-gravity meteor core
    if (!m.impacted) {
      ctx.save();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5 + Math.sin(frame.pulseAnimTime * 10) * 0.25;
      ctx.beginPath();
      ctx.arc(m.targetX, m.targetY, m.pullRadius * (1 - m.altitude * 0.5), 0, Math.PI * 2);
      ctx.stroke();

      // Pull lines spiraling inward
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 + frame.pulseAnimTime * 3;
        const r = m.pullRadius * (0.3 + 0.7 * (1 - m.altitude));
        ctx.beginPath();
        ctx.moveTo(m.targetX + Math.cos(a) * r, m.targetY + Math.sin(a) * r);
        ctx.lineTo(m.targetX, m.targetY);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.translate(m.currentX, m.currentY);
      const rot = frame.pulseAnimTime * 6;

      // Inverted negative space core
      ctx.fillStyle = '#020617';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#9333ea';
      ctx.shadowBlur = 24;

      const size = 32 + (1 - m.altitude) * 16;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Concentric event horizon rings rotating
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      for (let ring = 1; ring <= 3; ring++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, size * (1 + ring * 0.35), size * (0.6 + ring * 0.2), rot * ring, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Post-impact scorched crater, tectonic fissures & delayed singularity collapse
    if (m.impacted && m.impactTimer > 0) {
      const craterElapsed = Math.max(0, METEOR_CRATER_DURATION - m.impactTimer);
      const fade = Math.min(1, m.impactTimer / 0.55);

      ctx.save();
      ctx.translate(m.targetX, m.targetY);

      // (a) Scorched obsidian-magma-violet ground crater disc
      ctx.save();
      ctx.globalAlpha = fade * 0.9;
      const craterGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, METEOR_EXPLOSION_RADIUS);
      craterGrad.addColorStop(0, 'rgba(15, 6, 36, 0.92)');
      craterGrad.addColorStop(0.32, 'rgba(147, 51, 234, 0.42)');
      craterGrad.addColorStop(0.62, 'rgba(249, 115, 22, 0.28)');
      craterGrad.addColorStop(0.88, 'rgba(124, 45, 18, 0.14)');
      craterGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = craterGrad;
      ctx.beginPath();
      ctx.arc(0, 0, METEOR_EXPLOSION_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Crater outer rim ring
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, METEOR_EXPLOSION_RADIUS * 0.94, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // (b) Deterministic jagged tectonic fissures radiating from impact center
      const cracks = generateCraterCracks(m.id, 12);
      const fissureExpand = Math.min(1, craterElapsed / 0.14);
      ctx.save();
      ctx.globalAlpha = fade;
      for (let cIdx = 0; cIdx < cracks.length; cIdx++) {
        const crack = cracks[cIdx];
        const totalLen = METEOR_EXPLOSION_RADIUS * crack.lengthScale * fissureExpand;
        const midLen = totalLen * 0.52;
        const midX = Math.cos(crack.angle) * midLen;
        const midY = Math.sin(crack.angle) * midLen;
        const tipX = midX + Math.cos(crack.angle + crack.bendAngle) * (totalLen - midLen);
        const tipY = midY + Math.sin(crack.angle + crack.bendAngle) * (totalLen - midLen);

        // Molten glow channel
        ctx.strokeStyle = cIdx % 2 === 0 ? '#f97316' : '#a855f7';
        ctx.lineWidth = crack.width * 1.9;
        ctx.shadowColor = cIdx % 2 === 0 ? '#ea580c' : '#9333ea';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(midX, midY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // White-hot inner fissure vein
        ctx.shadowBlur = 0;
        ctx.strokeStyle = cIdx % 2 === 0 ? '#fef08a' : '#e9d5ff';
        ctx.lineWidth = Math.max(0.8, crack.width * 0.55);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(midX, midY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
      }
      ctx.restore();

      // (c) Counter-rotating gravity containment rings inside the crater
      ctx.save();
      ctx.globalAlpha = fade * 0.72;
      const rot = frame.pulseAnimTime * 2.4;
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.setLineDash([18, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, METEOR_EXPLOSION_RADIUS * 0.56, rot, rot + Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([10, 14]);
      ctx.beginPath();
      ctx.arc(0, 0, METEOR_EXPLOSION_RADIUS * 0.8, -rot * 1.4, -rot * 1.4 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // (d) Primary impact shockwave (first 0.45s)
      if (craterElapsed < 0.45) {
        const prog = craterElapsed / 0.45;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - prog);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4 * (1 - prog);
        ctx.beginPath();
        ctx.arc(0, 0, METEOR_EXPLOSION_RADIUS * prog, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // (e) Delayed secondary collapse telegraph & detonation
      if (craterElapsed < METEOR_AFTERSHOCK_DELAY) {
        const tProg = craterElapsed / METEOR_AFTERSHOCK_DELAY;
        ctx.save();
        ctx.globalAlpha = 0.35 + tProg * 0.55;
        ctx.strokeStyle = '#e879f9';
        ctx.lineWidth = 1.5 + tProg * 2.5;
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(12, METEOR_EXPLOSION_RADIUS * (1 - tProg * 0.92)), 0, Math.PI * 2);
        ctx.stroke();

        // Pulsing unstable singularity core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 8 + tProg * 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        const afterElapsed = craterElapsed - METEOR_AFTERSHOCK_DELAY;
        if (afterElapsed < 0.5) {
          const afterProg = afterElapsed / 0.5;
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - afterProg);
          ctx.strokeStyle = '#e879f9';
          ctx.lineWidth = 6 * (1 - afterProg);
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(0, 0, METEOR_EXPLOSION_RADIUS * 1.12 * afterProg, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3 * (1 - afterProg);
          ctx.beginPath();
          ctx.arc(0, 0, METEOR_EXPLOSION_RADIUS * 0.82 * afterProg, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      ctx.restore();
    }

    ctx.restore();
  }
}

export function renderDivineIonStrikes(ctx: CanvasRenderingContext2D, frame: RenderState) {
  if (!frame.ionStrikes || frame.ionStrikes.length === 0) return;
  for (const s of frame.ionStrikes) {
    ctx.save();

    // 1. Targeting Phase: Laser convergence lines
    if (s.phase === 'targeting') {
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 8;
      const targetAnim = (frame.pulseAnimTime * 20) % 20;

      // 3 laser guide lines from top
      ctx.beginPath();
      ctx.moveTo(s.targetX - 40, 0);
      ctx.lineTo(s.targetX, s.targetY);
      ctx.moveTo(s.targetX + 40, 0);
      ctx.lineTo(s.targetX, s.targetY);
      ctx.moveTo(s.targetX, 0);
      ctx.lineTo(s.targetX, s.targetY);
      ctx.stroke();

      // Ground crosshair
      ctx.beginPath();
      ctx.arc(s.targetX, s.targetY, 15 + targetAnim * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Massive Vertical Ion Pillar
    if (s.phase === 'pillar') {
      ctx.save();
      const halfW = s.beamWidth / 2;

      // Outer cyan plasma glow
      ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.fillRect(s.targetX - halfW * 1.5, 0, s.beamWidth * 1.5, frame.height);

      // Core blinding white ion shaft
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(s.targetX - halfW * 0.6, 0, s.beamWidth * 0.6, frame.height);

      // Electric arc discharges along pillar
      ctx.strokeStyle = '#a5f3fc';
      ctx.lineWidth = 2.5;
      for (let y = 0; y < frame.height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(s.targetX - halfW, y);
        ctx.lineTo(s.targetX + (Math.random() - 0.5) * 30, y + 30);
        ctx.lineTo(s.targetX + halfW, y + 60);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Ground Plasma Web
    if (s.phase === 'ground') {
      const alpha = Math.max(0, Math.min(1, s.groundTimer / 1.5));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(s.targetX, s.targetY);

      // Ground shock patch
      ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, ION_GROUND_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Crackling arcs
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2;
      for (let a = 0; a < 6; a++) {
        const ang = (a * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * ION_GROUND_RADIUS * 0.6, Math.sin(ang) * ION_GROUND_RADIUS * 0.6);
        ctx.lineTo(Math.cos(ang + 0.3) * ION_GROUND_RADIUS, Math.sin(ang + 0.3) * ION_GROUND_RADIUS);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }
}

export function renderPrismAegis(ctx: CanvasRenderingContext2D, frame: RenderState) {
  if (!frame.player.aegisLevel || frame.player.aegisLevel <= 0) return;
  const p = frame.player;
  const radius = p.aegisRadius || 140;
  const rot = frame.pulseAnimTime * 0.6;
  const pulseFrac = (frame.pulseAnimTime * 1.8) % 1;

  ctx.save();
  ctx.translate(p.x, p.y);

  // Subtle expanding perimeter pulse aura indicating active close-range burn field
  ctx.save();
  ctx.globalAlpha = Math.max(0, 0.35 * (1 - pulseFrac));
  ctx.strokeStyle = '#67e8f9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius * (0.65 + pulseFrac * 0.35), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Octagonal perimeter
  ctx.strokeStyle = '#38bdf8';
  ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#0284c7';
  ctx.shadowBlur = 12;

  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = rot + (i * Math.PI) / 4;
    const px = Math.cos(a) * radius;
    const py = Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Floating absorption charge dots
  const chargeCount = p.aegisReflectedCount || 0;
  for (let c = 0; c < chargeCount; c++) {
    const a = -rot * 2 + (c * Math.PI * 2) / 8;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * (radius - 12), Math.sin(a) * (radius - 12), 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function renderMirageBlades(ctx: CanvasRenderingContext2D, frame: RenderState) {
  // 1. Active blades (orbiting, queued, outbound, waiting offscreen, or returning convergence sweep)
  if (frame.mirageBlades && frame.mirageBlades.length > 0) {
    for (const b of frame.mirageBlades) {
      if (b.state === 'dead') continue;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      const isReturning = b.state === 'returning';
      const isOutbound = b.state === 'outbound';

      // High-speed supersonic streak trail
      if (isOutbound || isReturning) {
        const trailLen = isReturning ? 56 : 38;
        const grad = ctx.createLinearGradient(0, 0, -trailLen, 0);
        grad.addColorStop(0, isReturning ? 'rgba(244, 114, 182, 0.85)' : 'rgba(56, 189, 248, 0.85)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = isReturning ? 3.5 : 2.5;
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(-trailLen, 0);
        ctx.stroke();
      }

      // Ice-blue diamond blade (pink-tipped during the return convergence sweep)
      ctx.fillStyle = isReturning ? '#fce7f3' : '#e0f2fe';
      ctx.strokeStyle = isReturning ? '#f472b6' : '#38bdf8';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(14, 0); // Blade tip
      ctx.lineTo(-4, -5);
      ctx.lineTo(-12, 0);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }

  // 2. Decoupled Geometric Lotus Blooms at world-space hit points (莲华绽放)
  // Lightweight multi-layer vector passes (no shadowBlur) so 200+ enemy waves never drop frames
  if (frame.mirageBlooms && frame.mirageBlooms.length > 0) {
    for (const bloom of frame.mirageBlooms) {
      const duration = bloom.duration || MIRAGE_BLOOM_DURATION;
      const bloomProgress = Math.max(0, Math.min(1, bloom.elapsed / duration));
      const alpha = Math.max(0, 1 - bloomProgress * 0.85);

      ctx.save();
      ctx.translate(bloom.x, bloom.y);
      ctx.globalAlpha = alpha;

      // Soft outer halo disc (replaces expensive shadowBlur)
      ctx.fillStyle = 'rgba(244, 114, 182, 0.16)';
      ctx.beginPath();
      ctx.arc(0, 0, MIRAGE_BLOOM_RADIUS * (0.45 + bloomProgress * 0.55), 0, Math.PI * 2);
      ctx.fill();

      // Unfolding 8 diamond petals
      const petalDist = MIRAGE_BLOOM_RADIUS * (0.3 + bloomProgress * 0.7);
      const petalScale = 1 - bloomProgress * 0.3;
      for (let p = 0; p < 8; p++) {
        const petalAngle = (p * Math.PI) / 4 + bloomProgress * 0.6;
        const px = Math.cos(petalAngle) * petalDist;
        const py = Math.sin(petalAngle) * petalDist;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(petalAngle + Math.PI / 2);

        // Radiant crystal-pink & cyan lotus petal with crisp white edge
        ctx.fillStyle = p % 2 === 0 ? 'rgba(56, 189, 248, 0.82)' : 'rgba(244, 114, 182, 0.82)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;

        ctx.beginPath();
        ctx.moveTo(0, -12 * petalScale);
        ctx.lineTo(6 * petalScale, 0);
        ctx.lineTo(0, 8 * petalScale);
        ctx.lineTo(-6 * petalScale, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }

      // Luminous Lotus Core / Stamen (layered discs instead of shadowBlur)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, 12 * (1 - bloomProgress * 0.45), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 6.5 * (1 - bloomProgress * 0.5), 0, Math.PI * 2);
      ctx.fill();

      // Expanding geometric ripple ring
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, MIRAGE_BLOOM_RADIUS * bloomProgress, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }
}

