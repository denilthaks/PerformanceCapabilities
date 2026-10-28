// Every spoken line in the game, and the stable key each recorded voice file
// is stored under. Shared by the game (to find a line's audio) and by
// tools/generate-voices.ts (to create it), so the two can never disagree.

import type { Line, Scenario } from '../engine/types';

/** The words actually spoken: stage directions in brackets and quote marks removed. */
export function speechText(text: string): string {
  return text.replace(/\([^)]*\)/g, '').replace(/[“”"]/g, '').replace(/\s+/g, ' ').trim();
}

/** FNV-1a, 32-bit, as 8 hex digits. Stable across runs and platforms. */
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** The file key for one speaker saying one line. Changing the words changes the key. */
export function voiceKey(speaker: string, text: string): string {
  return `${speaker}-${fnv1a(`${speaker}|${speechText(text)}`)}`;
}

export interface SpokenLine { speaker: string; text: string; key: string }

/** All dialogue, questions and reactions across the given scenarios, de-duplicated. */
export function collectLines(scenarios: Scenario[]): SpokenLine[] {
  const out = new Map<string, SpokenLine>();
  const add = (speaker: string, text: string) => {
    if (!speechText(text) || speechText(text) === '...') return;
    const key = voiceKey(speaker, text);
    if (!out.has(key)) out.set(key, { speaker, text: speechText(text), key });
  };
  const addLines = (lines: Line[]) => lines.forEach((l) => add(l.speaker, l.text));
  for (const s of scenarios) {
    for (const st of s.stages) {
      if (st.kind === 'narrative') addLines(st.lines);
      if (st.kind === 'explore') st.hotspots.forEach((h) => addLines(h.lines ?? []));
      if (st.kind === 'decision') {
        add(st.asker, st.prompt);
        st.options.forEach((o) => o.outcome.reactions.forEach((r) => add(r.characterId, r.text)));
      }
    }
  }
  return [...out.values()];
}
