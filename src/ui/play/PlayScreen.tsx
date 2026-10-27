// Runs one scenario: stage header, Back / Exit, the current stage view and the
// Continue action. Every change is saved, so a refresh resumes in place.

import { useCallback, useEffect, useState } from 'react';
import { useGame } from '../../app/game';
import { navigate } from '../../app/router';
import { advance, blocker, currentStage, previousStage, restoreRun, stageIndex, startRun } from '../../engine/scenario-engine';
import { record } from '../../engine/progress-store';
import { zoneUnlocked } from '../../engine/progression';
import type { Run } from '../../engine/types';
import { SCENARIO_MAP } from '../../content/scenarios';
import { ZONES, zoneForScenario } from '../../content/zones';
import { Icon, Link } from '../common';
import { AftermathView, DecisionView, ExploreView, NarrativeView, ReflectionView, ReviewView } from './stages';

export function PlayScreen({ id }: { id: string }) {
  const game = useGame();
  const { progress, ctx } = game;
  const scenario = SCENARIO_MAP.get(id);
  const zone = zoneForScenario(id);
  const saved = record(progress, id).run;
  const [run, setRunState] = useState<Run | null>(() => (scenario ? (saved ? restoreRun(scenario, saved) : startRun(scenario)) : null));
  const [ready, setReady] = useState(false);
  const stage = scenario && run ? currentStage(scenario, run) : null;

  const setRun = useCallback((next: Run) => {
    setRunState(next);
    game.saveRun(next);
    // game.saveRun is recreated each render; the run is what matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save a freshly started run so Continue Journey can find it.
  useEffect(() => {
    if (run && !saved && scenario && zone && zoneUnlocked(progress, zone, ZONES)) game.saveRun(run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { setReady(false); }, [run?.stageId]);

  if (!scenario || !zone || !run || !stage) {
    return (
      <section className="page narrow">
        <h1>Scenario not found</h1>
        <Link to="/zones" className="btn btn-primary">All zones</Link>
      </section>
    );
  }

  if (!zoneUnlocked(progress, zone, ZONES)) {
    return (
      <section className="page narrow">
        <h1>{scenario.title} is locked</h1>
        <p>{progress.player ? zone.unlockText : 'Create a character to begin.'}</p>
        <Link to={progress.player ? '/journey' : '/create'} className="btn btn-primary">{progress.player ? 'Back to the world map' : 'Create character'}</Link>
      </section>
    );
  }

  if (run.completed) {
    return (
      <section className="page narrow">
        <h1>You've completed {scenario.title}</h1>
        <p>Review your debrief, or replay the scenario to try a different approach. Your best score is kept.</p>
        <div className="row">
          <Link to={`/debrief/${id}`} className="btn btn-ghost">View debrief</Link>
          <button type="button" className="btn btn-primary" onClick={() => { game.replay(id); setRun(startRun(scenario)); }}>
            <Icon name="replay" />Replay
          </button>
        </div>
      </section>
    );
  }

  const index = stageIndex(scenario, stage.id);
  const block = blocker(scenario, run, ctx);
  const needsReady = stage.kind === 'narrative';
  const canContinue = !block && (!needsReady || ready);
  const last = index === scenario.stages.length - 1;

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

  const props = { scenario, run, ctx, setRun, setReady };

  return (
    <section className={`play zone-${scenario.zone}`}>
      <header className="play-head">
        <div className="play-nav">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={index === 0}
            onClick={() => setRun(previousStage(scenario, run))}
          >
            <Icon name="back" size={18} />Back
          </button>
          <Link to={`/zone/${zone.id}`} className="btn btn-text btn-sm">Exit to {zone.name}</Link>
        </div>
        <div className="play-title">
          <p className="eyebrow">Zone {zone.number} · {scenario.title}</p>
          <h1 id="stage-title" tabIndex={-1}>{stage.title}</h1>
        </div>
        <ol className="stepper" aria-label="Scenario stages">
          {scenario.stages.map((s, i) => (
            <li key={s.id} className={i < index ? 'done' : i === index ? 'current' : ''} aria-current={i === index ? 'step' : undefined}>
              <span className="visually-hidden">{s.title}{i < index ? ' (done)' : ''}</span>
            </li>
          ))}
        </ol>
      </header>

      <div className="play-body">
        {stage.kind === 'narrative' && <NarrativeView {...props} stage={stage} />}
        {stage.kind === 'explore' && <ExploreView {...props} stage={stage} />}
        {stage.kind === 'decision' && <DecisionView {...props} stage={stage} />}
        {stage.kind === 'aftermath' && <AftermathView {...props} stage={stage} />}
        {stage.kind === 'review' && <ReviewView {...props} stage={stage} />}
        {stage.kind === 'reflection' && <ReflectionView {...props} stage={stage} />}
      </div>

      <footer className="play-foot">
        <p className="play-status" aria-live="polite">{block ?? (needsReady && !ready ? 'Read on to continue.' : '')}</p>
        {!(stage.kind === 'decision' && !run.choices[stage.id]) && (
          <button type="button" className="btn btn-primary btn-lg" disabled={!canContinue} onClick={onContinue}>
            {last ? 'Complete and see debrief' : stage.kind === 'explore' ? 'Ready to decide' : 'Continue'}
            <Icon name="arrow" />
          </button>
        )}
      </footer>
    </section>
  );
}
