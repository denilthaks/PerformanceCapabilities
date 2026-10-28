import { describe, expect, it } from 'vitest';
import { frontGate } from '../src/content/scenarios/front-gate';
import { advance, choose, inspect, startRun } from '../src/engine/scenario-engine';
import { blankSave, load, persist, recordFinish, resumeScreen, sanitise, SAVE_KEY, startFresh } from '../prototype/state.js';

const ctx = { flags: new Set<string>() };
function memory() {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), data };
}

describe('prototype save', () => {
  it('starts blank with no player', () => {
    const s = blankSave(frontGate);
    expect(s.player).toBeNull();
    expect(s.run.stageId).toBe('arrival');
    expect(resumeScreen(frontGate, s)).toBe('select');
  });

  it('round-trips through storage under its own key', () => {
    const store = memory();
    const s = startFresh(blankSave(frontGate), frontGate, { name: 'Alex', look: 'onyx' });
    expect(persist(store, s)).toBe(true);
    expect([...store.data.keys()]).toEqual([SAVE_KEY]);
    expect(SAVE_KEY).not.toBe('pc-journey.progress');
    expect(load(store, frontGate)).toEqual(s);
  });

  it('rejects bad names, unknown looks, junk runs and out-of-room positions', () => {
    const s = sanitise({ v: 1, player: { name: '\u0000  ', look: 'onyx' }, run: { stageId: 'act' }, pos: { x: 9999, y: -4 } }, frontGate);
    expect(s.player).toBeNull();
    expect(s.run).toEqual(startRun(frontGate));
    expect(s.pos).toEqual(frontGate.start);
    expect(sanitise({ v: 1, player: { name: 'Sam', look: 'hacker' } }, frontGate).player).toBeNull();
    expect(sanitise('nonsense', frontGate)).toEqual(blankSave(frontGate));
    expect(load({ getItem: () => '{not json' }, frontGate)).toEqual(blankSave(frontGate));
  });

  it('drops hotspots and options that are not in the scenario', () => {
    const s = sanitise({
      v: 1,
      player: { name: 'Sam', look: 'ember' },
      run: { scenarioId: 'front-gate', stageId: 'investigate', inspected: ['kai', 'made-up'], choices: { diagnose: 'not-an-option' }, evidenceAtDecision: {}, reflection: null, completed: false },
    }, frontGate);
    expect(s.run.inspected).toEqual(['kai']);
    expect(s.run.choices).toEqual({});
  });

  it('clamps best results', () => {
    const s = sanitise({ v: 1, best: { xp: 10 ** 9, medal: 'platinum', completions: -3 } }, frontGate);
    expect(s.best).toEqual({ xp: 100000, medal: null, completions: 0 });
  });

  it('resumes on the screen that matches the run', () => {
    let s = startFresh(blankSave(frontGate), frontGate, { name: 'Sam', look: 'vanta' });
    expect(resumeScreen(frontGate, s)).toBe('lobby');
    let run = advance(frontGate, s.run, ctx); // to investigate
    run = inspect(inspect(run, 'dana'), 'kai');
    run = advance(frontGate, run, ctx); // to diagnose
    s = { ...s, run };
    expect(resumeScreen(frontGate, s)).toBe('decision');
    s = { ...s, run: choose(frontGate, run, 'diagnose', 'forgot', ctx) };
    expect(resumeScreen(frontGate, s)).toBe('feedback');
  });

  it('keeps the best medal and XP across replays', () => {
    let s = blankSave(frontGate);
    s = recordFinish(s, 145, 'gold');
    s = recordFinish(s, 90, 'bronze');
    expect(s.best).toEqual({ xp: 145, medal: 'gold', completions: 2 });
  });
});
