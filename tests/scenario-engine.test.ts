import { describe, expect, it } from 'vitest';
import { SCENARIO_MAP } from '../src/content/scenarios';
import {
  advance, band, blocker, choose, currentStage, inspect, meters, previousStage, reflect, restoreRun, score,
  startRun, visibleHotspots, XP_RULES, linesFor,
} from '../src/engine/scenario-engine';
import type { ExploreStage, NarrativeStage, Run } from '../src/engine/types';
import { noFlags, playThrough } from './helpers';

const rig = SCENARIO_MAP.get('stalled-rig')!;
const signal = SCENARIO_MAP.get('signal-room')!;
const meridian = SCENARIO_MAP.get('meridian-launch')!;
const crucible = SCENARIO_MAP.get('crucible')!;

function toStage(scenarioRun: Run, id: string): Run {
  return { ...scenarioRun, stageId: id };
}

describe('scenario engine: Zone 1 vertical slice', () => {
  it('starts at the first stage and moves forward one stage at a time', () => {
    let run = startRun(rig);
    expect(run.stageId).toBe('arrival');
    run = advance(rig, run, noFlags);
    expect(run.stageId).toBe('investigate');
  });

  it('blocks the investigation until the required people have been spoken to', () => {
    let run = toStage(startRun(rig), 'investigate');
    expect(blocker(rig, run, noFlags)).toContain('Dana Reyes');
    expect(advance(rig, run, noFlags)).toBe(run);
    run = inspect(run, 'dana');
    run = inspect(run, 'kai');
    expect(blocker(rig, run, noFlags)).toBeNull();
    expect(advance(rig, run, noFlags).stageId).toBe('diagnose');
  });

  it('inspecting twice records the evidence once', () => {
    const run = inspect(inspect(startRun(rig), 'dana'), 'dana');
    expect(run.inspected).toEqual(['dana']);
  });

  it('records how much evidence was examined at the moment of each decision', () => {
    let run = toStage(startRun(rig), 'diagnose');
    run = inspect(inspect(inspect(run, 'dana'), 'kai'), 'error-log');
    run = choose(rig, run, 'diagnose', 'practice-gap', noFlags);
    expect(run.evidenceAtDecision.diagnose).toEqual({ inspected: 3, available: 7 });
  });

  it('a decision cannot be changed once made, and unknown options are ignored', () => {
    let run = toStage(startRun(rig), 'diagnose');
    run = choose(rig, run, 'diagnose', 'attitude', noFlags);
    expect(choose(rig, run, 'diagnose', 'practice-gap', noFlags).choices.diagnose).toBe('attitude');
    expect(choose(rig, startRun(rig), 'diagnose', 'nope', noFlags).choices).toEqual({});
  });

  it('applies consequences to the meters', () => {
    let run = toStage(startRun(rig), 'act');
    run = choose(rig, run, 'act', 'paired-practice', noFlags);
    const m = meters(rig, run);
    expect(m.capability).toBe(6);
    expect(m.output).toBe(5);
    const weak = choose(rig, toStage(startRun(rig), 'act'), 'act', 'warning', noFlags);
    expect(meters(rig, weak).trust).toBe(2);
  });

  it('requires a reflection before completing, then scores transparently', () => {
    let run = playThrough(rig, 'strong', true);
    expect(run.completed).toBe(true);
    const result = score(rig, run);
    expect(result.overall).toBe(100);
    expect(result.criteria.map((c) => c.id)).toEqual(['evidence', 'diagnosis', 'development', 'impact', 'reflection']);
    expect(result.xp).toBe(XP_RULES.completion + 7 * XP_RULES.perEvidence + XP_RULES.reflection + XP_RULES.reasoning);
    expect(result.flags).toContain('stalled-rig:paired-practice');

    run = toStage(startRun(rig), 'reflect');
    expect(blocker(rig, run, noFlags)).not.toBeNull();
    run = reflect(run, [], '');
    expect(blocker(rig, run, noFlags)).not.toBeNull();
  });

  it('weak choices with minimal evidence score low, but the band describes decisions, not the person', () => {
    const result = score(rig, playThrough(rig, 'weak', false));
    expect(result.overall).toBeLessThan(50);
    expect(band(0.9)).toBe('strong');
    expect(band(0.5)).toBe('developing');
    expect(band(0.1)).toBe('early');
  });

  it('Back steps to the previous stage without undoing decisions', () => {
    let run = toStage(startRun(rig), 'act');
    run = choose(rig, run, 'act', 'retake', noFlags);
    const back = previousStage(rig, run);
    expect(back.stageId).toBe('diagnose');
    expect(back.choices.act).toBe('retake');
  });
});

describe('scenario engine: later zones', () => {
  it('The Shift reveals new evidence only after the first decision', () => {
    let run = startRun(signal);
    const second = signal.stages.find((s) => s.id === 'second-look') as ExploreStage;
    expect(visibleHotspots(second, run, noFlags)).toHaveLength(0);
    run = choose(signal, toStage(run, 'first-call'), 'first-call', 'plan', noFlags);
    expect(visibleHotspots(second, run, noFlags).map((h) => h.id)).toContain('routing-log');
  });

  it('delayed consequences in The Horizon apply only once the aftermath is reached', () => {
    let run = choose(meridian, toStage(startRun(meridian), 'strategy'), 'strategy', 'reward-speed', noFlags);
    const before = meters(meridian, run);
    expect(before.output).toBe(8); // locally successful
    run = toStage(run, 'three-months');
    const after = meters(meridian, run);
    expect(after.output).toBe(5);
    expect(after.cohesion).toBeLessThan(before.cohesion);
  });

  it('The Crucible changes with earlier decisions', () => {
    const phase1 = crucible.stages.find((s) => s.id === 'phase-1') as ExploreStage;
    const run = startRun(crucible);
    const without = visibleHotspots(phase1, run, noFlags).map((h) => h.id);
    const withKai = visibleHotspots(phase1, run, { flags: new Set(['stalled-rig:paired-practice']) }).map((h) => h.id);
    expect(without).toContain('drill-log');
    expect(without).not.toContain('kai');
    expect(withKai).toContain('kai');
    const alarm = crucible.stages.find((s) => s.id === 'alarm') as NarrativeStage;
    expect(linesFor(alarm.lines, run, noFlags).length).toBe(linesFor(alarm.lines, run, { flags: new Set(['stalled-rig:paired-practice']) }).length);
  });

  it('The Crucible resolution reflects choices made in the same run', () => {
    let run = playThrough(crucible, 'strong');
    const resolution = crucible.stages.find((s) => s.id === 'resolution') as NarrativeStage;
    expect(linesFor(resolution.lines, run, noFlags).some((l) => l.text.includes('guiding someone'))).toBe(true);
    run = playThrough(crucible, 'weak');
    expect(linesFor(resolution.lines, run, noFlags).some((l) => l.text.includes('just as stuck'))).toBe(true);
  });
});

describe('restoreRun', () => {
  it('keeps valid state and drops anything that no longer matches the content', () => {
    const raw = {
      scenarioId: 'stalled-rig', stageId: 'act', inspected: ['dana', 'ghost', 'kai'],
      choices: { diagnose: 'practice-gap', bogus: 'x' },
      evidenceAtDecision: { diagnose: { inspected: 2, available: 7 } },
      reflection: null, completed: true,
    } as unknown as Run;
    const run = restoreRun(rig, raw);
    expect(run.inspected).toEqual(['dana', 'kai']);
    expect(run.choices).toEqual({ diagnose: 'practice-gap' });
    expect(run.stageId).toBe('act');
    expect(run.completed).toBe(false); // can't be complete without every decision and a reflection
  });

  it('never leaves a run past an unmade decision', () => {
    const raw = { scenarioId: 'stalled-rig', stageId: 'reflect', inspected: [], choices: {}, evidenceAtDecision: {}, reflection: null, completed: false } as Run;
    expect(restoreRun(rig, raw).stageId).toBe('diagnose');
  });

  it('starts fresh for another scenario\'s run or an unknown stage', () => {
    expect(restoreRun(rig, { ...startRun(signal) }).stageId).toBe('arrival');
    expect(restoreRun(rig, { ...startRun(rig), stageId: 'nowhere' }).stageId).toBe('arrival');
  });

  it('the current stage falls back to the first stage', () => {
    expect(currentStage(rig, { ...startRun(rig), stageId: 'nowhere' }).id).toBe('arrival');
  });
});
