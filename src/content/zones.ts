// The four zones of the world map. Zones 1–3 align with the three published
// levels of the framework. Zone 4 is a game-design capstone, not a fourth level.

import type { Zone } from '../engine/progression';

export const ZONES: Zone[] = [
  {
    id: 'foundation',
    number: 1,
    name: 'The Foundation',
    alignment: 'Level 1: Transactional',
    publishedLevel: true,
    theme: 'Telling the difference between having information and being able to perform a task.',
    environment: 'A dark industrial training facility: calibration rigs, illuminated walkways and a team under pressure.',
    objectives: [
      'Investigate why a trained technician keeps making errors.',
      'Separate the visible symptom from the underlying gap.',
      'Choose a response and see what it does to the team.',
    ],
    requires: [],
    unlockText: 'Open from the start.',
    scenarioIds: ['stalled-rig'],
    artefact: { name: 'Calibration Key', description: 'Earned by finishing The Foundation: a reminder that knowing the steps is where capability starts, not where it ends.' },
  },
  {
    id: 'shift',
    number: 2,
    name: 'The Shift',
    alignment: 'Level 2: Transformational',
    publishedLevel: true,
    theme: 'Questioning assumptions and recognising patterns that stop improvement.',
    environment: 'The Signal Room: a maze of branching data corridors, conflicting screens and misleading signals.',
    objectives: [
      'Act on an incomplete picture and see what your assumption costs.',
      'Gather new evidence from people and records that disagree.',
      'Rewind to the decision and choose again with a revised approach.',
    ],
    requires: ['foundation'],
    unlockText: 'Complete The Foundation, including its reflection.',
    scenarioIds: ['signal-room'],
    artefact: { name: 'Prism Lens', description: 'Earned by finishing The Shift: one situation, seen from more than one angle.' },
  },
  {
    id: 'horizon',
    number: 3,
    name: 'The Horizon',
    alignment: 'Level 3: Transcendental',
    publishedLevel: true,
    theme: 'Wider consequences, purpose, and the conditions that let other people perform well.',
    environment: 'The Meridian: a terraced city of connected teams, where every decision travels further than it looks.',
    objectives: [
      'Review how your earlier decisions played out.',
      'Resolve a cross-team challenge and balance individual and collective needs.',
      'See how a decision that worked locally plays out across the system three months later.',
    ],
    requires: ['shift'],
    unlockText: 'Complete The Shift.',
    scenarioIds: ['meridian-launch'],
    artefact: { name: 'Horizon Compass', description: 'Earned by finishing The Horizon: point decisions at the shared goal, not the nearest win.' },
  },
  {
    id: 'trial',
    number: 4,
    name: 'The Integration Trial',
    alignment: 'Game capstone (combines all three published levels)',
    publishedLevel: false,
    theme: 'Applying what you have practised to a new, layered crisis.',
    environment: 'The Crucible: a live incident room where all three earlier worlds converge.',
    objectives: [
      'Handle a multi-stage crisis: a capability gap, a wrong assumption and a system trade-off.',
      'Work with people whose situation depends on your earlier decisions.',
      'Receive a personalised debrief against a transparent rubric.',
    ],
    requires: ['foundation', 'shift', 'horizon'],
    unlockText: 'Complete Zones 1–3.',
    scenarioIds: ['crucible'],
    artefact: { name: 'Integration Seal', description: 'Earned by finishing the Integration Trial.' },
  },
];

export function zoneById(id: string): Zone | undefined {
  return ZONES.find((z) => z.id === id);
}

export function zoneForScenario(scenarioId: string): Zone | undefined {
  return ZONES.find((z) => z.scenarioIds.includes(scenarioId));
}
