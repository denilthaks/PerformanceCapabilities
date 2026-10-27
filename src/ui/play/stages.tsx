// One view per stage kind. Each takes the run and reports changes upward;
// all rules are in src/engine/scenario-engine.ts.

import { useEffect, useRef, useState } from 'react';
import type {
  AftermathStage, DecisionStage, ExploreStage, Hotspot, NarrativeStage, ReflectionStage, ReviewStage, Run, Scenario,
} from '../../engine/types';
import {
  availableEvidence, choose, chosenOption, conditionMet, decisionStages, inspect, linesFor, meters, stageIndex,
  visibleHotspots, type Context,
} from '../../engine/scenario-engine';
import { record } from '../../engine/progress-store';
import { useGame } from '../../app/game';
import { announce } from '../../app/a11y';
import { characterById, PLAYER_LOOKS } from '../../content/characters';
import { SCENARIO_MAP } from '../../content/scenarios';
import { Icon, Link, Meters, ReferenceCard } from '../common';
import { Portrait } from '../Portrait';
import { SceneArt } from '../SceneArt';
import { Dialogue } from './Dialogue';

export interface StageProps<S> {
  scenario: Scenario;
  stage: S;
  run: Run;
  ctx: Context;
  setRun(run: Run): void;
  /** Lets the stage tell the runner it has nothing left to show. */
  setReady(ready: boolean): void;
}

const QUALITY_TEXT = { strong: 'Strong', mixed: 'Mixed', weak: 'Weak' } as const;

export function NarrativeView({ scenario, stage, run, ctx, setReady }: StageProps<NarrativeStage>) {
  return (
    <div className="stage-scene">
      <div className="scene-frame"><SceneArt zone={scenario.zone} /></div>
      <div className="glass panel-pad stage-panel">
        <Dialogue lines={linesFor(stage.lines, run, ctx)} resetKey={stage.id} onDone={() => setReady(true)} />
      </div>
    </div>
  );
}

// ---- Explore ----

const START: [number, number] = [50, 92];

export function ExploreView({ scenario, stage, run, ctx, setRun }: StageProps<ExploreStage>) {
  const { progress } = useGame();
  const hotspots = visibleHotspots(stage, run, ctx);
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const [pos, setPos] = useState<[number, number]>(START);
  const panel = useRef<HTMLDivElement>(null);
  const look = PLAYER_LOOKS[progress.player?.avatar ?? 'ember'].look;

  useEffect(() => { setSelected(null); setPos(START); }, [stage.id]);

  const open = (h: Hotspot) => {
    setSelected(h);
    // Walk to just below the hotspot so the token doesn't cover it.
    setPos([h.x, Math.min(94, h.y + 12)]);
    if (!run.inspected.includes(h.id)) {
      setRun(inspect(run, h.id));
      announce(`${h.label}: added to your evidence record.`);
    }
    window.setTimeout(() => panel.current?.focus({ preventScroll: false }), 50);
  };

  const done = hotspots.filter((h) => run.inspected.includes(h.id)).length;

  return (
    <div className="explore">
      <div className="explore-main">
        <div className="scene-frame interactive">
          <SceneArt zone={scenario.zone} />
          {hotspots.map((h) => {
            const seen = run.inspected.includes(h.id);
            const c = h.characterId ? characterById(h.characterId) : null;
            return (
              <button
                key={h.id}
                type="button"
                className={`hotspot hotspot-${h.kind}${seen ? ' seen' : ''}${selected?.id === h.id ? ' active' : ''}${stage.required.includes(h.id) ? ' required' : ''}`}
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
                onClick={() => open(h)}
                aria-label={`${h.label}${h.kind === 'character' ? ', talk' : ', inspect'}${seen ? ', examined' : ''}${stage.required.includes(h.id) ? ', required' : ''}`}
              >
                {c ? <Portrait look={c.look} size={52} /> : <span className="hotspot-icon"><Icon name="doc" size={22} /></span>}
                <span className="hotspot-label">{h.label}{seen && <Icon name="check" size={14} />}</span>
              </button>
            );
          })}
          <span className="player-token" style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }} aria-hidden="true">
            <Portrait look={look} size={40} />
          </span>
        </div>
        <div ref={panel} tabIndex={-1} className="glass panel-pad inspect-panel" aria-live="polite">
          {!selected && <p className="muted">Select a person or object to investigate.</p>}
          {selected && selected.kind === 'character' && (
            <>
              <h3>{selected.label} <small className="muted">{characterById(selected.characterId!)?.role}</small></h3>
              <Dialogue key={selected.id} lines={linesFor(selected.lines ?? [], run, ctx)} />
            </>
          )}
          {selected && selected.kind === 'evidence' && selected.doc && (
            <div className="doc">
              <p className="doc-source">{selected.doc.source}</p>
              <h3>{selected.doc.title}</h3>
              <ul>{selected.doc.body.map((b) => <li key={b}>{b}</li>)}</ul>
            </div>
          )}
        </div>
      </div>
      <div className="explore-side">
        <div className="glass panel-pad">
          <p className="muted">{stage.instructions}</p>
          <p className="evidence-count"><strong>{done}</strong> of {hotspots.length} sources examined</p>
          <ul className="poi-list">
            {hotspots.map((h) => (
              <li key={h.id}>
                <button type="button" className={`poi${run.inspected.includes(h.id) ? ' seen' : ''}${selected?.id === h.id ? ' active' : ''}`} onClick={() => open(h)}>
                  <Icon name={h.kind === 'character' ? 'person' : 'doc'} size={18} />
                  <span>{h.label}{stage.required.includes(h.id) && <small> · required</small>}</span>
                  {run.inspected.includes(h.id) && <Icon name="check" size={16} />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ---- Decision and consequence ----

export function DecisionView({ scenario, stage, run, ctx, setRun }: StageProps<DecisionStage>) {
  const [pick, setPick] = useState<string>('');
  const chosen = chosenOption(scenario, run, stage.id);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { setPick(''); }, [stage.id]);
  useEffect(() => { if (chosen) heading.current?.focus(); }, [chosen]);

  if (chosen) {
    const without = { ...run, choices: { ...run.choices } };
    delete without.choices[stage.id];
    const reactions = chosen.outcome.reactions.filter((r) => conditionMet(r.when, run, ctx));
    return (
      <div className="consequence">
        <div className="glass panel-pad">
          <p className="eyebrow">Consequence · {stage.title}</p>
          <h2 ref={heading} tabIndex={-1}>{chosen.outcome.headline}</h2>
          <p className="you-chose"><span className="muted">You chose:</span> {chosen.label}</p>
          {chosen.outcome.narrative.map((n) => <p key={n}>{n}</p>)}
          <ul className="reactions">
            {reactions.map((r) => {
              const c = characterById(r.characterId)!;
              return (
                <li key={r.characterId + r.text} className={`reaction mood-${r.mood}`}>
                  <Portrait look={c.look} mood={r.mood} size={56} />
                  <div>
                    <span className="line-name">{c.name} <small className="muted">· {r.mood}</small></span>
                    <p>{r.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="consequence-side">
          {Object.keys(chosen.outcome.effects).length > 0 && (
            <div className="glass panel-pad">
              <h3>What changed</h3>
              <Meters defs={scenario.meters} values={meters(scenario, run)} before={meters(scenario, without)} />
              <p className="hint">These meters show the story's situation. They are simulated and say nothing about you.</p>
            </div>
          )}
          <div className={`glass panel-pad feedback quality-${chosen.quality}`}>
            <p className="eyebrow">Why it played out this way · <span className={`q q-${chosen.quality}`}>{QUALITY_TEXT[chosen.quality]} choice</span></p>
            <p>{chosen.feedback}</p>
            <div className="ref-list">
              {chosen.principleIds.map((p) => <ReferenceCard key={p} id={p} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const evidence = availableEvidence(scenario, stage, run, ctx);
  const seen = evidence.filter((h) => run.inspected.includes(h.id));
  return (
    <div className="decision">
      <div className="glass panel-pad">
        <p className="eyebrow">Decision · {stage.title}</p>
        <h2>{stage.prompt}</h2>
        <fieldset className="options">
          <legend className="visually-hidden">{stage.prompt}</legend>
          {stage.options.map((o) => (
            <label key={o.id} className={`option${pick === o.id ? ' selected' : ''}`}>
              <input type="radio" name={`decision-${stage.id}`} value={o.id} checked={pick === o.id} onChange={() => setPick(o.id)} />
              <span className="option-body">
                <strong>{o.label}</strong>
                {o.detail && <small>{o.detail}</small>}
              </span>
            </label>
          ))}
        </fieldset>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={!pick}
          onClick={() => {
            setRun(choose(scenario, run, stage.id, pick, ctx));
            announce('Decision made. Showing the consequences.');
          }}
        >
          Commit decision
        </button>
        {!pick && <p className="hint">Select an option, then commit. Decisions can't be undone in this run, but you can replay.</p>}
      </div>
      <aside className="glass panel-pad notebook">
        <h3>Your evidence</h3>
        <p className="evidence-count"><strong>{seen.length}</strong> of {evidence.length} available sources examined</p>
        {seen.length === 0 && <p className="muted">You haven't examined anything yet.</p>}
        <ul>{seen.map((h) => <li key={h.id}><strong>{h.label}:</strong> {h.summary}</li>)}</ul>
        {seen.length < evidence.length && <p className="hint">You can use Back to return and investigate further before committing.</p>}
      </aside>
    </div>
  );
}

// ---- Aftermath ----

export function AftermathView({ scenario, stage, run }: StageProps<AftermathStage>) {
  const option = chosenOption(scenario, run, stage.decision);
  const before = { ...run, stageId: scenario.stages[stageIndex(scenario, stage.id) - 1].id };
  return (
    <div className="aftermath">
      <div className="scene-frame dim"><SceneArt zone={scenario.zone} /></div>
      <div className="glass panel-pad stage-panel">
        <p className="eyebrow">{stage.title}</p>
        <h2>{stage.intro}</h2>
        {option && <p className="you-chose"><span className="muted">Your earlier decision:</span> {option.label}</p>}
        {(option?.outcome.later ?? []).map((l) => <p key={l} className="later">{l}</p>)}
        <Meters defs={scenario.meters} values={meters(scenario, run)} before={meters(scenario, before)} />
      </div>
    </div>
  );
}

// ---- Review of earlier scenarios ----

export function ReviewView({ stage }: StageProps<ReviewStage>) {
  const { progress } = useGame();
  return (
    <div className="review">
      <div className="glass panel-pad">
        <p className="eyebrow">{stage.title}</p>
        <h2>{stage.intro}</h2>
      </div>
      <div className="review-grid">
        {stage.scenarioIds.map((sid) => {
          const s = SCENARIO_MAP.get(sid);
          const last = record(progress, sid).last;
          if (!s) return null;
          return (
            <article key={sid} className="glass panel-pad">
              <h3>{s.title}</h3>
              {!last && <p className="muted">Not completed yet.</p>}
              {last && (
                <>
                  <ul className="review-decisions">
                    {decisionStages(s).map((d) => {
                      const o = d.options.find((x) => x.id === last.choices[d.id]);
                      return o ? (
                        <li key={d.id}>
                          <span className="muted">{d.title}</span>
                          <strong>{o.label}</strong>
                          <span><span className={`q q-${o.quality}`}>{QUALITY_TEXT[o.quality]}</span> {o.outcome.headline}</span>
                        </li>
                      ) : null;
                    })}
                  </ul>
                  <p className="muted">Reasoning score: {last.overall}% · <Link to={`/debrief/${sid}`} className="text-link">full debrief</Link></p>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

// ---- Reflection ----

export function ReflectionView({ stage, run, setRun }: StageProps<ReflectionStage>) {
  const selected = run.reflection?.selected ?? [];
  const note = run.reflection?.note ?? '';
  const update = (sel: string[], n: string) => setRun({ ...run, reflection: { selected: sel, note: n.slice(0, 2000) } });
  return (
    <div className="reflection glass panel-pad">
      <p className="eyebrow">{stage.title}</p>
      <h2>{stage.prompt}</h2>
      <fieldset className="checks">
        <legend className="visually-hidden">{stage.prompt}</legend>
        {stage.options.map((o) => (
          <label key={o.id} className={`check${selected.includes(o.id) ? ' selected' : ''}`}>
            <input
              type="checkbox"
              checked={selected.includes(o.id)}
              onChange={(e) => update(e.target.checked ? [...selected, o.id] : selected.filter((x) => x !== o.id), note)}
            />
            <span>{o.text}</span>
          </label>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor="reflection-note">{stage.notePrompt} <span className="muted">(optional)</span></label>
        <textarea id="reflection-note" rows={4} maxLength={2000} value={note} onChange={(e) => update(selected, e.target.value)} />
        <p className="hint">Saved to your learning journal on this device. It's never scored or sent anywhere.</p>
      </div>
    </div>
  );
}
