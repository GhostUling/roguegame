import { describe, expect, it } from 'vitest';
import { ALL_UPGRADES } from './upgrades';
import { CODEX_DETAILS, synergyLabel } from './codexData';

describe('codex coverage', () => {
  it('covers every upgrade, with no orphan entries', () => {
    const upgradeKeys = ALL_UPGRADES.map((u) => u.key).sort();
    const codexKeys = Object.keys(CODEX_DETAILS).sort();
    expect(codexKeys).toEqual(upgradeKeys);
  });

  it('lists exactly maxLevel rungs on every ladder', () => {
    for (const u of ALL_UPGRADES) {
      const detail = CODEX_DETAILS[u.key];
      expect(detail, u.key).toBeDefined();
      // The ladder length is what the modal prints as "共 N 个等级阶段" and what
      // drives its Lv.N / MAX badge, so it must match the data table.
      expect(detail.levels.length, u.key).toBe(u.maxLevel);
    }
  });

  it('gives every rung a non-empty title and description', () => {
    for (const u of ALL_UPGRADES) {
      for (const [idx, lvl] of CODEX_DETAILS[u.key].levels.entries()) {
        expect(lvl.title.trim(), `${u.key} Lv.${idx + 1}`).not.toBe('');
        expect(lvl.description.trim(), `${u.key} Lv.${idx + 1}`).not.toBe('');
      }
    }
  });

  it('fills in the flavor fields every entry renders', () => {
    for (const u of ALL_UPGRADES) {
      const detail = CODEX_DETAILS[u.key];
      for (const field of ['quote', 'primaryRole', 'recommendedArchetype', 'tacticalTip'] as const) {
        expect(detail[field].trim(), `${u.key}.${field}`).not.toBe('');
      }
    }
  });
});

describe('codex synergies', () => {
  it('only points at upgrades that exist', () => {
    const keys = new Set(ALL_UPGRADES.map((u) => u.key));
    for (const u of ALL_UPGRADES) {
      for (const syn of CODEX_DETAILS[u.key].synergies) {
        expect(keys.has(syn.targetKey), `${u.key} -> ${syn.targetKey}`).toBe(true);
      }
    }
  });

  it('never points an upgrade at itself', () => {
    for (const u of ALL_UPGRADES) {
      for (const syn of CODEX_DETAILS[u.key].synergies) {
        expect(syn.targetKey, u.key).not.toBe(u.key);
      }
    }
  });

  it('gives every synergy card a non-empty title and description', () => {
    for (const u of ALL_UPGRADES) {
      for (const syn of CODEX_DETAILS[u.key].synergies) {
        expect(syn.synergyTitle.trim(), `${u.key} -> ${syn.targetKey}`).not.toBe('');
        expect(syn.description.trim(), `${u.key} -> ${syn.targetKey}`).not.toBe('');
      }
    }
  });
});

describe('synergyLabel', () => {
  it('reads the name from the upgrade table instead of a second copy', () => {
    for (const u of ALL_UPGRADES) {
      expect(synergyLabel(u.key)).toBe(u.nameZh);
    }
  });

  it('reveals the raw key when the pointer is unknown', () => {
    expect(synergyLabel('no_such_upgrade')).toBe('no_such_upgrade');
  });
});
