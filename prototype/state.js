// Saved progress for the nine-screen prototype. It lives under its own
// localStorage key so it never touches the main game's save. Everything read
// back is treated as untrusted and re-validated against the real scenario.

import { medalRank, restoreRun, startRun } from '../src/engine/scenario-engine';
import { AVATARS, cleanName } from '../src/engine/progress-store';

export const SAVE_KEY = 'pc-journey.prototype.v1';
const MAX_XP = 100000;

export function blankSave(scenario) {
  return {
    v: 1,
    player: null,
    run: startRun(scenario),
    pos: { ...scenario.start },
    best: { xp: 0, medal: null, completions: 0 },
  };
}

function cleanPos(raw, scenario) {
  const ok = raw && Number.isFinite(raw.x) && Number.isFinite(raw.y) && raw.x >= 0 && raw.x <= 480 && raw.y >= 0 && raw.y <= 300;
  return ok ? { x: raw.x, y: raw.y } : { ...scenario.start };
}

/** Rebuild a save from anything, keeping only what is valid for this scenario. */
export function sanitise(raw, scenario) {
  const save = blankSave(scenario);
  if (!raw || typeof raw !== 'object' || raw.v !== 1) return save;
  const name = cleanName(raw.player?.name);
  if (name && AVATARS.includes(raw.player?.look)) save.player = { name, look: raw.player.look };
  if (save.player && raw.run) save.run = restoreRun(scenario, raw.run);
  save.pos = cleanPos(raw.pos, scenario);
  const b = raw.best ?? {};
  save.best = {
    xp: Number.isInteger(b.xp) ? Math.max(0, Math.min(MAX_XP, b.xp)) : 0,
    medal: medalRank(b.medal) > 0 ? b.medal : null,
    completions: Number.isInteger(b.completions) ? Math.max(0, Math.min(9999, b.completions)) : 0,
  };
  return save;
}

export function load(storage, scenario) {
  try {
    const text = storage?.getItem(SAVE_KEY);
    return sanitise(text ? JSON.parse(text) : null, scenario);
  } catch {
    return blankSave(scenario);
  }
}

export function persist(storage, save) {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

/** Keep the better of two medals and the higher XP. */
export function recordFinish(save, xp, medal) {
  return {
    ...save,
    best: {
      xp: Math.max(save.best.xp, Math.min(MAX_XP, xp)),
      medal: medalRank(medal) > medalRank(save.best.medal) ? medal : save.best.medal,
      completions: save.best.completions + 1,
    },
  };
}

/** Which screen a saved run resumes on. */
export function resumeScreen(scenario, save) {
  if (!save.player) return 'select';
  const run = save.run;
  if (run.completed) return 'complete';
  const stage = scenario.stages.find((s) => s.id === run.stageId) ?? scenario.stages[0];
  if (stage.kind === 'decision') return run.choices[stage.id] ? 'feedback' : 'decision';
  if (stage.kind === 'reflection') return 'reflection';
  return 'lobby';
}

/** A new journey with a new pass. Best results are kept. */
export function startFresh(save, scenario, player) {
  return { ...save, player: { name: cleanName(player.name), look: AVATARS.includes(player.look) ? player.look : AVATARS[0] }, run: startRun(scenario), pos: { ...scenario.start } };
}
