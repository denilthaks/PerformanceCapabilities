// Scenario characters. All are fictional and written for this prototype.

import type { Character } from '../engine/types';

export const CHARACTERS: Character[] = [
  // Zone 1: The Foundation
  {
    id: 'dana', name: 'Dana Reyes', role: 'Line Supervisor, Calibration Bay',
    goal: 'Hit the weekly calibration target without more rework.',
    perspective: 'Kai has had the training and passed it. If the errors continue, it has to be an attitude problem.',
    look: { skin: '#b07a55', hair: '#1b1414', hairStyle: 'bun', accent: '#FF303F', outfit: '#2a2d38' },
  },
  {
    id: 'kai', name: 'Kai Mensah', role: 'Calibration Technician, 4 months in',
    goal: 'Get the new rig right without looking like the weak link.',
    perspective: 'I know the steps on paper. The new rig behaves differently and nobody has shown me how.',
    look: { skin: '#6b4430', hair: '#0f0c0c', hairStyle: 'fade', accent: '#F0C66A', outfit: '#323646' },
  },
  {
    id: 'theo', name: 'Theo Lindqvist', role: 'Senior Technician, 12 years',
    goal: 'Keep the bay running and avoid being pulled off the line.',
    perspective: 'Most of what matters on the new rig is not in the manual. We learned it by doing it next to someone.',
    look: { skin: '#e2c2a6', hair: '#a8a29a', hairStyle: 'short', accent: '#8F1026', outfit: '#3a3a40' },
  },
  // Zone 2: The Shift
  {
    id: 'imani', name: 'Imani Okafor', role: 'Operations Lead, Signal Room',
    goal: 'Bring response times back under the service-level target.',
    perspective: 'Response times went up when Rafael joined. A tighter script and a performance plan should fix it.',
    look: { skin: '#5a3a28', hair: '#120d0b', hairStyle: 'curly', accent: '#FF303F', outfit: '#262a35' },
  },
  {
    id: 'rafael', name: 'Rafael Duarte', role: 'Response Analyst, 6 weeks in',
    goal: 'Prove he belongs on the team.',
    perspective: 'My queue is full of the hardest cases. I try to solve them myself because nobody escalates here.',
    look: { skin: '#c18e6a', hair: '#2b1d14', hairStyle: 'short', accent: '#9fb4ff', outfit: '#30343f' },
  },
  {
    id: 'odette', name: 'Odette Varga', role: 'Senior Response Analyst',
    goal: 'Protect the team\'s way of working.',
    perspective: 'We have always handled it this way and it worked. New people need to toughen up.',
    look: { skin: '#e8cdb5', hair: '#5a2320', hairStyle: 'long', accent: '#F0C66A', outfit: '#2d2a33' },
  },
  // Zone 3: The Horizon
  {
    id: 'priya', name: 'Priya Nair', role: 'Programme Director, Meridian Launch',
    goal: 'Launch Meridian on the committed date with a product customers trust.',
    perspective: 'I need every team pulling in the same direction, and right now I can\'t tell if they are.',
    look: { skin: '#9c6b4c', hair: '#0e0b0b', hairStyle: 'long', accent: '#FF303F', outfit: '#23262f' },
  },
  {
    id: 'marcus', name: 'Marcus Hale', role: 'Build Team Lead',
    goal: 'Ship his team\'s module first and get the recognition it deserves.',
    perspective: 'My team is fast because we push hard. Other teams should match us instead of slowing us down.',
    look: { skin: '#d9b08f', hair: '#3b2a1f', hairStyle: 'short', accent: '#ff8a5c', outfit: '#2c3040' },
  },
  {
    id: 'lena', name: 'Lena Sato', role: 'Customer Support Lead',
    goal: 'Stop her team drowning in defects they didn\'t create.',
    perspective: 'Every early release lands on us. We absorb the cost and nobody sees it.',
    look: { skin: '#e5c4a1', hair: '#141015', hairStyle: 'bun', accent: '#7fd1c7', outfit: '#2b2f39' },
  },
  {
    id: 'jonah', name: 'Jonah Pierce', role: 'Junior Engineer, Build Team',
    goal: 'Keep up with the people being praised.',
    perspective: 'Everyone here works nights. If I stop, I fall behind.',
    look: { skin: '#7a5136', hair: '#1a1210', hairStyle: 'shaved', accent: '#F0C66A', outfit: '#343846' },
  },
  // Zone 4: The Integration Trial
  {
    id: 'sol', name: 'Sol Andersen', role: 'Incident Commander, Halcyon',
    goal: 'Restore the client\'s service and keep the partnership.',
    perspective: 'I have one hour before the client\'s executive call. I need answers, not theories.',
    look: { skin: '#cfa27f', hair: '#6b6b6b', hairStyle: 'short', accent: '#FF303F', outfit: '#22252e' },
  },
  {
    id: 'mira', name: 'Mira Chen', role: 'On-call Engineer, first rotation',
    goal: 'Get through her first incident without making it worse.',
    perspective: 'I read the runbook. I have never actually done a failover.',
    look: { skin: '#ecd0b3', hair: '#0d0b0c', hairStyle: 'long', accent: '#9fb4ff', outfit: '#2e3240' },
  },
];

export function characterById(id: string): Character | undefined {
  return CHARACTERS.find((c) => c.id === id);
}

/** The four player looks offered at character creation. */
export const PLAYER_LOOKS: Record<string, { label: string; look: Character['look'] }> = {
  ember: { label: 'Ember', look: { skin: '#a8744f', hair: '#1a1212', hairStyle: 'curly', accent: '#FF303F', outfit: '#1c1f29' } },
  onyx: { label: 'Onyx', look: { skin: '#5e3b29', hair: '#0b0909', hairStyle: 'fade', accent: '#F0C66A', outfit: '#1f2230' } },
  vanta: { label: 'Vanta', look: { skin: '#e9cdb3', hair: '#2a1b18', hairStyle: 'long', accent: '#c3c8ff', outfit: '#20232c' } },
  signal: { label: 'Signal', look: { skin: '#c89474', hair: '#3a2a20', hairStyle: 'short', accent: '#ff7a52', outfit: '#232733' } },
};
