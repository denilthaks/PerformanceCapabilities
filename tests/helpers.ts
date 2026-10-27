import type { Quality, Run, Scenario } from '../src/engine/types';
import { advance, choose, currentStage, inspect, reflect, startRun, visibleHotspots, type Context } from '../src/engine/scenario-engine';

export const noFlags: Context = { flags: new Set() };

/**
 * Play a scenario to the end. `pick` chooses an option quality per decision;
 * `inspectAll` inspects every visible hotspot, otherwise only required ones.
 */
export function playThrough(scenario: Scenario, pick: Quality | ((decisionId: string) => Quality), inspectAll = true, ctx: Context = noFlags): Run {
  let run = startRun(scenario);
  for (let guard = 0; guard < 50 && !run.completed; guard++) {
    const stage = currentStage(scenario, run);
    if (stage.kind === 'explore') {
      for (const h of visibleHotspots(stage, run, ctx)) if (inspectAll || stage.required.includes(h.id)) run = inspect(run, h.id);
    } else if (stage.kind === 'decision') {
      const quality = typeof pick === 'function' ? pick(stage.id) : pick;
      const option = stage.options.find((o) => o.quality === quality) ?? stage.options.find((o) => o.quality === 'mixed') ?? stage.options[0];
      run = choose(scenario, run, stage.id, option.id, ctx);
    } else if (stage.kind === 'reflection') {
      run = reflect(run, [stage.options[0].id], 'A note.');
    }
    run = advance(scenario, run, ctx);
  }
  return run;
}

export function memoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => { data.set(k, v); },
    removeItem: (k: string) => { data.delete(k); },
  };
}
