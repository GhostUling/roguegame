import {
  Player,
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
} from '../types';
import { drawCharacterShip, getCharacterDef } from '../characters';
import { drawResonanceArc } from '../resonanceArc';
import { getTwinPositions, hasPilot } from '../pilots';
import { isPaired } from '../modes';
import { TURRET_FADE } from '../turrets';
import { GRID_CELL, GRID_FLASH } from '../gridVerdict';
import { FRIENDLY_COLOR, drawFriendlyMarker } from './friendlyMarker';
import { LANCE_LENGTH, RIFT_SPACING, riftBranch } from '../riftLance';

/**
 * Everything the renderer reads. GameEngine satisfies this shape structurally, so
 * a frame object is passed straight in and no render pass can reach game logic.
 */
export interface RenderState {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
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

  // 11. Draw Thrown Lances & Energy Rays
  renderLances(ctx, frame);
  renderBeams(ctx, frame);

  // 12. Draw Player
  renderPlayer(ctx, frame);

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

/**
 * Grid Verdict's lattice. The cell size is the same constant the engine's scan
 * cuts with, so a line the player can see is a line that bites. One path for the
 * whole lattice, and no glow work per line.
 */
export function renderGridVerdict(ctx: CanvasRenderingContext2D, frame: RenderState) {
  const flash = frame.player.gridFlash;
  if (!flash || flash <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1, flash / GRID_FLASH) * 0.5;
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x <= frame.width; x += GRID_CELL) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, frame.height);
  }
  for (let y = 0; y <= frame.height; y += GRID_CELL) {
    ctx.moveTo(0, y);
    ctx.lineTo(frame.width, y);
  }
  ctx.stroke();

  // A brighter band on each line gives the cut its edge without a second pass.
  ctx.globalAlpha *= 0.6;
  ctx.strokeStyle = '#e9d5ff';
  ctx.lineWidth = 0.75;
  ctx.stroke();
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
