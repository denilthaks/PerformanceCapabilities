// Consequence and debrief: the transparent rubric, what it suggests, the
// paths not taken, and replay. Describes decisions, never the person.

import { useGame } from '../../app/game';
import { navigate } from '../../app/router';
import { band, CRITERION_LABELS, CRITERION_QUESTIONS, decisionStages, exploreStages, XP_RULES, type Band } from '../../engine/scenario-engine';
import { record } from '../../engine/progress-store';
import { zoneComplete, zoneUnlocked } from '../../engine/progression';
import type { CriterionId, Result } from '../../engine/types';
import { SCENARIO_MAP, SCENARIOS } from '../../content/scenarios';
import { ZONES, zoneForScenario } from '../../content/zones';
import { Constellation, Icon, Link, ReferenceCard, ScoreBar } from '../common';

const BAND_TEXT: Record<Band, string> = { strong: 'Strong', developing: 'Developing', early: 'Early' };

const SUGGESTION: Record<CriterionId, Record<Band, string>> = {
  evidence: {
    strong: 'You examined most of the available evidence before committing.',
    developing: 'You looked at some of the evidence first. The sources you skipped would have changed the picture.',
    early: 'You decided with little of the available evidence. Try investigating more widely before you commit.',
  },
  diagnosis: {
    strong: 'Your decisions targeted the underlying cause rather than the visible symptom.',
    developing: 'You were partly right about the cause. Look for the explanation that fits all of the evidence, not just some of it.',
    early: 'Your decisions responded to the symptom. Ask "what else would explain this?" before acting.',
  },
  development: {
    strong: 'Your responses built capability rather than only removing the problem.',
    developing: 'Some of your responses fixed the immediate problem without building lasting capability.',
    early: 'Your responses removed or punished the problem rather than developing the people involved.',
  },
  impact: {
    strong: 'You accounted for the other people and the wider system your decisions touched.',
    developing: 'You considered some of the wider effects. Others surfaced later.',
    early: 'The costs of your decisions landed on people or parts of the system you hadn\'t considered.',
  },
  reflection: {
    strong: 'You took time to reflect on your own approach.',
    developing: 'You started a reflection.',
    early: 'No reflection was recorded.',
  },
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
  return (
    <section className="glass panel-pad">
      <h2>Your journey, across all four zones</h2>
      <p className="muted">Average of your most recent run in each scenario. Patterns across scenarios say more than any single score.</p>
      <table className="rubric-table">
        <thead><tr><th scope="col">Criterion</th>{results.map((r) => <th key={r.s.id} scope="col">{r.s.title}</th>)}<th scope="col">Average</th></tr></thead>
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
      <div className="two-col tight">
        <div>
          <h3>Most consistent strength</h3>
          <p><strong>{CRITERION_LABELS[ranked[0].c]}.</strong> {SUGGESTION[ranked[0].c][band(ranked[0].v)]}</p>
        </div>
        <div>
          <h3>Biggest opportunity</h3>
          <p><strong>{CRITERION_LABELS[ranked[ranked.length - 1].c]}.</strong> {SUGGESTION[ranked[ranked.length - 1].c][band(ranked[ranked.length - 1].v)]}</p>
        </div>
      </div>
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

  if (!scenario || !zone) {
    return <section className="page narrow"><h1>Debrief not found</h1><Link to="/zones" className="btn btn-primary">All zones</Link></section>;
  }
  if (!result) {
    return (
      <section className="page narrow">
        <h1>No debrief yet for {scenario.title}</h1>
        <p>Complete the scenario, including its reflection, to see your debrief.</p>
        <Link to={`/play/${id}`} className="btn btn-primary">Play {scenario.title}</Link>
      </section>
    );
  }

  const next = ZONES.find((z) => z.number === zone.number + 1);
  const nextOpen = next && zoneUnlocked(progress, next, ZONES);
  const strengths = result.criteria.filter((c) => c.id !== 'reflection' && band(c.score) === 'strong');
  const opportunities = result.criteria.filter((c) => c.id !== 'reflection' && band(c.score) !== 'strong');
  const misleading = exploreStages(scenario).flatMap((s) => s.hotspots.filter((h) => h.misleading));
  const journal = [...progress.journal].reverse().find((j) => j.scenarioId === id);
  const strongCount = decisionStages(scenario).filter((d) => d.options.find((o) => o.id === result.choices[d.id])?.quality === 'strong').length;

  return (
    <section className="page debrief">
      <header className="page-head">
        <Link to={`/zone/${zone.id}`} className="back-link"><Icon name="back" size={18} />{zone.name}</Link>
        <p className="eyebrow">Debrief · Zone {zone.number}</p>
        <h1>{scenario.title}</h1>
      </header>

      <div className="debrief-top">
        <section className="glass panel-pad score-card">
          <p className="eyebrow">Reasoning in this scenario</p>
          <p className="big-score">{result.overall}<span>%</span></p>
          <p className="muted">Your best: {rec.bestOverall}% · this run earned {result.xp} XP (best {rec.bestXp} XP)</p>
          <p className="hint">This score rates your decisions in one fictional scenario against the rubric below. It is not a validated measure of you or your capability.</p>
        </section>
        <section className="glass panel-pad rewards">
          <h2>Rewards</h2>
          <ul className="reward-list">
            <li><Icon name="spark" /><span><strong>{strongCount}</strong> insight fragment{strongCount === 1 ? '' : 's'} from strong decisions</span></li>
            <li><Icon name="doc" /><span><strong>{progress.evidence.filter((e) => e.startsWith(`${id}/`)).length}</strong> evidence records in your archive from this scenario</span></li>
            <li><Icon name="star" /><span><strong>{result.xp}</strong> XP this run</span></li>
            {zoneComplete(progress, zone) && <li><Constellation size={28} /><span>Capability emblem and artefact: <strong>{zone.artefact.name}</strong></span></li>}
          </ul>
        </section>
      </div>

      <section className="glass panel-pad">
        <h2>How this was scored</h2>
        <p className="muted">
          Each criterion is scored from 0–100%. Evidence is the share of available sources you examined before each decision.
          Diagnosis, development and impact come from the options you chose (0–2 points each, set by the scenario author).
          Reflection counts completion only. The overall score is the average.
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
        <p className="hint">XP: {XP_RULES.completion} for completing, {XP_RULES.perEvidence} per evidence record (up to {XP_RULES.evidenceCap}), {XP_RULES.reflection} for reflecting, and up to {XP_RULES.reasoning} scaled by the score. Replays keep your best.</p>
      </section>

      <div className="two-col">
        <section className="glass panel-pad">
          <h2>What held up</h2>
          {strengths.length ? <ul className="checklist">{strengths.map((c) => <li key={c.id}><strong>{CRITERION_LABELS[c.id]}:</strong> {SUGGESTION[c.id].strong}</li>)}</ul> : <p className="muted">No criterion reached "strong" this time. That's useful information. Replay and try a different approach.</p>}
        </section>
        <section className="glass panel-pad">
          <h2>Opportunities to develop</h2>
          {opportunities.length ? <ul className="checklist opp">{opportunities.map((c) => <li key={c.id}><strong>{CRITERION_LABELS[c.id]}:</strong> {SUGGESTION[c.id][band(c.score)]}</li>)}</ul> : <p className="muted">Every criterion was strong. Try replaying with a different choice to see how the alternatives play out.</p>}
        </section>
      </div>

      <section className="glass panel-pad">
        <h2>What the game can't tell</h2>
        <p className="muted">
          The debrief sees only which options you picked and which sources you opened. It can't see your reasons, your context or how you'd act with real people.
          Several options are defensible, and the scenario author's ratings are a judgement, not a fact. Treat this as a prompt for reflection, not a verdict.
        </p>
      </section>

      <section className="glass panel-pad">
        <h2>Your decisions, and the paths not taken</h2>
        {decisionStages(scenario).map((d) => {
          const chosen = d.options.find((o) => o.id === result.choices[d.id]);
          return (
            <article key={d.id} className="decision-recap">
              <h3>{d.title}</h3>
              {chosen && (
                <p><span className={`q q-${chosen.quality}`}>{chosen.quality}</span> <strong>{chosen.label}</strong>, which led to: {chosen.outcome.headline}</p>
              )}
              {chosen && <p className="muted">{chosen.feedback}</p>}
              <details>
                <summary>See the other options</summary>
                <ul className="paths">
                  {d.options.filter((o) => o.id !== chosen?.id).map((o) => (
                    <li key={o.id}><span className={`q q-${o.quality}`}>{o.quality}</span> <strong>{o.label}</strong> → {o.outcome.headline} <span className="muted">{o.feedback}</span></li>
                  ))}
                </ul>
              </details>
            </article>
          );
        })}
      </section>

      {misleading.length > 0 && (
        <section className="glass panel-pad">
          <h2>Clues that could mislead</h2>
          <p className="muted">These sources were accurate, but they pointed towards a tempting explanation.</p>
          <ul className="checklist">{misleading.map((h) => <li key={h.id}><strong>{h.label}:</strong> {h.summary}</li>)}</ul>
        </section>
      )}

      <section className="glass panel-pad">
        <h2>Framework links</h2>
        <div className="ref-grid">
          {[...new Set(decisionStages(scenario).flatMap((d) => d.options.find((o) => o.id === result.choices[d.id])?.principleIds ?? []))].map((p) => <ReferenceCard key={p} id={p} />)}
        </div>
      </section>

      {journal && (
        <section className="glass panel-pad">
          <h2>Your reflection</h2>
          <ul className="checklist">{journal.selected.map((s) => <li key={s}>{s}</li>)}</ul>
          {journal.note && <blockquote className="journal-note">{journal.note}</blockquote>}
          <Link to="/progress" className="text-link">Open your learning journal</Link>
        </section>
      )}

      {zone.id === 'trial' && <JourneySummary />}

      <div className="row debrief-actions">
        <button type="button" className="btn btn-ghost btn-lg" onClick={() => { game.replay(id); navigate(`/play/${id}`); }}>
          <Icon name="replay" />Replay with a different approach
        </button>
        {next && nextOpen
          ? <Link to={`/zone/${next.id}`} className="btn btn-primary btn-lg">Continue to {next.name}<Icon name="arrow" /></Link>
          : <Link to="/journey" className="btn btn-primary btn-lg">Back to the world map<Icon name="arrow" /></Link>}
      </div>
    </section>
  );
}
