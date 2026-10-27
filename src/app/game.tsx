// Game state: saved progress plus the actions screens use to change it.
// All rules live in src/engine; this file wires them to React and storage.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  createProgressStore, defaultProgress, journeyFlags, reconcileRuns, withAchievements, withCompletion, withPlayer,
  withReplay, withRun, withSettings, type Progress, type Settings,
} from '../engine/progress-store';
import { ACHIEVEMENTS, earnedAchievements } from '../engine/progression';
import { decisionStages, chosenOption, medalFor, score, type Context } from '../engine/scenario-engine';
import type { Result, Run } from '../engine/types';
import { SCENARIO_MAP } from '../content/scenarios';
import { ZONES } from '../content/zones';
import { applySettings, announce } from './a11y';

export interface Toast { id: number; title: string; text: string }

interface Game {
  progress: Progress;
  storageAvailable: boolean;
  ctx: Context;
  toasts: Toast[];
  dismissToast(id: number): void;
  createPlayer(name: string, avatar: string): void;
  updateSettings(settings: Partial<Settings>): void;
  saveRun(run: Run): void;
  completeRun(run: Run): Result | null;
  replay(scenarioId: string): void;
  reset(): void;
}

const GameContext = createContext<Game | null>(null);

export function useGame(): Game {
  const game = useContext(GameContext);
  if (!game) throw new Error('useGame must be used inside <GameProvider>');
  return game;
}

function withEarned(progress: Progress): Progress {
  const earned = earnedAchievements(progress, ZONES, SCENARIO_MAP);
  return withAchievements(progress, earned);
}

export function GameProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => createProgressStore(), []);
  const [progress, setProgress] = useState<Progress>(() => reconcileRuns(store.load(), SCENARIO_MAP));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  useEffect(() => { store.save(progress); }, [store, progress]);
  useEffect(() => { applySettings(progress.settings); }, [progress.settings]);

  // Toast achievements as they are added (not the ones loaded from a save).
  const seen = useRef(new Set(progress.achievements));
  useEffect(() => {
    const added = progress.achievements.filter((a) => !seen.current.has(a));
    if (!added.length) return;
    added.forEach((a) => seen.current.add(a));
    const items = added.map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter((a): a is NonNullable<typeof a> => Boolean(a));
    setToasts((t) => [...t, ...items.map((a) => ({ id: ++toastId.current, title: `Achievement: ${a.title}`, text: a.description }))]);
    announce(`Achievement unlocked: ${items.map((a) => a.title).join(', ')}`);
  }, [progress.achievements]);

  // Apply an update, then award any achievements it earned.
  const update = useCallback((fn: (p: Progress) => Progress) => setProgress((p) => withEarned(fn(p))), []);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const ctx = useMemo<Context>(() => ({ flags: journeyFlags(progress) }), [progress]);

  const game: Game = {
    progress,
    storageAvailable: store.available,
    ctx,
    toasts,
    dismissToast,
    createPlayer: (name, avatar) => update((p) => withPlayer(p, name, avatar)),
    updateSettings: (settings) => setProgress((p) => withSettings(p, settings)),
    saveRun: (run) => update((p) => withRun(p, run)),
    completeRun: (run) => {
      const scenario = SCENARIO_MAP.get(run.scenarioId);
      if (!scenario || !run.completed) return null;
      const result = score(scenario, run);
      const chosen = decisionStages(scenario).map((d) => ({ d, o: chosenOption(scenario, run, d.id) }));
      const reflectionStage = scenario.stages.find((s) => s.kind === 'reflection');
      const reflection = run.reflection;
      update((p) => withCompletion(p, run, result, {
        principleIds: [...new Set(chosen.flatMap((c) => c.o?.principleIds ?? []))],
        insights: chosen.filter((c) => c.o?.quality === 'strong').map((c) => `${scenario.id}/${c.d.id}`),
        medal: medalFor(scenario, result),
        journal: reflection && reflectionStage?.kind === 'reflection'
          ? {
            id: `${scenario.id}-${Date.now()}`,
            scenarioId: scenario.id,
            at: Date.now(),
            prompt: reflectionStage.notePrompt,
            selected: reflection.selected.map((id) => reflectionStage.options.find((o) => o.id === id)?.text ?? id),
            note: reflection.note,
          }
          : null,
      }));
      return result;
    },
    replay: (scenarioId) => update((p) => withReplay(p, scenarioId)),
    reset: () => {
      store.reset();
      seen.current = new Set();
      setProgress(defaultProgress());
      setToasts([]);
      announce('Progress reset.');
    },
  };

  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}
