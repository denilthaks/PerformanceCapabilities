import { describe, expect, it } from 'vitest';
import { SCENARIO_MAP } from '../src/content/scenarios';
import {
  advance, availableEvidence, band, blocker, choose, conditionMet, currentStage, decisionStages, inspect, linesFor, medalChecks,
  medalFor, meters, optionAvailable, previousStage, reflect, restoreRun, score, startRun, visibleHotspots, XP_RULES,
} from '../src/engine/scenario-engine';
import type { ExploreStage, NarrativeStage, Run } from '../src/engine/types';
import { noFlags, playThrough } from './helpers';

const gate = SCENARIO_MAP.get('front-gate')!;
const vault = SCENARIO_MAP.get('signal-vault')!;
const lounge = SCENARIO_MAP.get('late-shift')!;
const top = SCENARIO_MAP.get('top-floor')!;
const at = (run: Run, id: string): Run => ({ ...run, stageId: id });

describe('scenario engine: the Grand Lobby', () => {
  it('moves forward one stage at a time', () => {
    const run = advance(gate, startRun(gate), noFlags);
    expect(run.stageId).toBe('investigate');
  });

  it('blocks the investigation until Dana and Kai have been spoken to', () => {
    let run = at(startRun(gate), 'investigate');
    expect(blocker(gate, run, noFlags)).toContain('Dana');
    run = inspect(inspect(run, 'dana'), 'kai');
    expect(blocker(gate, run, noFlags)).toBeNull();
    expect(advance(gate, run, noFlags).stageId).toBe('diagnose');
  });

  it('records evidence once, and counts secrets as discoveries, not evidence', () => {
    let run = at(startRun(gate), 'diagnose');
    run = inspect(inspect(inspect(inspect(run, 'dana'), 'dana'), 'kai'), 'emblem');
    expect(run.inspected).toEqual(['dana', 'kai', 'emblem']);
    const d = decisionStages(gate)[0];
    expect(availableEvidence(gate, d, run, noFlags).some((h) => h.id === 'emblem')).toBe(false);
    run = choose(gate, run, 'diagnose', 'forgot', noFlags);
    expect(run.evidenceAtDecision.diagnose).toEqual({ inspected: 2, available: 9 });
  });

  it('locks the strongest read until you have met Margit or checked the east gate', () => {
    const diag = decisionStages(gate)[0];
    const practice = diag.options.find((o) => o.id === 'practice-gap')!;
    let run = at(startRun(gate), 'diagnose');
    expect(optionAvailable(practice, run)).toBe(false);
    expect(choose(gate, run, 'diagnose', 'practice-gap', noFlags).choices).toEqual({});
    run = inspect(run, 'gate-console');
    expect(optionAvailable(practice, run)).toBe(true);
    expect(choose(gate, run, 'diagnose', 'practice-gap', noFlags).choices.diagnose).toBe('practice-gap');
  });

  it('characters react to what you have already found', () => {
    const investigate = gate.stages.find((s) => s.id === 'investigate') as ExploreStage;
    const kai = investigate.hotspots.find((h) => h.id === 'kai')!;
    const before = linesFor(kai.lines!, startRun(gate), noFlags).map((l) => l.text).join(' ');
    const after = linesFor(kai.lines!, inspect(startRun(gate), 'margit'), noFlags).map((l) => l.text).join(' ');
    expect(before).toContain('I asked once');
    expect(after).toContain('amber light');
    expect(conditionMet({ notInspected: 'margit' }, inspect(startRun(gate), 'margit'), noFlags)).toBe(false);
  });

  it('a decision cannot be changed once made', () => {
    let run = at(startRun(gate), 'diagnose');
    run = choose(gate, run, 'diagnose', 'attitude', noFlags);
    expect(choose(gate, run, 'diagnose', 'forgot', noFlags).choices.diagnose).toBe('attitude');
  });

  it('applies consequences to the meters', () => {
    const run = choose(gate, inspect(at(startRun(gate), 'act'), 'margit'), 'act', 'paired-practice', noFlags);
    expect(meters(gate, run)).toMatchObject({ capability: 7, output: 5, quality: 7 });
    expect(meters(gate, choose(gate, at(startRun(gate), 'act'), 'act', 'warning', noFlags)).trust).toBe(2);
  });

  it('requires a reflection, then scores transparently', () => {
    const run = playThrough(gate, 'strong', true);
    const result = score(gate, run);
    expect(result.overall).toBe(100);
    expect(result.criteria.map((c) => c.id)).toEqual(['evidence', 'diagnosis', 'development', 'impact', 'reflection']);
    expect(result.xp).toBe(XP_RULES.completion + Math.min(XP_RULES.evidenceCap, run.inspected.length * XP_RULES.perEvidence) + XP_RULES.reflection + XP_RULES.reasoning);
    expect(result.flags).toContain('front-gate:paired-practice');
    let r = at(startRun(gate), 'reflect');
    expect(blocker(gate, r, noFlags)).not.toBeNull();
    r = reflect(r, [], '');
    expect(blocker(gate, r, noFlags)).not.toBeNull();
  });

  it('bands describe decisions, not people', () => {
    expect([band(0.9), band(0.5), band(0.1)]).toEqual(['strong', 'developing', 'early']);
  });

  it('Back steps to the previous stage without undoing decisions', () => {
    const run = choose(gate, at(startRun(gate), 'act'), 'act', 'retake', noFlags);
    const back = previousStage(gate, run);
    expect(back.stageId).toBe('diagnose');
    expect(back.choices.act).toBe('retake');
  });
});

describe('medals', () => {
  it('gold for strong decisions on full evidence, silver for sound ones, bronze for finishing', () => {
    expect(medalFor(gate, score(gate, playThrough(gate, 'strong', true)))).toBe('gold');
    // Strong choices, but having skipped evidence: not gold.
    const partial = score(gate, playThrough(gate, (d) => (d === 'diagnose' ? 'mixed' : 'strong'), true));
    expect(medalFor(gate, partial)).toBe('silver');
    expect(medalFor(gate, score(gate, playThrough(gate, 'weak', false)))).toBe('bronze');
    expect(medalFor(gate, null)).toBeNull();
  });

  it('shows every criterion, met or not', () => {
    const checks = medalChecks(gate, score(gate, playThrough(gate, 'weak', false)));
    expect(checks.map((c) => [c.medal, c.met])).toEqual([['bronze', true], ['silver', false], ['gold', false]]);
    expect(checks.every((c) => c.criterion.length > 20)).toBe(true);
  });
});

describe('later floors', () => {
  it('The Vault reveals new evidence only after the first call', () => {
    const second = vault.stages.find((s) => s.id === 'second-look') as ExploreStage;
    let run = startRun(vault);
    expect(visibleHotspots(second, run, noFlags)).toHaveLength(0);
    run = choose(vault, at(run, 'first-call'), 'first-call', 'plan', noFlags);
    expect(visibleHotspots(second, run, noFlags).map((h) => h.id)).toContain('routing-log');
  });

  it('the Lounge\'s delayed consequences apply only once the aftermath is reached', () => {
    let run = choose(lounge, at(startRun(lounge), 'strategy'), 'strategy', 'reward-speed', noFlags);
    const before = meters(lounge, run);
    expect(before.output).toBe(8);
    run = at(run, 'three-months');
    expect(meters(lounge, run).output).toBe(5);
  });

  it('the Top Floor changes with earlier decisions', () => {
    const phase1 = top.stages.find((s) => s.id === 'phase-1') as ExploreStage;
    const ids = (flags: string[]) => visibleHotspots(phase1, startRun(top), { flags: new Set(flags) }).map((h) => h.id);
    expect(ids([])).toContain('drill-log');
    expect(ids([])).not.toContain('kai');
    expect(ids(['front-gate:paired-practice'])).toContain('kai');
  });

  it('the Top Floor resolution reflects choices made in the same run', () => {
    const resolution = top.stages.find((s) => s.id === 'resolution') as NarrativeStage;
    expect(linesFor(resolution.lines, playThrough(top, 'strong'), noFlags).some((l) => l.text.includes('guiding someone'))).toBe(true);
    expect(linesFor(resolution.lines, playThrough(top, 'weak'), noFlags).some((l) => l.text.includes('just as stuck'))).toBe(true);
  });
});

describe('restoreRun', () => {
  it('keeps valid state and drops anything that no longer matches', () => {
    const raw = {
      scenarioId: 'front-gate', stageId: 'act', inspected: ['dana', 'ghost', 'kai'],
      choices: { diagnose: 'forgot', bogus: 'x' }, evidenceAtDecision: { diagnose: { inspected: 2, available: 9 } },
      reflection: null, completed: true,
    } as unknown as Run;
    const run = restoreRun(gate, raw);
    expect(run.inspected).toEqual(['dana', 'kai']);
    expect(run.choices).toEqual({ diagnose: 'forgot' });
    expect(run.completed).toBe(false);
  });

  it('never leaves a run past an unmade decision, and falls back to the start', () => {
    const raw = { ...startRun(gate), stageId: 'reflect' };
    expect(restoreRun(gate, raw).stageId).toBe('diagnose');
    expect(restoreRun(gate, { ...startRun(vault) }).stageId).toBe('arrival');
    expect(currentStage(gate, { ...startRun(gate), stageId: 'nowhere' }).id).toBe('arrival');
  });
});
