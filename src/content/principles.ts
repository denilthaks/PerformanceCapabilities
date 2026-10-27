// Framework content. Every item records how it was verified so the UI can
// separate published material from placeholders and gameplay interpretation.
//
// Research note (Oct 2026): the official sites could not be fetched directly
// from the build environment (network policy). The items marked 'summary' were
// confirmed from search-engine extracts of the official pages and podcast
// listings; their exact wording still needs Ben's review. Nothing marked
// 'placeholder' should be read as Ben's material.

export type Verification = 'title' | 'summary' | 'placeholder';

export interface Source {
  label: string;
  url: string;
}

export interface Level {
  id: 'level-1' | 'level-2' | 'level-3';
  number: 1 | 2 | 3;
  name: string;
  /** Subtitle used on the official site, where one was found. */
  subtitle: string;
  subtitleStatus: Verification;
  summary: string;
  summaryStatus: Verification;
  sources: Source[];
}

export interface Principle {
  id: string;
  number: number;
  level: Level['id'];
  /** Official title, or a neutral placeholder label. */
  title: string;
  titleStatus: Verification;
  summary: string;
  summaryStatus: Verification;
  sources: Source[];
}

export const SOURCES = {
  site: { label: 'performancecapability.com', url: 'https://performancecapability.com/' },
  trisphereon: { label: 'Performance Capability Trisphereon (official site)', url: 'https://performancecapability.com/performance-capability/' },
  training: { label: 'Performance Training (official site)', url: 'https://www.performancecapability.com/performance-training/' },
  coaching: { label: 'Performance Coaching (official site)', url: 'https://www.performancecapability.com/performance-coaching/' },
  founders: { label: "Founder's Note (official site)", url: 'https://performancecapability.com/founders-note/' },
  twelve: { label: 'The 12 Principles of the Performance Capability Trisphereon (benson-speaks.com)', url: 'https://benson-speaks.com/insights-1/f/the-12-principles-of-the-performance-capability-trisphereon' },
  podcast: { label: 'Ben Benson Performance Capability Network (podcast)', url: 'https://performancecapability.buzzsprout.com/2424655/episodes' },
  ep7: { label: 'Podcast episode 7: The Trisphereon, Level 1: Transactional, Mastering the Content', url: 'https://performancecapability.buzzsprout.com/2424655/episodes/16622888-episode-7-part-1-the-trisphereon-level-1-transactional-mastering-the-content' },
  ep9: { label: 'Podcast episode 9: Level 1 Transactional, knowledge-based vs practice-based development', url: 'https://performancecapability.buzzsprout.com/2424655/episodes/16710603-episode-9-level-1-transactional-knowledge-based-vs-practice-based-development' },
  shop: { label: 'performancecapability.shop', url: 'https://performancecapability.shop/' },
} satisfies Record<string, Source>;

export const FRAMEWORK = {
  name: 'Performance Capability Trisphereon',
  summary:
    'Performance Capability presents a framework, the Trisphereon, made of three interconnected levels that build on one another, with four principles at each level: twelve principles in all.',
  sources: [SOURCES.trisphereon, SOURCES.twelve],
};

export const LEVELS: Level[] = [
  {
    id: 'level-1',
    number: 1,
    name: 'Transactional',
    subtitle: 'Mastering the Content',
    subtitleStatus: 'title',
    summary:
      'The foundation level: commanding the "what and how" of performance. Podcast material on this level distinguishes knowledge-based development, which builds understanding, from practice-based development, which refines skill through action.',
    summaryStatus: 'summary',
    sources: [SOURCES.ep7, SOURCES.ep9, SOURCES.training],
  },
  {
    id: 'level-2',
    number: 2,
    name: 'Transformational',
    subtitle: 'Mastering the Context',
    subtitleStatus: 'summary',
    summary:
      'Placeholder for Ben to review. The level name comes from the published framework; its official description could not be retrieved for this prototype.',
    summaryStatus: 'placeholder',
    sources: [SOURCES.trisphereon],
  },
  {
    id: 'level-3',
    number: 3,
    name: 'Transcendental',
    subtitle: 'Mastering the Contribution',
    subtitleStatus: 'summary',
    summary:
      'Placeholder for Ben to review. The level name comes from the published framework; its official description could not be retrieved for this prototype.',
    summaryStatus: 'placeholder',
    sources: [SOURCES.trisphereon],
  },
];

const placeholder = (number: number, level: Level['id']): Principle => ({
  id: `p${number}`,
  number,
  level,
  title: `Principle ${number}`,
  titleStatus: 'placeholder',
  summary: 'Placeholder for Ben to review. This principle\'s official title and description could not be verified for this prototype.',
  summaryStatus: 'placeholder',
  sources: [SOURCES.twelve],
});

export const PRINCIPLES: Principle[] = [
  {
    id: 'p1',
    number: 1,
    level: 'level-1',
    title: "You Can't Develop What You Don't Accept",
    titleStatus: 'title',
    summary: 'Development starts from accepting present reality: a clear, honest view of where performance actually is now.',
    summaryStatus: 'summary',
    sources: [SOURCES.trisphereon, SOURCES.twelve],
  },
  {
    id: 'p2',
    number: 2,
    level: 'level-1',
    title: 'Principle 2: comfort with discomfort',
    titleStatus: 'summary',
    summary: 'Being comfortable with discomfort enables persistence through difficulty. (Theme as described in published summaries; official title to be confirmed.)',
    summaryStatus: 'summary',
    sources: [SOURCES.trisphereon],
  },
  {
    id: 'p3',
    number: 3,
    level: 'level-1',
    title: 'Principle 3: the Zone of Direct Development',
    titleStatus: 'summary',
    summary: 'Working in the Zone of Direct Development ensures efficient progress. (Theme as described in published summaries; official title and definition to be confirmed.)',
    summaryStatus: 'summary',
    sources: [SOURCES.trisphereon],
  },
  {
    id: 'p4',
    number: 4,
    level: 'level-1',
    title: 'Principle 4: process discipline',
    titleStatus: 'summary',
    summary: 'Disciplined adherence to process ensures consistent application. (Theme as described in published summaries; official title to be confirmed.)',
    summaryStatus: 'summary',
    sources: [SOURCES.trisphereon],
  },
  placeholder(5, 'level-2'),
  placeholder(6, 'level-2'),
  placeholder(7, 'level-2'),
  placeholder(8, 'level-2'),
  placeholder(9, 'level-3'),
  placeholder(10, 'level-3'),
  placeholder(11, 'level-3'),
  placeholder(12, 'level-3'),
];

/**
 * The Seven Stars. Published material states that the seven stars represent
 * seven human needs, and that a Seven Stars assessment maps a person's current
 * capability position against them. The individual needs could not be
 * verified, so they are deliberately not named or scored anywhere in the game.
 */
export const SEVEN_STARS = {
  summary:
    "Performance Capability's seven stars represent seven human needs that drive human accomplishment. Published coaching material describes a Seven Stars assessment that maps a person's current capability position against all seven needs, to find which need is driving a pattern of results.",
  summaryStatus: 'summary' as Verification,
  needsStatus: 'placeholder' as Verification,
  needsNote:
    'The names and descriptions of the seven needs could not be verified for this prototype, so they are left for Ben to supply. The game does not assign players to needs or score them against needs.',
  sources: [SOURCES.founders, SOURCES.coaching, SOURCES.shop],
};

/**
 * Gameplay concepts written for this prototype. They are not Ben's material;
 * the Principles page lists them separately from the framework.
 */
export interface GameConcept {
  id: string;
  title: string;
  summary: string;
  relatesTo: string[];
}

export const GAME_CONCEPTS: GameConcept[] = [
  {
    id: 'g-knowing-vs-doing',
    title: 'Knowing is not yet doing',
    summary: 'Passing a test shows someone has the information. It does not show they can perform the task under real conditions. Practice under those conditions closes that gap.',
    relatesTo: ['level-1', 'p1'],
  },
  {
    id: 'g-symptom-vs-cause',
    title: 'Symptoms are not causes',
    summary: 'Errors, delays and missed targets are what you see. Before deciding who or what to fix, look for the conditions that produce them.',
    relatesTo: ['level-1', 'p1'],
  },
  {
    id: 'g-test-assumptions',
    title: 'Test the assumption before acting on it',
    summary: 'When information is incomplete, a small, reversible step that tests your explanation is often better than a large fix built on it.',
    relatesTo: ['level-2'],
  },
  {
    id: 'g-familiar-fix',
    title: 'The familiar fix',
    summary: 'Repeating the action that worked last time feels safe. If the situation has changed, it can make the real problem harder to see.',
    relatesTo: ['level-2'],
  },
  {
    id: 'g-local-vs-system',
    title: 'Local wins, system costs',
    summary: 'A decision that improves one team\'s numbers can move the cost to another team, or into the future. Judge it at the level of the shared goal.',
    relatesTo: ['level-3'],
  },
  {
    id: 'g-conditions',
    title: 'Create the conditions for others',
    summary: 'Sustained performance depends on the conditions around people: clear standards, support, recognition and workload. Leaders shape those conditions.',
    relatesTo: ['level-3'],
  },
];

export function principleById(id: string): Principle | undefined {
  return PRINCIPLES.find((p) => p.id === id);
}

export function conceptById(id: string): GameConcept | undefined {
  return GAME_CONCEPTS.find((c) => c.id === id);
}

export function levelById(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

/**
 * Feedback can reference a principle, a level or a game concept. Returns a
 * display-ready reference with its verification status.
 */
export function resolveReference(id: string): { id: string; title: string; summary: string; kind: 'principle' | 'level' | 'concept'; status: Verification | 'game' } | null {
  const p = principleById(id);
  if (p) return { id, title: p.titleStatus === 'placeholder' ? `${p.title} (placeholder)` : p.title, summary: p.summary, kind: 'principle', status: p.summaryStatus };
  const l = levelById(id);
  if (l) return { id, title: `Level ${l.number}: ${l.name}`, summary: l.summary, kind: 'level', status: l.summaryStatus };
  const c = conceptById(id);
  if (c) return { id, title: c.title, summary: c.summary, kind: 'concept', status: 'game' };
  return null;
}
