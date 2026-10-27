// Browser-side progress for the prototype. localStorage is user-controlled,
// so everything read back is treated as untrusted: validated and clamped.
// This is a single-browser demonstration store, not secure multi-user
// persistence: anyone with access to the browser can read or edit it.

import type { Result, Run, Scenario } from './types';
import { MEDALS, restoreRun, type Medal } from './scenario-engine';

export const STORAGE_KEY = 'pc-journey.progress';
// v2: Halcyon Tower (new scenario ids, medals, discovered outcomes). v1 saves start fresh.
export const SCHEMA_VERSION = 2;
export const AVATARS = ['ember', 'onyx', 'vanta', 'signal'] as const;
export const MAX_NAME_LENGTH = 24;
const MAX_XP = 100000;
const MAX_JOURNAL = 200;
const MAX_HISTORY = 10;
const ID = /^[a-z0-9-]{1,64}$/;

export type Avatar = (typeof AVATARS)[number];
export type Motion = 'system' | 'reduce' | 'full';
export type TextSize = 'normal' | 'large';

export interface Settings {
  motion: Motion;
  textSize: TextSize;
  /** Interface sound effects. */
  sound: boolean;
  /** Spoken dialogue (the browser's text-to-speech). */
  voice: boolean;
}

export interface HistoryEntry {
  at: number;
  choices: Record<string, string>;
  overall: number;
}

export interface ScenarioRecord {
  /** In-progress (or just finished) run. */
  run: Run | null;
  completions: number;
  bestOverall: number;
  bestXp: number;
  /** Result of the most recent completed run, shown on the debrief screen. */
  last: Result | null;
  history: HistoryEntry[];
  /** Best medal earned on this floor. */
  bestMedal: Medal | null;
}

export interface JournalEntry {
  id: string;
  scenarioId: string;
  at: number;
  prompt: string;
  selected: string[];
  note: string;
}

export interface Progress {
  version: number;
  player: { name: string; avatar: Avatar } | null;
  scenarios: Record<string, ScenarioRecord>;
  achievements: string[];
  journal: JournalEntry[];
  /** Evidence records collected, as "scenarioId/hotspotId". */
  evidence: string[];
  /** Principle ids the player has met in feedback. */
  principles: string[];
  /** Decisions that earned an insight fragment, as "scenarioId/decisionId". */
  insights: string[];
  /** Outcomes the player has seen, as "scenarioId/decisionId/optionId". Drives replay discovery. */
  outcomes: string[];
  settings: Settings;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function defaultSettings(): Settings {
  return { motion: 'system', textSize: 'normal', sound: true, voice: true };
}

export function defaultProgress(): Progress {
  return {
    version: SCHEMA_VERSION, player: null, scenarios: {}, achievements: [], journal: [],
    evidence: [], principles: [], insights: [], outcomes: [], settings: defaultSettings(),
  };
}

export function emptyRecord(): ScenarioRecord {
  return { run: null, completions: 0, bestOverall: 0, bestXp: 0, last: null, history: [], bestMedal: null };
}

function clampInt(value: unknown, max = MAX_XP): number {
  return Number.isInteger(value) && (value as number) > 0 ? Math.min(value as number, max) : 0;
}

export function cleanName(value: unknown): string {
  if (typeof value !== 'string') return '';
  // Drop control characters; the UI always renders names as text, never HTML.
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_NAME_LENGTH);
}

function stringList(raw: unknown, pattern: RegExp, max: number): string[] {
  return Array.isArray(raw) ? [...new Set(raw.filter((v): v is string => typeof v === 'string' && pattern.test(v)))].slice(0, max) : [];
}

function sanitizePlayer(raw: unknown): Progress['player'] {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  return {
    name: cleanName(r.name) || 'Traveller',
    avatar: (AVATARS as readonly string[]).includes(r.avatar as string) ? (r.avatar as Avatar) : AVATARS[0],
  };
}

function sanitizeSettings(raw: unknown): Settings {
  const settings = defaultSettings();
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if (['system', 'reduce', 'full'].includes(r.motion as string)) settings.motion = r.motion as Motion;
    if (['normal', 'large'].includes(r.textSize as string)) settings.textSize = r.textSize as TextSize;
    if (typeof r.sound === 'boolean') settings.sound = r.sound;
    if (typeof r.voice === 'boolean') settings.voice = r.voice;
  }
  return settings;
}

function sanitizeChoices(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) if (ID.test(k) && typeof v === 'string' && ID.test(v)) out[k] = v;
  }
  return out;
}

function sanitizeResult(id: string, raw: unknown): Result | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (r.scenarioId !== id || !Array.isArray(r.criteria)) return null;
  const criteria = r.criteria
    .filter((c): c is Record<string, unknown> => Boolean(c) && typeof c === 'object')
    .filter((c) => typeof c.id === 'string' && typeof c.score === 'number' && typeof c.detail === 'string')
    .map((c) => ({ id: c.id as Result['criteria'][number]['id'], score: Math.max(0, Math.min(1, c.score as number)), detail: (c.detail as string).slice(0, 500) }));
  const meters: Record<string, number> = {};
  if (r.meters && typeof r.meters === 'object') {
    for (const [k, v] of Object.entries(r.meters as Record<string, unknown>)) if (typeof v === 'number') meters[k] = Math.max(0, Math.min(10, v));
  }
  return {
    scenarioId: id,
    criteria,
    overall: clampInt(r.overall, 100),
    xp: clampInt(r.xp),
    meters,
    choices: sanitizeChoices(r.choices),
    flags: stringList(r.flags, /^[a-z0-9-]{1,64}:[a-z0-9-]{1,64}$/, 50),
  };
}

function sanitizeRecord(id: string, raw: unknown): ScenarioRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  // Runs are re-checked against scenario content by restoreRun() on load.
  const run = r.run && typeof r.run === 'object' && (r.run as Run).scenarioId === id ? (r.run as Run) : null;
  const history = Array.isArray(r.history)
    ? r.history
      .filter((h): h is Record<string, unknown> => Boolean(h) && typeof h === 'object')
      .map((h) => ({ at: clampInt(h.at, Number.MAX_SAFE_INTEGER), choices: sanitizeChoices(h.choices), overall: clampInt(h.overall, 100) }))
      .slice(-MAX_HISTORY)
    : [];
  return {
    run,
    completions: clampInt(r.completions, 9999),
    bestOverall: clampInt(r.bestOverall, 100),
    bestXp: clampInt(r.bestXp),
    last: sanitizeResult(id, r.last),
    history,
    bestMedal: (MEDALS as string[]).includes(r.bestMedal as string) ? (r.bestMedal as Medal) : null,
  };
}

function sanitizeJournal(raw: unknown): JournalEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is Record<string, unknown> => Boolean(e) && typeof e === 'object')
    .filter((e) => typeof e.id === 'string' && typeof e.scenarioId === 'string' && ID.test(e.scenarioId))
    .map((e) => ({
      id: (e.id as string).slice(0, 64),
      scenarioId: e.scenarioId as string,
      at: clampInt(e.at, Number.MAX_SAFE_INTEGER),
      prompt: typeof e.prompt === 'string' ? e.prompt.slice(0, 300) : '',
      selected: Array.isArray(e.selected) ? e.selected.filter((s): s is string => typeof s === 'string').map((s) => s.slice(0, 300)).slice(0, 20) : [],
      note: typeof e.note === 'string' ? e.note.slice(0, 2000) : '',
    }))
    .slice(-MAX_JOURNAL);
}

export function sanitizeProgress(raw: unknown): Progress {
  if (!raw || typeof raw !== 'object') return defaultProgress();
  const data = raw as Record<string, unknown>;
  // Saved by a newer release, or not ours: start fresh rather than misread it.
  if (data.version !== SCHEMA_VERSION) return defaultProgress();
  const scenarios: Record<string, ScenarioRecord> = {};
  if (data.scenarios && typeof data.scenarios === 'object' && !Array.isArray(data.scenarios)) {
    for (const [id, record] of Object.entries(data.scenarios as Record<string, unknown>)) {
      if (!ID.test(id)) continue;
      const clean = sanitizeRecord(id, record);
      if (clean) scenarios[id] = clean;
    }
  }
  return {
    version: SCHEMA_VERSION,
    player: sanitizePlayer(data.player),
    scenarios,
    achievements: stringList(data.achievements, ID, 100),
    journal: sanitizeJournal(data.journal),
    evidence: stringList(data.evidence, /^[a-z0-9-]{1,64}\/[a-z0-9-]{1,64}$/, 1000),
    principles: stringList(data.principles, ID, 100),
    insights: stringList(data.insights, /^[a-z0-9-]{1,64}\/[a-z0-9-]{1,64}$/, 500),
    outcomes: stringList(data.outcomes, /^[a-z0-9-]{1,64}\/[a-z0-9-]{1,64}\/[a-z0-9-]{1,64}$/, 1000),
    settings: sanitizeSettings(data.settings),
  };
}

function browserStorage(): StorageLike | null {
  try {
    const storage = globalThis.localStorage;
    const probe = '__pc_journey_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null; // private mode, blocked storage, or no window
  }
}

export function createProgressStore(storage: StorageLike | null = browserStorage()) {
  return {
    available: Boolean(storage),
    load(): Progress {
      if (!storage) return defaultProgress();
      try {
        const text = storage.getItem(STORAGE_KEY);
        return text ? sanitizeProgress(JSON.parse(text)) : defaultProgress();
      } catch {
        return defaultProgress(); // corrupted JSON
      }
    },
    save(progress: Progress): boolean {
      if (!storage) return false;
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(progress));
        return true;
      } catch {
        return false; // quota exceeded or storage revoked
      }
    },
    reset(): void {
      if (!storage) return;
      try {
        storage.removeItem(STORAGE_KEY);
      } catch {
        /* nothing to clear */
      }
    },
  };
}

// ---- Pure helpers for updating progress ----

export function record(progress: Progress, scenarioId: string): ScenarioRecord {
  return progress.scenarios[scenarioId] || emptyRecord();
}

export function withPlayer(progress: Progress, name: string, avatar: string): Progress {
  return { ...progress, player: sanitizePlayer({ name, avatar }) };
}

export function withSettings(progress: Progress, settings: Partial<Settings>): Progress {
  return { ...progress, settings: sanitizeSettings({ ...progress.settings, ...settings }) };
}

function addUnique(list: string[], items: string[]): string[] {
  const missing = items.filter((i) => !list.includes(i));
  return missing.length ? [...list, ...missing] : list;
}

function outcomeKeys(run: Run): string[] {
  return Object.entries(run.choices).map(([d, o]) => `${run.scenarioId}/${d}/${o}`);
}

/** Save an in-progress run, plus any evidence and outcomes it has uncovered. */
export function withRun(progress: Progress, run: Run): Progress {
  const rec = record(progress, run.scenarioId);
  return {
    ...progress,
    scenarios: { ...progress.scenarios, [run.scenarioId]: { ...rec, run } },
    evidence: addUnique(progress.evidence, run.inspected.map((h) => `${run.scenarioId}/${h}`)),
    outcomes: addUnique(progress.outcomes, outcomeKeys(run)),
  };
}

export interface CompletionExtras {
  principleIds: string[];
  /** "scenarioId/decisionId" for each strong decision in this run. */
  insights: string[];
  journal: JournalEntry | null;
  medal: Medal | null;
}

/**
 * Record a finished run. Replays keep the best score rather than stacking XP,
 * so total XP reflects demonstrated reasoning, not repetition.
 */
export function withCompletion(progress: Progress, run: Run, result: Result, extras: CompletionExtras, now = Date.now()): Progress {
  const rec = record(progress, run.scenarioId);
  const alreadyCounted = Boolean(rec.run?.completed);
  const next: ScenarioRecord = {
    run,
    completions: rec.completions + (alreadyCounted ? 0 : 1),
    bestOverall: Math.max(rec.bestOverall, result.overall),
    bestXp: Math.max(rec.bestXp, result.xp),
    last: result,
    bestMedal: MEDALS.indexOf(extras.medal as Medal) > MEDALS.indexOf(rec.bestMedal as Medal) ? extras.medal : rec.bestMedal,
    history: alreadyCounted ? rec.history : [...rec.history, { at: now, choices: result.choices, overall: result.overall }].slice(-MAX_HISTORY),
  };
  const journal = extras.journal && !alreadyCounted ? [...progress.journal, extras.journal].slice(-MAX_JOURNAL) : progress.journal;
  return {
    ...progress,
    scenarios: { ...progress.scenarios, [run.scenarioId]: next },
    evidence: addUnique(progress.evidence, run.inspected.map((h) => `${run.scenarioId}/${h}`)),
    outcomes: addUnique(progress.outcomes, outcomeKeys(run)),
    principles: addUnique(progress.principles, extras.principleIds),
    insights: addUnique(progress.insights, extras.insights),
    journal,
  };
}

/** Start the scenario again from the beginning. Best scores are kept. */
export function withReplay(progress: Progress, scenarioId: string): Progress {
  const rec = record(progress, scenarioId);
  return { ...progress, scenarios: { ...progress.scenarios, [scenarioId]: { ...rec, run: null } } };
}

export function withAchievements(progress: Progress, ids: string[]): Progress {
  const achievements = addUnique(progress.achievements, ids);
  return achievements === progress.achievements ? progress : { ...progress, achievements };
}

export function totalXp(progress: Progress): number {
  return Object.values(progress.scenarios).reduce((sum, r) => sum + r.bestXp, 0);
}

export function isComplete(progress: Progress, scenarioId: string): boolean {
  return record(progress, scenarioId).completions > 0;
}

/** Flags from each scenario's most recent completed run. */
export function journeyFlags(progress: Progress): Set<string> {
  const flags = new Set<string>();
  for (const rec of Object.values(progress.scenarios)) for (const f of rec.last?.flags ?? []) flags.add(f);
  return flags;
}

/** Restore every saved run against current content (call after load). */
export function reconcileRuns(progress: Progress, scenarios: Map<string, Scenario>): Progress {
  const next: Record<string, ScenarioRecord> = {};
  for (const [id, rec] of Object.entries(progress.scenarios)) {
    const scenario = scenarios.get(id);
    if (!scenario) continue; // content removed
    next[id] = { ...rec, run: rec.run ? restoreRun(scenario, rec.run) : null };
  }
  return { ...progress, scenarios: next };
}
