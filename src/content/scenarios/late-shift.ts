// Floor 23, the Break Lounge. Zone 3, The Horizon (Level 3: Transcendental).
// Fictional. One team is "winning"; the cost lands elsewhere, and later.
// The Seven Stars are not named or scored here.

import type { Scenario } from '../../engine/types';

export const lateShift: Scenario = {
  id: 'late-shift',
  zone: 'horizon',
  room: 'lounge',
  floor: '23',
  title: 'The Late Shift',
  hook: 'It\'s 11pm and the lounge is full. One team is winning. Nobody else looks like it.',
  start: { x: 250, y: 284 },
  characters: ['priya', 'marcus', 'lena', 'jonah', 'ravi', 'sam'],
  principleIds: ['level-3', 'g-local-vs-system', 'g-conditions'],
  meters: [
    { id: 'output', label: 'Delivery pace', start: 6 },
    { id: 'quality', label: 'Product quality', start: 5 },
    { id: 'trust', label: 'Cross-team trust', start: 4 },
    { id: 'wellbeing', label: 'Wellbeing', start: 4 },
    { id: 'cohesion', label: 'Shared purpose', start: 4 },
  ],
  criteria: ['evidence', 'diagnosis', 'development', 'impact', 'reflection'],
  estimatedMinutes: 10,
  stages: [
    {
      kind: 'review',
      id: 'look-back',
      title: 'Going up',
      intro: 'Twenty-three floors is a long ride. You flip back through your notebook.',
      scenarioIds: ['front-gate', 'signal-vault'],
    },
    {
      kind: 'narrative',
      id: 'briefing',
      title: 'Floor 23',
      lines: [
        { speaker: 'narrator', text: 'Rain runs down the windows. The coffee machine has been going for four hours, and nobody here looks ready to go home.' },
        { speaker: 'priya', text: 'You must be the one who sorted out the Vault. I\'m glad you\'re here.', when: { flag: 'signal-vault:redesigned-routing' } },
        { speaker: 'priya', text: 'Thank you for coming up so late. Meridian launches in six weeks, and Marcus\'s Build team is two weeks ahead of plan.' },
        { speaker: 'priya', text: 'The board wants to give Build an award and tell everyone else to keep up. Before I agree, I\'d like your honest opinion.' },
      ],
    },
    {
      kind: 'explore',
      id: 'lounge',
      title: 'The lounge',
      goal: 'Priya wants your recommendation. Everyone here has a side of the story.',
      required: ['priya', 'launch-board'],
      hotspots: [
        {
          id: 'priya', label: 'Priya', kind: 'character', characterId: 'priya', x: 220, y: 234,
          summary: 'Priya owns the shared goal: launch on time with something people trust. Each team reports green; she can\'t see the whole.',
          lines: [
            { speaker: 'priya', text: 'Every team tells me their numbers look fine. And yet, something doesn\'t feel right.' },
            { speaker: 'priya', text: 'Meridian only works if all three teams work together. And nobody is measured on that, except me.' },
          ],
        },
        {
          id: 'marcus', label: 'Marcus', kind: 'character', characterId: 'marcus', x: 297, y: 118,
          summary: 'Marcus\'s team ships fast by pushing hard, and he resents being slowed down.',
          lines: [
            { speaker: 'marcus', text: 'See that top score? That\'s mine. Of course it is.' },
            { speaker: 'marcus', text: 'My team delivers. We work weekends if we have to. That\'s what commitment looks like.' },
            { speaker: 'marcus', text: 'Support complains about bugs. But that\'s what support is there for, isn\'t it?' },
          ],
        },
        {
          id: 'lena', label: 'Lena', kind: 'character', characterId: 'lena', x: 152, y: 150,
          summary: 'Lena\'s team is absorbing the defects from Build\'s early releases on rising overtime, unseen.',
          lines: [
            { speaker: 'lena', text: 'Every rushed release lands on my team. We\'re the ones fixing whatever customers find.' },
            { speaker: 'lena', text: 'Two of my people asked to transfer this month. Nobody upstairs noticed, because our work isn\'t on the board.' },
          ],
        },
        {
          id: 'ravi', label: 'Ravi', kind: 'character', characterId: 'ravi', x: 126, y: 150,
          summary: 'Ravi, in Support, has stopped recording his overtime.',
          lines: [
            { speaker: 'ravi', text: 'I\'ve done sixty hours this week. I\'ve stopped putting it on my timesheet.' },
            { speaker: 'ravi', text: 'If nobody reads it anyway, what\'s the point?' },
          ],
        },
        {
          id: 'jonah', label: 'Jonah', kind: 'character', characterId: 'jonah', x: 340, y: 195,
          summary: 'Jonah, a junior on Build, is exhausted but feels he must match the "heroes". He wrote two of the bugs Support is fixing.',
          lines: [
            { speaker: 'jonah', text: 'Oh, hey. Sorry, I\'m still finishing the release.' },
            { speaker: 'jonah', text: 'Everyone on Build works late. If I stop, I\'m the one holding them back.' },
            { speaker: 'jonah', text: 'Two of the bugs Lena\'s team is fixing are mine. I\'d been working for fourteen hours.' },
          ],
        },
        {
          id: 'sam', label: 'Sam', kind: 'character', characterId: 'sam', x: 78, y: 118,
          summary: 'Sam the barista notices Build orders triple shots at 2am, and Support has stopped coming up for breaks at all.',
          lines: [
            { speaker: 'sam', text: 'Want to know how a company is really doing? Watch the coffee orders.' },
            { speaker: 'sam', text: 'Build orders triple shots at two in the morning, every single night. Support? I haven\'t seen them up here in a month. They eat at their desks.' },
          ],
        },
        {
          id: 'launch-board', label: 'Launch board', kind: 'evidence', icon: 'doc', x: 220, y: 32, misleading: true,
          summary: 'Build shows 112% of plan in green. Integration is amber and Support readiness is red, but nothing on the board connects them.',
          doc: {
            title: 'Meridian launch board',
            source: 'Printed and stuck to the fridge',
            body: ['Build: 112% of plan (GREEN)', 'Integration: 88% (AMBER)', 'Support readiness: 54% (RED)', 'Overall launch readiness: not measured'],
          },
        },
        {
          id: 'recognition', label: 'Bulletin board', kind: 'evidence', icon: 'doc', x: 350, y: 36,
          summary: 'All eight "Launch Hero" awards went to Build, mostly for working weekends. None for preventing defects or helping another team.',
          doc: {
            title: '"Launch Hero" awards: last eight',
            source: 'Bulletin board',
            body: ['Build: 8 · Integration: 0 · Support: 0', 'Most-cited reason: "worked through the weekend"', 'Awards for preventing defects or helping another team: 0', 'Pinned below: pulse survey, cross-team trust 2.9 / 5 (was 3.8)'],
          },
        },
        {
          id: 'memo', label: 'Vending machine', kind: 'evidence', icon: 'doc', x: 258, y: 60, secret: true,
          summary: 'Wedged behind the coin slot: the founder\'s third memo.',
          doc: {
            title: 'Founder\'s memo, no. 3',
            source: 'Folded behind the vending machine\'s coin slot',
            body: ['"Every floor in this Tower can hit its own target', 'while the building falls down."', '— A. Halcyon'],
          },
        },
        {
          id: 'cat', label: 'The cat', kind: 'evidence', icon: 'doc', x: 120, y: 240, secret: true,
          summary: 'The lounge cat is asleep. Someone has given it a lanyard that says "LAUNCH HERO".',
          doc: {
            title: 'The lounge cat',
            source: 'Asleep on the sofa arm',
            body: ['Lanyard: "LAUNCH HERO"', 'Hours worked this week: none', 'Wellbeing: excellent'],
          },
        },
      ],
    },
    {
      kind: 'decision',
      id: 'strategy',
      title: 'The recommendation',
      asker: 'priya',
      prompt: 'The board meets first thing tomorrow. What should I tell them?',
      evidenceFrom: ['lounge'],
      options: [
        {
          id: 'reward-speed',
          label: '"Give Build the award, and ask the other teams to match their pace."',
          quality: 'weak',
          rubric: { diagnosis: 0, development: 0, impact: 0 },
          outcome: {
            headline: 'Momentum!',
            narrative: ['The announcement lands well. Build pushes even harder. For two weeks, the board has never looked greener.'],
            reactions: [
              { characterId: 'marcus', mood: 'encouraged', text: 'About time, too.' },
              { characterId: 'lena', mood: 'withdrawn', text: 'Match their pace. Right. Sure.' },
            ],
            effects: { output: 2, cohesion: -1 },
            later: [
              'Launch week: defects from rushed releases swamp Support. Two of Lena\'s team quit.',
              'Jonah goes on sick leave after the launch. Meridian slips three weeks while the defects are fixed.',
              'It looked like a win for one team, and the whole programme paid for it.',
            ],
            laterEffects: { output: -3, quality: -3, trust: -2, wellbeing: -3, cohesion: -2 },
          },
          feedback: 'On its own terms this worked: Build\'s numbers went up. But the cost moved to Support, into the future, and onto the people least able to carry it. The board only measured each team\'s own column, so it couldn\'t show the problem.',
          principleIds: ['g-local-vs-system', 'level-3'],
          flags: ['rewarded-speed'],
        },
        {
          id: 'shared-measure',
          label: '"Let\'s agree one shared meaning of ready for all three teams. Move some Build engineers onto fixing bugs, thank anyone who helps another team, and put a limit on overtime."',
          quality: 'strong',
          rubric: { diagnosis: 2, development: 2, impact: 2 },
          unlockedBy: ['lena', 'ravi', 'sam'],
          outcome: {
            headline: 'Slower on one column. Faster on the one that matters.',
            narrative: ['Build\'s pace dips for a fortnight while engineers rotate into Support. Marcus is loudly unhappy.'],
            reactions: [
              { characterId: 'marcus', mood: 'frustrated', text: 'You\'re slowing down the only team that actually delivers.' },
              { characterId: 'lena', mood: 'encouraged', text: 'That\'s the first time anyone has looked at our side of things.' },
              { characterId: 'priya', mood: 'encouraged', text: 'Good. Now everyone is measured on the same thing I am.' },
            ],
            effects: { output: -1, cohesion: 2, trust: 1 },
            later: [
              'Meridian launches on the promised date, with 70% fewer customer-reported defects than the last launch.',
              'Having seen their bugs from the other side, Build\'s engineers stop shipping half-finished work. Jonah is still here, and mentoring the next junior.',
            ],
            laterEffects: { output: 2, quality: 3, trust: 2, wellbeing: 2, cohesion: 1 },
          },
          feedback: 'You changed the conditions the teams work in, not just their targets. A shared measure made the whole system visible. Rotation spread both the cost and the learning, and recognition plus capped overtime changed what "good" looks like. Build\'s short-term dip was the price of the shared goal.',
          principleIds: ['level-3', 'g-local-vs-system', 'g-conditions'],
          flags: ['shared-measure'],
        },
        {
          id: 'contractors',
          label: '"Bring in contractors to clear Support\'s backlog, and leave Build alone."',
          quality: 'mixed',
          rubric: { diagnosis: 1, development: 0, impact: 1 },
          outcome: {
            headline: 'Capacity, bought.',
            narrative: ['Contractors arrive within a week. Lena\'s overtime drops. Build carries on exactly as before.'],
            reactions: [
              { characterId: 'lena', mood: 'relieved', text: 'Help, at last. Although the bugs keep coming.' },
              { characterId: 'marcus', mood: 'relieved', text: 'Good. So nothing changes for us.' },
            ],
            effects: { wellbeing: 1, cohesion: -1 },
            later: [
              'Meridian launches a week late. The contractors kept Support afloat and ate a quarter of the contingency budget.',
              'The defect rate never changed, because nothing upstream did. Jonah still works nights.',
            ],
            laterEffects: { output: 1, quality: -1, trust: -1, wellbeing: -1 },
          },
          feedback: 'You saw that Support was overloaded and acted on it, which counts. But buying capacity treats the overflow, not the source. What was producing the defects, and what was being rewarded, stayed the same.',
          principleIds: ['g-local-vs-system', 'g-symptom-vs-cause'],
          flags: ['contractors'],
        },
        {
          id: 'freeze',
          label: '"Stop all releases until every team is ready."',
          quality: 'mixed',
          rubric: { diagnosis: 1, development: 0, impact: 1 },
          outcome: {
            headline: 'Everything stops.',
            narrative: ['Releases halt. Support finally breathes. Build sits idle and furious.'],
            reactions: [
              { characterId: 'marcus', mood: 'frustrated', text: 'So we get punished for being ahead. Brilliant.' },
              { characterId: 'lena', mood: 'relieved', text: 'A pause. Finally, we can breathe.' },
            ],
            effects: { output: -2, wellbeing: 1 },
            later: [
              'Meridian slips three weeks. Defects fall, but Build\'s morale collapses and two senior engineers leave.',
              'The freeze stopped the damage without changing how the teams work together.',
            ],
            laterEffects: { output: -1, quality: 1, trust: -1, cohesion: -1 },
          },
          feedback: 'You saw the teams were out of balance. But a blanket freeze swaps one team\'s problem for another\'s, and changes nothing about how they work together, so the pattern returns once releases restart.',
          principleIds: ['g-local-vs-system', 'level-3'],
          flags: ['freeze'],
        },
      ],
    },
    {
      kind: 'aftermath',
      id: 'three-months',
      title: 'Three months later',
      decision: 'strategy',
      intro: 'Same lounge. Different season. Here\'s what your recommendation turned into.',
    },
    {
      kind: 'decision',
      id: 'jonah-talk',
      title: 'Jonah',
      asker: 'jonah',
      prompt: 'Have you got a minute? I really want to be a Launch Hero, like the others. What do I need to do?',
      evidenceFrom: ['lounge'],
      options: [
        {
          id: 'praise',
          label: '"Just keep doing what you\'re doing. All that effort will pay off."',
          quality: 'weak',
          rubric: { development: 0, impact: 0 },
          outcome: {
            headline: 'Encouragement, in the wrong direction.',
            narrative: ['Jonah leaves fired up, and works through the next two weekends.'],
            reactions: [{ characterId: 'jonah', mood: 'encouraged', text: 'Thanks. I\'ll keep pushing, then.' }],
            effects: { wellbeing: -2 },
          },
          feedback: 'Kindly meant, but it reinforces the very thing hurting him: being valued for hours, not outcomes. He didn\'t need more effort. He needed different conditions.',
          principleIds: ['g-conditions'],
        },
        {
          id: 'conditions',
          label: '"Let\'s sit down with Marcus and agree a workload you can keep up. We\'ll pair you with someone senior, and be clear about what good work looks like here."',
          quality: 'strong',
          rubric: { development: 2, impact: 2 },
          unlockedBy: ['jonah'],
          outcome: {
            headline: 'A different definition of good.',
            narrative: ['Marcus agrees, grudgingly. Jonah\'s hours drop, and his defect count drops with them.'],
            reactions: [
              { characterId: 'jonah', mood: 'relieved', text: 'Honestly? I didn\'t know I was allowed to stop.' },
              { characterId: 'marcus', mood: 'neutral', text: 'His code is cleaner now. I\'ll give you that.' },
            ],
            effects: { wellbeing: 2, quality: 1, cohesion: 1 },
          },
          feedback: 'You changed what was around Jonah instead of asking him to change alone: clear standards, support and a workload he can sustain. That let him do good work.',
          principleIds: ['g-conditions', 'level-3'],
          flags: ['supported-jonah'],
        },
        {
          id: 'move',
          label: '"Let\'s move you over to Support, away from all the pressure."',
          quality: 'mixed',
          rubric: { development: 1, impact: 0 },
          outcome: {
            headline: 'Out of the fire.',
            narrative: ['Jonah moves. He recovers. Build\'s culture doesn\'t change, and the next junior inherits his hours.'],
            reactions: [{ characterId: 'jonah', mood: 'neutral', text: 'It\'s quieter here. I do miss building things, though.' }],
            effects: { wellbeing: 1 },
          },
          feedback: 'It protects Jonah, which matters. But it moves the person, not the conditions, so the next junior walks into the same pressure.',
          principleIds: ['g-symptom-vs-cause', 'g-conditions'],
        },
        {
          id: 'time-off',
          label: '"Take a week off, and come back fresh."',
          quality: 'mixed',
          rubric: { development: 0, impact: 1 },
          outcome: {
            headline: 'Rested, then right back where he was.',
            narrative: ['Jonah takes the week. A fortnight after he\'s back, he\'s doing fourteen-hour days again.'],
            reactions: [{ characterId: 'jonah', mood: 'withdrawn', text: 'The week off was nice. But nothing has changed, has it?' }],
            effects: { wellbeing: 1 },
          },
          feedback: 'Rest helps, and you saw he needed it. But nothing about his situation changed, so the pattern came straight back.',
          principleIds: ['g-conditions'],
        },
      ],
    },
    {
      kind: 'reflection',
      id: 'reflect',
      title: 'Your notebook',
      prompt: 'Last coffee of the night. What\'s true about how you played this?',
      options: [
        { id: 'green-board', text: 'The green numbers pulled me towards the obvious answer.' },
        { id: 'whole-system', text: 'I judged my plan by the shared goal, not one team\'s results.' },
        { id: 'later-surprise', text: 'The three-months-later part surprised me.' },
        { id: 'needs', text: 'I thought about what each person needed around them to do well.' },
        { id: 'pattern', text: 'I can see a pattern in my decisions across all three floors.' },
      ],
      notePrompt: 'A decision that helped your team but cost another team, or your future self. What would a shared measure have shown?',
    },
  ],
};
