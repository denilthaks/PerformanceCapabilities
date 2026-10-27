import { describe, expect, it } from 'vitest';
import { SCENARIOS, SCENARIO_MAP } from '../src/content/scenarios';
import { ZONES } from '../src/content/zones';
import { CHARACTERS } from '../src/content/characters';
import { GAME_CONCEPTS, LEVELS, PRINCIPLES, SEVEN_STARS } from '../src/content/principles';
import { validateScenario, validateZones } from '../src/engine/validation';
import { MEMO_IDS } from '../src/engine/progression';
import { decisionStages, exploreStages, score } from '../src/engine/scenario-engine';
import { playThrough } from './helpers';

const refs = {
  characterIds: new Set(CHARACTERS.map((c) => c.id)),
  referenceIds: new Set([...PRINCIPLES.map((p) => p.id), ...LEVELS.map((l) => l.id), ...GAME_CONCEPTS.map((c) => c.id)]),
  scenarioIds: new Set(SCENARIOS.map((s) => s.id)),
};
const ALL_FLAGS = { flags: new Set(['front-gate:paired-practice', 'signal-vault:redesigned-routing', 'late-shift:shared-measure']) };

describe('content', () => {
  it.each(SCENARIOS.map((s) => [s.id, s] as const))('scenario %s is valid', (_, s) => {
    expect(validateScenario(s, refs)).toEqual([]);
  });

  it('zones are the four floors, each with one scenario in its own room', () => {
    expect(validateZones(ZONES, SCENARIO_MAP)).toEqual([]);
    expect(ZONES.map((z) => z.room)).toEqual(['lobby', 'vault', 'lounge', 'executive']);
    for (const z of ZONES) for (const id of z.scenarioIds) expect(SCENARIO_MAP.get(id)!.room).toBe(z.room);
  });

  it('only zones 1–3 claim a published framework level', () => {
    expect(ZONES.filter((z) => z.publishedLevel).map((z) => z.id)).toEqual(['foundation', 'shift', 'horizon']);
    expect(ZONES[3].alignment.toLowerCase()).not.toContain('level 4');
  });

  it('lists 12 principles, 4 per level, and marks unverified ones as placeholders', () => {
    expect(PRINCIPLES).toHaveLength(12);
    for (const level of LEVELS) expect(PRINCIPLES.filter((p) => p.level === level.id)).toHaveLength(4);
    for (const p of PRINCIPLES.slice(4)) expect(p.titleStatus).toBe('placeholder');
    expect(SEVEN_STARS.needsStatus).toBe('placeholder');
  });

  it('keeps framework jargon out of in-play feedback (it lives in the debrief and journal)', () => {
    for (const s of SCENARIOS) {
      for (const d of decisionStages(s)) for (const o of d.options) {
        expect(o.feedback, `${s.id}/${o.id}`).not.toMatch(/\bPrinciple \d|\bLevel \d|Transactional|Transformational|Transcendental/);
      }
    }
  });

  it('hides one founder\'s memo on every floor', () => {
    for (const m of MEMO_IDS) {
      const [sid, hid] = m.split('/');
      const h = exploreStages(SCENARIO_MAP.get(sid)!).flatMap((st) => st.hotspots).find((x) => x.id === hid);
      expect(h?.secret, m).toBe(true);
    }
  });

  it('every scenario can be completed with strong or weak choices, with or without earlier decisions', () => {
    for (const s of SCENARIOS) for (const ctx of [undefined, ALL_FLAGS]) for (const q of ['strong', 'weak'] as const) {
      expect(playThrough(s, q, true, ctx).completed, `${s.id} ${q}`).toBe(true);
      expect(playThrough(s, q, false, ctx).completed, `${s.id} ${q} minimal`).toBe(true);
    }
  });

  it('a thorough, strong playthrough scores 100%; a careless one scores lower', () => {
    for (const s of SCENARIOS) for (const ctx of [undefined, ALL_FLAGS]) {
      const strong = score(s, playThrough(s, 'strong', true, ctx)).overall;
      const weak = score(s, playThrough(s, 'weak', false, ctx)).overall;
      expect(strong, s.id).toBe(100);
      expect(weak, s.id).toBeLessThan(strong);
    }
  });

  it('exploring is what opens the strongest choices: skipping optional people locks them', () => {
    for (const s of SCENARIOS) {
      const minimal = score(s, playThrough(s, 'strong', false)).overall;
      expect(minimal, s.id).toBeLessThan(100);
    }
  });
});
