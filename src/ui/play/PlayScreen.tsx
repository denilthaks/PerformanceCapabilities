// Plays one floor: a small HUD, the explorable room, and the panel for the
// current stage. Every change is saved, so a refresh resumes in place.

import { useCallback, useEffect, useState } from 'react';
import { useGame } from '../../app/game';
import { navigate } from '../../app/router';
import { announce, prefersReducedMotion } from '../../app/a11y';
import {
  advance, chosenOption, conditionMet, currentStage, exploreStages, inspect, previousStage, restoreRun, stageIndex,
  startRun, visibleHotspots,
} from '../../engine/scenario-engine';
import { record } from '../../engine/progress-store';
import { zoneUnlocked } from '../../engine/progression';
import type { Hotspot, Run, Scenario, Stage } from '../../engine/types';
import { characterById } from '../../content/characters';
import { SCENARIO_MAP } from '../../content/scenarios';
import { ZONES, zoneForScenario } from '../../content/zones';
import { Icon, Link } from '../common';
import { RoomStage, type Bubble } from '../RoomStage';
import { AftermathPanel, DecisionPanel, ExplorePanel, NarrativePanel, ReflectionPanel, ReviewPanel } from './stages';

/** How the player would refer to someone: "Dana", or "Dr. Nwosu" for a titled name. */
function shortName(id: string): string {
  const parts = characterById(id)?.name.split(' ') ?? ['them'];
  return /^(Dr|Prof)\.?$/.test(parts[0]) ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
}

/** What the Continue button says: where the story goes next, not "next step". */
function continueLabel(scenario: Scenario, index: number): string {
  const next: Stage | undefined = scenario.stages[index + 1];
  if (!next) return 'Close the notebook';
  switch (next.kind) {
    case 'decision': return `Go back to ${shortName(next.asker)}`;
    case 'explore': return 'Look around';
    case 'aftermath': return 'Let time pass';
    case 'reflection': return 'Open your notebook';
    default: return 'Continue';
  }
}

export function PlayScreen({ id }: { id: string }) {
  const game = useGame();
  const { progress, ctx } = game;
  const scenario = SCENARIO_MAP.get(id);
  const zone = zoneForScenario(id);
  const saved = record(progress, id).run;
  const [run, setRunState] = useState<Run | null>(() => (scenario ? (saved ? restoreRun(scenario, saved) : startRun(scenario)) : null));
  const [active, setActive] = useState<Hotspot | null>(null);
  const [notebook, setNotebook] = useState(false);
  const reduced = prefersReducedMotion(progress.settings);

  const setRun = useCallback((next: Run) => {
    setRunState(next);
    game.saveRun(next);
    // game.saveRun is recreated each render; the run is what matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save a freshly started run so Continue Journey can find it.
  useEffect(() => {
    if (run && !saved && zone && zoneUnlocked(progress, zone, ZONES)) game.saveRun(run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { setActive(null); }, [run?.stageId]);

  if (!scenario || !zone || !run) {
    return <section className="page narrow"><h1>Floor not found</h1><Link to="/journey" className="btn btn-primary">Back to the Tower</Link></section>;
  }

  if (!zoneUnlocked(progress, zone, ZONES)) {
    return (
      <section className="page narrow">
        <h1>The elevator won't stop at {zone.place} yet</h1>
        <p>{progress.player ? zone.unlockText : 'You need a character before you can enter the Tower.'}</p>
        <Link to={progress.player ? '/journey' : '/create'} className="btn btn-primary">{progress.player ? 'Back to the Tower' : 'Create your character'}</Link>
      </section>
    );
  }

  if (run.completed) {
    return (
      <section className="page narrow">
        <h1>{zone.place}: resolved</h1>
        <p>You've seen this floor through. Read the report, or play it again and try something different. Your best medal is kept.</p>
        <div className="row">
          <Link to={`/debrief/${id}`} className="btn btn-ghost">Floor report</Link>
          <button type="button" className="btn btn-primary" onClick={() => { game.replay(id); setRun(startRun(scenario)); }}>
            <Icon name="replay" />Play again
          </button>
        </div>
      </section>
    );
  }

  const stage = currentStage(scenario, run);
  const index = stageIndex(scenario, stage.id);
  const visible = stage.kind === 'explore' ? visibleHotspots(stage, run, ctx) : [];
  const look = progress.player?.avatar ?? 'ember';

  const interact = (h: Hotspot) => {
    if (!run.inspected.includes(h.id)) {
      setRun(inspect(run, h.id));
      if (h.secret) announce('You found something hidden.');
    }
    setActive(h);
  };

  const onContinue = () => {
    const next = advance(scenario, run, ctx);
    if (next.completed) {
      setRunState(next);
      game.completeRun(next);
      navigate(`/debrief/${id}`);
      return;
    }
    setRun(next);
    document.getElementById('stage-title')?.focus();
  };

  let bubbles: Bubble[] = [];
  if (stage.kind === 'decision') {
    const o = chosenOption(scenario, run, stage.id);
    if (o) bubbles = o.outcome.reactions.filter((r) => conditionMet(r.when, run, ctx));
  }
  const caption = stage.kind === 'aftermath' ? stage.title : stage.kind === 'review' ? `Going up · Floor ${scenario.floor}` : null;

  const props = { scenario, run, ctx, reducedMotion: reduced, setRun, onContinue, continueLabel: continueLabel(scenario, index) };
  const evidence = exploreStages(scenario).flatMap((s) => s.hotspots).filter((h) => run.inspected.includes(h.id));
  const found = evidence.filter((h) => !h.secret);
  const curios = evidence.filter((h) => h.secret);

  return (
    <section className={`play room-${scenario.room}`}>
      <header className="hud">
        <div className="hud-place">
          <span className="floor-badge">{scenario.floor === 'Ground' ? 'G' : scenario.floor}</span>
          <div>
            <p className="hud-sub">{zone.place} · {scenario.title}</p>
            <h1 id="stage-title" tabIndex={-1}>{stage.title}</h1>
          </div>
        </div>
        <div className="hud-actions">
          <button type="button" className={`btn btn-ghost btn-sm${notebook ? ' on' : ''}`} aria-expanded={notebook} aria-controls="field-notebook" onClick={() => setNotebook((n) => !n)}>
            📓 <span className="hud-count">{found.length}</span><span className="visually-hidden"> clues in your notebook</span>
          </button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={index === 0} onClick={() => setRun(previousStage(scenario, run))}>
            <Icon name="back" size={16} />Back
          </button>
          <Link to={`/zone/${zone.id}`} className="btn btn-text btn-sm">Leave floor</Link>
        </div>
      </header>

      {notebook && (
        <aside id="field-notebook" className="field-notebook">
          <h2>Your notebook</h2>
          {found.length === 0 && <p className="muted">Nothing yet. Talk to people. Look at things.</p>}
          <ul>{found.map((h) => <li key={h.id}><strong>{h.label}:</strong> {h.summary}</li>)}</ul>
          {curios.length > 0 && (
            <>
              <h3>Curiosities</h3>
              <ul>{curios.map((h) => <li key={h.id}>{h.summary}</li>)}</ul>
            </>
          )}
        </aside>
      )}

      <div className="play-room">
        <RoomStage
          key={scenario.id}
          room={scenario.room}
          look={look}
          start={scenario.start}
          hotspots={visible}
          inspected={run.inspected}
          activeId={active?.id ?? null}
          interactive={stage.kind === 'explore'}
          reducedMotion={reduced}
          onInteract={interact}
          bubbles={bubbles}
          caption={caption}
        />
      </div>

      <div className="play-panel" aria-live="polite">
        {stage.kind === 'narrative' && <NarrativePanel {...props} stage={stage} />}
        {stage.kind === 'explore' && <ExplorePanel {...props} stage={stage} active={active} visible={visible} onInteract={interact} onClose={() => setActive(null)} />}
        {stage.kind === 'decision' && <DecisionPanel {...props} stage={stage} />}
        {stage.kind === 'aftermath' && <AftermathPanel {...props} stage={stage} />}
        {stage.kind === 'review' && <ReviewPanel {...props} stage={stage} />}
        {stage.kind === 'reflection' && <ReflectionPanel {...props} stage={stage} />}
      </div>
    </section>
  );
}
