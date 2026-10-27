// Every playable scenario, one per floor of Halcyon Tower. To add one: write a
// Scenario object, list it here and add its id to a zone in ../zones.ts.
// tests/content.test.ts validates it.

import type { Scenario } from '../../engine/types';
import { frontGate } from './front-gate';
import { signalVault } from './signal-vault';
import { lateShift } from './late-shift';
import { topFloor } from './top-floor';

export const SCENARIOS: Scenario[] = [frontGate, signalVault, lateShift, topFloor];

export const SCENARIO_MAP = new Map(SCENARIOS.map((s) => [s.id, s]));
