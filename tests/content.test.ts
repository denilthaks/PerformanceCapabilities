import { describe, expect, it } from 'vitest';
import { SCENARIOS, SCENARIO_MAP } from '../src/content/scenarios';
import { ZONES } from '../src/content/zones';
import { CHARACTERS } from '../src/content/characters';
import { GAME_CONCEPTS, LEVELS, PRINCIPLES, SEVEN_STARS } from '../src/content/principles';
import { validateScenario, validateZones } from '../src/engine/validation';
import { playThrough } from './helpers';
import { score } from '../src/engine/scenario-engine';

const refs = {
  characterIds: new Set(CHARACTERS.map((c) => c.id)),
  referenceIds: new Set([...PRINCIPLES.map((p) => p.id), ...LEVELS.map((l) => l.id), ...GAME_CONCEPTS.map((c) => c.id)]),
  scenarioIds: new Set(SCENARIOS.map((s) => s.id)),
};

describe('content', () => {
  it.each(SCENARIOS.map((s) => [s.id, s] as const))('scenario %s is valid', (_, s) => {
    expect(validateScenario(s, refs)).toEqual([]);
  });

  it('zones are valid and every scenario belongs to exactly one zone', () => {
    expect(validateZones(ZONES, SCENARIO_MAP)).toEqual([]);
    expect(new Set(ZONES.flatMap((z) => z.scenarioIds))).toEqual(new Set(SCENARIOS.map((s) => s.id)));
  });

  it('has four zones, and only zones 1–3 claim a published framework level', () => {
    expect(ZONES).toHaveLength(4);
    expect(ZONES.filter((z) => z.publishedLevel).map((z) => z.id)).toEqual(['foundation', 'shift', 'horizon']);
    const trial = ZONES.find((z) => z.id === 'trial')!;
    expect(trial.alignment.toLowerCase()).not.toContain('level 4');
  });

  it('lists 12 principles, 4 per level, and marks unverified ones as placeholders', () => {
    expect(PRINCIPLES).toHaveLength(12);
    for (const level of LEVELS) expect(PRINCIPLES.filter((p) => p.level === level.id)).toHaveLength(4);
    for (const p of PRINCIPLES.slice(4)) {
      expect(p.titleStatus).toBe('placeholder');
      expect(p.summary.toLowerCase()).toContain('placeholder');
    }
  });

  it('does not name or score the seven needs', () => {
    expect(SEVEN_STARS.needsStatus).toBe('placeholder');
  });

  it('every scenario can be completed with the strongest and the weakest choices', () => {
    for (const s of SCENARIOS) {
      for (const q of ['strong', 'weak'] as const) {
        const run = playThrough(s, q);
        expect(run.completed, `${s.id} ${q}`).toBe(true);
      }
    }
  });

  it('strong choices with full evidence score higher than weak choices', () => {
    for (const s of SCENARIOS) {
      const strong = score(s, playThrough(s, 'strong', true)).overall;
      const weak = score(s, playThrough(s, 'weak', false)).overall;
      expect(strong, s.id).toBeGreaterThan(weak);
      expect(strong, s.id).toBe(100);
    }
  });
});
