// Zone 3, The Horizon (Level 3: Transcendental). Fictional scenario written
// for this prototype. The Seven Stars are referenced only as published (seven
// human needs); individual needs are not named or scored.

import type { Scenario } from '../../engine/types';

export const meridianLaunch: Scenario = {
  id: 'meridian-launch',
  zone: 'horizon',
  title: 'The Meridian Launch',
  tagline: 'One team is winning. Is the launch?',
  setting: 'The Meridian, a programme of connected teams six weeks from a major launch.',
  objectives: [
    'Look back at how your earlier decisions played out.',
    'Understand how each team experiences the launch.',
    'Choose a strategy, then see its effects across the system three months later.',
  ],
  characters: ['priya', 'marcus', 'lena', 'jonah'],
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
      title: 'Look back',
      intro: 'Before you enter the Meridian, review the decisions you made earlier and what they led to. What do they have in common?',
      scenarioIds: ['stalled-rig', 'signal-room'],
    },
    {
      kind: 'narrative',
      id: 'briefing',
      title: 'Briefing',
      lines: [
        { speaker: 'narrator', text: 'From the upper terrace you can see the whole programme: build, integration and support, linked by bridges of light.' },
        { speaker: 'priya', text: 'Meridian launches in six weeks. Marcus\'s Build team is two weeks ahead of plan.' },
        { speaker: 'priya', text: 'Leadership wants to reward Build publicly and ask the other teams to match their pace. Before I agree, I want your recommendation.' },
      ],
    },
    {
      kind: 'explore',
      id: 'terraces',
      title: 'The terraces',
      instructions: 'Visit the teams and check the shared records. Speak to Priya and check the launch board before recommending a strategy.',
      required: ['priya', 'launch-board'],
      hotspots: [
        {
          id: 'priya', label: 'Priya Nair', kind: 'character', characterId: 'priya', x: 50, y: 70,
          summary: 'Priya owns the shared goal: launch on time with a product customers trust. She can\'t tell whether the teams are aligned.',
          lines: [
            { speaker: 'priya', text: 'Each team reports green on its own measures. And yet I don\'t feel like we\'re on track.' },
            { speaker: 'priya', text: 'The launch only works if all three parts work together. Nobody is measured on that.' },
          ],
        },
        {
          id: 'marcus', label: 'Marcus Hale', kind: 'character', characterId: 'marcus', x: 18, y: 56,
          summary: 'Marcus\'s team ships fast by pushing hard, and he resents being slowed down by other teams.',
          lines: [
            { speaker: 'marcus', text: 'My team ships. We work weekends when we need to. That\'s what commitment looks like.' },
            { speaker: 'marcus', text: 'Support complains about defects. Fine, but that\'s what support is for, isn\'t it?' },
          ],
        },
        {
          id: 'lena', label: 'Lena Sato', kind: 'character', characterId: 'lena', x: 82, y: 56,
          summary: 'Lena\'s team is absorbing the defects from Build\'s early releases, on rising overtime, without recognition.',
          lines: [
            { speaker: 'lena', text: 'Every early release lands on my team. We fix what customers find.' },
            { speaker: 'lena', text: 'Two of my people have asked to transfer. Nobody upstairs has noticed, because our numbers aren\'t on the board.' },
          ],
        },
        {
          id: 'jonah', label: 'Jonah Pierce', kind: 'character', characterId: 'jonah', x: 33, y: 76,
          summary: 'Jonah, a junior on Build, is exhausted but feels he has to match the "heroes" to be valued.',
          lines: [
            { speaker: 'jonah', text: 'Everyone on Build works nights. If I stop, I\'m the one holding them back.' },
            { speaker: 'jonah', text: 'I made two of the bugs Lena\'s team is fixing. I was on hour fourteen.' },
          ],
        },
        {
          id: 'launch-board', label: 'Launch board', kind: 'evidence', x: 50, y: 22, misleading: true,
          summary: 'Build is at 112% of plan and shows green. Integration is amber. Support readiness is red, but nothing on the board connects the three.',
          doc: {
            title: 'Meridian launch board',
            source: 'Programme office',
            body: [
              'Build: 112% of plan (GREEN)',
              'Integration: 88% (AMBER)',
              'Support readiness: 54% (RED)',
              'Overall launch readiness measure: none defined',
            ],
          },
        },
        {
          id: 'support-queue', label: 'Support queue', kind: 'evidence', x: 80, y: 28,
          summary: '46 defects from early Build releases are open and 31 have been reopened. Support overtime is up 60%.',
          doc: {
            title: 'Support queue: Meridian defects',
            source: 'Support system',
            body: [
              'Open defects traced to early Build releases: 46',
              'Reopened after "fix": 31',
              'Support overtime vs last quarter: +60%',
            ],
          },
        },
        {
          id: 'recognition-wall', label: 'Recognition wall', kind: 'evidence', x: 20, y: 28,
          summary: 'All eight recent "Launch Hero" awards went to Build. The most cited reason is "worked through the weekend".',
          doc: {
            title: '"Launch Hero" awards: last eight',
            source: 'Programme recognition wall',
            body: [
              'Build team: 8 · Integration: 0 · Support: 0',
              'Most cited reason: "worked through the weekend"',
              'Awards for preventing defects or helping another team: 0',
            ],
          },
        },
        {
          id: 'pulse', label: 'Pulse survey', kind: 'evidence', x: 64, y: 44,
          summary: 'Cross-team trust has fallen from 3.8 to 2.9 out of 5. One comment: "We\'re judged on our own column, so we only care about our own column."',
          doc: {
            title: 'Programme pulse survey',
            source: 'People team',
            body: [
              'Cross-team trust: 2.9 / 5 (last quarter 3.8)',
              '"I can sustain my current workload": 41% agree',
              'Comment: "We\'re judged on our own column, so we only care about our own column."',
            ],
          },
        },
      ],
    },
    {
      kind: 'decision',
      id: 'strategy',
      title: 'Launch strategy',
      prompt: 'Priya needs your recommendation for the next six weeks.',
      evidenceFrom: ['terraces'],
      options: [
        {
          id: 'reward-speed',
          label: 'Reward the Build team publicly and ask the other teams to match their pace.',
          quality: 'weak',
          rubric: { diagnosis: 0, development: 0, impact: 0 },
          outcome: {
            headline: 'Momentum!',
            narrative: ['The announcement lands well. Build pushes even harder, and for two weeks the board has never looked greener.'],
            reactions: [
              { characterId: 'marcus', mood: 'encouraged', text: 'About time this was recognised.' },
              { characterId: 'lena', mood: 'withdrawn', text: 'Match their pace. Right.' },
            ],
            effects: { output: 2, cohesion: -1 },
            later: [
              'Three months later: defects from rushed releases overwhelmed Support in the launch week. Two of Lena\'s team left.',
              'Jonah went on sick leave after the launch. The launch slipped by three weeks while the defects were fixed.',
              'The decision looked like a win for one team and cost the whole programme.',
            ],
            laterEffects: { output: -3, quality: -3, trust: -2, wellbeing: -3, cohesion: -2 },
          },
          feedback: 'Locally, this worked: Build\'s numbers went up. But the cost moved to Support, into the future, and onto the people least able to absorb it. The board measured each team\'s column, so it couldn\'t show the problem. Judged against the shared goal, a launch customers trust, it failed.',
          principleIds: ['g-local-vs-system', 'level-3'],
          flags: ['rewarded-speed'],
        },
        {
          id: 'shared-measure',
          label: 'Define "ready" as one shared launch measure across Build, Integration and Support. Rotate Build engineers onto defect fixing, recognise cross-team help, and cap overtime.',
          quality: 'strong',
          rubric: { diagnosis: 2, development: 2, impact: 2 },
          outcome: {
            headline: 'Slower on one column. Faster on the one that matters.',
            narrative: ['Build\'s pace drops for a fortnight as engineers rotate into Support. Marcus objects loudly at first.'],
            reactions: [
              { characterId: 'marcus', mood: 'frustrated', text: 'You\'re slowing down the only team that\'s delivering.' },
              { characterId: 'lena', mood: 'encouraged', text: 'First time anyone has looked at our column.' },
              { characterId: 'priya', mood: 'encouraged', text: 'Now everyone\'s measured on the same thing as me.' },
            ],
            effects: { output: -1, cohesion: 2, trust: 1 },
            later: [
              'Three months later: Meridian launched on the committed date. Customer-reported defects in launch week were 70% below the previous launch.',
              'Marcus\'s engineers, having seen their bugs from the other side, cut reopened defects sharply. Jonah is still on the team and has been mentoring the next junior.',
            ],
            laterEffects: { output: 2, quality: 3, trust: 2, wellbeing: 2, cohesion: 1 },
          },
          feedback: 'You changed the conditions the teams work in, not just their targets. A shared measure makes the system visible. Rotation spreads the cost and the learning. Recognition and capped overtime change what "good" looks like. The short-term drop for Build was real, and it was the price of the shared goal.',
          principleIds: ['level-3', 'g-local-vs-system', 'g-conditions'],
          flags: ['shared-measure'],
        },
        {
          id: 'contractors',
          label: 'Bring in contractors to absorb the support backlog, and leave Build\'s pace alone.',
          quality: 'mixed',
          rubric: { diagnosis: 1, development: 0, impact: 1 },
          outcome: {
            headline: 'Capacity bought.',
            narrative: ['Contractors arrive within a week. Lena\'s overtime drops. Build carries on as before.'],
            reactions: [
              { characterId: 'lena', mood: 'relieved', text: 'Help, at last. Though the defects keep coming.' },
              { characterId: 'marcus', mood: 'relieved', text: 'Good. No change on our side, then.' },
            ],
            effects: { wellbeing: 1, cohesion: -1 },
            later: [
              'Three months later: the launch went ahead a week late. The contractors kept Support afloat, at a cost that ate a quarter of the programme\'s contingency.',
              'The defect rate didn\'t change, because nothing upstream did. Jonah still works nights.',
            ],
            laterEffects: { output: 1, quality: -1, trust: -1, wellbeing: -1 },
          },
          feedback: 'You saw that Support was overloaded and responded to it, which counts for something. But buying capacity treats the overflow, not the source. The conditions producing defects, and the culture rewarding them, are unchanged.',
          principleIds: ['g-local-vs-system', 'g-symptom-vs-cause'],
          flags: ['contractors'],
        },
        {
          id: 'freeze',
          label: 'Freeze all releases until every team shows green.',
          quality: 'mixed',
          rubric: { diagnosis: 1, development: 0, impact: 1 },
          outcome: {
            headline: 'Everything stops.',
            narrative: ['Releases halt. Support catches its breath. Build is idle and furious.'],
            reactions: [
              { characterId: 'marcus', mood: 'frustrated', text: 'So we\'re punished for being ahead.' },
              { characterId: 'lena', mood: 'relieved', text: 'A pause, finally.' },
            ],
            effects: { output: -2, wellbeing: 1 },
            later: [
              'Three months later: the launch slipped by three weeks. Defects did fall, but Build\'s morale collapsed and two senior engineers left.',
              'The freeze stopped the damage without changing how the teams work together.',
            ],
            laterEffects: { output: -1, quality: 1, trust: -1, cohesion: -1 },
          },
          feedback: 'You recognised that the teams were out of balance, but a blanket freeze swaps one team\'s problem for another\'s. It doesn\'t create a shared measure or change the conditions, so the pattern is likely to come back once releases resume.',
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
      intro: 'Decisions travel. Here is what yours looked like once it had reached the whole system.',
    },
    {
      kind: 'decision',
      id: 'jonah-talk',
      title: 'One conversation',
      prompt: 'Jonah asks to talk. He\'s exhausted, but says he wants to be a "Launch Hero" like the others. What do you do?',
      evidenceFrom: ['terraces'],
      options: [
        {
          id: 'praise',
          label: 'Praise his commitment and tell him the effort will pay off.',
          quality: 'weak',
          rubric: { development: 0, impact: 0 },
          outcome: {
            headline: 'Encouragement in the wrong direction.',
            narrative: ['Jonah leaves energised, and works through the next two weekends.'],
            reactions: [{ characterId: 'jonah', mood: 'encouraged', text: 'Thanks. I\'ll keep pushing.' }],
            effects: { wellbeing: -2 },
          },
          feedback: 'Well meant, but it reinforces the condition that is harming him: being valued for hours, not for outcomes. What Jonah needed from the environment was not more effort.',
          principleIds: ['g-conditions'],
        },
        {
          id: 'conditions',
          label: 'Agree a sustainable workload with Marcus, pair Jonah with a senior engineer, and make clear what good performance looks like here.',
          quality: 'strong',
          rubric: { development: 2, impact: 2 },
          outcome: {
            headline: 'A different definition of good.',
            narrative: ['Marcus reluctantly agrees. Jonah\'s hours drop, and his defect count drops with them.'],
            reactions: [
              { characterId: 'jonah', mood: 'relieved', text: 'I didn\'t know I was allowed to stop.' },
              { characterId: 'marcus', mood: 'neutral', text: 'Fine. His work has been cleaner, I\'ll give you that.' },
            ],
            effects: { wellbeing: 2, quality: 1, cohesion: 1 },
          },
          feedback: 'You changed the conditions around Jonah rather than asking him to change alone. Clear standards, support and a sustainable workload allowed him to perform well. The game calls this "create the conditions for others", and it is the focus of this zone.',
          principleIds: ['g-conditions', 'level-3'],
          flags: ['supported-jonah'],
        },
        {
          id: 'move',
          label: 'Move him to the Support team to get him away from the pressure.',
          quality: 'mixed',
          rubric: { development: 1, impact: 0 },
          outcome: {
            headline: 'Out of the fire.',
            narrative: ['Jonah moves. He recovers, but Build\'s culture is unchanged and the next junior inherits his workload.'],
            reactions: [{ characterId: 'jonah', mood: 'neutral', text: 'It\'s quieter here. I miss building things, though.' }],
            effects: { wellbeing: 1 },
          },
          feedback: 'This protects Jonah, which matters. But it moves the person rather than the conditions, so the next junior faces the same pressure.',
          principleIds: ['g-symptom-vs-cause', 'g-conditions'],
        },
        {
          id: 'time-off',
          label: 'Tell him to take a week off, then return to the same role.',
          quality: 'mixed',
          rubric: { development: 0, impact: 1 },
          outcome: {
            headline: 'Rested, and back where he started.',
            narrative: ['Jonah takes the week. Within a fortnight of returning, he\'s back on fourteen-hour days.'],
            reactions: [{ characterId: 'jonah', mood: 'withdrawn', text: 'The week was good. Nothing\'s different, though.' }],
            effects: { wellbeing: 1 },
          },
          feedback: 'Rest helps, and you recognised he needed it. But nothing about the environment changed, so the pattern returned.',
          principleIds: ['g-conditions'],
        },
      ],
    },
    {
      kind: 'reflection',
      id: 'reflect',
      title: 'Reflection',
      prompt: 'Which of these were true of your approach at the Meridian?',
      options: [
        { id: 'green-board', text: 'The green numbers on the board pulled me towards the obvious decision.' },
        { id: 'whole-system', text: 'I judged my strategy against the shared goal, not one team\'s results.' },
        { id: 'later-surprise', text: 'The three-months-later consequences surprised me.' },
        { id: 'needs', text: 'I thought about what each person needed from their environment to perform well.' },
        { id: 'pattern', text: 'I can see a pattern linking my decisions across all three zones.' },
      ],
      notePrompt: 'Think of a decision that helped your team but cost another team, or your future self. What would a shared measure have shown?',
    },
  ],
};
