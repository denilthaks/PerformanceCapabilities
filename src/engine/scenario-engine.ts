// Pure scenario rules: no DOM, React or storage. Every function takes the
// current run and returns a new one, so state transitions are predictable and
// unit-testable.

import type {
  ChoiceCriterion, Condition, CriterionId, CriterionResult, DecisionStage, ExploreStage, Hotspot,
  Line, Option, Result, Run, Scenario, Stage,
} from './types';

export interface Context {
  /** Flags from earlier scenarios (see Condition). */
  flags: ReadonlySet<string>;
}

export const XP_RULES = {
  completion: 30,
  perEvidence: 5,
  evidenceCap: 50,
  reflection: 15,
  /** Scaled by the overall rubric score (0–100%). */
  reasoning: 50,
} as const;

export const CRITERION_LABELS: Record<CriterionId, string> = {
  evidence: 'Evidence gathering',
  diagnosis: 'Diagnosis',
  development: 'Developing capability',
  impact: 'Wider impact',
  reflection: 'Reflection',
};

export const CRITERION_QUESTIONS: Record<CriterionId, string> = {
  evidence: 'Did you look at the available evidence before deciding?',
  diagnosis: 'Did your decision address the underlying problem rather than the visible symptom?',
  development: 'Did your decision build capability, rather than only removing the problem for now?',
  impact: 'Did your decision account for the other people and the wider system it affects?',
  reflection: 'Did you stop to reflect on your approach? (Completion only; what you write is never scored.)',
};

export function conditionMet(cond: Condition | undefined, run: Run, ctx: Context): boolean {
  if (!cond) return true;
  if (cond.flag && !ctx.flags.has(cond.flag)) return false;
  if (cond.notFlag && ctx.flags.has(cond.notFlag)) return false;
  if (cond.choice) {
    const picked = run.choices[cond.choice.decision];
    const allowed = Array.isArray(cond.choice.option) ? cond.choice.option : [cond.choice.option];
    if (!picked || !allowed.includes(picked)) return false;
  }
  return true;
}

export function linesFor(lines: Line[], run: Run, ctx: Context): Line[] {
  return lines.filter((l) => conditionMet(l.when, run, ctx));
}

export function stageIndex(scenario: Scenario, stageId: string): number {
  return scenario.stages.findIndex((s) => s.id === stageId);
}

export function currentStage(scenario: Scenario, run: Run): Stage {
  const i = stageIndex(scenario, run.stageId);
  return scenario.stages[i >= 0 ? i : 0];
}

export function startRun(scenario: Scenario): Run {
  return {
    scenarioId: scenario.id,
    stageId: scenario.stages[0].id,
    inspected: [],
    choices: {},
    evidenceAtDecision: {},
    reflection: null,
    completed: false,
  };
}

export function decisionStages(scenario: Scenario): DecisionStage[] {
  return scenario.stages.filter((s): s is DecisionStage => s.kind === 'decision');
}

export function exploreStages(scenario: Scenario): ExploreStage[] {
  return scenario.stages.filter((s): s is ExploreStage => s.kind === 'explore');
}

export function hotspotVisible(h: Hotspot, run: Run, ctx: Context): boolean {
  if (h.revealAfter && !run.choices[h.revealAfter]) return false;
  return conditionMet(h.when, run, ctx);
}

export function visibleHotspots(stage: ExploreStage, run: Run, ctx: Context): Hotspot[] {
  return stage.hotspots.filter((h) => hotspotVisible(h, run, ctx));
}

/** Hotspot ids are unique per scenario, so inspection is tracked by id alone. */
export function inspect(run: Run, hotspotId: string): Run {
  if (run.completed || run.inspected.includes(hotspotId)) return run;
  return { ...run, inspected: [...run.inspected, hotspotId] };
}

export function missingRequired(stage: ExploreStage, run: Run, ctx: Context): Hotspot[] {
  return visibleHotspots(stage, run, ctx).filter((h) => stage.required.includes(h.id) && !run.inspected.includes(h.id));
}

export function availableEvidence(scenario: Scenario, decision: DecisionStage, run: Run, ctx: Context): Hotspot[] {
  return exploreStages(scenario)
    .filter((s) => decision.evidenceFrom.includes(s.id))
    .flatMap((s) => visibleHotspots(s, run, ctx));
}

export function choose(scenario: Scenario, run: Run, decisionId: string, optionId: string, ctx: Context): Run {
  const decision = decisionStages(scenario).find((d) => d.id === decisionId);
  if (!decision || run.completed || run.choices[decisionId]) return run;
  if (!decision.options.some((o) => o.id === optionId)) return run;
  const available = availableEvidence(scenario, decision, run, ctx);
  const inspected = available.filter((h) => run.inspected.includes(h.id)).length;
  return {
    ...run,
    choices: { ...run.choices, [decisionId]: optionId },
    evidenceAtDecision: { ...run.evidenceAtDecision, [decisionId]: { inspected, available: available.length } },
  };
}

export function reflect(run: Run, selected: string[], note: string): Run {
  if (run.completed) return run;
  return { ...run, reflection: { selected: [...new Set(selected)], note: note.slice(0, 2000) } };
}

export function chosenOption(scenario: Scenario, run: Run, decisionId: string): Option | null {
  const decision = decisionStages(scenario).find((d) => d.id === decisionId);
  const id = run.choices[decisionId];
  return decision?.options.find((o) => o.id === id) ?? null;
}

/** Why the player can't continue yet, or null when they can. */
export function blocker(scenario: Scenario, run: Run, ctx: Context): string | null {
  const stage = currentStage(scenario, run);
  switch (stage.kind) {
    case 'explore': {
      const missing = missingRequired(stage, run, ctx);
      return missing.length ? `Still to investigate: ${missing.map((h) => h.label).join(', ')}.` : null;
    }
    case 'decision':
      return run.choices[stage.id] ? null : 'Make a decision to continue.';
    case 'reflection':
      return run.reflection && run.reflection.selected.length ? null : 'Choose at least one reflection to continue.';
    default:
      return null;
  }
}

export function advance(scenario: Scenario, run: Run, ctx: Context): Run {
  if (run.completed || blocker(scenario, run, ctx)) return run;
  const i = stageIndex(scenario, run.stageId);
  if (i >= scenario.stages.length - 1) return { ...run, completed: true };
  return { ...run, stageId: scenario.stages[i + 1].id };
}

/** Step back one stage to review it. Decisions already made are kept. */
export function previousStage(scenario: Scenario, run: Run): Run {
  const i = stageIndex(scenario, run.stageId);
  if (i <= 0 || run.completed) return run;
  return { ...run, stageId: scenario.stages[i - 1].id };
}

function clampMeter(v: number): number {
  return Math.max(0, Math.min(10, v));
}

/**
 * Meter values after the decisions made so far. Delayed ("later") effects
 * count only once the run has reached the aftermath stage that reveals them.
 */
export function meters(scenario: Scenario, run: Run): Record<string, number> {
  const values: Record<string, number> = {};
  for (const m of scenario.meters) values[m.id] = m.start;
  const reached = run.completed ? scenario.stages.length : stageIndex(scenario, run.stageId);
  for (const decision of decisionStages(scenario)) {
    const option = chosenOption(scenario, run, decision.id);
    if (!option) continue;
    for (const [k, v] of Object.entries(option.outcome.effects)) if (k in values) values[k] = clampMeter(values[k] + (v ?? 0));
    const aftermath = scenario.stages.findIndex((s) => s.kind === 'aftermath' && s.decision === decision.id);
    if (aftermath >= 0 && reached >= aftermath) {
      for (const [k, v] of Object.entries(option.outcome.laterEffects ?? {})) if (k in values) values[k] = clampMeter(values[k] + (v ?? 0));
    }
  }
  return values;
}

export function flagsFor(scenario: Scenario, run: Run): string[] {
  const flags = new Set<string>();
  for (const decision of decisionStages(scenario)) {
    const option = chosenOption(scenario, run, decision.id);
    for (const f of option?.flags ?? []) flags.add(`${scenario.id}:${f}`);
  }
  return [...flags];
}

function choiceCriterion(scenario: Scenario, run: Run, criterion: ChoiceCriterion): CriterionResult | null {
  let points = 0;
  let max = 0;
  const notes: string[] = [];
  for (const decision of decisionStages(scenario)) {
    if (!decision.options.some((o) => o.rubric[criterion] !== undefined)) continue;
    max += 2;
    const option = chosenOption(scenario, run, decision.id);
    const p = option?.rubric[criterion] ?? 0;
    points += p;
    notes.push(`${decision.title}: ${p}/2`);
  }
  if (!max) return null;
  return { id: criterion, score: points / max, detail: notes.join(' · ') };
}

export function score(scenario: Scenario, run: Run): Result {
  const criteria: CriterionResult[] = [];
  for (const id of scenario.criteria) {
    if (id === 'evidence') {
      const records = decisionStages(scenario)
        .map((d) => ({ d, e: run.evidenceAtDecision[d.id] }))
        .filter((r) => r.e && r.e.available > 0);
      if (!records.length) continue;
      const mean = records.reduce((s, r) => s + r.e.inspected / r.e.available, 0) / records.length;
      criteria.push({
        id,
        score: mean,
        detail: records.map((r) => `${r.d.title}: ${r.e.inspected} of ${r.e.available} sources examined first`).join(' · '),
      });
    } else if (id === 'reflection') {
      const done = Boolean(run.reflection && run.reflection.selected.length);
      criteria.push({ id, score: done ? 1 : 0, detail: done ? 'Reflection completed.' : 'No reflection recorded.' });
    } else {
      const r = choiceCriterion(scenario, run, id);
      if (r) criteria.push(r);
    }
  }
  const overall = criteria.length ? Math.round((criteria.reduce((s, c) => s + c.score, 0) / criteria.length) * 100) : 0;
  const evidenceXp = Math.min(XP_RULES.evidenceCap, run.inspected.length * XP_RULES.perEvidence);
  const xp = run.completed
    ? XP_RULES.completion + evidenceXp + (run.reflection ? XP_RULES.reflection : 0) + Math.round((overall / 100) * XP_RULES.reasoning)
    : 0;
  return {
    scenarioId: scenario.id,
    criteria,
    overall,
    xp,
    meters: meters(scenario, run),
    choices: { ...run.choices },
    flags: flagsFor(scenario, run),
  };
}

export type Band = 'strong' | 'developing' | 'early';

/** Describes decisions in this scenario, never the player as a person. */
export function band(scoreValue: number): Band {
  if (scoreValue >= 0.75) return 'strong';
  if (scoreValue >= 0.4) return 'developing';
  return 'early';
}

/**
 * Re-check a saved run against the current content: unknown stages, options
 * and hotspots are dropped so an edited scenario can't strand a player.
 */
export function restoreRun(scenario: Scenario, raw: Run): Run {
  const run = startRun(scenario);
  if (!raw || raw.scenarioId !== scenario.id) return run;
  const hotspotIds = new Set(exploreStages(scenario).flatMap((s) => s.hotspots.map((h) => h.id)));
  const choices: Record<string, string> = {};
  const evidenceAtDecision: Run['evidenceAtDecision'] = {};
  for (const d of decisionStages(scenario)) {
    const picked = raw.choices?.[d.id];
    if (typeof picked === 'string' && d.options.some((o) => o.id === picked)) {
      choices[d.id] = picked;
      const e = raw.evidenceAtDecision?.[d.id];
      if (e && Number.isInteger(e.inspected) && Number.isInteger(e.available) && e.inspected >= 0 && e.inspected <= e.available) {
        evidenceAtDecision[d.id] = { inspected: e.inspected, available: e.available };
      } else {
        evidenceAtDecision[d.id] = { inspected: 0, available: 0 };
      }
    }
  }
  const stageOk = stageIndex(scenario, raw.stageId) >= 0;
  const reflection = raw.reflection && Array.isArray(raw.reflection.selected)
    ? { selected: raw.reflection.selected.filter((s) => typeof s === 'string').slice(0, 20), note: typeof raw.reflection.note === 'string' ? raw.reflection.note.slice(0, 2000) : '' }
    : null;
  const restored: Run = {
    ...run,
    stageId: stageOk ? raw.stageId : run.stageId,
    inspected: Array.isArray(raw.inspected) ? [...new Set(raw.inspected.filter((h) => typeof h === 'string' && hotspotIds.has(h)))] : [],
    choices,
    evidenceAtDecision,
    reflection,
  };
  // A stage can't be ahead of an unmade decision.
  for (const d of decisionStages(scenario)) {
    if (!choices[d.id] && stageIndex(scenario, restored.stageId) > stageIndex(scenario, d.id)) {
      restored.stageId = d.id;
      break;
    }
  }
  restored.completed = raw.completed === true && decisionStages(scenario).every((d) => choices[d.id]) && Boolean(reflection?.selected.length);
  return restored;
}
