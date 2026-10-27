// The four zones are the four floors of Halcyon Tower. Zones 1–3 align with the
// three published levels of the framework. Zone 4 is a game-design capstone,
// not a fourth level.

import type { Zone } from '../engine/progression';

export const ZONES: Zone[] = [
  {
    id: 'foundation',
    number: 1,
    name: 'The Foundation',
    place: 'Grand Lobby',
    floor: 'Ground',
    room: 'lobby',
    alignment: 'Level 1: Transactional',
    publishedLevel: true,
    theme: 'Telling the difference between having information and being able to perform a task.',
    requires: [],
    unlockText: 'Open from your first night.',
    scenarioIds: ['front-gate'],
    artefact: { name: 'Gate Key', description: 'Knowing the steps is where it starts, not where it ends.' },
  },
  {
    id: 'shift',
    number: 2,
    name: 'The Shift',
    place: 'Data Vault',
    floor: '7',
    room: 'vault',
    alignment: 'Level 2: Transformational',
    publishedLevel: true,
    theme: 'Questioning assumptions and recognising patterns that stop improvement.',
    requires: ['foundation'],
    unlockText: 'The elevator won\'t stop here until the lobby is resolved.',
    scenarioIds: ['signal-vault'],
    artefact: { name: 'Prism Lens', description: 'One situation, seen from more than one angle.' },
  },
  {
    id: 'horizon',
    number: 3,
    name: 'The Horizon',
    place: 'Break Lounge',
    floor: '23',
    room: 'lounge',
    alignment: 'Level 3: Transcendental',
    publishedLevel: true,
    theme: 'Wider consequences, purpose, and the conditions that let other people perform well.',
    requires: ['shift'],
    unlockText: 'Resolve the Data Vault first.',
    scenarioIds: ['late-shift'],
    artefact: { name: 'Horizon Compass', description: 'Point decisions at the shared goal, not the nearest win.' },
  },
  {
    id: 'trial',
    number: 4,
    name: 'The Integration Trial',
    place: 'Executive Suite',
    floor: '40',
    room: 'executive',
    alignment: 'Game capstone (combines all three published levels)',
    publishedLevel: false,
    theme: 'Applying everything at once, with the people your earlier decisions shaped.',
    requires: ['foundation', 'shift', 'horizon'],
    unlockText: 'The top floor opens when every floor below is resolved.',
    scenarioIds: ['top-floor'],
    artefact: { name: 'Halcyon Seal', description: 'The whole Tower, held together.' },
  },
];

export function zoneById(id: string): Zone | undefined {
  return ZONES.find((z) => z.id === id);
}

export function zoneForScenario(scenarioId: string): Zone | undefined {
  return ZONES.find((z) => z.scenarioIds.includes(scenarioId));
}
