// The panel under the room, one per stage kind. Rules live in the engine;
// these views only present them and report the player's actions.

import { useEffect, useRef, useState } from 'react';
import type {
  AftermathStage, DecisionStage, ExploreStage, Hotspot, NarrativeStage, ReflectionStage, ReviewStage, Run, Scenario,
} from '../../engine/types';
import {
  choose, chosenOption, conditionMet, decisionStages, linesFor, medalFor, meters, missingRequired, optionAvailable,
  stageIndex, type Context,
} from '../../engine/scenario-engine';
import { record } from '../../engine/progress-store';
import { useGame } from '../../app/game';
import { announce } from '../../app/a11y';
import { characterById } from '../../content/characters';
import { SCENARIO_MAP } from '../../content/scenarios';
import { zoneForScenario } from '../../content/zones';
import { Meters } from '../common';
import { MedalIcon } from '../medals';
import { Portrait } from '../sprites';
import { Dialogue } from './Dialogue';
import { speak, speakAll } from '../../app/voice';
import { VoiceField } from '../VoiceInput';

export interface PanelProps<S> {
  scenario: Scenario;
  stage: S;
  run: Run;
  ctx: Context;
  reducedMotion: boolean;
  setRun(run: Run): void;
  onContinue(): void;
  continueLabel: string;
}

function ContinueButton({ onClick, label, disabled }: { onClick(): void; label: string; disabled?: boolean }) {
  return <button type="button" className="btn btn-primary" onClick={onClick} disabled={disabled}>{label} ▸</button>;
}

export function NarrativePanel({ stage, run, ctx, reducedMotion, onContinue, continueLabel }: PanelProps<NarrativeStage>) {
  return (
    <Dialogue
      lines={linesFor(stage.lines, run, ctx)}
      reducedMotion={reducedMotion}
      resetKey={stage.id}
      after={<ContinueButton onClick={onContinue} label={continueLabel} />}
    />
  );
}

// ---- Explore ----

export function ExplorePanel({ stage, run, ctx, reducedMotion, onContinue, continueLabel, active, onInteract, onClose, visible }: PanelProps<ExploreStage> & {
  active: Hotspot | null; onInteract(h: Hotspot): void; onClose(): void; visible: Hotspot[];
}) {
  const missing = missingRequired(stage, run, ctx);
  if (active) {
    const close = <button type="button" className="btn btn-pixel" onClick={onClose} autoFocus={active.kind === 'evidence'}>Done ▸</button>;
    if (active.kind === 'character' && active.lines) {
      return <Dialogue key={active.id} lines={linesFor(active.lines, run, ctx)} reducedMotion={reducedMotion} resetKey={active.id} after={close} />;
    }
    if (active.doc) {
      return (
        <div className={`doc-card${active.secret ? ' secret' : ''}`}>
          <p className="doc-source">{active.doc.source}</p>
          <h2 className="doc-title">{active.doc.title}</h2>
          <ul>{active.doc.body.map((b) => <li key={b}>{b}</li>)}</ul>
          <div className="dialogue-actions">{close}</div>
        </div>
      );
    }
  }
  const others = visible.filter((h) => !h.secret);
  return (
    <div className="explore-panel">
      <p className="goal"><span className="goal-label">Now</span> {stage.goal}</p>
      <div className="nearby" aria-label="People and things here">
        {others.map((h) => (
          <button key={h.id} type="button" className={`chip${run.inspected.includes(h.id) ? ' seen' : ''}`} onClick={() => onInteract(h)}>
            {h.kind === 'character' && h.icon !== 'call' ? '👤' : h.icon === 'call' ? '☎' : '▣'} {h.label}
            {run.inspected.includes(h.id) && <span className="visually-hidden"> (seen)</span>}
          </button>
        ))}
      </div>
      <div className="explore-foot">
        {missing.length > 0
          ? <p className="muted">{missing.map((h) => h.label).join(' and ')} {missing.length === 1 ? 'is' : 'are'} expecting you.</p>
          : <ContinueButton onClick={onContinue} label={continueLabel} />}
      </div>
    </div>
  );
}

// ---- Decision and consequence ----

const QUALITY_TEXT = { strong: 'Strong', mixed: 'Mixed', weak: 'Weak' } as const;

export function DecisionPanel({ scenario, stage, run, ctx, onContinue, continueLabel, setRun }: PanelProps<DecisionStage>) {
  const [pick, setPick] = useState('');
  const chosen = chosenOption(scenario, run, stage.id);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { setPick(''); }, [stage.id]);
  // The asker says their question aloud; afterwards, everyone reacts in turn.
  useEffect(() => { if (!chosen) speak(stage.prompt, stage.asker); }, [stage.id, stage.prompt, stage.asker, chosen]);
  useEffect(() => {
    if (!chosen) return;
    speakAll(chosen.outcome.reactions.filter((r) => conditionMet(r.when, run, ctx)).map((r) => ({ text: r.text, speaker: r.characterId })));
    // Spoken once, when the outcome first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen]);
  useEffect(() => {
    if (!chosen) return;
    // Keep the room (and everyone's reactions) in view while focus moves to the outcome.
    heading.current?.focus({ preventScroll: true });
    document.querySelector('.play')?.scrollIntoView({ block: 'start' });
  }, [chosen]);
  const asker = characterById(stage.asker);

  if (chosen) {
    const without = { ...run, choices: { ...run.choices } };
    delete without.choices[stage.id];
    const reactions = chosen.outcome.reactions.filter((r) => conditionMet(r.when, run, ctx));
    return (
      <div className="consequence">
        <div className="consequence-main">
          <h2 ref={heading} tabIndex={-1} className="headline">{chosen.outcome.headline}</h2>
          {chosen.outcome.narrative.map((n) => <p key={n}>{n}</p>)}
          <ul className={`reactions${reactions.every((r) => characterById(r.characterId)?.sprite.room === scenario.room) ? ' in-room' : ''}`}>
            {reactions.map((r) => (
              <li key={r.characterId + r.text} className={`reaction mood-${r.mood}${characterById(r.characterId)?.sprite.room === scenario.room ? ' in-room' : ''}`}>
                <Portrait characterId={r.characterId} size={44} />
                <p><strong>{characterById(r.characterId)?.name}</strong> {r.text}</p>
              </li>
            ))}
          </ul>
          <details className="why" open>
            <summary>Why it played out this way</summary>
            <p>{chosen.feedback}</p>
          </details>
        </div>
        <div className="consequence-side">
          {Object.keys(chosen.outcome.effects).length > 0 && (
            <Meters defs={scenario.meters} values={meters(scenario, run)} before={meters(scenario, without)} />
          )}
          <p className="notebook-note">📓 Noted in your notebook.</p>
          <ContinueButton onClick={onContinue} label={continueLabel} />
        </div>
      </div>
    );
  }

  const locked = stage.options.filter((o) => !optionAvailable(o, run)).length;
  return (
    <div className="decision">
      <div className="dialogue-box">
        <Portrait characterId={stage.asker} size={64} />
        <div className="dialogue-body">
          <span className="dialogue-name">{asker?.name}</span>
          <p className="dialogue-text">{stage.prompt}</p>
        </div>
      </div>
      <fieldset className="replies">
        <legend className="visually-hidden">Your reply</legend>
        {stage.options.map((o, i) => {
          const open = optionAvailable(o, run);
          if (!open) return null;
          return (
            <label key={o.id} className={`reply${pick === o.id ? ' selected' : ''}`}>
              <input type="radio" name={`decision-${stage.id}`} value={o.id} checked={pick === o.id} onChange={() => setPick(o.id)} />
              <span className="reply-num" aria-hidden="true">{i + 1}</span>
              <span>{o.label}</span>
            </label>
          );
        })}
        {locked > 0 && (
          <p className="reply locked">
            <span className="reply-num" aria-hidden="true">?</span>
            <span>{locked === 1 ? 'There may be another answer' : `There may be ${locked} other answers`}, if you knew more. Look around before you commit, or come back and replay.</span>
          </p>
        )}
      </fieldset>
      <div className="decision-foot">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!pick}
          onClick={() => {
            setRun(choose(scenario, run, stage.id, pick, ctx));
            announce('You said it. Here is what happened.');
          }}
        >
          Say it ▸
        </button>
        <span className="muted">You can't take it back in this run.</span>
      </div>
    </div>
  );
}

// ---- Aftermath ----

export function AftermathPanel({ scenario, stage, run, onContinue, continueLabel }: PanelProps<AftermathStage>) {
  const option = chosenOption(scenario, run, stage.decision);
  const before = { ...run, stageId: scenario.stages[stageIndex(scenario, stage.id) - 1].id };
  return (
    <div className="consequence">
      <div className="consequence-main">
        <p className="muted">{stage.intro}</p>
        {(option?.outcome.later ?? []).map((l) => <p key={l} className="later">{l}</p>)}
      </div>
      <div className="consequence-side">
        <Meters defs={scenario.meters} values={meters(scenario, run)} before={meters(scenario, before)} />
        <ContinueButton onClick={onContinue} label={continueLabel} />
      </div>
    </div>
  );
}

// ---- The elevator ride: a look back ----

export function ReviewPanel({ stage, onContinue, continueLabel }: PanelProps<ReviewStage>) {
  const { progress } = useGame();
  return (
    <div className="elevator">
      <p className="muted">{stage.intro}</p>
      <ul className="notebook-pages">
        {stage.scenarioIds.map((sid) => {
          const s = SCENARIO_MAP.get(sid);
          const rec = record(progress, sid);
          const z = zoneForScenario(sid);
          if (!s || !rec.last) return null;
          return (
            <li key={sid} className="notebook-page">
              <p className="nb-head"><MedalIcon medal={medalFor(s, rec.last)} size={18} /> Floor {s.floor} · {z?.place}</p>
              <ul>
                {decisionStages(s).map((d) => {
                  const o = d.options.find((x) => x.id === rec.last!.choices[d.id]);
                  return o ? <li key={d.id}><span className={`q q-${o.quality}`}>{QUALITY_TEXT[o.quality]}</span> {o.outcome.headline}</li> : null;
                })}
              </ul>
            </li>
          );
        })}
      </ul>
      <ContinueButton onClick={onContinue} label={continueLabel} />
    </div>
  );
}

// ---- Reflection: the notebook ----

export function ReflectionPanel({ stage, run, setRun, onContinue, continueLabel }: PanelProps<ReflectionStage>) {
  const selected = run.reflection?.selected ?? [];
  const note = run.reflection?.note ?? '';
  const update = (sel: string[], n: string) => setRun({ ...run, reflection: { selected: sel, note: n.slice(0, 2000) } });
  return (
    <div className="notebook">
      <h2 className="notebook-title">{stage.prompt}</h2>
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
      <label htmlFor="reflection-note" className="note-label">{stage.notePrompt} <span className="muted">(optional, private)</span></label>
      <VoiceField value={note} onChange={(v) => update(selected, v)} maxLength={2000} label="your note">
        <textarea id="reflection-note" rows={3} maxLength={2000} value={note} onChange={(e) => update(selected, e.target.value)} />
      </VoiceField>
      <div className="explore-foot">
        {selected.length === 0 ? <p className="muted">Tick at least one line to close the notebook.</p> : <ContinueButton onClick={onContinue} label={continueLabel} />}
      </div>
    </div>
  );
}
