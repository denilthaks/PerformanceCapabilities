// Content checks for scenarios and zones. Run by the unit tests so a broken
// reference in new content fails CI instead of stranding a player.

import type { Condition, Line, Scenario } from './types';
import type { Zone } from './progression';

export interface ContentRefs {
  characterIds: Set<string>;
  /** Principle, level and game-concept ids that feedback may cite. */
  referenceIds: Set<string>;
  scenarioIds: Set<string>;
}

export function validateScenario(s: Scenario, refs: ContentRefs): string[] {
  const errors: string[] = [];
  const err = (msg: string) => errors.push(`${s.id}: ${msg}`);
  const stageIds = s.stages.map((st) => st.id);
  const position = (id: string) => stageIds.indexOf(id);
  const meterIds = new Set(s.meters.map((m) => m.id));
  const decisionIds = new Set(s.stages.filter((st) => st.kind === 'decision').map((st) => st.id));
  const speaker = (id: string, where: string) => {
    if (id !== 'narrator' && id !== 'player' && !refs.characterIds.has(id)) err(`${where}: unknown speaker "${id}"`);
  };
  const condition = (c: Condition | undefined, where: string, before: number) => {
    if (c?.choice && (!decisionIds.has(c.choice.decision) || position(c.choice.decision) >= before)) {
      err(`${where}: condition refers to decision "${c.choice.decision}" that doesn't come earlier`);
    }
  };
  const lines = (ls: Line[], where: string, at: number) => ls.forEach((l, i) => { speaker(l.speaker, `${where} line ${i + 1}`); condition(l.when, where, at); });

  if (!/^[a-z0-9-]{1,64}$/.test(s.id)) err('id must be lowercase letters, digits and hyphens');
  if (new Set(stageIds).size !== stageIds.length) err('duplicate stage ids');
  if (!s.stages.length) err('no stages');
  if (s.stages[s.stages.length - 1]?.kind !== 'reflection') err('last stage must be a reflection');
  if (!decisionIds.size) err('needs at least one decision');
  s.characters.forEach((c) => { if (!refs.characterIds.has(c)) err(`unknown character "${c}"`); });
  s.principleIds.forEach((p) => { if (!refs.referenceIds.has(p)) err(`unknown principle reference "${p}"`); });
  s.meters.forEach((m) => { if (m.start < 0 || m.start > 10) err(`meter ${m.id} start out of range`); });

  const hotspotIds = new Set<string>();
  s.stages.forEach((st, at) => {
    switch (st.kind) {
      case 'narrative':
        lines(st.lines, st.id, at);
        if (!st.lines.length) err(`${st.id}: empty narrative`);
        break;
      case 'explore':
        st.hotspots.forEach((h) => {
          if (hotspotIds.has(h.id)) err(`duplicate hotspot id "${h.id}"`);
          hotspotIds.add(h.id);
          if (h.x < 0 || h.x > 100 || h.y < 0 || h.y > 100) err(`${h.id}: position out of range`);
          if (h.kind === 'character' && (!h.characterId || !refs.characterIds.has(h.characterId))) err(`${h.id}: unknown character`);
          if (h.kind === 'character' && !h.lines?.length) err(`${h.id}: character hotspot without dialogue`);
          if (h.kind === 'evidence' && !h.doc) err(`${h.id}: evidence hotspot without a document`);
          if (h.lines) lines(h.lines, h.id, at);
          if (h.revealAfter && (!decisionIds.has(h.revealAfter) || position(h.revealAfter) >= at)) err(`${h.id}: revealAfter must name an earlier decision`);
          condition(h.when, h.id, at);
        });
        st.required.forEach((r) => {
          const h = st.hotspots.find((x) => x.id === r);
          if (!h) err(`${st.id}: required hotspot "${r}" not in this stage`);
          else if (h.when) err(`${st.id}: required hotspot "${r}" is conditional, so a player could be blocked`);
        });
        break;
      case 'decision':
        if (st.options.length < 2) err(`${st.id}: needs at least two options`);
        if (!st.options.some((o) => o.quality === 'strong')) err(`${st.id}: needs at least one strong option`);
        if (new Set(st.options.map((o) => o.id)).size !== st.options.length) err(`${st.id}: duplicate option ids`);
        st.evidenceFrom.forEach((e) => {
          const p = position(e);
          if (p < 0 || p > at || s.stages[p].kind !== 'explore') err(`${st.id}: evidenceFrom "${e}" must be an earlier explore stage`);
        });
        st.options.forEach((o) => {
          const where = `${st.id}/${o.id}`;
          if (!o.feedback.trim()) err(`${where}: missing feedback`);
          if (!o.principleIds.length) err(`${where}: needs a principle reference`);
          o.principleIds.forEach((p) => { if (!refs.referenceIds.has(p)) err(`${where}: unknown principle reference "${p}"`); });
          o.outcome.reactions.forEach((r) => {
            if (!refs.characterIds.has(r.characterId)) err(`${where}: unknown reacting character "${r.characterId}"`);
            condition(r.when, where, at + 1);
          });
          for (const k of [...Object.keys(o.outcome.effects), ...Object.keys(o.outcome.laterEffects ?? {})]) {
            if (!meterIds.has(k as never)) err(`${where}: effect on meter "${k}" that this scenario doesn't show`);
          }
          (o.flags ?? []).forEach((f) => { if (!/^[a-z0-9-]{1,64}$/.test(f)) err(`${where}: bad flag "${f}"`); });
          if (Object.keys(o.rubric).length === 0) err(`${where}: empty rubric`);
        });
        // Every option must be scored on the same criteria, or the max would be unfair.
        {
          const keys = st.options.map((o) => Object.keys(o.rubric).sort().join(','));
          if (new Set(keys).size > 1) err(`${st.id}: options are scored on different rubric criteria`);
        }
        break;
      case 'aftermath': {
        const p = position(st.decision);
        if (!decisionIds.has(st.decision) || p >= at) err(`${st.id}: must follow decision "${st.decision}"`);
        const d = s.stages[p];
        if (d?.kind === 'decision' && d.options.some((o) => !o.outcome.later?.length)) err(`${st.id}: every option of "${st.decision}" needs later consequences`);
        break;
      }
      case 'review':
        st.scenarioIds.forEach((id) => { if (!refs.scenarioIds.has(id) || id === s.id) err(`${st.id}: unknown scenario "${id}"`); });
        break;
      case 'reflection':
        if (st.options.length < 2) err(`${st.id}: needs at least two reflection options`);
        break;
    }
  });
  return errors;
}

export function validateZones(zones: Zone[], scenarios: Map<string, Scenario>): string[] {
  const errors: string[] = [];
  const ids = new Set(zones.map((z) => z.id));
  const seen = new Set<string>();
  zones.forEach((z) => {
    z.requires.forEach((r) => { if (!ids.has(r) || r === z.id) errors.push(`${z.id}: bad requirement "${r}"`); });
    z.scenarioIds.forEach((s) => {
      const sc = scenarios.get(s);
      if (!sc) errors.push(`${z.id}: unknown scenario "${s}"`);
      else if (sc.zone !== z.id) errors.push(`${z.id}: scenario "${s}" belongs to zone "${sc.zone}"`);
      if (seen.has(s)) errors.push(`scenario "${s}" is in more than one zone`);
      seen.add(s);
    });
    if (!z.scenarioIds.length) errors.push(`${z.id}: no scenarios`);
  });
  if (!zones.some((z) => z.requires.length === 0)) errors.push('no zone is open from the start');
  return errors;
}
