// Every playable scenario. To add one: write a Scenario object, list it here
// and add its id to a zone in ../zones.ts. tests/content.test.ts validates it.

import type { Scenario } from '../../engine/types';
import { stalledRig } from './stalled-rig';
import { signalRoom } from './signal-room';
import { meridianLaunch } from './meridian-launch';
import { crucible } from './crucible';

export const SCENARIOS: Scenario[] = [stalledRig, signalRoom, meridianLaunch, crucible];

export const SCENARIO_MAP = new Map(SCENARIOS.map((s) => [s.id, s]));
