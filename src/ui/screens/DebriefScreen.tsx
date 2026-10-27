// The floor report: the medal and why, what your choices did, the outcomes you
// have and haven't seen yet, and (optionally) the framework behind it all.
// Describes decisions, never the person.

import { useEffect } from 'react';
import { useGame } from '../../app/game';
import { play } from '../../app/audio';
import { navigate } from '../../app/router';
import {
  band, CRITERION_LABELS, CRITERION_QUESTIONS, decisionStages, exploreStages, medalFor, XP_RULES, type Band,
} from '../../engine/scenario-engine';
import { record } from '../../engine/progress-store';
import { zoneUnlocked } from '../../engine/progression';
import type { CriterionId, Result } from '../../engine/types';
import { SCENARIO_MAP, SCENARIOS } from '../../content/scenarios';
import { ZONES, zoneForScenario } from '../../content/zones';
import { Icon, Link, Meters, ReferenceCard, ScoreBar } from '../common';
import { MedalCriteria, MedalIcon, MEDAL_NAMES } from '../medals';

const BAND_TEXT: Record<Band, string> = { strong: 'Strong', developing: 'Developing', early: 'Early' };

const SUGGESTION: Record<CriterionId, Record<Band, string>> = {
  evidence: {
    strong: 'You looked at almost everything before committing.',
    developing: 'You looked at some of it first. What you skipped would have changed the picture.',
    early: 'You decided on very little. Next time, look wider before you commit.',
  },
  diagnosis: {
    strong: 'You went after the real cause, not the visible symptom.',
    developing: 'You were partly right about the cause. Look for the explanation that fits everything you found.',
    early: 'You responded to the symptom. Try asking "what else would explain this?"',
  },
  development: {
    strong: 'You built people\'s ability instead of just removing the problem.',
    developing: 'Some of your choices fixed today without building anything for tomorrow.',
    early: 'Your choices removed or punished the problem rather than helping anyone grow.',
  },
  impact: {
    strong: 'You accounted for everyone your decisions landed on.',
    developing: 'You saw some of the knock-on effects. Others surfaced later.',
    early: 'The cost of your decisions landed on people you hadn\'t considered.',
  },
  reflection: { strong: 'You stopped to reflect.', developing: 'You started a reflection.', early: 'No reflection recorded.' },
};

function JourneySummary() {
  const { progress } = useGame();
  const results = SCENARIOS.map((s) => ({ s, last: record(progress, s.id).last })).filter((r): r is { s: typeof r.s; last: Result } => Boolean(r.last));
  const criteria: CriterionId[] = ['evidence', 'diagnosis', 'development', 'impact'];
  const avg = (c: CriterionId) => {
    const vals = results.map((r) => r.last.criteria.find((x) => x.id === c)?.score).filter((v): v is number => v !== undefined);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const ranked = criteria.map((c) => ({ c, v: avg(c) })).sort((a, b) => b.v - a.v);
  const top = ranked[0];
  const low = ranked[ranked.length - 1];
  return (
    <section className="glass panel-pad">
      <h2>The whole Tower</h2>
      <p className="muted">Your most recent run on each floor. Patterns across floors say more than any one score.</p>
      <div className="two-col tight">
        <div><h3>Your most consistent strength</h3><p><strong>{CRITERION_LABELS[top.c]}.</strong> {SUGGESTION[top.c][band(top.v)]}</p></div>
        <div><h3>Where to grow next</h3><p><strong>{CRITERION_LABELS[low.c]}.</strong> {SUGGESTION[low.c][band(low.v)]}</p></div>
      </div>
      <details>
        <summary>Floor by floor</summary>
        <table className="rubric-table">
          <thead><tr><th scope="col">Criterion</th>{results.map((r) => <th key={r.s.id} scope="col">{zoneForScenario(r.s.id)?.place}</th>)}<th scope="col">Average</th></tr></thead>
          <tbody>
            {criteria.map((c) => (
              <tr key={c}>
                <th scope="row">{CRITERION_LABELS[c]}</th>
                {results.map((r) => {
                  const v = r.last.criteria.find((x) => x.id === c)?.score;
                  return <td key={r.s.id}>{v === undefined ? '–' : `${Math.round(v * 100)}%`}</td>;
                })}
                <td><strong>{Math.round(avg(c) * 100)}%</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

export function DebriefScreen({ id }: { id: string }) {
  const game = useGame();
  const { progress } = game;
  const scenario = SCENARIO_MAP.get(id);
  const zone = zoneForScenario(id);
  const rec = record(progress, id);
  const result = rec.last;
  const earned = scenario && result ? medalFor(scenario, result) : null;
  useEffect(() => { if (earned) play('medal'); }, [id, earned]);

  if (!scenario || !zone) {
    return <section className="page narrow"><h1>Report not found</h1><Link to="/journey" className="btn btn-primary">Back to the Tower</Link></section>;
  }
  if (!result) {
    return (
      <section className="page narrow">
        <h1>No report yet for {zone.place}</h1>
        <p>See the floor through, including your notebook, and the report will be here.</p>
        <Link to={`/play/${id}`} className="btn btn-primary">Go to {zone.place}</Link>
      </section>
    );
  }

  const medal = medalFor(scenario, result);
  const next = ZONES.find((z) => z.number === zone.number + 1);
  const nextOpen = next && zoneUnlocked(progress, next, ZONES);
  const misleading = exploreStages(scenario).flatMap((s) => s.hotspots.filter((h) => h.misleading));
  const secrets = exploreStages(scenario).flatMap((s) => s.hotspots.filter((h) => h.secret));
  const secretsFound = secrets.filter((h) => progress.evidence.includes(`${id}/${h.id}`));
  const journal = [...progress.journal].reverse().find((j) => j.scenarioId === id);
  const refs = [...new Set(decisionStages(scenario).flatMap((d) => d.options.find((o) => o.id === result.choices[d.id])?.principleIds ?? []))];
  const growth = result.criteria.filter((c) => c.id !== 'reflection' && band(c.score) !== 'strong');

  return (
    <section className="page debrief">
      <header className="page-head">
        <Link to={`/zone/${zone.id}`} className="back-link"><Icon name="back" size={18} />{zone.place}</Link>
        <p className="eyebrow pixel-font">Floor {zone.floor} · report</p>
        <h1>{zone.place}: resolved</h1>
      </header>

      <div className="debrief-top">
        <section className="glass panel-pad medal-card" data-tilt>
          <MedalIcon medal={medal} size={88} label={medal ? `${MEDAL_NAMES[medal]} medal` : 'No medal'} />
          <div>
            <p className="big-medal">{medal ? MEDAL_NAMES[medal] : 'No medal'}</p>
            <p className="muted">{rec.bestMedal && rec.bestMedal !== medal ? `Your best here is still ${MEDAL_NAMES[rec.bestMedal]}.` : 'This is your best on this floor.'}</p>
            {growth.length > 0 && <p>{SUGGESTION[growth[0].id][band(growth[0].score)]}</p>}
          </div>
        </section>
        <section className="glass panel-pad">
          <h2 className="pixel-font small-heading">What each medal takes</h2>
          <MedalCriteria scenario={scenario} result={result} />
        </section>
      </div>

      <section className="glass panel-pad">
        <h2>How it played out</h2>
        <div className="two-col tight">
          <div>
            {decisionStages(scenario).map((d) => {
              const chosen = d.options.find((o) => o.id === result.choices[d.id]);
              const seen = d.options.filter((o) => o.id !== chosen?.id && progress.outcomes.includes(`${id}/${d.id}/${o.id}`));
              const unseen = d.options.length - 1 - seen.length;
              return (
                <article key={d.id} className="decision-recap">
                  <h3>{d.title}</h3>
                  {chosen && (
                    <>
                      <p><span className={`q q-${chosen.quality}`}>{chosen.quality}</span> <strong>{chosen.outcome.headline}</strong></p>
                      <p className="muted">{chosen.feedback}</p>
                    </>
                  )}
                  {seen.length > 0 && (
                    <details>
                      <summary>Other ways you've seen this go ({seen.length})</summary>
                      <ul className="paths">
                        {seen.map((o) => <li key={o.id}><span className={`q q-${o.quality}`}>{o.quality}</span> <strong>{o.outcome.headline}</strong> <span className="muted">{o.feedback}</span></li>)}
                      </ul>
                    </details>
                  )}
                  {unseen > 0 && <p className="undiscovered">{unseen === 1 ? 'One other outcome' : `${unseen} other outcomes`} you haven't seen yet.</p>}
                </article>
              );
            })}
          </div>
          <div>
            <h3>Where things ended</h3>
            <Meters defs={scenario.meters} values={result.meters} />
            <p className="hint">The story's situation at the end. Simulated; it says nothing about you.</p>
          </div>
        </div>
      </section>

      <div className="two-col">
        {misleading.length > 0 && (
          <section className="glass panel-pad">
            <h2>The clue that pulls you the wrong way</h2>
            <ul className="checklist">{misleading.map((h) => <li key={h.id}><strong>{h.label}:</strong> {h.summary}</li>)}</ul>
          </section>
        )}
        <section className="glass panel-pad">
          <h2>Hidden on this floor</h2>
          <p className="muted">{secretsFound.length} of {secrets.length} found.</p>
          <ul className="checklist">{secretsFound.map((h) => <li key={h.id}>{h.summary}</li>)}</ul>
          {secretsFound.length < secrets.length && <p className="hint">They have no markers. Look at things nobody asked you to look at.</p>}
        </section>
      </div>

      {journal && (
        <section className="glass panel-pad notebook-entry">
          <h2>Your notebook</h2>
          <ul className="checklist">{journal.selected.map((s) => <li key={s}>{s}</li>)}</ul>
          {journal.note && <blockquote className="journal-note">{journal.note}</blockquote>}
        </section>
      )}

      {zone.id === 'trial' && <JourneySummary />}

      <details className="glass panel-pad deep">
        <summary>How this floor was judged</summary>
        <p className="muted">
          Each criterion is 0–100%. Evidence is the share of sources you examined before each decision (hidden things don't count).
          Diagnosis, development and impact come from the options you chose, 0–2 points each, set by the scenario's author. Reflection
          counts completion only; what you write is never scored. The overall reasoning score, {result.overall}%, is the average.
        </p>
        <table className="rubric-table">
          <thead><tr><th scope="col">Criterion</th><th scope="col">Question</th><th scope="col">Score</th><th scope="col">Detail</th></tr></thead>
          <tbody>
            {result.criteria.map((c) => (
              <tr key={c.id}>
                <th scope="row">{CRITERION_LABELS[c.id]}</th>
                <td>{CRITERION_QUESTIONS[c.id]}</td>
                <td className="score-cell"><ScoreBar value={c.score} label={CRITERION_LABELS[c.id]} /><span>{Math.round(c.score * 100)}% · {BAND_TEXT[band(c.score)]}</span></td>
                <td className="muted">{c.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint">
          XP this run: {result.xp} ({XP_RULES.completion} for finishing, {XP_RULES.perEvidence} per discovery up to {XP_RULES.evidenceCap},
          {' '}{XP_RULES.reflection} for the notebook, up to {XP_RULES.reasoning} for reasoning). Replays keep your best. The score rates choices in one
          fictional situation; it is not a validated measure of a person.
        </p>
      </details>

      <details className="glass panel-pad deep">
        <summary>Field notes: the ideas behind this floor</summary>
        <p className="muted">
          {zone.publishedLevel
            ? `This floor is built around ${zone.alignment} of Ben Benson's Performance Capability framework.`
            : 'This floor is a game capstone that draws on all three published levels.'}{' '}
          Each card says whether it's published material, a summary, a placeholder awaiting Ben's review, or written for the game.
        </p>
        <div className="ref-grid">{refs.map((p) => <ReferenceCard key={p} id={p} />)}</div>
        <Link to="/principles" className="text-link">Open the full field guide</Link>
      </details>

      <div className="row debrief-actions">
        <button type="button" className="btn btn-ghost btn-lg" onClick={() => { game.replay(id); navigate(`/play/${id}`); }}>
          <Icon name="replay" />Play it differently
        </button>
        {next && nextOpen
          ? <Link to={`/zone/${next.id}`} className="btn btn-primary btn-lg">Take the elevator to {next.place} ▸</Link>
          : <Link to="/journey" className="btn btn-primary btn-lg">Back to the Tower ▸</Link>}
      </div>
    </section>
  );
}
