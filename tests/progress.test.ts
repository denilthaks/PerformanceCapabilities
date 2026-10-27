import { describe, expect, it } from 'vitest';
import {
  createProgressStore, defaultProgress, journeyFlags, reconcileRuns, sanitizeProgress, STORAGE_KEY, totalXp,
  withCompletion, withPlayer, withReplay, withRun, withSettings, isComplete,
} from '../src/engine/progress-store';
import { continuePath, earnedAchievements, zoneState, zoneUnlocked } from '../src/engine/progression';
import { SCENARIO_MAP } from '../src/content/scenarios';
import { ZONES } from '../src/content/zones';
import { score, startRun } from '../src/engine/scenario-engine';
import type { Progress } from '../src/engine/progress-store';
import { memoryStorage, playThrough } from './helpers';

const rig = SCENARIO_MAP.get('stalled-rig')!;

function complete(progress: Progress, id: string, quality: 'strong' | 'weak' = 'strong', note = ''): Progress {
  const s = SCENARIO_MAP.get(id)!;
  const run = playThrough(s, quality, true, { flags: journeyFlags(progress) });
  const result = score(s, run);
  return withCompletion(progress, run, result, {
    principleIds: s.principleIds,
    insights: [],
    journal: { id: `${id}-${Date.now()}`, scenarioId: id, at: 1, prompt: 'p', selected: ['x'], note },
  });
}

describe('progress store', () => {
  it('round-trips progress through storage', () => {
    const storage = memoryStorage();
    const store = createProgressStore(storage);
    const p = complete(withPlayer(defaultProgress(), 'Ada', 'onyx'), 'stalled-rig');
    expect(store.save(p)).toBe(true);
    const loaded = store.load();
    expect(loaded.player).toEqual({ name: 'Ada', avatar: 'onyx' });
    expect(isComplete(loaded, 'stalled-rig')).toBe(true);
    expect(loaded.scenarios['stalled-rig'].last?.overall).toBe(100);
  });

  it('survives corrupted, foreign and hostile data', () => {
    const storage = memoryStorage();
    const store = createProgressStore(storage);
    storage.setItem(STORAGE_KEY, '{not json');
    expect(store.load()).toEqual(defaultProgress());
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, player: { name: 'X' } }));
    expect(store.load().player).toBeNull();
    const hostile = sanitizeProgress({
      version: 1,
      player: { name: '<img src=x onerror=alert(1)>\u0000' + 'a'.repeat(100), avatar: 'dragon' },
      scenarios: { 'BAD ID': {}, 'stalled-rig': { bestXp: 1e12, bestOverall: 500, completions: -4, run: { scenarioId: 'other' } } },
      achievements: ['ok', 42, '../../etc'],
      settings: { motion: 'warp', graphics: 'off' },
    });
    expect(hostile.player!.name.length).toBeLessThanOrEqual(24);
    expect(hostile.player!.avatar).toBe('ember');
    expect(Object.keys(hostile.scenarios)).toEqual(['stalled-rig']);
    expect(hostile.scenarios['stalled-rig'].bestOverall).toBe(100);
    expect(hostile.scenarios['stalled-rig'].completions).toBe(0);
    expect(hostile.scenarios['stalled-rig'].run).toBeNull();
    expect(hostile.achievements).toEqual(['ok']);
    expect(hostile.settings).toEqual({ motion: 'system', textSize: 'normal', graphics: 'off' });
  });

  it('works without storage (private mode) and reports it', () => {
    const store = createProgressStore(null);
    expect(store.available).toBe(false);
    expect(store.save(defaultProgress())).toBe(false);
    expect(store.load()).toEqual(defaultProgress());
  });

  it('reset clears saved progress', () => {
    const storage = memoryStorage();
    const store = createProgressStore(storage);
    store.save(withPlayer(defaultProgress(), 'Ada', 'ember'));
    store.reset();
    expect(store.load().player).toBeNull();
  });

  it('replays keep the best score and do not stack XP', () => {
    let p = complete(withPlayer(defaultProgress(), 'Ada', 'ember'), 'stalled-rig', 'strong');
    const best = totalXp(p);
    p = withReplay(p, 'stalled-rig');
    expect(p.scenarios['stalled-rig'].run).toBeNull();
    p = complete(p, 'stalled-rig', 'weak');
    expect(totalXp(p)).toBe(best);
    expect(p.scenarios['stalled-rig'].completions).toBe(2);
    expect(p.scenarios['stalled-rig'].history).toHaveLength(2);
    expect(p.scenarios['stalled-rig'].last?.overall).toBeLessThan(100);
  });

  it('saving the same completed run twice counts it once', () => {
    const s = rig;
    const run = playThrough(s, 'strong');
    const result = score(s, run);
    const extras = { principleIds: [], insights: [], journal: null };
    let p = withCompletion(defaultProgress(), run, result, extras);
    p = withCompletion(p, run, result, extras);
    expect(p.scenarios['stalled-rig'].completions).toBe(1);
  });

  it('records evidence as it is uncovered, and keeps settings valid', () => {
    let run = startRun(rig);
    run = { ...run, inspected: ['dana', 'error-log'] };
    const p = withRun(defaultProgress(), run);
    expect(p.evidence).toEqual(['stalled-rig/dana', 'stalled-rig/error-log']);
    expect(withSettings(p, { textSize: 'large' }).settings.textSize).toBe('large');
  });

  it('reconciles saved runs with current content', () => {
    const p = withRun(defaultProgress(), { ...startRun(rig), inspected: ['ghost', 'kai'] });
    const r = reconcileRuns({ ...p, scenarios: { ...p.scenarios, removed: p.scenarios['stalled-rig'] } }, SCENARIO_MAP);
    expect(r.scenarios['stalled-rig'].run!.inspected).toEqual(['kai']);
    expect(r.scenarios.removed).toBeUndefined();
  });
});

describe('progression', () => {
  it('locks everything until a character exists, then opens Zone 1 only', () => {
    let p = defaultProgress();
    expect(continuePath(p, ZONES)).toBe('/create');
    expect(ZONES.every((z) => !zoneUnlocked(p, z, ZONES))).toBe(true);
    p = withPlayer(p, 'Ada', 'ember');
    expect(ZONES.map((z) => zoneState(p, z, ZONES))).toEqual(['open', 'locked', 'locked', 'locked']);
    expect(continuePath(p, ZONES)).toBe('/zone/foundation');
  });

  it('unlocks zones in order and resumes an in-progress run first', () => {
    let p = withPlayer(defaultProgress(), 'Ada', 'ember');
    p = withRun(p, { ...startRun(rig), stageId: 'investigate' });
    expect(continuePath(p, ZONES)).toBe('/play/stalled-rig');
    expect(zoneState(p, ZONES[0], ZONES)).toBe('in-progress');
    p = complete(p, 'stalled-rig');
    expect(zoneState(p, ZONES[1], ZONES)).toBe('open');
    expect(zoneState(p, ZONES[2], ZONES)).toBe('locked');
    p = complete(p, 'signal-room');
    p = complete(p, 'meridian-launch');
    expect(zoneState(p, ZONES[3], ZONES)).toBe('open');
    p = complete(p, 'crucible');
    expect(ZONES.every((z) => zoneState(p, z, ZONES) === 'complete')).toBe(true);
    expect(continuePath(p, ZONES)).toBe('/progress');
  });

  it('earlier decisions carry into later scenarios through flags', () => {
    let p = withPlayer(defaultProgress(), 'Ada', 'ember');
    p = complete(p, 'stalled-rig', 'strong');
    expect(journeyFlags(p).has('stalled-rig:paired-practice')).toBe(true);
    p = complete(withReplay(p, 'stalled-rig'), 'stalled-rig', 'weak');
    expect(journeyFlags(p).has('stalled-rig:paired-practice')).toBe(false);
  });

  it('awards achievements for learning behaviours', () => {
    let p = withPlayer(defaultProgress(), 'Ada', 'ember');
    expect(earnedAchievements(p, ZONES, SCENARIO_MAP)).toEqual(['first-step']);
    p = complete(p, 'stalled-rig', 'strong', 'note one');
    let a = earnedAchievements(p, ZONES, SCENARIO_MAP);
    expect(a).toContain('foundation-laid');
    expect(a).toContain('evidence-first');
    expect(a).toContain('archivist');
    p = complete(p, 'signal-room', 'strong', 'note two');
    p = complete(p, 'meridian-launch', 'strong', 'note three');
    p = complete(p, 'crucible', 'strong');
    a = earnedAchievements(p, ZONES, SCENARIO_MAP);
    for (const id of ['assumption-breaker', 'wider-lens', 'journal-keeper', 'integrated', 'constellation']) expect(a).toContain(id);
    expect(a).not.toContain('second-look');
  });
});
