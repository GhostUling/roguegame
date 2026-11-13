import { describe, expect, it } from 'vitest';
import {
  RESONANCE_SYNERGIES,
  hasResonanceSynergy,
  getActiveResonanceSynergies,
  getSynergyHintsForCard,
  getSynergyLedger,
  isEnemyUnderSpatialControl,
  ownsSuperWeapon,
} from '../systems/resonanceSynergies';
import { createPlayer } from '../core/player';

describe('Resonance Cross-Skill Synergies (超阶神兵联动)', () => {
  it('defines 5 distinct cross-skill synergies', () => {
    expect(RESONANCE_SYNERGIES).toHaveLength(5);
    const ids = new Set(RESONANCE_SYNERGIES.map((s) => s.id));
    expect(ids.size).toBe(5);
  });

  it('activates each synergy only when both sides are owned', () => {
    const p = createPlayer('alpha_prism', 'resonance');
    expect(getActiveResonanceSynergies(p)).toHaveLength(0);

    // meteor_ion = singularity_meteor + divine_ion_beam
    p.meteorLevel = 1;
    expect(ownsSuperWeapon(p, 'singularity_meteor')).toBe(true);
    expect(hasResonanceSynergy(p, 'meteor_ion')).toBe(false);
    p.ionLevel = 1;
    expect(hasResonanceSynergy(p, 'meteor_ion')).toBe(true);
    // Also unlocks rift_judgment (divine_ion_beam + singularity_meteor)
    expect(hasResonanceSynergy(p, 'rift_judgment')).toBe(true);

    // iaijutsu_mirage
    p.voidIaijutsuLevel = 1;
    expect(hasResonanceSynergy(p, 'iaijutsu_mirage')).toBe(false);
    p.mirageLevel = 1;
    expect(hasResonanceSynergy(p, 'iaijutsu_mirage')).toBe(true);
    // prism_aegis + mirage_blades activates aegis_arsenal
    p.aegisLevel = 1;
    expect(hasResonanceSynergy(p, 'aegis_arsenal')).toBe(true);

    // gaster_babylon
    p.gasterLevel = 1;
    expect(hasResonanceSynergy(p, 'gaster_babylon')).toBe(false);
    p.babylonLevel = 1;
    expect(hasResonanceSynergy(p, 'gaster_babylon')).toBe(true);

    expect(getActiveResonanceSynergies(p)).toHaveLength(5);
  });

  it('surfaces willComplete hints when one half of a pair is already held', () => {
    const p = createPlayer('alpha_prism', 'resonance');
    p.meteorLevel = 1;

    const hints = getSynergyHintsForCard(p, 'divine_ion_beam');
    const meteorIon = hints.find((h) => h.synergy.id === 'meteor_ion');
    expect(meteorIon).toBeDefined();
    expect(meteorIon?.willComplete).toBe(true);
    expect(meteorIon?.alreadyActive).toBe(false);

    const ledger = getSynergyLedger(p);
    const entry = ledger.find((i) => i.synergy.id === 'meteor_ion');
    expect(entry?.hasHalf).toBe(true);
    expect(entry?.active).toBe(false);
  });

  it('detects enemies under spatial control (Iaijutsu stun or Meteor gravity zone)', () => {
    expect(isEnemyUnderSpatialControl({ x: 100, y: 100, stunTimer: 0.5 }, [])).toBe(true);
    expect(isEnemyUnderSpatialControl({ x: 100, y: 100, stunTimer: 0 }, [])).toBe(false);
    expect(
      isEnemyUnderSpatialControl(
        { x: 120, y: 120, stunTimer: 0 },
        [{ targetX: 100, targetY: 100, pullRadius: 200 }]
      )
    ).toBe(true);
    expect(
      isEnemyUnderSpatialControl(
        { x: 500, y: 500, stunTimer: 0 },
        [{ targetX: 100, targetY: 100, pullRadius: 200 }]
      )
    ).toBe(false);
  });
});
