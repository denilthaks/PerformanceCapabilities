// Zone 2, The Shift (Level 2: Transformational). Fictional scenario written
// for this prototype. The published Level 2 principles could not be verified,
// so feedback links to the level and to clearly labelled gameplay concepts.

import type { Scenario } from '../../engine/types';

export const signalRoom: Scenario = {
  id: 'signal-room',
  zone: 'shift',
  title: 'The Signal Room',
  tagline: 'The obvious explanation is ready and waiting. Is it the right one?',
  setting: 'The Signal Room, an operations response centre. Response times have climbed for three weeks.',
  objectives: [
    'Make a first call with only part of the picture.',
    'See what happens when the first explanation is wrong.',
    'Uncover what changed, rewind, and choose a revised approach.',
  ],
  characters: ['imani', 'rafael', 'odette'],
  principleIds: ['level-2', 'p1', 'g-test-assumptions', 'g-familiar-fix'],
  meters: [
    { id: 'output', label: 'Response speed', start: 4 },
    { id: 'quality', label: 'Resolution quality', start: 5 },
    { id: 'trust', label: 'Trust', start: 5 },
    { id: 'capability', label: 'Capability', start: 4 },
    { id: 'wellbeing', label: 'Wellbeing', start: 4 },
  ],
  criteria: ['evidence', 'diagnosis', 'development', 'impact', 'reflection'],
  estimatedMinutes: 10,
  stages: [
    {
      kind: 'narrative',
      id: 'brief',
      title: 'The brief',
      lines: [
        { speaker: 'narrator', text: 'Screens flicker in the Signal Room. A red line on the wall display climbs steadily: average response time.' },
        { speaker: 'imani', text: 'Up forty per cent in three weeks. We\'re breaching our target every day.' },
        { speaker: 'imani', text: 'It started when Rafael joined. His numbers are double everyone else\'s. I\'ve drafted a performance plan, and I want to bring back the fast-response script that fixed this last year.' },
        { speaker: 'imani', text: 'I need a decision today.' },
      ],
    },
    {
      kind: 'explore',
      id: 'first-look',
      title: 'First look',
      instructions: 'You have a little time before Imani needs an answer. Speak to Imani and check the dashboard. Talk to anyone else you can.',
      required: ['imani', 'dashboard'],
      hotspots: [
        {
          id: 'imani', label: 'Imani Okafor', kind: 'character', characterId: 'imani', x: 18, y: 64,
          summary: 'Imani links the rise to Rafael\'s arrival and wants a quick, familiar fix.',
          lines: [
            { speaker: 'imani', text: 'I\'ve run this team for five years. When numbers move, it\'s usually one person or one process.' },
            { speaker: 'player', text: 'What else changed three weeks ago?' },
            { speaker: 'imani', text: 'Nothing that matters. Rafael started. That\'s the change.' },
          ],
        },
        {
          id: 'dashboard', label: 'Response dashboard', kind: 'evidence', x: 50, y: 24, misleading: true,
          summary: 'Team average is 41 minutes against a 25-minute target. Rafael\'s average is 78 minutes, and the rise lines up with his start date.',
          doc: {
            title: 'Response dashboard: last 30 days',
            source: 'Signal Room wall display',
            body: [
              'Team average response: 41 min (target 25)',
              'Slowest analyst: R. Duarte, 78 min',
              'Trend begins: 21 days ago (R. Duarte start date marked)',
              'Breakdown by ticket type: not shown on this view',
            ],
          },
        },
        {
          id: 'rafael', label: 'Rafael Duarte', kind: 'character', characterId: 'rafael', x: 52, y: 70,
          summary: 'Rafael says his queue is full of hard cases and that people don\'t escalate here.',
          lines: [
            { speaker: 'rafael', text: 'I know my numbers look bad.' },
            { speaker: 'rafael', text: 'Most of what lands in my queue is the gnarly stuff: outages, data issues. I try to solve them myself.' },
            { speaker: 'player', text: 'Why not escalate?' },
            { speaker: 'rafael', text: 'Nobody does. I asked once and got a look. So I don\'t.' },
          ],
        },
        {
          id: 'odette', label: 'Odette Varga', kind: 'character', characterId: 'odette', x: 82, y: 64,
          summary: 'Odette thinks new people need to toughen up, and that the old way of working is fine.',
          lines: [
            { speaker: 'odette', text: 'When I started, nobody held my hand. You figure it out.' },
            { speaker: 'odette', text: 'The script worked last year. Bring it back, everyone speeds up, done.' },
          ],
        },
      ],
    },
    {
      kind: 'decision',
      id: 'first-call',
      title: 'First call',
      prompt: 'You only have part of the picture, and Imani wants action today. What do you do?',
      evidenceFrom: ['first-look'],
      options: [
        {
          id: 'plan',
          label: 'Agree with Imani: put Rafael on a performance plan.',
          quality: 'weak',
          rubric: { diagnosis: 0, impact: 0 },
          outcome: {
            headline: 'Decisive. Is it right?',
            narrative: ['The plan is issued that afternoon. Imani is relieved to have acted.'],
            reactions: [
              { characterId: 'imani', mood: 'relieved', text: 'Good. Now we\'ll see some movement.' },
              { characterId: 'rafael', mood: 'withdrawn', text: 'Understood.' },
            ],
            effects: { trust: -2, wellbeing: -1 },
            later: [
              'Two weeks on, Rafael\'s numbers haven\'t moved. He has stopped asking questions entirely and is quietly applying for other jobs.',
              'Odette\'s average has started to slip too, and nobody can explain why.',
            ],
            laterEffects: { output: -1, wellbeing: -1 },
          },
          feedback: 'The dashboard showed a correlation: times rose when Rafael started. Acting on it as if it were a cause skipped the question "what else changed?" It\'s the most natural mistake in this scenario, which is why it\'s worth noticing.',
          principleIds: ['g-test-assumptions', 'level-2'],
          flags: ['first-plan'],
        },
        {
          id: 'script',
          label: 'Bring back last year\'s fast-response script for the whole team.',
          quality: 'weak',
          rubric: { diagnosis: 0, impact: 1 },
          outcome: {
            headline: 'The familiar fix.',
            narrative: ['The script is back by evening. Simple tickets close faster almost immediately.'],
            reactions: [
              { characterId: 'odette', mood: 'relieved', text: 'Told you. Old tricks.' },
              { characterId: 'rafael', mood: 'concerned', text: 'The script doesn\'t cover the kind of tickets I get.' },
            ],
            effects: { output: 1, quality: -1 },
            later: [
              'Two weeks on, simple tickets are faster but the average has barely moved. Complex tickets bounce back to customers two or three times.',
              'The script fixed last year\'s problem. This year\'s problem looks different.',
            ],
            laterEffects: { output: -1, quality: -1 },
          },
          feedback: 'Repeating an action that worked before feels safe. But it assumes this year\'s problem has the same cause as last year\'s. Nobody checked that assumption.',
          principleIds: ['g-familiar-fix', 'level-2'],
          flags: ['first-script'],
        },
        {
          id: 'probe',
          label: 'Hold the big decision for a week. Pull ticket-level data and ask the team what changed three weeks ago.',
          quality: 'strong',
          rubric: { diagnosis: 2, impact: 2 },
          outcome: {
            headline: 'A small, reversible step.',
            narrative: ['You tell Imani you\'ll have a recommendation in a week, and ask for ticket-level data in the meantime.'],
            reactions: [
              { characterId: 'imani', mood: 'frustrated', text: 'A week? We\'re breaching every day.' },
              { characterId: 'rafael', mood: 'encouraged', text: 'Thanks for asking about the tickets, not just the time.' },
            ],
            effects: { trust: 1 },
            later: [
              'The data arrives, and something doesn\'t fit Imani\'s story: Rafael\'s simple tickets are as fast as anyone\'s.',
              'Two weeks of breaches cost goodwill with Imani, but you now have something to work with.',
            ],
            laterEffects: { output: -1 },
          },
          feedback: 'With incomplete information, you chose a step that tests the explanation before committing to it. It cost a week of pressure, but it kept you from building a fix on an untested assumption.',
          principleIds: ['g-test-assumptions', 'level-2'],
          flags: ['first-probe'],
        },
        {
          id: 'wait',
          label: 'Do nothing yet. New starters always take time to settle in.',
          quality: 'weak',
          rubric: { diagnosis: 0, impact: 0 },
          outcome: {
            headline: 'Waiting is also a decision.',
            narrative: ['You tell Imani to give it time. She isn\'t happy.'],
            reactions: [
              { characterId: 'imani', mood: 'frustrated', text: 'Time is exactly what we don\'t have.' },
            ],
            effects: { trust: -1 },
            later: ['Two weeks on, response times have climbed further. Rafael is exhausted.'],
            laterEffects: { output: -1, wellbeing: -2 },
          },
          feedback: 'Waiting assumes the problem will fix itself, which is another untested assumption. Unlike a probe, it gathers no new information while the cost builds.',
          principleIds: ['g-test-assumptions'],
          flags: ['first-wait'],
        },
      ],
    },
    {
      kind: 'aftermath',
      id: 'two-weeks',
      title: 'Two weeks later',
      decision: 'first-call',
      intro: 'Whatever you decided, the situation has moved on. New evidence has surfaced, and the room looks different from here.',
    },
    {
      kind: 'explore',
      id: 'second-look',
      title: 'Second look',
      instructions: 'New records and conversations are now available. Check the routing change log and the ticket sample before you decide again.',
      required: ['routing-log', 'ticket-sample'],
      hotspots: [
        {
          id: 'routing-log', label: 'Routing change log', kind: 'evidence', x: 30, y: 26, revealAfter: 'first-call',
          summary: 'Three weeks ago, a new rule sent the most complex tickets to the newest analyst "for development exposure". Imani approved it.',
          doc: {
            title: 'Routing configuration: change history',
            source: 'Ticketing system',
            body: [
              '21 days ago: NEW RULE "Tier-3 escalations → newest analyst (development exposure)"',
              'Approved by: I. Okafor',
              'Support or pairing attached to rule: none',
            ],
          },
        },
        {
          id: 'ticket-sample', label: 'Ticket sample', kind: 'evidence', x: 68, y: 26, revealAfter: 'first-call',
          summary: '64% of Rafael\'s tickets are Tier-3, against a team average of 12%. On Tier-1 tickets, his speed matches the team.',
          doc: {
            title: 'Ticket mix by analyst, last 21 days',
            source: 'Ticketing system export',
            body: [
              'R. Duarte: Tier-3 share 64% · Tier-1 avg 19 min (team 18 min)',
              'Team average Tier-3 share: 12%',
              'Tier-3 tickets escalated for help: 0 of 211 (whole team)',
            ],
          },
        },
        {
          id: 'imani-2', label: 'Imani, again', kind: 'character', characterId: 'imani', x: 18, y: 64, revealAfter: 'first-call',
          summary: 'Imani set up the routing rule to stretch new people, and hadn\'t connected it to the numbers.',
          lines: [
            { speaker: 'imani', text: 'The routing rule was mine. I wanted new people to get stretched early. It\'s how I grew.' },
            { speaker: 'imani', text: 'I didn\'t connect it to the numbers. I was looking at who, not at what changed.' },
          ],
        },
        {
          id: 'odette-2', label: 'Odette, again', kind: 'character', characterId: 'odette', x: 82, y: 64, revealAfter: 'first-call',
          summary: 'Odette admits that escalating is seen as weakness here, and that she solved her own hard cases for years.',
          lines: [
            { speaker: 'odette', text: 'Escalating here is seen as weakness. Always has been.' },
            { speaker: 'odette', text: 'I spent years grinding through Tier-3s alone. Maybe that\'s not something to be proud of.' },
          ],
        },
      ],
    },
    {
      kind: 'decision',
      id: 'revised',
      title: 'Revised approach',
      prompt: 'You\'re back at the decision point with a fuller picture. What do you do now?',
      evidenceFrom: ['first-look', 'second-look'],
      options: [
        {
          id: 'revert',
          label: 'Revert the routing rule and move on.',
          quality: 'mixed',
          rubric: { diagnosis: 1, development: 0, impact: 1 },
          outcome: {
            headline: 'Fast recovery, lost intent.',
            narrative: ['Response times recover within days. The new-starter stretch programme quietly disappears, and nobody discusses escalation.'],
            reactions: [
              { characterId: 'imani', mood: 'relieved', text: 'Numbers are back. Let\'s not overthink it.' },
              { characterId: 'rafael', mood: 'neutral', text: 'Easier, sure. I\'m not sure I\'m learning anything now, though.' },
            ],
            effects: { output: 2, trust: 1 },
          },
          feedback: 'You found the cause and removed it, which is real progress. But the assumption underneath, that people should grow by struggling alone, hasn\'t been examined. It will produce the same pattern somewhere else.',
          principleIds: ['g-familiar-fix', 'level-2'],
          flags: ['reverted-routing'],
        },
        {
          id: 'redesign',
          label: 'Keep stretch work, but redesign it: pair new analysts with a senior on their first Tier-3s, make escalation an expected step, and review it with the team in two weeks.',
          quality: 'strong',
          rubric: { diagnosis: 2, development: 2, impact: 2 },
          outcome: {
            headline: 'The assumption, not just the rule, changes.',
            narrative: [
              'Imani introduces the change herself and names the routing rule as her mistake. Odette volunteers to pair with Rafael.',
              'Escalations go from zero to a dozen a week. Average response time falls below target within three weeks.',
            ],
            reactions: [
              { characterId: 'imani', mood: 'encouraged', text: 'I was right that people need stretch. I was wrong that they need to be alone for it.' },
              { characterId: 'odette', mood: 'encouraged', text: 'Turns out I quite like being asked.' },
              { characterId: 'rafael', mood: 'encouraged', text: 'I\'m still getting the hard ones. Now I\'m learning from them.' },
            ],
            effects: { output: 2, quality: 2, trust: 2, capability: 3, wellbeing: 2 },
          },
          feedback: 'This response deals with the pattern, not only the symptom. It keeps the good intention (stretch), challenges the assumption that made it harmful (struggle alone), and changes a team norm (escalation as weakness). It also brings the team into checking whether the change worked.',
          principleIds: ['level-2', 'g-test-assumptions', 'p1'],
          flags: ['redesigned-routing'],
        },
        {
          id: 'course',
          label: 'Keep the routing rule and send Rafael on an advanced troubleshooting course.',
          quality: 'weak',
          rubric: { diagnosis: 1, development: 1, impact: 0 },
          outcome: {
            headline: 'Still on his own.',
            narrative: ['Rafael returns with a certificate and the same queue. Times improve slightly, then plateau.'],
            reactions: [
              { characterId: 'rafael', mood: 'frustrated', text: 'The course was good. I still can\'t ask anyone when I\'m stuck.' },
            ],
            effects: { capability: 1, wellbeing: -1 },
          },
          feedback: 'You recognised that Rafael is short of experience with complex tickets. But the course answers that with more information, and leaves the routing and the escalation norm as they were. The pattern stays in place.',
          principleIds: ['g-familiar-fix', 'g-knowing-vs-doing'],
          flags: ['course'],
        },
        {
          id: 'shield',
          label: 'Move Rafael to Tier-1 tickets only, until he has more experience.',
          quality: 'mixed',
          rubric: { diagnosis: 1, development: 0, impact: 1 },
          outcome: {
            headline: 'Protected, and parked.',
            narrative: ['Times improve. The Tier-3 tickets move to the next-newest analyst, whose numbers start to climb.'],
            reactions: [
              { characterId: 'rafael', mood: 'neutral', text: 'It\'s calmer. I\'m not sure how I\'ll ever get experience, though.' },
              { characterId: 'odette', mood: 'concerned', text: 'So now it\'s Hamid\'s turn to drown.' },
            ],
            effects: { output: 1, wellbeing: 1 },
          },
          feedback: 'This takes the pressure off Rafael, but the rule still routes complex work to whoever is newest. The problem moves to the next person, which suggests the cause wasn\'t Rafael in the first place.',
          principleIds: ['g-symptom-vs-cause', 'level-2'],
          flags: ['shielded'],
        },
      ],
    },
    {
      kind: 'reflection',
      id: 'reflect',
      title: 'Reflection',
      prompt: 'Which of these were true of your approach in the Signal Room?',
      options: [
        { id: 'dashboard-trust', text: 'The dashboard made the explanation feel obvious.' },
        { id: 'asked-changed', text: 'I asked what else had changed before deciding.' },
        { id: 'first-wrong', text: 'My first decision was based on an assumption that turned out to be wrong.' },
        { id: 'revised-well', text: 'New evidence changed my mind, and I let it.' },
        { id: 'norms', text: 'I noticed that a team habit (not escalating) was part of the problem.' },
      ],
      notePrompt: 'What is one assumption you hold about how people improve at work? How could you test it?',
    },
  ],
};
