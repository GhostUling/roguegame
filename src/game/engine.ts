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
  GameState,
  EnemyType,
  CharacterId,
  SingularityVortex,
  Drone,
  GameMode,
} from './types';
import { sound } from './audio';
import { drawCharacterShip, getCharacterDef } from './characters';
import { drawResonanceArc } from './resonanceArc';
import { getPilotWeaponStats, getTwinPositions, hasPilot } from './pilots';
import { createPlayer } from './player';
import {
  interceptorInterval,
  interceptorShotDamage,
  missileShotDamage,
  railgunInterval,
  railgunShotDamage,
} from './drones';
import { GameModeDef, isPaired, modeOfPlayer } from './modes';
import { ENEMY_TYPES, EnemyTypeDef, enemyHpFor, pickEnemyType } from './enemyTypes';
import { renderScene } from './render/renderer';

export interface GameEngineCallbacks {
  onLevelUp: () => void;
  onGameOver: (stats: {
    survivedTime: number;
    finalLevel: number;
    enemiesKilled: number;
    damageDealt: number;
    score: number;
    gameMode?: GameMode;
    twinPilotId?: CharacterId;
  }) => void;
  onStatsUpdate: (player: Player, timeSeconds: number, bossWarning: boolean) => void;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  /** Viewport size in CSS pixels; read by the renderer. */
  public width: number = 0;
  public height: number = 0;

  // Game state
  public state: GameState = 'title';
  public player: Player;
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public enemyProjectiles: EnemyProjectile[] = [];
  public gems: Gem[] = [];
  public particles: DebrisParticle[] = [];
  public floatingTexts: FloatingText[] = [];
  public shockwaves: Shockwave[] = [];
  public satellites: Satellite[] = [];
  public vortices: SingularityVortex[] = [];

  // System
  private animFrameId: number = 0;
  private lastTime: number = 0;
  private gameTime: number = 0; // seconds
  private callbacks: GameEngineCallbacks;

  // Controls
  private keys: Record<string, boolean> = {};
  public joystickVector: { x: number; y: number } = { x: 0, y: 0 };

  // Game speed multiplier (0.5 / 1 / 2 / 3)
  public timeScale: number = 1;
  /** Scaled clock in ms. All weapon timers read this so they honour `timeScale`. */
  private gameClockMs: number = 0;

  // Pointer steering
  public controlMode: 'keys' | 'mouse' = 'keys';
  public mouseX: number = 0;
  public mouseY: number = 0;
  public mouseInside: boolean = false;

  // Screen shake
  private shakeIntensity: number = 0;
  private shakeDecay: number = 0.9;
  public shakeOffset: { x: number; y: number } = { x: 0, y: 0 };

  // Spawning & timers
  private nextEnemyId: number = 1;
  private nextProjId: number = 1;
  private nextEnemyProjId: number = 1;
  private nextGemId: number = 1;
  private nextParticleId: number = 1;
  private nextTextId: number = 1;
  private nextVortexId: number = 1;
  private nextWaveTimer: number = 0;
  private lastBarragePulse: number = 0;
  private bossSpawnedTimers: Set<number> = new Set();
  public bossWarningActive: boolean = false;
  private bossWarningTimer: number = 0;
  private nextDroneId: number = 1;

  // Visuals & Offscreen Glow Texture Cache
  /** Seconds since the run started, drives every idle animation. */
  public pulseAnimTime: number = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;
    this.callbacks = callbacks;

    this.player = createPlayer('alpha_prism');
    this.handleResize();

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseout', this.handleMouseOut);
  }

  public destroy() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseout', this.handleMouseOut);
  }

  public setControlMode(mode: 'keys' | 'mouse') {
    this.controlMode = mode;
    this.canvas.style.cursor = mode === 'mouse' ? 'none' : 'crosshair';
  }

  private handleMouseMove = (e: MouseEvent) => {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    this.mouseInside = true;
  };

  private handleMouseOut = (e: MouseEvent) => {
    if (!e.relatedTarget) this.mouseInside = false;
  };

  private handleResize = () => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = true;
    if (e.code === 'Space' || e.key === ' ') {
      if (this.state === 'playing') {
        e.preventDefault();
        this.triggerActiveSkill();
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };


  public getTwinPositions(): { p1: { x: number; y: number }; p2: { x: number; y: number } } {
    return getTwinPositions(this.player);
  }

  /** True when the given vessel is flying in the current run (either wing of a twin pair). */
  private hasPilot(id: CharacterId): boolean {
    return hasPilot(this.player, id);
  }

  /** True when two vessels are linked in this run. */
  private isPaired(): boolean {
    return isPaired(this.player);
  }

  /** Tuning knobs for the mode this run is flying. */
  private mode(): GameModeDef {
    return modeOfPlayer(this.player);
  }

  public startNewGame(
    charId: CharacterId = 'alpha_prism',
    gameMode: GameMode = 'standard',
    twinPilotId?: CharacterId
  ) {
    this.player = createPlayer(charId, gameMode, twinPilotId);
    this.player.x = this.width / 2;
    this.player.y = this.height / 2;
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.gems = [];
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.satellites = [];
    this.vortices = [];
    this.gameTime = 0;
    this.nextWaveTimer = 0;
    this.lastBarragePulse = 0;
    this.bossSpawnedTimers.clear();
    this.bossWarningActive = false;
    this.bossWarningTimer = 0;
    this.shakeIntensity = 0;
    this.state = 'playing';

    sound.resume();
    this.lastTime = performance.now();
    cancelAnimationFrame(this.animFrameId);
    this.loop(this.lastTime);
  }

  public resumeGame() {
    this.state = 'playing';
    this.lastTime = performance.now();
    cancelAnimationFrame(this.animFrameId);
    this.loop(this.lastTime);
  }

  public pauseGame() {
    this.state = 'paused';
  }

  public triggerScreenShake(intensity: number) {
    this.shakeIntensity = Math.min(20, this.shakeIntensity + intensity);
  }

  public triggerActiveSkill(): boolean {
    if (this.state !== 'playing') return false;
    if (this.player.skillCooldown > 0) return false;

    this.player.skillCooldown = this.player.skillMaxCooldown;
    const charId = this.player.characterId;
    const twinId = this.player.twinPilotId;

    this.executeCharSkill(charId);
    if (this.isPaired() && twinId) {
      this.executeCharSkill(twinId);
    }
    return true;
  }

  private executeCharSkill(charId: CharacterId) {
    if (charId === 'alpha_prism') {
      const blinkDist = 170;
      let blinkAngle = this.player.angle;
      if (Math.hypot(this.player.vx, this.player.vy) > 0.1) {
        blinkAngle = Math.atan2(this.player.vy, this.player.vx);
      }

      this.shockwaves.push({
        id: Math.random(),
        x: this.player.x,
        y: this.player.y,
        radius: 10,
        maxRadius: 100,
        color: '#00ffcc',
        width: 3,
        life: 0,
        maxLife: 0.3,
      });

      this.player.x += Math.cos(blinkAngle) * blinkDist;
      this.player.y += Math.sin(blinkAngle) * blinkDist;
      const margin = this.player.radius + 10;
      this.player.x = Math.max(margin, Math.min(this.width - margin, this.player.x));
      this.player.y = Math.max(margin, Math.min(this.height - margin, this.player.y));

      this.player.invincibleTimer = 0.6;
      this.shockwaves.push({
        id: Math.random(),
        x: this.player.x,
        y: this.player.y,
        radius: 12,
        maxRadius: 130,
        color: '#ffffff',
        width: 3.5,
        life: 0,
        maxLife: 0.35,
      });

      const blinkDamage = Math.round(this.player.bulletDamage * 1.8);
      for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        if (dx * dx + dy * dy < 130 * 130) {
          enemy.hp -= blinkDamage;
          enemy.hitFlashTimer = 0.08;
          enemy.x += (dx / 130) * 30;
          enemy.y += (dy / 130) * 30;
        }
      }

      this.triggerScreenShake(6);
      sound.playBlink();
      return;
    }

    if (charId === 'beta_phalanx') {
      const distAhead = 90;
      const vx = this.player.x + Math.cos(this.player.angle) * distAhead;
      const vy = this.player.y + Math.sin(this.player.angle) * distAhead;

      this.vortices.push({
        id: this.nextVortexId++,
        x: Math.max(50, Math.min(this.width - 50, vx)),
        y: Math.max(50, Math.min(this.height - 50, vy)),
        radius: 20,
        maxRadius: 240,
        life: 0,
        maxLife: 2.5,
        damagePerSec: this.player.bulletDamage * 1.5,
      });

      this.triggerScreenShake(6);
      sound.playBlackhole();
      return;
    }

    if (charId === 'gamma_viper') {
      this.player.isSkillActive = true;
      this.player.skillActiveTimer = Math.max(this.player.skillActiveTimer, 2.0);
      this.player.lastFireTime = 0;
      this.lastBarragePulse = 0;

      this.triggerScreenShake(5);
      sound.playBarrageStart();
      return;
    }

    if (charId === 'delta_chronos') {
      this.player.isSkillActive = true;
      this.player.skillActiveTimer = Math.max(this.player.skillActiveTimer, 3.5);

      this.shockwaves.push({
        id: Math.random(),
        x: this.player.x,
        y: this.player.y,
        radius: 20,
        maxRadius: Math.max(this.width, this.height) * 0.75,
        color: '#06b6d4',
        width: 4,
        life: 0,
        maxLife: 0.5,
      });

      this.triggerScreenShake(6);
      sound.playTimeSlow();
      return;
    }

    if (charId === 'epsilon_carrier') {
      this.player.isSkillActive = true;
      this.player.skillActiveTimer = Math.max(this.player.skillActiveTimer, 4.0);

      // Deploy 2 temporary assault drones
      this.player.drones.push(
        {
          id: this.nextDroneId++,
          type: 'interceptor',
          angle: Math.random() * Math.PI * 2,
          dist: 65,
          rotSpeed: 3.2,
          lastFireTime: this.gameClockMs,
        },
        {
          id: this.nextDroneId++,
          type: 'interceptor',
          angle: Math.random() * Math.PI * 2,
          dist: 75,
          rotSpeed: -3.2,
          lastFireTime: this.gameClockMs,
        }
      );

      this.shockwaves.push({
        id: Math.random(),
        x: this.player.x,
        y: this.player.y,
        radius: 15,
        maxRadius: 180,
        color: '#10b981',
        width: 3.5,
        life: 0,
        maxLife: 0.4,
      });

      this.triggerScreenShake(7);
      sound.playSwarmDeploy();
      return;
    }

    if (charId === 'zeta_aurora') {
      this.player.isSkillActive = true;
      this.player.skillActiveTimer = Math.max(this.player.skillActiveTimer, 3.0);

      // Freeze all on-screen enemies for 3 seconds
      for (let i = 0; i < this.enemies.length; i++) {
        this.enemies[i].frozenTimer = 3.0;
        this.enemies[i].hitFlashTimer = 0.15;
      }

      // Burst 14 aurora penetrating piercing shards in 360°
      const burstCount = 14;
      const auroraDmg = Math.round(this.player.bulletDamage * 1.5);
      for (let s = 0; s < burstCount; s++) {
        const angle = (s * Math.PI * 2) / burstCount;
        this.projectiles.push({
          id: this.nextProjId++,
          x: this.player.x,
          y: this.player.y,
          vx: Math.cos(angle) * 14,
          vy: Math.sin(angle) * 14,
          damage: auroraDmg,
          pierce: 3,
          radius: 4,
          color: '#00f0ff',
          trail: [],
          isCrit: true,
          life: 0,
          maxLife: 1.2,
          hitEnemyIds: new Set(),
        });
      }

      this.shockwaves.push({
        id: Math.random(),
        x: this.player.x,
        y: this.player.y,
        radius: 20,
        maxRadius: Math.max(this.width, this.height) * 0.7,
        color: '#00f0ff',
        width: 4,
        life: 0,
        maxLife: 0.5,
      });

      this.triggerScreenShake(8);
      sound.playFrostGlaciation();
      return;
    }
  }

  private loop = (timestamp: number) => {
    if (this.state !== 'playing') {
      return;
    }

    const realDt = Math.min((timestamp - this.lastTime) / 1000, 0.08);
    this.lastTime = timestamp;
    const dt = realDt * this.timeScale;

    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  /* ========================================================================= */
  /*                               UPDATE LOGIC                                */
  /* ========================================================================= */
  private update(dt: number) {
    this.gameTime += dt;
    this.gameClockMs += dt * 1000;
    this.pulseAnimTime += dt;

    // 1. Skill Timers & Cooldown
    if (this.player.isSkillActive) {
      this.player.skillActiveTimer -= dt;
      if (this.player.skillActiveTimer <= 0) {
        this.player.isSkillActive = false;
        this.player.skillActiveTimer = 0;
        if (this.hasPilot('epsilon_carrier')) {
          while (this.player.drones.length > Math.max(1, this.player.droneCount)) {
            this.player.drones.pop();
          }
        }
      }
    } else if (this.player.skillCooldown > 0) {
      const prevCd = this.player.skillCooldown;
      this.player.skillCooldown = Math.max(0, this.player.skillCooldown - dt);
      if (prevCd > 0 && this.player.skillCooldown === 0) {
        sound.playSkillReady();
      }
    }

    // 2. Boss schedule & periodic rewards
    this.updateBossSchedule(dt);

    // 3. Update Player Movement & Passives
    this.updatePlayerMovement(dt);

    // 4. Auto Shoot & Barrage
    this.updateAutoShooting();

    // 5. Update Orbit Satellites
    this.updateSatellites(dt);

    // 6. Update Autonomous Drones
    this.updateDrones(dt);

    // 7. Update Supernova Pulse
    this.updateNovaPulse(dt);

    // 8. Update Repulsion Field
    this.updateRepulsionField(dt);

    // 9. Update Nanite Shield Timer
    this.updateNaniteShield(dt);

    // 10. Update Singularity Vortices
    this.updateVortices(dt);

    // 11. Update Player Projectiles (bouncing, cluster, cryo, chain)
    this.updateProjectiles(dt);

    // 12. Update Enemy Projectiles
    this.updateEnemyProjectiles(dt);

    // 13. Spawn & Update Enemies (tactical AI)
    this.updateEnemySpawning(dt);
    this.updateEnemies(dt);

    // 14. Update Gems & Attraction
    this.updateGems(dt);

    // 15. Update Particles & VFX
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.updateShockwaves(dt);

    // 16. Camera Shake
    if (this.shakeIntensity > 0.3) {
      this.shakeOffset.x = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeOffset.y = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
      this.shakeIntensity = 0;
    }

    // 17. Out-of-Combat Health Regeneration (only recovers HP after 3.0s without taking damage)
    this.player.timeSinceLastDamage = (this.player.timeSinceLastDamage || 0) + dt;
    const OUT_OF_COMBAT_REGEN_TIME = 3.0;
    if (this.player.timeSinceLastDamage >= OUT_OF_COMBAT_REGEN_TIME && this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.shieldRegenRate * dt);
      if (Math.random() < 0.15 && this.particles.length < 50) {
        this.particles.push({
          id: this.nextParticleId++,
          x: this.player.x + (Math.random() - 0.5) * 26,
          y: this.player.y + (Math.random() - 0.5) * 26,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -Math.random() * 2 - 1,
          color: '#10b981',
          size: 2.5,
          sides: 3,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: 3,
          life: 0,
          maxLife: 0.4,
        });
      }
    }

    this.callbacks.onStatsUpdate(this.player, this.gameTime, this.bossWarningActive);
  }

  private updateBossSchedule(dt: number) {
    const bossCheckpoints = [120, 240, 360, 480];
    for (const time of bossCheckpoints) {
      if (this.gameTime >= time - 5 && this.gameTime < time && !this.bossSpawnedTimers.has(time)) {
        this.bossWarningActive = true;
        this.bossWarningTimer += dt;
        if (Math.floor(this.bossWarningTimer * 2) % 2 === 0 && Math.random() < 0.05) {
          sound.playBossAlarm();
        }
      } else if (this.gameTime >= time && !this.bossSpawnedTimers.has(time)) {
        this.bossSpawnedTimers.add(time);
        this.bossWarningActive = false;
        // Reward 1 extra reroll on surviving till boss!
        this.player.rerollCount = (this.player.rerollCount || 0) + 1;
        this.spawnBoss();
      }
    }
  }

  private updatePlayerMovement(dt: number) {
    let dx = 0;
    let dy = 0;

    if (this.controlMode === 'mouse') {
      // Chase the pointer: full stick deflection far away, fine control up close.
      const toX = this.mouseX - this.player.x;
      const toY = this.mouseY - this.player.y;
      const dist = Math.hypot(toX, toY);
      if (this.mouseInside && dist > 8) {
        const deflection = Math.min(1, dist / 140);
        dx = (toX / dist) * deflection;
        dy = (toY / dist) * deflection;
      }
    } else {
      if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
      if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
      if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
      if (this.keys['d'] || this.keys['arrowright']) dx += 1;

      if (Math.abs(this.joystickVector.x) > 0.05 || Math.abs(this.joystickVector.y) > 0.05) {
        dx = this.joystickVector.x;
        dy = this.joystickVector.y;
      }
    }

    let currentSpeed = this.player.speed;
    if (this.hasPilot('delta_chronos') && this.player.isSkillActive) {
      currentSpeed *= 1.45;
    }

    const len = Math.hypot(dx, dy);
    if (len > 0.01) {
      const normalizer = len > 1 ? 1 / len : 1;
      this.player.vx = dx * normalizer * currentSpeed;
      this.player.vy = dy * normalizer * currentSpeed;
      this.player.angle = Math.atan2(dy, dx);
    } else {
      this.player.vx *= 0.8;
      this.player.vy *= 0.8;
    }

    this.player.x += this.player.vx * (dt * 60);
    this.player.y += this.player.vy * (dt * 60);

    // A linked pair keeps both wings on screen, so it needs extra horizontal margin.
    const marginY = this.player.radius + 6;
    const marginX = this.player.radius + this.mode().wingSpacing + 6;
    this.player.x = Math.max(marginX, Math.min(this.width - marginX, this.player.x));
    this.player.y = Math.max(marginY, Math.min(this.height - marginY, this.player.y));

    if (this.player.invincibleTimer > 0) {
      this.player.invincibleTimer -= dt;
    }
  }

  private updateAutoShooting() {
    const now = this.gameClockMs;
    const positions = this.getTwinPositions();

    this.updateBarragePulse(0, positions.p1, now);
    this.firePilotWeapon(0, positions.p1, now);

    if (this.isPaired()) {
      this.updateBarragePulse(1, positions.p2, now);
      this.firePilotWeapon(1, positions.p2, now);
    }
  }

  /**
   * Effective weapon profile for one wing. Pilot 1 owns the live stats on `player`;
   * pilot 2 mirrors this run's upgrades as deltas on top of its own chassis base.
   */
  private getPilotWeaponStats(index: 0 | 1) {
    return getPilotWeaponStats(this.player, index);
  }

  private updateBarragePulse(index: 0 | 1, origin: { x: number; y: number }, now: number) {
    const stats = this.getPilotWeaponStats(index);
    if (stats.charId !== 'gamma_viper' || !this.player.isSkillActive) return;

    // A lone gamma owns the pulse clock; a second gamma volleys on the same beat.
    const isLeadGamma = index === 0 || this.getPilotWeaponStats(0).charId !== 'gamma_viper';
    if (isLeadGamma) {
      if (now - this.lastBarragePulse < 130) return;
      this.lastBarragePulse = now;
    }

    const baseA = this.pulseAnimTime * 5;
    const waveDmg = Math.round(stats.bulletDamage * 1.4);
    for (let i = 0; i < 8; i++) {
      const a = baseA + (i * Math.PI) / 4;
      this.projectiles.push({
        id: this.nextProjId++,
        x: origin.x,
        y: origin.y,
        vx: Math.cos(a) * 13,
        vy: Math.sin(a) * 13,
        damage: waveDmg,
        pierce: 3,
        radius: 5,
        color: '#fbbf24',
        trail: [],
        isCrit: true,
        life: 0,
        maxLife: 1.5,
        hitEnemyIds: new Set(),
        bouncesRemaining: this.player.bouncingBullets || 0,
      });
    }
    sound.playShoot(1.3);
  }

  private firePilotWeapon(index: 0 | 1, origin: { x: number; y: number }, now: number) {
    const stats = this.getPilotWeaponStats(index);

    let currentFireRate = stats.fireRate;
    if (stats.charId === 'gamma_viper' && this.player.isSkillActive) {
      currentFireRate = Math.max(75, Math.round(stats.fireRate * 0.25));
    }

    const lastFireTime =
      index === 0 ? this.player.lastFireTime : this.player.pilot2LastFireTime || 0;
    if (now - lastFireTime < currentFireRate) return;
    if (this.enemies.length === 0) return;

    let targetEnemy: Enemy | null = null;
    let minDistSq = Infinity;

    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      const dx = enemy.x - origin.x;
      const dy = enemy.y - origin.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        targetEnemy = enemy;
      }
    }

    if (!targetEnemy) return;
    const maxRangeSq = (Math.max(this.width, this.height) * 1.2) ** 2;
    if (minDistSq > maxRangeSq) return;

    if (index === 0) {
      this.player.lastFireTime = now;
    } else {
      this.player.pilot2LastFireTime = now;
    }

    const baseAngle = Math.atan2(targetEnemy.y - origin.y, targetEnemy.x - origin.x);
    if (index === 0) {
      this.player.angle = baseAngle;
    } else {
      this.player.pilot2Angle = baseAngle;
    }

    const count = stats.bulletCount;
    const spreadAngle = 0.16;
    const startAngle = baseAngle - ((count - 1) * spreadAngle) / 2;

    const isGuaranteedCrit =
      (stats.charId === 'delta_chronos' && this.player.isSkillActive) ||
      (stats.charId === 'zeta_aurora' && this.player.isSkillActive);

    let effectiveCritChance = stats.critChance;
    if (stats.charId === 'gamma_viper') {
      const currentMoveSpd = Math.hypot(this.player.vx, this.player.vy);
      const ratio = Math.min(1.0, currentMoveSpd / Math.max(1, this.player.speed));
      effectiveCritChance = Math.min(0.85, stats.critChance + ratio * 0.28);
    }

    const bulletColor = index === 0 ? '#00ffcc' : getCharacterDef(stats.charId).color;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * spreadAngle;
      const isCrit = isGuaranteedCrit || Math.random() < effectiveCritChance;

      const dmg = Math.round(stats.bulletDamage * (isCrit ? stats.critMultiplier : 1));

      this.projectiles.push({
        id: this.nextProjId++,
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * this.player.bulletSpeed,
        vy: Math.sin(angle) * this.player.bulletSpeed,
        damage: dmg,
        pierce: stats.bulletPierce,
        radius: isCrit ? 5.5 : 4.5,
        color: isCrit ? '#ffee33' : bulletColor,
        trail: [],
        isCrit,
        life: 0,
        maxLife: 2.0,
        hitEnemyIds: new Set(),
        bouncesRemaining: this.player.bouncingBullets || 0,
      });
    }

    sound.playShoot(1 + (count - 1) * 0.05);
  }

  /* ========================================================================= */
  /*                          SUMMONS & DRONES LOGIC                           */
  /* ========================================================================= */
  private updateDrones(dt: number) {
    const desiredInterceptors = this.player.droneCount || 0;
    const now = this.gameClockMs;

    // Sync interceptor drones
    const currentInterceptors = this.player.drones.filter((d) => d.type === 'interceptor');
    while (currentInterceptors.length < desiredInterceptors) {
      const idx = currentInterceptors.length;
      const drone: Drone = {
        id: this.nextDroneId++,
        type: 'interceptor',
        angle: (idx * Math.PI * 2) / Math.max(1, desiredInterceptors),
        dist: 45,
        rotSpeed: 2.4,
        lastFireTime: 0,
      };
      this.player.drones.push(drone);
      currentInterceptors.push(drone);
    }

    // Sync orbital railgun
    if (this.player.droneRailgun) {
      const hasRailgun = this.player.drones.some((d) => d.type === 'railgun');
      if (!hasRailgun) {
        this.player.drones.push({
          id: this.nextDroneId++,
          type: 'railgun',
          angle: 0,
          dist: 75,
          rotSpeed: 1.2,
          lastFireTime: now,
        });
      }
    }

    // Sync guardian aegis drone
    if (this.player.droneShield) {
      const hasGuardian = this.player.drones.some((d) => d.type === 'guardian');
      if (!hasGuardian) {
        this.player.drones.push({
          id: this.nextDroneId++,
          type: 'guardian',
          angle: Math.PI,
          dist: 35,
          rotSpeed: 3.2 * this.player.droneShieldSpinScale,
          lastFireTime: now,
        });
      }
    }

    // Update and fire drones
    const speedBoost = this.player.droneRateScale;

    for (let i = 0; i < this.player.drones.length; i++) {
      const drone = this.player.drones[i];
      drone.angle += drone.rotSpeed * dt * speedBoost;

      const droneX = this.player.x + Math.cos(drone.angle) * drone.dist;
      const droneY = this.player.y + Math.sin(drone.angle) * drone.dist;

      const isCarrier = this.hasPilot('epsilon_carrier');

      if (drone.type === 'interceptor') {
        const fireInterval = interceptorInterval(this.player, isCarrier);

        // 1. Regular plasma shots
        if (now - drone.lastFireTime >= fireInterval && this.enemies.length > 0) {
          // Find closest enemy within 240px
          let target: Enemy | null = null;
          let minDistSq = 240 * 240;
          for (let j = 0; j < this.enemies.length; j++) {
            const e = this.enemies[j];
            const dSq = (e.x - droneX) ** 2 + (e.y - droneY) ** 2;
            if (dSq < minDistSq) {
              minDistSq = dSq;
              target = e;
            }
          }

          if (target) {
            drone.lastFireTime = now;
            const aim = Math.atan2(target.y - droneY, target.x - droneX);
            const droneDmg = interceptorShotDamage(this.player, isCarrier);
            this.projectiles.push({
              id: this.nextProjId++,
              x: droneX,
              y: droneY,
              vx: Math.cos(aim) * 11,
              vy: Math.sin(aim) * 11,
              damage: droneDmg,
              pierce: 1,
              radius: 3.5,
              color: this.hasPilot('epsilon_carrier') ? '#10b981' : '#38bdf8',
              trail: [],
              isCrit: false,
              life: 0,
              maxLife: 1.2,
              hitEnemyIds: new Set(),
            });
          }
        }

        // 2. Micro-Missile barrage (if droneMissiles unlocked)
        if (this.player.droneMissiles) {
          const missileInterval = this.player.droneMissileInterval;
          if (now - (drone.lastMissileTime || 0) >= missileInterval && this.enemies.length > 0) {
            drone.lastMissileTime = now;
            // Target random enemy
            const target = this.enemies[Math.floor(Math.random() * this.enemies.length)];
            const aim = Math.atan2(target.y - droneY, target.x - droneX);
            const missileDmg = missileShotDamage(this.player, isCarrier);
            this.projectiles.push({
              id: this.nextProjId++,
              x: droneX,
              y: droneY,
              vx: Math.cos(aim) * 8.5,
              vy: Math.sin(aim) * 8.5,
              damage: missileDmg,
              pierce: 1,
              radius: 5,
              color: '#f59e0b',
              trail: [],
              isCrit: true,
              isClusterSub: true,
              life: 0,
              maxLife: 2.2,
              hitEnemyIds: new Set(),
            });
            sound.playShoot(0.9);
          }
        }
      } else if (drone.type === 'guardian') {
        // Defensive perimeter drone, pulses gently
      } else if (drone.type === 'railgun') {
        const fireInterval = railgunInterval(this.player, isCarrier);

        if (now - drone.lastFireTime >= fireInterval && this.enemies.length > 0) {
          // Target highest HP enemy
          let bossOrTank: Enemy = this.enemies[0];
          for (let j = 1; j < this.enemies.length; j++) {
            if (this.enemies[j].hp > bossOrTank.hp) {
              bossOrTank = this.enemies[j];
            }
          }

          drone.lastFireTime = now;
          const aim = Math.atan2(bossOrTank.y - droneY, bossOrTank.x - droneX);
          const railDmg = railgunShotDamage(this.player, isCarrier);
          sound.playLaserShot();

          this.projectiles.push({
            id: this.nextProjId++,
            x: droneX,
            y: droneY,
            vx: Math.cos(aim) * 16,
            vy: Math.sin(aim) * 16,
            damage: railDmg,
            pierce: 5,
            radius: 6 * this.player.railgunWidthScale,
            color: this.hasPilot('epsilon_carrier') ? '#f59e0b' : '#a855f7',
            trail: [],
            isCrit: true,
            life: 0,
            maxLife: 1.6,
            hitEnemyIds: new Set(),
          });

          this.triggerScreenShake(3);
        }
      }
    }
  }

  private updateSatellites(dt: number) {
    if (this.player.orbitSatellites <= 0) return;

    const count = this.player.orbitSatellites;
    const speed = 3.5;
    const orbitRadius = 65;

    while (this.satellites.length < count) {
      this.satellites.push({
        angle: (this.satellites.length * (Math.PI * 2)) / count,
        distance: orbitRadius,
        radius: 8,
        damage: Math.round(this.player.bulletDamage * 0.9),
        rotation: 0,
      });
    }

    for (let i = 0; i < this.satellites.length; i++) {
      const sat = this.satellites[i];
      sat.angle += speed * dt;
      sat.rotation += speed * 2 * dt;
      const satX = this.player.x + Math.cos(sat.angle) * sat.distance;
      const satY = this.player.y + Math.sin(sat.angle) * sat.distance;

      for (let j = 0; j < this.enemies.length; j++) {
        const enemy = this.enemies[j];
        const dx = enemy.x - satX;
        const dy = enemy.y - satY;
        const hitR = enemy.radius + sat.radius;
        if (dx * dx + dy * dy < hitR * hitR) {
          enemy.hp -= sat.damage;
          enemy.hitFlashTimer = 0.07;
          sound.playHit();

          if (this.floatingTexts.length < 20) {
            this.addFloatingText(enemy.x, enemy.y, `${sat.damage}`, '#a855f7', false);
          }

          const knockAngle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
          enemy.x += Math.cos(knockAngle) * 5;
          enemy.y += Math.sin(knockAngle) * 5;
        }
      }
    }
  }

  private updateNovaPulse(dt: number) {
    if (this.player.novaInterval <= 0) return;

    this.player.novaTimer += dt * 1000;
    if (this.player.novaTimer >= this.player.novaInterval) {
      this.player.novaTimer = 0;

      if (this.shockwaves.length < 5) {
        this.shockwaves.push({
          id: Math.random(),
          x: this.player.x,
          y: this.player.y,
          radius: 10,
          maxRadius: 280,
          color: '#00ffff',
          width: 4,
          life: 0,
          maxLife: 0.45,
        });
      }

      this.triggerScreenShake(7);
      sound.playExplosion(true);

      const novaDamage = Math.round(this.player.bulletDamage * 2.2);
      for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        if (dx * dx + dy * dy < 260 * 260) {
          enemy.hp -= novaDamage;
          enemy.hitFlashTimer = 0.1;
          const knockAngle = Math.atan2(dy, dx);
          enemy.x += Math.cos(knockAngle) * 45;
          enemy.y += Math.sin(knockAngle) * 45;
        }
      }
    }
  }

  private updateRepulsionField(dt: number) {
    if (!this.player.repulsionField) return;

    this.player.repulsionTimer = (this.player.repulsionTimer || 0) + dt;
    if (this.player.repulsionTimer >= this.player.repulsionInterval) {
      this.player.repulsionTimer = 0;

      this.shockwaves.push({
        id: Math.random(),
        x: this.player.x,
        y: this.player.y,
        radius: 15,
        maxRadius: this.player.repulsionRadius,
        color: '#38bdf8',
        width: 3.5,
        life: 0,
        maxLife: 0.35,
      });

      sound.playClick(true);
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        const dx = e.x - this.player.x;
        const dy = e.y - this.player.y;
        const distSq = dx * dx + dy * dy;
        const repelR = this.player.repulsionRadius;
        if (distSq < repelR * repelR && distSq > 1) {
          const dist = Math.sqrt(distSq);
          e.x += (dx / dist) * 90;
          e.y += (dy / dist) * 90;
          e.hp -= Math.round(this.player.bulletDamage * 0.8);
          e.hitFlashTimer = 0.08;
        }
      }
    }
  }

  private updateNaniteShield(dt: number) {
    if (!this.player.naniteShield) return;

    if (!this.player.naniteShieldActive) {
      this.player.naniteShieldTimer = (this.player.naniteShieldTimer || 0) + dt;
      if (this.player.naniteShieldTimer >= this.player.naniteShieldCooldown) {
        this.player.naniteShieldActive = true;
        this.player.naniteShieldTimer = 0;
        sound.playSkillReady();
      }
    }
  }

  private updateVortices(dt: number) {
    for (let i = this.vortices.length - 1; i >= 0; i--) {
      const v = this.vortices[i];
      v.life += dt;

      for (let j = 0; j < this.enemies.length; j++) {
        const enemy = this.enemies[j];
        const dx = v.x - enemy.x;
        const dy = v.y - enemy.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < v.maxRadius * v.maxRadius) {
          const dist = Math.sqrt(distSq);
          const pullSpeed = Math.min(14, 4 + (1 - dist / v.maxRadius) * 12);
          enemy.x += (dx / Math.max(1, dist)) * pullSpeed * (dt * 60);
          enemy.y += (dy / Math.max(1, dist)) * pullSpeed * (dt * 60);

          if (distSq < 50 * 50) {
            enemy.hp -= v.damagePerSec * dt;
            if (Math.random() < 0.1) {
              enemy.hitFlashTimer = 0.05;
            }
          }
        }
      }

      for (let gIdx = 0; gIdx < this.gems.length; gIdx++) {
        const gem = this.gems[gIdx];
        const dx = v.x - gem.x;
        const dy = v.y - gem.y;
        if (dx * dx + dy * dy < v.maxRadius * v.maxRadius) {
          gem.x += (dx > 0 ? 1 : -1) * 6 * (dt * 60);
          gem.y += (dy > 0 ? 1 : -1) * 6 * (dt * 60);
        }
      }

      if (v.life >= v.maxLife) {
        this.vortices.splice(i, 1);
        this.triggerScreenShake(10);
        sound.playExplosion(true);

        if (this.shockwaves.length < 5) {
          this.shockwaves.push({
            id: Math.random(),
            x: v.x,
            y: v.y,
            radius: 15,
            maxRadius: 200,
            color: '#a855f7',
            width: 4,
            life: 0,
            maxLife: 0.4,
          });
        }

        this.spawnDebris(v.x, v.y, '#c084fc', 12);

        const blastDmg = Math.round(this.player.bulletDamage * 3.2);
        for (let j = 0; j < this.enemies.length; j++) {
          const enemy = this.enemies[j];
          const dx = enemy.x - v.x;
          const dy = enemy.y - v.y;
          if (dx * dx + dy * dy < 180 * 180) {
            enemy.hp -= blastDmg;
            enemy.hitFlashTimer = 0.1;
          }
        }
      }
    }
  }

  private updateProjectiles(dt: number) {
    if (this.projectiles.length > 130) {
      this.projectiles.splice(0, this.projectiles.length - 130);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      p.trail.unshift({ x: p.x, y: p.y, alpha: 1.0 });
      if (p.trail.length > 7) {
        p.trail.pop();
      }
      p.trail.forEach((t) => (t.alpha *= 0.8));

      p.x += p.vx * (dt * 60);
      p.y += p.vy * (dt * 60);
      p.life += dt;

      // Bouncing Matrix Synergy: reflect off canvas border
      if (
        p.bouncesRemaining &&
        p.bouncesRemaining > 0 &&
        (p.x <= 15 || p.x >= this.width - 15 || p.y <= 15 || p.y >= this.height - 15)
      ) {
        if (p.x <= 15 || p.x >= this.width - 15) p.vx = -p.vx;
        if (p.y <= 15 || p.y >= this.height - 15) p.vy = -p.vy;
        p.bouncesRemaining--;
        sound.playClick(true);
      }

      let despawn = p.life >= p.maxLife;

      if (!despawn) {
        for (let eIdx = 0; eIdx < this.enemies.length; eIdx++) {
          const enemy = this.enemies[eIdx];
          if (p.hitEnemyIds.has(enemy.id)) continue;

          const dx = enemy.x - p.x;
          if (dx > 32 || dx < -32) continue;
          const dy = enemy.y - p.y;
          if (dy > 32 || dy < -32) continue;

          const hitR = enemy.radius + p.radius;
          if (dx * dx + dy * dy < hitR * hitR) {
            p.hitEnemyIds.add(enemy.id);

            // Cryo freeze vulnerability (20% bonus damage)
            const dmgMultiplier =
              enemy.frozenTimer && enemy.frozenTimer > 0 ? 1 + this.player.cryoVulnerability : 1.0;
            const finalDmg = Math.round(p.damage * dmgMultiplier);

            enemy.hp -= finalDmg;
            enemy.hitFlashTimer = 0.08;
            this.player.totalDamageDealt += finalDmg;

            // Cryo slow application
            if (this.player.cryoSlow) {
              enemy.frozenTimer = 2.2;
            }

            sound.playHit();

            if (this.floatingTexts.length < 20) {
              this.addFloatingText(
                enemy.x,
                enemy.y - 12,
                p.isCrit ? `CRIT ${finalDmg}` : `${finalDmg}`,
                p.isCrit ? '#ffea00' : '#ffffff',
                p.isCrit
              );
            }

            // Small kinetic knockback
            enemy.x += (p.vx > 0 ? 1 : -1) * 3;
            enemy.y += (p.vy > 0 ? 1 : -1) * 3;

            this.spawnImpactSparks(p.x, p.y, p.color, 3);

            // Refraction Matrix Passive (Alpha Prism): 40% chance on hit to refract 2 secondary shards
            if (
              this.hasPilot('alpha_prism') &&
              !p.isRefractionShard &&
              this.projectiles.length < 115 &&
              Math.random() < 0.4
            ) {
              const baseAngle = Math.atan2(p.vy, p.vx);
              const shardDmg = Math.max(10, Math.round(this.player.bulletDamage * 0.65));
              [-0.65, 0.65].forEach((offsetAngle) => {
                const shardA = baseAngle + offsetAngle;
                this.projectiles.push({
                  id: this.nextProjId++,
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(shardA) * 13,
                  vy: Math.sin(shardA) * 13,
                  damage: shardDmg,
                  pierce: 1,
                  radius: 3.5,
                  color: '#00ffcc',
                  trail: [],
                  isCrit: false,
                  life: 0,
                  maxLife: 0.85,
                  hitEnemyIds: new Set([enemy.id]),
                  isRefractionShard: true,
                });
              });
              this.spawnImpactSparks(enemy.x, enemy.y, '#00ffcc', 4);
              sound.playClick(true);
            }

            // Epsilon Carrier Passive: Drone/shard hits occasionally trigger nanite self-repair
            if (this.hasPilot('epsilon_carrier') && Math.random() < 0.2) {
              const heal = 2;
              this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
            }

            // Cluster Bombs Synergy: split into 3 sub-shards
            if (this.player.clusterBombs && !p.isClusterSub && this.projectiles.length < 110) {
              const baseAngle = Math.atan2(p.vy, p.vx);
              const subDmg = Math.round(p.damage * this.player.clusterBombDamageScale);
              const fragCount = this.player.clusterBombFragments;
              const offsets: number[] = [];
              for (let i = 0; i < fragCount; i++) {
                offsets.push((i - (fragCount - 1) / 2) * 0.4);
              }
              offsets.forEach((offset) => {
                const subA = baseAngle + offset;
                this.projectiles.push({
                  id: this.nextProjId++,
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(subA) * 9,
                  vy: Math.sin(subA) * 9,
                  damage: subDmg,
                  pierce: 1,
                  radius: 3,
                  color: '#fbbf24',
                  trail: [],
                  isCrit: false,
                  life: 0,
                  maxLife: 0.6,
                  hitEnemyIds: new Set([enemy.id]),
                  isClusterSub: true,
                });
              });
            }

            // Tesla Chain Lightning Synergy on crit hit
            if (this.player.chainLightning && p.isCrit) {
              sound.playTeslaArc();
              let chains = 0;
              for (let k = 0; k < this.enemies.length && chains < this.player.chainLightningTargets; k++) {
                const other = this.enemies[k];
                if (other.id !== enemy.id) {
                  const ox = other.x - enemy.x;
                  const oy = other.y - enemy.y;
                  if (ox * ox + oy * oy < 140 * 140) {
                    chains++;
                    const arcDmg = Math.round(p.damage * this.player.chainLightningDamageScale);
                    other.hp -= arcDmg;
                    other.hitFlashTimer = 0.08;
                    if (this.player.chainLightningStun > 0) {
                      other.frozenTimer = Math.max(
                        other.frozenTimer || 0,
                        this.player.chainLightningStun
                      );
                    }
                    this.spawnImpactSparks(other.x, other.y, '#38bdf8', 4);
                  }
                }
              }
            }

            // Executioner Protocol: execute enemies under 25% max HP
            if (
              this.player.executioner &&
              !enemy.isBoss &&
              enemy.hp > 0 &&
              enemy.hp <= enemy.maxHp * this.player.executionerThreshold
            ) {
              enemy.hp = 0;
              this.addFloatingText(enemy.x, enemy.y - 18, 'EXECUTE', '#ef4444', true);
            }

            p.pierce--;
            if (p.pierce <= 0) {
              despawn = true;
              break;
            }
          }
        }
      }

      if (
        p.x < -40 ||
        p.x > this.width + 40 ||
        p.y < -40 ||
        p.y > this.height + 40 ||
        despawn
      ) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateEnemyProjectiles(dt: number) {
    const wings = this.getTwinPositions();

    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.enemyProjectiles[i];
      ep.x += ep.vx * (dt * 60);
      ep.y += ep.vy * (dt * 60);
      ep.life += dt;

      let despawn = ep.life >= ep.maxLife;

      // Guardian drone interception check
      if (!despawn && this.player.droneShield) {
        const guardian = this.player.drones.find((d) => d.type === 'guardian');
        if (guardian) {
          const gx = this.player.x + Math.cos(guardian.angle) * guardian.dist;
          const gy = this.player.y + Math.sin(guardian.angle) * guardian.dist;
          const gDistSq = (ep.x - gx) ** 2 + (ep.y - gy) ** 2;
          if (gDistSq < 26 * 26) {
            despawn = true;
            this.spawnImpactSparks(ep.x, ep.y, '#10b981', 4);
            sound.playClick(true);
          }
        }
      }

      // Player collision — either wing can be struck
      let winged = false;
      let contactX = 0;
      let contactY = 0;
      if (!despawn) {
        const hitRadius = this.player.radius + ep.radius;
        const hitSq = hitRadius * hitRadius;
        const d1 = (wings.p1.x - ep.x) ** 2 + (wings.p1.y - ep.y) ** 2;
        const d2 = (wings.p2.x - ep.x) ** 2 + (wings.p2.y - ep.y) ** 2;
        if (d1 < hitSq) {
          winged = true;
          contactX = wings.p1.x;
          contactY = wings.p1.y;
        } else if (this.isPaired() && d2 < hitSq) {
          winged = true;
          contactX = wings.p2.x;
          contactY = wings.p2.y;
        }
      }

      if (winged) {
        despawn = true;

        if (this.player.naniteShieldActive) {
          // Nanite shield absorbs hit
          this.player.naniteShieldActive = false;
          this.player.naniteShieldTimer = 0;
          this.player.timeSinceLastDamage = 0;
          this.shockwaves.push({
            id: Math.random(),
            x: contactX,
            y: contactY,
            radius: 12,
            maxRadius: this.player.naniteBreakWaveRadius,
            color: '#38bdf8',
            width: 3,
            life: 0,
            maxLife: 0.25,
          });
          sound.playClick(true);
        } else if (this.player.invincibleTimer <= 0) {
          this.player.hp -= ep.damage;
          this.player.timeSinceLastDamage = 0;
          this.player.invincibleTimer = 0.4;
          this.triggerScreenShake(7);
          sound.playPlayerHit();

          if (this.floatingTexts.length < 20) {
            this.addFloatingText(contactX, contactY - 15, `-${ep.damage}`, '#ff2255', true);
          }

          // Retaliation thorns trigger
          if (this.player.retaliationThorns) {
            this.triggerRetaliationThorns();
          }

          if (this.player.hp <= 0) {
            this.handlePlayerDeath();
            return;
          }
        }
      }

      if (
        ep.x < -30 ||
        ep.x > this.width + 30 ||
        ep.y < -30 ||
        ep.y > this.height + 30 ||
        despawn
      ) {
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  private triggerRetaliationThorns() {
    sound.playShoot(1.6);
    const thornDmg = Math.round(this.player.bulletDamage * this.player.thornsDamageScale);
    const thornCount = this.player.thornsCount;
    for (let i = 0; i < thornCount; i++) {
      const a = (i * Math.PI * 2) / thornCount;
      this.projectiles.push({
        id: this.nextProjId++,
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(a) * 12,
        vy: Math.sin(a) * 12,
        damage: thornDmg,
        pierce: this.player.thornsPierce,
        radius: 4,
        color: '#f43f5e',
        trail: [],
        isCrit: true,
        life: 0,
        maxLife: 1.0,
        hitEnemyIds: new Set(),
      });
    }
  }

  private updateEnemySpawning(dt: number) {
    this.nextWaveTimer += dt;
    const spawnInterval = Math.max(0.2, 1.2 - (this.gameTime / 180) * 0.85);

    // A mode that doubles player firepower also doubles the swarm to match.
    const mode = this.mode();
    if (this.enemies.length >= mode.maxAlive) return;

    if (this.nextWaveTimer >= spawnInterval) {
      this.nextWaveTimer = 0;
      const type = pickEnemyType(this.gameTime, Math.random());

      for (let i = 0; i < mode.spawnMultiplier; i++) {
        this.spawnEnemy(type);
      }
    }
  }

  private spawnEnemy(type: EnemyType) {
    const def = ENEMY_TYPES[type];
    const pad = 50;
    let x = 0;
    let y = 0;
    const side = Math.floor(Math.random() * 4);

    if (side === 0) {
      x = Math.random() * this.width;
      y = -pad;
    } else if (side === 1) {
      x = this.width + pad;
      y = Math.random() * this.height;
    } else if (side === 2) {
      x = Math.random() * this.width;
      y = this.height + pad;
    } else {
      x = -pad;
      y = Math.random() * this.height;
    }

    const hp = enemyHpFor(def, this.gameTime, this.enemyGrowthScale());

    this.enemies.push({
      id: this.nextEnemyId++,
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: def.radius,
      hp,
      maxHp: hp,
      speed: def.speed,
      damage: def.damage,
      fillColor: def.fillColor,
      strokeColor: def.strokeColor,
      points: def.sides,
      sides: def.sides,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2,
      hitFlashTimer: 0,
      expValue: def.expValue,
      state: 'idle',
      stateTimer: 0,
      attackCooldown: 1.5 + Math.random() * 2,
    });
  }

  /** Steepens the enemy stat curve for modes that need a harder late game. */
  private enemyGrowthScale(): number {
    return this.mode().growthScale;
  }

  private spawnBoss() {
    const def = ENEMY_TYPES.boss;
    const x = this.width / 2;
    const y = -80;
    const hp = enemyHpFor(def, this.gameTime, this.enemyGrowthScale());

    this.enemies.push({
      id: this.nextEnemyId++,
      type: 'boss',
      x,
      y,
      vx: 0,
      vy: 0,
      radius: def.radius,
      hp,
      maxHp: hp,
      speed: def.speed,
      damage: def.damage,
      fillColor: def.fillColor,
      strokeColor: def.strokeColor,
      points: def.sides,
      sides: def.sides,
      rotation: 0,
      rotSpeed: 1.2,
      hitFlashTimer: 0,
      expValue: def.expValue,
      isBoss: true,
      state: 'idle',
      stateTimer: 0,
      attackCooldown: 3.5,
    });

    this.triggerScreenShake(12);
    sound.playBossAlarm();
  }

  private updateEnemies(dt: number) {
    const isSlowedBySkill = this.hasPilot('delta_chronos') && this.player.isSkillActive;
    const isTwin = this.isPaired();
    const wings = this.getTwinPositions();

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      if (e.hitFlashTimer > 0) e.hitFlashTimer -= dt;
      if (e.attackCooldown && e.attackCooldown > 0) e.attackCooldown -= dt;

      // Cryo freeze slow calculation
      let currentSlow = 1.0;
      if (isSlowedBySkill) currentSlow *= 0.25;
      if (e.frozenTimer && e.frozenTimer > 0) {
        e.frozenTimer -= dt;
        currentSlow *= this.player.cryoSlowMultiplier;
      }

      if (e.hp <= 0) {
        this.killEnemy(e, i);
        continue;
      }

      // Enemies pursue whichever wing is nearer, so a twin pair splits the swarm.
      const d1x = wings.p1.x - e.x;
      const d1y = wings.p1.y - e.y;
      const d1Sq = d1x * d1x + d1y * d1y;
      const d2x = wings.p2.x - e.x;
      const d2y = wings.p2.y - e.y;
      const d2Sq = isTwin ? d2x * d2x + d2y * d2y : Infinity;
      const chasesSecondWing = d2Sq < d1Sq;
      const pdx = chasesSecondWing ? d2x : d1x;
      const pdy = chasesSecondWing ? d2y : d1y;
      const pDist = Math.hypot(pdx, pdy);

      // ==========================================
      // TACTICAL ENEMY BEHAVIOR STATEMACHINES
      // ==========================================
      if (e.type === 'sniper') {
        // Keeps 250px distance and charges laser
        if (pDist < 200) {
          // Back up
          e.vx = -(pdx / pDist) * e.speed * currentSlow;
          e.vy = -(pdy / pDist) * e.speed * currentSlow;
        } else if (pDist > 300) {
          // Approach
          e.vx = (pdx / pDist) * e.speed * currentSlow;
          e.vy = (pdy / pDist) * e.speed * currentSlow;
        } else {
          // Hover
          e.vx *= 0.9;
          e.vy *= 0.9;
        }

        if (e.state === 'idle' && e.attackCooldown && e.attackCooldown <= 0 && pDist < 380) {
          e.state = 'charging';
          e.stateTimer = 0;
          e.aimLocked = false;
          sound.playSniperAim();
        } else if (e.state === 'charging') {
          e.stateTimer = (e.stateTimer || 0) + dt;

          // Phase 1: Real-time aiming / tracking player (0s to 0.7s)
          if (e.stateTimer < 0.7) {
            e.aimAngle = Math.atan2(pdy, pdx);
            e.aimLocked = false;
          } else {
            // Phase 2: PATH IS LOCKED for exactly 0.5s (0.7s to 1.2s)!
            if (!e.aimLocked) {
              e.aimLocked = true;
              sound.playSniperLock(); // Tension warning cue!
            }
            // e.aimAngle remains frozen so the player has 0.5s reaction window to step aside!
          }

          if (e.stateTimer >= 1.2) {
            // Fire laser shot along the locked path
            e.state = 'idle';
            e.stateTimer = 0;
            e.aimLocked = false;
            e.attackCooldown = 3.2;
            sound.playLaserShot();

            const fireAngle = e.aimAngle ?? Math.atan2(pdy, pdx);
            this.enemyProjectiles.push({
              id: this.nextEnemyProjId++,
              x: e.x,
              y: e.y,
              vx: Math.cos(fireAngle) * 11,
              vy: Math.sin(fireAngle) * 11,
              damage: e.damage,
              radius: 4.5,
              color: '#38bdf8',
              life: 0,
              maxLife: 2.0,
            });
          }
        }
      } else if (e.type === 'charger') {
        // Dasher
        if (e.state === 'idle') {
          e.vx = (pdx / pDist) * e.speed * currentSlow;
          e.vy = (pdy / pDist) * e.speed * currentSlow;

          if (pDist < 240 && e.attackCooldown && e.attackCooldown <= 0) {
            e.state = 'charging';
            e.stateTimer = 0;
            e.chargeDir = { x: pdx / pDist, y: pdy / pDist };
            e.vx = 0;
            e.vy = 0;
          }
        } else if (e.state === 'charging') {
          e.stateTimer = (e.stateTimer || 0) + dt;
          // Pulse warning
          if (e.stateTimer >= 0.8) {
            e.state = 'firing';
            e.stateTimer = 0;
            sound.playChargerDash();
          }
        } else if (e.state === 'firing') {
          e.stateTimer = (e.stateTimer || 0) + dt;
          const dashSpeed = e.speed * 3.8 * currentSlow;
          e.vx = (e.chargeDir?.x || 0) * dashSpeed;
          e.vy = (e.chargeDir?.y || 0) * dashSpeed;

          if (e.stateTimer >= 0.5) {
            e.state = 'cooldown';
            e.stateTimer = 0;
            e.vx = 0;
            e.vy = 0;
          }
        } else if (e.state === 'cooldown') {
          e.stateTimer = (e.stateTimer || 0) + dt;
          e.vx *= 0.8;
          e.vy *= 0.8;
          if (e.stateTimer >= 0.9) {
            e.state = 'idle';
            e.attackCooldown = 2.4;
          }
        }
      } else if (e.type === 'boss') {
        // Periodic 16-bullet barrage ring
        const angle = Math.atan2(pdy, pdx);
        e.vx = Math.cos(angle) * e.speed * currentSlow;
        e.vy = Math.sin(angle) * e.speed * currentSlow;

        if (e.attackCooldown && e.attackCooldown <= 0) {
          e.attackCooldown = 4.2;
          sound.playExplosion(false);
          for (let b = 0; b < 16; b++) {
            const bAngle = (b * Math.PI * 2) / 16 + e.rotation;
            this.enemyProjectiles.push({
              id: this.nextEnemyProjId++,
              x: e.x,
              y: e.y,
              vx: Math.cos(bAngle) * 5.5,
              vy: Math.sin(bAngle) * 5.5,
              damage: 18,
              radius: 5,
              color: '#ff0077',
              life: 0,
              maxLife: 3.5,
            });
          }
        }
      } else {
        // Standard chaser / speeder / tank / hive
        const angle = Math.atan2(pdy, pdx);
        e.vx = Math.cos(angle) * e.speed * currentSlow;
        e.vy = Math.sin(angle) * e.speed * currentSlow;
      }

      // Fast soft separation
      const checkLimit = Math.min(this.enemies.length, i + 6);
      for (let j = Math.max(0, i - 6); j < checkLimit; j++) {
        if (i === j) continue;
        const other = this.enemies[j];
        const dx = other.x - e.x;
        if (dx > 30 || dx < -30) continue;
        const dy = other.y - e.y;
        if (dy > 30 || dy < -30) continue;

        const minDist = e.radius + other.radius;
        if (dx * dx + dy * dy < minDist * minDist) {
          e.x -= dx * 0.08;
          e.y -= dy * 0.08;
        }
      }

      e.x += e.vx * (dt * 60);
      e.y += e.vy * (dt * 60);
      e.rotation += e.rotSpeed * dt * currentSlow;

      // Player melee collision — either wing counts as a contact
      const hitRadius = this.player.radius + e.radius;
      const hitSq = hitRadius * hitRadius;
      const wingContact =
        d1Sq < hitSq || (isTwin && d2Sq < hitSq);
      if (wingContact) {
        if (this.player.naniteShieldActive) {
          this.player.naniteShieldActive = false;
          this.player.naniteShieldTimer = 0;
          this.player.timeSinceLastDamage = 0;
          this.shockwaves.push({
            id: Math.random(),
            x: this.player.x,
            y: this.player.y,
            radius: 12,
            maxRadius: this.player.naniteBreakWaveRadius,
            color: '#38bdf8',
            width: 3,
            life: 0,
            maxLife: 0.25,
          });
          sound.playClick(true);
        } else if (this.player.invincibleTimer <= 0) {
          let incomingDmg = e.damage;
          if (this.player.droneShield) {
            incomingDmg = Math.max(1, Math.round(incomingDmg * (1 - this.player.droneShieldReduction)));
          }
          if (this.hasPilot('beta_phalanx')) {
            incomingDmg = Math.round(incomingDmg * 0.8);
            const bounceAngle = Math.atan2(e.y - this.player.y, e.x - this.player.x);
            e.x += Math.cos(bounceAngle) * 25;
            e.y += Math.sin(bounceAngle) * 25;
            e.hp -= 15;
            e.hitFlashTimer = 0.08;
          }

          this.player.hp -= incomingDmg;
          this.player.timeSinceLastDamage = 0;
          this.player.invincibleTimer = 0.45;
          this.triggerScreenShake(8);
          sound.playPlayerHit();

          if (this.floatingTexts.length < 20) {
            this.addFloatingText(this.player.x, this.player.y - 15, `-${incomingDmg}`, '#ff2255', true);
          }

          if (this.player.retaliationThorns) {
            this.triggerRetaliationThorns();
          }

          if (this.player.hp <= 0) {
            this.handlePlayerDeath();
            return;
          }
        }
      }
    }
  }

  private killEnemy(e: Enemy, index: number) {
    this.enemies.splice(index, 1);
    this.player.kills++;
    this.player.score += e.isBoss ? 1500 : Math.round(e.maxHp * 2);

    this.triggerScreenShake(e.isBoss ? 12 : 3);
    sound.playExplosion(e.isBoss);

    this.spawnDebris(e.x, e.y, e.strokeColor, e.isBoss ? 14 : 6);

    // Hive enemy splits into 3 micro triangles on death
    if (e.type === 'hive') {
      for (let s = 0; s < 3; s++) {
        const a = (s * Math.PI * 2) / 3;
        this.enemies.push({
          id: this.nextEnemyId++,
          type: 'speeder',
          x: e.x + Math.cos(a) * 18,
          y: e.y + Math.sin(a) * 18,
          vx: Math.cos(a) * 3,
          vy: Math.sin(a) * 3,
          radius: 8,
          hp: 16,
          maxHp: 16,
          speed: 3.8,
          damage: 8,
          fillColor: '#180a03',
          strokeColor: '#22c55e',
          points: 3,
          sides: 3,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: 3,
          hitFlashTimer: 0,
          expValue: 1,
        });
      }
    }

    // Zeta Aurora Passive: Shattering frozen enemies triggers cryo frost explosion
    if (this.hasPilot('zeta_aurora') && e.frozenTimer && e.frozenTimer > 0) {
      const shatterDmg = Math.round(this.player.bulletDamage * 1.4);
      if (this.shockwaves.length < 5) {
        this.shockwaves.push({
          id: Math.random(),
          x: e.x,
          y: e.y,
          radius: 12,
          maxRadius: 110,
          color: '#00f0ff',
          width: 3.5,
          life: 0,
          maxLife: 0.35,
        });
      }
      this.spawnDebris(e.x, e.y, '#00f0ff', 8);
      for (let j = 0; j < this.enemies.length; j++) {
        const other = this.enemies[j];
        if (other.id !== e.id) {
          const ox = other.x - e.x;
          const oy = other.y - e.y;
          if (ox * ox + oy * oy < 110 * 110) {
            other.hp -= shatterDmg;
            other.frozenTimer = 2.0;
            other.hitFlashTimer = 0.08;
          }
        }
      }
    }

    // Epsilon Carrier Passive: 40% chance on kill to drop +2 HP nanite heal
    if (this.hasPilot('epsilon_carrier') && Math.random() < 0.4) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2);
      if (this.floatingTexts.length < 20) {
        this.addFloatingText(this.player.x, this.player.y - 14, '+2 HP', '#10b981', false);
      }
    }

    const gemCount = e.isBoss ? 6 : 1;
    for (let g = 0; g < gemCount; g++) {
      const scatterAngle = Math.random() * Math.PI * 2;
      const scatterDist = Math.random() * (e.isBoss ? 30 : 8);
      this.gems.push({
        id: this.nextGemId++,
        x: e.x + Math.cos(scatterAngle) * scatterDist,
        y: e.y + Math.sin(scatterAngle) * scatterDist,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        value: e.isBoss ? 5 : e.expValue,
        radius: e.isBoss ? 7 : 5,
        rotation: 0,
        rotSpeed: 3.5,
        color: e.isBoss ? '#00e5ff' : '#00ffaa',
        attracted: false,
      });
    }
  }

  private updateGems(dt: number) {
    if (this.gems.length > 90) {
      const excess = this.gems.length - 90;
      for (let k = 0; k < excess; k++) {
        if (this.gems.length > 1) {
          const removed = this.gems.shift()!;
          this.gems[0].value += removed.value;
        }
      }
    }

    const magnetSq = this.player.magnetRadius * this.player.magnetRadius;
    const isTwin = this.isPaired();
    const wings = this.getTwinPositions();

    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      g.rotation += g.rotSpeed * dt;

      // Gems stream toward the nearer wing and can be banked by either one.
      const e1x = wings.p1.x - g.x;
      const e1y = wings.p1.y - g.y;
      const e1Sq = e1x * e1x + e1y * e1y;
      const e2x = wings.p2.x - g.x;
      const e2y = wings.p2.y - g.y;
      const e2Sq = isTwin ? e2x * e2x + e2y * e2y : Infinity;
      const towardSecond = e2Sq < e1Sq;
      const dx = towardSecond ? e2x : e1x;
      const dy = towardSecond ? e2y : e1y;
      const distSq = towardSecond ? e2Sq : e1Sq;

      if (distSq < magnetSq || g.attracted) {
        g.attracted = true;
        const dist = Math.sqrt(distSq);
        const pullSpeed =
          Math.min(18, 5 + (1 - dist / (this.player.magnetRadius + 100)) * 14) *
          this.player.gemPullSpeedScale;
        g.vx = (dx / Math.max(1, dist)) * pullSpeed;
        g.vy = (dy / Math.max(1, dist)) * pullSpeed;

        g.x += g.vx * (dt * 60);
        g.y += g.vy * (dt * 60);

        const pickupDist = this.player.radius + g.radius + 6;
        const pickupSq = pickupDist * pickupDist;
        const otherWingSq = towardSecond ? e1Sq : e2Sq;
        if (distSq < pickupSq || (isTwin && otherWingSq < pickupSq)) {
          this.gems.splice(i, 1);
          this.collectGem(g);
        }
      } else {
        g.x += g.vx;
        g.y += g.vy;
        g.vx *= 0.95;
        g.vy *= 0.95;
      }
    }
  }

  private collectGem(gem: Gem) {
    this.player.xp += gem.value;
    sound.playExp(Math.min(20, this.player.xp % 10));

    if (this.hasPilot('delta_chronos') && this.player.skillCooldown > 0) {
      this.player.skillCooldown = Math.max(0, this.player.skillCooldown - 0.15);
    }

    if (this.player.xp >= this.player.nextLevelXp) {
      this.handleLevelUp();
    }
  }

  private handleLevelUp() {
    this.player.level++;
    this.player.xp -= this.player.nextLevelXp;
    this.player.nextLevelXp = Math.floor(20 * Math.pow(1.28, this.player.level - 1));

    // Gravity Siphon Synergy: suck all gems on level up
    if (this.player.gravitySiphon) {
      for (let g = 0; g < this.gems.length; g++) {
        this.gems[g].attracted = true;
      }
      if (this.player.gravitySiphonWave) {
        const waveR = Math.max(this.width, this.height) * 0.6;
        this.shockwaves.push({
          id: Math.random(),
          x: this.player.x,
          y: this.player.y,
          radius: 20,
          maxRadius: waveR,
          color: '#a855f7',
          width: 3,
          life: 0,
          maxLife: 0.5,
        });
        for (let i = 0; i < this.enemies.length; i++) {
          const e = this.enemies[i];
          const dx = e.x - this.player.x;
          const dy = e.y - this.player.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 1 && dist < waveR) {
            e.x += (dx / dist) * 70;
            e.y += (dy / dist) * 70;
            e.hp -= Math.round(this.player.bulletDamage * 0.6);
            e.hitFlashTimer = 0.08;
          }
        }
        this.triggerScreenShake(5);
      }
    }

    if (this.shockwaves.length < 5) {
      this.shockwaves.push({
        id: Math.random(),
        x: this.player.x,
        y: this.player.y,
        radius: 12,
        maxRadius: 220,
        color: '#00ffcc',
        width: 4,
        life: 0,
        maxLife: 0.5,
      });
    }

    this.triggerScreenShake(6);
    sound.playUpgrade();

    this.state = 'levelup';
    this.callbacks.onLevelUp();
  }

  private handlePlayerDeath() {
    this.state = 'gameover';
    this.triggerScreenShake(18);
    sound.playExplosion(true);

    this.spawnDebris(this.player.x, this.player.y, '#00ffff', 20);

    this.callbacks.onGameOver({
      survivedTime: Math.floor(this.gameTime),
      finalLevel: this.player.level,
      enemiesKilled: this.player.kills,
      damageDealt: this.player.totalDamageDealt,
      score: this.player.score,
    });
  }

  /* ========================================================================= */
  /*                               VFX HELPERS                                 */
  /* ========================================================================= */
  private spawnDebris(x: number, y: number, color: string, count: number) {
    if (this.particles.length > 50) return;
    for (let i = 0; i < count; i++) {
      const angle = (i * (Math.PI * 2)) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2.5 + Math.random() * 5.5;
      this.particles.push({
        id: this.nextParticleId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
        size: 3 + Math.random() * 4,
        color,
        sides: 3,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 10,
      });
    }
  }

  private spawnImpactSparks(x: number, y: number, color: string, count: number) {
    if (this.particles.length > 60) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.0;
      this.particles.push({
        id: this.nextParticleId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.15 + Math.random() * 0.1,
        size: 2 + Math.random() * 1.5,
        color,
        sides: 3,
        rotation: 0,
        rotSpeed: 5,
      });
    }
  }

  private addFloatingText(
    x: number,
    y: number,
    text: string,
    color: string,
    isCrit: boolean
  ) {
    if (this.floatingTexts.length >= 22) {
      this.floatingTexts.shift();
    }
    this.floatingTexts.push({
      id: this.nextTextId++,
      x: x + (Math.random() - 0.5) * 14,
      y: y + (Math.random() - 0.5) * 8,
      text,
      color,
      life: 0,
      maxLife: isCrit ? 0.7 : 0.45,
      vy: isCrit ? -1.5 : -1.0,
      scale: isCrit ? 1.4 : 1.0,
      isCrit,
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * (dt * 60);
      p.y += p.vy * (dt * 60);
      p.vx *= 0.93;
      p.vy *= 0.93;
      p.rotation += p.rotSpeed * dt;
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy * (dt * 60);
      t.life += dt;
      if (t.life >= t.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private updateShockwaves(dt: number) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.life += dt;
      s.radius += (s.maxRadius - s.radius) * (dt * 8);
      if (s.life >= s.maxLife) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  /* ========================================================================= */
  /*                              RENDER ENGINE                                */
  /* ========================================================================= */
  private render() {
    renderScene(this.ctx, this);
  }
}
