// Unlocks, the "Continue Journey" target and achievements. Pure functions of
// saved progress and content.

import type { RoomId, Scenario, ZoneId } from './types';
import { decisionStages, medalRank } from './scenario-engine';
import { isComplete, record, type Progress } from './progress-store';

export interface Zone {
  id: ZoneId;
  number: number;
  name: string;
  /** The floor of the Tower where this zone is played. */
  place: string;
  floor: string;
  room: RoomId;
  /** Framework level this zone is aligned with, or the capstone label. */
  alignment: string;
  /** True only for zones that map to a published level of the framework. */
  publishedLevel: boolean;
  theme: string;
  requires: ZoneId[];
  unlockText: string;
  scenarioIds: string[];
  artefact: { name: string; description: string };
}

export type ZoneState = 'locked' | 'open' | 'in-progress' | 'complete';

export function zoneComplete(progress: Progress, zone: Zone): boolean {
  return zone.scenarioIds.length > 0 && zone.scenarioIds.every((id) => isComplete(progress, id));
}

export function zoneUnlocked(progress: Progress, zone: Zone, zones: Zone[]): boolean {
  if (!progress.player) return false;
  return zone.requires.every((req) => {
    const z = zones.find((x) => x.id === req);
    return z ? zoneComplete(progress, z) : false;
  });
}

export function zoneState(progress: Progress, zone: Zone, zones: Zone[]): ZoneState {
  if (!zoneUnlocked(progress, zone, zones)) return 'locked';
  if (zoneComplete(progress, zone)) return 'complete';
  const started = zone.scenarioIds.some((id) => {
    const rec = record(progress, id);
    return rec.completions > 0 || rec.run !== null;
  });
  return started ? 'in-progress' : 'open';
}

/** Where "Continue Journey" should take the player. */
export function continuePath(progress: Progress, zones: Zone[]): string {
  if (!progress.player) return '/create';
  for (const zone of zones) {
    if (!zoneUnlocked(progress, zone, zones)) continue;
    for (const id of zone.scenarioIds) {
      const rec = record(progress, id);
      if (rec.run && !rec.run.completed) return `/play/${id}`;
    }
  }
  for (const zone of zones) {
    if (!zoneUnlocked(progress, zone, zones)) continue;
    const next = zone.scenarioIds.find((id) => !isComplete(progress, id));
    if (next) return `/zone/${zone.id}`;
  }
  return '/progress';
}

/** The founder's four memos, one hidden on each floor ("scenarioId/hotspotId"). */
export const MEMO_IDS = ['front-gate/emblem', 'signal-vault/watcher', 'late-shift/memo', 'top-floor/tome'];

// ---- Achievements: every one reflects a learning behaviour, never luck or spend ----

export interface Achievement {
  id: string;
  title: string;
  description: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-step', title: 'First Night', description: 'Walked into Halcyon Tower.' },
  { id: 'foundation-laid', title: 'Floor Resolved', description: 'Saw a floor through to the end and wrote it up in your notebook.' },
  { id: 'evidence-first', title: 'Evidence First', description: 'Examined every available source before making a decision.' },
  { id: 'second-look', title: 'Second Look', description: 'Replayed a scenario to try a different approach.' },
  { id: 'assumption-breaker', title: 'Assumption Breaker', description: 'Chose a strong revised approach in The Shift once new evidence came to light.' },
  { id: 'wider-lens', title: 'Wider Lens', description: 'Made a decision in The Horizon that held up across the whole system.' },
  { id: 'journal-keeper', title: 'Journal Keeper', description: 'Wrote three reflection notes in your learning journal.' },
  { id: 'archivist', title: 'Archivist', description: 'Found every piece of evidence on a floor.' },
  { id: 'gold-standard', title: 'Gold Standard', description: 'Earned a gold medal on any floor.' },
  { id: 'founders-memos', title: 'The Founder\'s Memos', description: 'Found all four of the founder\'s hidden memos.' },
  { id: 'integrated', title: 'Top Floor', description: 'Resolved the Executive Suite.' },
  { id: 'constellation', title: 'The Whole Tower', description: 'Resolved all four floors.' },
];

export function earnedAchievements(progress: Progress, zones: Zone[], scenarios: Map<string, Scenario>): string[] {
  const earned: string[] = [];
  const add = (id: string, cond: boolean) => { if (cond) earned.push(id); };
  add('first-step', Boolean(progress.player));
  add('foundation-laid', Object.values(progress.scenarios).some((r) => r.completions > 0));
  add('evidence-first', Object.values(progress.scenarios).some((r) =>
    r.run && Object.values(r.run.evidenceAtDecision).some((e) => e.available > 0 && e.inspected === e.available)));
  add('second-look', Object.values(progress.scenarios).some((r) => r.history.length >= 2));

  const shift = zones.find((z) => z.id === 'shift');
  add('assumption-breaker', Boolean(shift && shift.scenarioIds.some((id) => {
    const s = scenarios.get(id);
    const last = record(progress, id).last;
    if (!s || !last) return false;
    // The Shift's second decision is the revised one, made after new evidence.
    const second = decisionStages(s)[1];
    return Boolean(second && second.options.find((o) => o.id === last.choices[second.id])?.quality === 'strong');
  })));

  const horizon = zones.find((z) => z.id === 'horizon');
  add('wider-lens', Boolean(horizon && horizon.scenarioIds.some((id) => {
    const last = record(progress, id).last;
    const impact = last?.criteria.find((c) => c.id === 'impact');
    return Boolean(impact && impact.score >= 0.75);
  })));

  add('journal-keeper', progress.journal.filter((j) => j.note.trim().length > 0).length >= 3);
  add('archivist', zones.some((z) => {
    const ids = z.scenarioIds.flatMap((sid) => {
      const s = scenarios.get(sid);
      if (!s) return [];
      // Only evidence that is always reachable counts, so no zone demands a particular choice.
      return s.stages.flatMap((st) => (st.kind === 'explore' ? st.hotspots.filter((h) => !h.when && !h.secret).map((h) => `${sid}/${h.id}`) : []));
    });
    return ids.length > 0 && ids.every((e) => progress.evidence.includes(e));
  }));
  add('gold-standard', Object.values(progress.scenarios).some((r) => medalRank(r.bestMedal) === 3));
  add('founders-memos', MEMO_IDS.every((m) => progress.evidence.includes(m)));
  const trial = zones.find((z) => z.id === 'trial');
  add('integrated', Boolean(trial && zoneComplete(progress, trial)));
  add('constellation', zones.every((z) => zoneComplete(progress, z)));
  return earned;
}
