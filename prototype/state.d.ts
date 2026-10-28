import type { Run, Scenario } from '../src/engine/types';
import type { Medal } from '../src/engine/scenario-engine';

export interface PrototypeSave {
  v: 1;
  player: { name: string; look: string } | null;
  run: Run;
  pos: { x: number; y: number };
  best: { xp: number; medal: Medal | null; completions: number };
}

export const SAVE_KEY: string;
export function blankSave(scenario: Scenario): PrototypeSave;
export function sanitise(raw: unknown, scenario: Scenario): PrototypeSave;
export function load(storage: Pick<Storage, 'getItem'> | null | undefined, scenario: Scenario): PrototypeSave;
export function persist(storage: Pick<Storage, 'setItem'> | null | undefined, save: PrototypeSave): boolean;
export function recordFinish(save: PrototypeSave, xp: number, medal: Medal | null): PrototypeSave;
export function resumeScreen(scenario: Scenario, save: PrototypeSave): 'select' | 'lobby' | 'decision' | 'feedback' | 'reflection' | 'complete';
export function startFresh(save: PrototypeSave, scenario: Scenario, player: { name: string; look: string }): PrototypeSave;
