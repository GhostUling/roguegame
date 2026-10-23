import { describe, expect, it } from 'vitest';
import { findNonFinite, runHeadless } from './headlessEngine';
import { ALL_UPGRADES } from '../cards/upgrades';

describe('predator mode', () => {
  it('starts the hunt with a pilot, a prey and soldiers arriving', () => {
    const run = runHeadless({
      character: 'alpha_prism',
      gameMode: 'predator',
      seed: 3,
      watch: (engine, frame) => {
        expect(findNonFinite(engine), `frame ${frame}`).toBeNull();
        expect(engine.enemies.length).toBeLessThanOrEqual(260);
        // Death is a form change, not a screen: you are never bodyless.
        expect(engine.pilot).not.toBeNull();
        expect(engine.state).toBe('playing');
      },
    });
    try {
      expect(run.engine.pilot).not.toBeNull();
      expect(run.engine.pilot!.form).toBe('chaser');

      run.step(300);
      const engine = run.engine;
      expect(engine.enemies.length).toBeGreaterThan(0);
      expect(engine.player.hp).toBeLessThanOrEqual(engine.player.maxHp);
      expect(engine.player.maxHp).toBeGreaterThan(100);
    } finally {
      run.restore();
    }
  });

  it('scales the prey beyond a normal hull and keeps its own clock', () => {
    const run = runHeadless({
      character: 'alpha_prism',
      gameMode: 'predator',
      seed: 3,
      watch: (engine) => {
        // The clock is the hunt's; it must never count backwards.
        expect(engine.player.hp).toBeLessThanOrEqual(engine.player.maxHp);
      },
    });
    try {
      const normal = runHeadless({
        character: 'alpha_prism',
        gameMode: 'standard',
        seed: 3,
      });
      try {
        expect(run.engine.player.maxHp).toBeGreaterThan(normal.engine.player.maxHp);
      } finally {
        normal.restore();
      }
      run.step(120);
      expect(run.engine.player.maxHp).toBeGreaterThan(100);
    } finally {
      run.restore();
    }
  });

  it('lets a soldier bite the prey on its own cooldown', () => {
    const run = runHeadless({ character: 'alpha_prism', gameMode: 'predator', seed: 5 });
    try {
      run.step(180); // waves have arrived
      const engine = run.engine;
      expect(engine.enemies.length).toBeGreaterThan(0);

      // Keep the pilot out of it so the only possible damage is the bite, and
      // give its soldier-thin hull a body that cannot end mid-assertion.
      engine.pilot!.x = 40;
      engine.pilot!.y = 40;
      engine.pilot!.maxHp = 100000;
      engine.pilot!.hp = 100000;

      const soldier = engine.enemies[0];
      soldier.x = engine.player.x;
      soldier.y = engine.player.y;
      soldier.contactCooldown = 0;

      const before = engine.player.hp;
      run.step(3);
      expect(engine.player.hp).toBeLessThan(before);
    } finally {
      run.restore();
    }
  });

  it('lets your own bite land on the prey', () => {
    const run = runHeadless({ character: 'alpha_prism', gameMode: 'predator', seed: 5 });
    try {
      run.step(2); // before the first wave, so no soldier can muddy the result
      const pilot = run.engine.pilot;
      expect(pilot).not.toBeNull();
      pilot!.x = run.engine.player.x;
      pilot!.y = run.engine.player.y;

      const before = run.engine.player.hp;
      run.step(3);
      expect(run.engine.player.hp).toBeLessThan(before);
    } finally {
      run.restore();
    }
  });

  it('shoots the closest body on it — so biting is what gets you shot', () => {
    const run = runHeadless({ character: 'alpha_prism', gameMode: 'predator', seed: 5 });
    try {
      const engine = run.engine;
      const startHp = engine.pilot!.hp;

      // Hold it at arm's reach on one side: the closest body there is, which is
      // what the hull answers. (Glued to the exact centre, a round is already
      // past you on the frame it spawns — this is the geometry of a bite.)
      let scarred = false;
      for (let frame = 0; frame < 300; frame++) {
        engine.pilot!.x = engine.player.x + 60;
        engine.pilot!.y = engine.player.y;
        engine.pilot!.invulnTimer = 0;
        run.step(1);
        const pilot = engine.pilot!;
        if (pilot.hp < startHp || pilot.hp < pilot.maxHp) scarred = true;
      }

      expect(scarred).toBe(true);
    } finally {
      run.restore();
    }
  });

  it('does not know you are the pilot: at range it shoots the swarm, not you', () => {
    const run = runHeadless({ character: 'alpha_prism', gameMode: 'predator', seed: 5 });
    try {
      run.step(180); // waves have arrived
      const engine = run.engine;
      expect(engine.enemies.length).toBeGreaterThan(0);

      // You, parked in a corner; one soldier, parked on the prey. The soldier is
      // now the closest body, so that is what the hull answers.
      const pilot = engine.pilot!;
      pilot.x = 80;
      pilot.y = 1000;
      pilot.maxHp = 100000;
      pilot.hp = 100000;
      const witness = engine.enemies[0];
      witness.x = engine.player.x + 60;
      witness.y = engine.player.y;
      witness.hp = 100000;
      witness.maxHp = 100000;

      const startHp = pilot.hp;
      for (let frame = 0; frame < 240; frame++) {
        pilot.x = 80;
        pilot.y = 1000;
        witness.x = engine.player.x + 60;
        witness.y = engine.player.y;
        run.step(1);
      }

      // The witness took the fire instead of you.
      expect(pilot.hp).toBe(startHp);
      expect(witness.hp).toBeLessThan(witness.maxHp);
    } finally {
      run.restore();
    }
  });

  it('respawns you straight away from a bound slot, never into the form you lost', () => {
    const run = runHeadless({ character: 'alpha_prism', gameMode: 'predator', seed: 5 });
    try {
      const engine = run.engine;
      engine.bindRespawnSlot(0, 'tank');
      engine.bindRespawnSlot(1, 'speeder');
      expect(engine.respawnSlots).toEqual(['tank', 'speeder', null]);

      // Glue the pilot to the prey so the prey's own rounds reach it, and let it
      // die as many times as it takes to prove the respawn is not a screen.
      for (let frame = 0; frame < 900 && engine.pilot!.form === 'chaser'; frame++) {
        engine.pilot!.x = engine.player.x;
        engine.pilot!.y = engine.player.y;
        engine.pilot!.invulnTimer = 0;
        run.step(1);
        expect(engine.state).toBe('playing');
      }

      expect(engine.pilot!.form).not.toBe('chaser');
      expect(['tank', 'speeder']).toContain(engine.pilot!.form);
      // Binding is not consuming: the slots are still there for the next death.
      expect(engine.respawnSlots).toEqual(['tank', 'speeder', null]);
    } finally {
      run.restore();
    }
  });

  it('hands the prey a free level out of the card pool on the 30s clock', () => {
    const run = runHeadless({
      character: 'alpha_prism',
      gameMode: 'predator',
      seed: 5,
      input: () => ({ x: 0, y: 0 }),
    });
    try {
      const engine = run.engine;
      const poolKeys = ALL_UPGRADES.map((def) => def.key);

      run.step(29 * 60);
      expect(engine.preyUpgradeViews).toHaveLength(0);

      // A 46-strong swarm can eat a 1200 HP hull, and a dead prey ends the run —
      // which would stop the clock this test is measuring. Hold it open.
      engine.player.maxHp = 1_000_000;
      engine.player.hp = 1_000_000;

      run.step(2 * 60);
      expect(engine.preyUpgradeViews).toHaveLength(1);
      const first = engine.preyUpgradeViews[0];
      expect(poolKeys).toContain(first.key);
      expect(first.nameZh.length).toBeGreaterThan(1);
      expect(first.level).toBe(1);

      // Two more beats, and the third has to be a real 30s after the first.
      run.step(61 * 60);
      expect(engine.preyUpgradeViews).toHaveLength(3);
      expect(engine.preyUpgradeViews[2].atTime).toBeGreaterThanOrEqual(89);

      // The ledger is a mirror of the real build, never a parallel story: the
      // level it reports must be one the hull actually has.
      for (const entry of engine.preyUpgradeViews) {
        expect(poolKeys).toContain(entry.key);
        expect(engine.player.upgradeLevels[entry.key]).toBeGreaterThanOrEqual(entry.level);
        expect(engine.player.activeSlots).toContain(entry.key);
      }
    } finally {
      run.restore();
    }
  });
});
