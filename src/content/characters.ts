// The people of Halcyon Tower. All fictional. Each is drawn in one of the
// pixel-art rooms; `sprite` points at their head there, for portraits.

import type { Character } from '../engine/types';

export const CHARACTERS: Character[] = [
  // Ground floor: the Grand Lobby
  {
    id: 'dana', name: 'Dana Reyes', role: 'Front-of-House Manager',
    goal: 'Get the new gates working before head office notices the incident count.',
    perspective: 'Kai passed the training. If the gates keep failing on his shift, that is on Kai.',
    sprite: { room: 'lobby', x: 240, y: 106 },
  },
  {
    id: 'kai', name: 'Kai Mensah', role: 'Night Security Officer, 4 months in',
    goal: 'Stop being the reason the lobby logs another incident.',
    perspective: 'I follow the procedure exactly. The new gates just don\'t behave the way it says.',
    sprite: { room: 'lobby', x: 444, y: 198 },
  },
  {
    id: 'margit', name: 'Margit Lindqvist', role: 'Head of Security, 12 years',
    goal: 'Keep the building safe without living in it.',
    perspective: 'Half of what matters about those gates isn\'t written down. You learn it standing next to someone.',
    sprite: { room: 'lobby', x: 432, y: 64 },
  },
  {
    id: 'luis', name: 'Luis Ferreira', role: 'Contractor, stuck at the gate',
    goal: 'Get upstairs before his client gives up on him.',
    perspective: 'Third night running the gate has eaten my pass.',
    sprite: { room: 'lobby', x: 86, y: 154 },
  },
  {
    id: 'ines', name: 'Ines Moreau', role: 'Interview candidate',
    goal: 'Land a job here, if it\'s a job worth having.',
    perspective: 'This is the third time they\'ve advertised the night role this year.',
    sprite: { room: 'lobby', x: 62, y: 200 },
  },
  // Floor 7: the Data Vault
  {
    id: 'imani', name: 'Imani Okafor', role: 'Operations Lead, Data Vault',
    goal: 'Get response times back under target, today.',
    perspective: 'The numbers went up when Rafael arrived. That isn\'t a coincidence.',
    sprite: { room: 'vault', x: 360, y: 160 },
  },
  {
    id: 'rafael', name: 'Rafael Duarte', role: 'Response Analyst, 6 weeks in',
    goal: 'Prove he belongs here.',
    perspective: 'My queue is all the nightmares. Nobody here asks for help, so neither do I.',
    sprite: { room: 'vault', x: 240, y: 254 },
  },
  {
    id: 'odette', name: 'Odette Varga', role: 'Senior Response Analyst',
    goal: 'Protect the way the Vault has always worked.',
    perspective: 'Nobody held my hand when I started. You figure it out.',
    sprite: { room: 'vault', x: 120, y: 156 },
  },
  {
    id: 'watcher', name: 'The Watcher', role: 'Unknown',
    goal: 'Unknown.',
    perspective: 'Has been here longer than the servers.',
    sprite: { room: 'vault', x: 447, y: 214 },
  },
  // Floor 23: the Break Lounge
  {
    id: 'priya', name: 'Priya Nair', role: 'Programme Director, Meridian launch',
    goal: 'Launch on the date she promised, with a product people trust.',
    perspective: 'Every team says it\'s green. So why does it feel like we\'re losing?',
    sprite: { room: 'lounge', x: 220, y: 220 },
  },
  {
    id: 'marcus', name: 'Marcus Hale', role: 'Build Team Lead',
    goal: 'Ship first and get the credit his team has earned.',
    perspective: 'My team is fast because we push. Everyone else should keep up.',
    sprite: { room: 'lounge', x: 297, y: 104 },
  },
  {
    id: 'lena', name: 'Lena Sato', role: 'Customer Support Lead',
    goal: 'Stop her team drowning in other people\'s defects.',
    perspective: 'Every early release lands on us, and nobody upstairs sees it.',
    sprite: { room: 'lounge', x: 152, y: 136 },
  },
  {
    id: 'ravi', name: 'Ravi Kapoor', role: 'Support Engineer',
    goal: 'Get through the week.',
    perspective: 'I\'ve stopped putting my hours on the timesheet. Nobody reads it.',
    sprite: { room: 'lounge', x: 126, y: 136 },
  },
  {
    id: 'jonah', name: 'Jonah Pierce', role: 'Junior Engineer, Build',
    goal: 'Keep up with the people being praised.',
    perspective: 'Everyone on Build works nights. If I stop, I\'m the one holding them back.',
    sprite: { room: 'lounge', x: 340, y: 181 },
  },
  {
    id: 'sam', name: 'Sam Okoro', role: 'Barista',
    goal: 'Keep the coffee flowing and the gossip accurate.',
    perspective: 'You learn a lot about a company from who orders what, and when.',
    sprite: { room: 'lounge', x: 78, y: 104 },
  },
  // Floor 40: the Executive Suite
  {
    id: 'sol', name: 'Sol Andersen', role: 'Chief Executive, Halcyon',
    goal: 'Keep the biggest client, and the company\'s reputation.',
    perspective: 'I have one hour before the client\'s board call. I need answers, not theories.',
    sprite: { room: 'executive', x: 240, y: 110 },
  },
  {
    id: 'mira', name: 'Mira Chen', role: 'On-call Engineer, first rotation',
    goal: 'Get through her first incident without making it worse.',
    perspective: 'I\'ve read the runbook three times. I\'ve never actually done a failover.',
    sprite: { room: 'executive', x: 132, y: 152 },
  },
  {
    id: 'adaeze', name: 'Dr. Adaeze Nwosu', role: 'Client CTO, waiting in the suite',
    goal: 'Know whether Halcyon can be trusted with her payments.',
    perspective: 'Outages happen. What I care about is what you do next.',
    sprite: { room: 'executive', x: 284, y: 158 },
  },
  {
    id: 'bex', name: 'Bex Harlow', role: 'Sol\'s Chief of Staff',
    goal: 'Protect Sol\'s time and the company\'s story.',
    perspective: 'Leadership has already told the client it was the vendor. Let\'s not muddy that.',
    sprite: { room: 'executive', x: 432, y: 124 },
  },
];

export function characterById(id: string): Character | undefined {
  return CHARACTERS.find((c) => c.id === id);
}
