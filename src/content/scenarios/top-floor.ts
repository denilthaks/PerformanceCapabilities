// Floor 40, the Executive Suite. Zone 4, the Integration Trial: a game-design
// capstone combining the three published levels, NOT a fourth framework level.
// Earlier decisions (flags) decide who picks up the desk phone.

import type { Scenario } from '../../engine/types';

const KAI = 'front-gate:paired-practice';
const RAFAEL = 'signal-vault:redesigned-routing';
const PRIYA = 'late-shift:shared-measure';

export const topFloor: Scenario = {
  id: 'top-floor',
  zone: 'trial',
  room: 'executive',
  floor: '40',
  title: 'The Top Floor',
  hook: 'The payments platform is down. The client is in the room. The board call is in an hour.',
  start: { x: 240, y: 280 },
  characters: ['sol', 'mira', 'adaeze', 'bex'],
  principleIds: ['level-1', 'level-2', 'level-3', 'p1', 'g-knowing-vs-doing', 'g-test-assumptions', 'g-local-vs-system'],
  meters: [
    { id: 'output', label: 'Service', start: 1 },
    { id: 'quality', label: 'Reliability', start: 3 },
    { id: 'trust', label: 'Client trust', start: 4 },
    { id: 'capability', label: 'Team capability', start: 4 },
    { id: 'wellbeing', label: 'Team wellbeing', start: 4 },
  ],
  criteria: ['evidence', 'diagnosis', 'development', 'impact', 'reflection'],
  estimatedMinutes: 15,
  stages: [
    {
      kind: 'review',
      id: 'carry-over',
      title: 'Going up',
      intro: 'Floor 40. Whatever happens up there, you made the people who\'ll help you.',
      scenarioIds: ['front-gate', 'signal-vault', 'late-shift'],
    },
    {
      kind: 'narrative',
      id: 'alarm',
      title: 'Floor 40',
      lines: [
        { speaker: 'narrator', text: 'The suite is silent except for the clock. A red light pulses on Sol\'s desk: payments, down.' },
        { speaker: 'sol', text: 'Our biggest client\'s payment platform has been down for twenty minutes. Their CTO is sitting right there.' },
        { speaker: 'sol', text: 'Mira\'s on call. First rotation. The board call is in an hour. Get us back up.' },
      ],
    },
    {
      kind: 'explore',
      id: 'phase-1',
      title: 'Stabilise',
      goal: 'Mira has the failover. Find out what she needs.',
      required: ['mira', 'runbook'],
      hotspots: [
        {
          id: 'mira', label: 'Mira', kind: 'character', characterId: 'mira', x: 132, y: 166,
          summary: 'Mira has read the failover runbook three times, and has never performed a failover.',
          lines: [
            { speaker: 'mira', text: 'I know the runbook. I\'ve read it three times.' },
            { speaker: 'mira', text: 'I\'ve never actually done a failover. Not even a drill. What if I make it worse?' },
          ],
        },
        {
          id: 'runbook', label: 'Runbook', kind: 'evidence', icon: 'doc', x: 197, y: 140,
          summary: 'The failover runbook has 14 steps and was last tested nine months ago. Two steps point at a server that no longer exists.',
          doc: {
            title: 'Runbook: payments failover',
            source: 'Printed on Sol\'s desk',
            body: ['14 steps · last tested: 9 months ago', 'Steps 6 and 9 refer to server PAY-02 (decommissioned)', 'On-call onboarding: "read the runbook"'],
          },
        },
        {
          id: 'kai', label: 'Desk phone', kind: 'character', characterId: 'kai', x: 226, y: 140, icon: 'call', when: { flag: KAI },
          summary: 'Kai, who now runs hands-on practice for the Tower\'s on-call staff, offers to talk Mira through it live.',
          lines: [
            { speaker: 'kai', text: 'It\'s Kai, from the lobby. Well, not just the lobby now. I run the practice sessions.' },
            { speaker: 'kai', text: 'I\'ve been where Mira is: knew the steps, never done it. Put me on speaker. She\'ll be slower than a senior today, and faster than anyone next time.' },
          ],
        },
        {
          id: 'drill-log', label: 'Desk phone', kind: 'evidence', icon: 'call', x: 226, y: 140, when: { notFlag: KAI },
          summary: 'You call around for help. Nobody has run a failover drill this year; on-call staff are trained by reading.',
          doc: {
            title: 'Calls to the operations floor',
            source: 'Desk phone',
            body: ['"Drills? Not this year."', '"We just read the runbook before our first shift."', '"Try someone who\'s done one. Not sure who has."'],
          },
        },
      ],
    },
    {
      kind: 'decision',
      id: 'stabilise',
      title: 'Stabilise',
      asker: 'sol',
      prompt: 'Clock\'s running. How do we get back up?',
      evidenceFrom: ['phase-1'],
      options: [
        {
          id: 'take-over',
          label: '"Get the most senior engineer on the line and have them run it. Mira watches."',
          quality: 'mixed',
          rubric: { diagnosis: 1, development: 0, impact: 1 },
          outcome: {
            headline: 'Back up in twenty minutes.',
            narrative: ['The senior engineer works around the broken steps from memory. Service returns. Mira watches from the side.'],
            reactions: [
              { characterId: 'mira', mood: 'withdrawn', text: 'I guess I\'m not ready for on-call.' },
              { characterId: 'sol', mood: 'relieved', text: 'Good. Next.' },
            ],
            effects: { output: 5, wellbeing: -1 },
          },
          feedback: 'Fast, and defensible in a crisis. But the runbook is still wrong, and the gap between reading a failover and doing one is still waiting for the next person on call.',
          principleIds: ['g-knowing-vs-doing', 'level-1'],
        },
        {
          id: 'guided',
          label: '"Mira runs it, with someone experienced guiding her live. Fix the runbook as you go."',
          quality: 'strong',
          rubric: { diagnosis: 2, development: 2, impact: 2 },
          unlockedBy: ['kai', 'drill-log'],
          outcome: {
            headline: 'Back up in thirty minutes, with two people who can do it.',
            narrative: [
              'Mira runs it step by step with guidance in her ear. They hit the broken steps, fix them in the runbook, and keep going.',
              'Service returns ten minutes later than the fastest option.',
            ],
            reactions: [
              { characterId: 'mira', mood: 'encouraged', text: 'I did it. And the runbook\'s right now.' },
              { characterId: 'kai', mood: 'encouraged', text: 'That\'s how I learned too.', when: { flag: KAI } },
              { characterId: 'sol', mood: 'neutral', text: 'Ten minutes slower. Fine, if it means we\'re never here again.' },
            ],
            effects: { output: 4, capability: 3, quality: 1 },
          },
          feedback: 'You turned the crisis into the practice Mira had never had, with support, and fixed the procedure along the way. Ten minutes was the cost. A skill gap and a broken process both closed.',
          principleIds: ['level-1', 'g-knowing-vs-doing', 'p4'],
          flags: ['guided-failover'],
        },
        {
          id: 'wait-vendor',
          label: '"Don\'t touch anything until the vendor\'s support team responds."',
          quality: 'weak',
          rubric: { diagnosis: 0, development: 0, impact: 0 },
          outcome: {
            headline: 'Forty minutes of nothing.',
            narrative: ['The vendor replies after forty minutes: their systems are healthy. The board call is now twenty minutes away.'],
            reactions: [
              { characterId: 'sol', mood: 'frustrated', text: 'We had people who could have acted.' },
              { characterId: 'adaeze', mood: 'concerned', text: 'Is anyone actually fixing this?' },
            ],
            effects: { output: 2, trust: -2 },
          },
          feedback: 'Waiting for someone else handed the decision away without any evidence that the problem was theirs.',
          principleIds: ['g-test-assumptions'],
        },
      ],
    },
    {
      kind: 'explore',
      id: 'phase-2',
      title: 'The cause',
      goal: 'Service is back. Now: what actually broke it?',
      required: ['change-log'],
      hotspots: [
        {
          id: 'change-log', label: 'Change log', kind: 'evidence', icon: 'doc', x: 197, y: 140,
          summary: 'A connection-pool change was deployed 47 minutes before the outage, outside the change window and without review.',
          doc: {
            title: 'Deployment log',
            source: 'Printout on Sol\'s desk',
            body: ['47 min before outage: connection-pool limit 400 → 40', 'Outside the agreed change window', 'Review: skipped ("urgent performance tweak")'],
          },
        },
        {
          id: 'vendor-status', label: 'Window screen', kind: 'evidence', icon: 'screen', x: 300, y: 40, misleading: true,
          summary: 'The vendor\'s status page shows "degraded performance", starting six minutes after Halcyon\'s first errors.',
          doc: {
            title: 'Vendor status page',
            source: 'Projected on the window',
            body: ['"Degraded performance: EU region"', 'Started 6 minutes after Halcyon\'s first customer errors'],
          },
        },
        {
          id: 'sol-2', label: 'Sol', kind: 'character', characterId: 'sol', x: 240, y: 124,
          summary: 'Leadership has already told the client it was the vendor. Sol is under pressure to keep that story.',
          lines: [
            { speaker: 'sol', text: 'The board already told the client it was the vendor. Walking that back will hurt.' },
            { speaker: 'sol', text: 'Whatever you find, I need to know before the call.' },
          ],
        },
        {
          id: 'bex', label: 'Bex', kind: 'character', characterId: 'bex', x: 432, y: 138,
          summary: 'Bex wants the vendor story kept intact, for the company\'s sake.',
          lines: [
            { speaker: 'bex', text: 'The vendor statement is out. It\'s clean. It protects us.' },
            { speaker: 'bex', text: 'If you\'re about to make that messier, think very carefully.' },
          ],
        },
        {
          id: 'rafael', label: 'Desk phone', kind: 'character', characterId: 'rafael', x: 226, y: 140, icon: 'call', when: { flag: RAFAEL },
          summary: 'Rafael, from the Vault, says the tickets show customer errors starting two minutes after the internal change, before the vendor\'s problems.',
          lines: [
            { speaker: 'rafael', text: 'Rafael, Floor 7. We escalate early now, so the tickets were tagged within minutes.' },
            { speaker: 'rafael', text: 'First customer errors: two minutes after the connection-pool deploy. Before the vendor\'s status changed.' },
          ],
        },
        {
          id: 'ticket-queue', label: 'Desk phone', kind: 'evidence', icon: 'call', x: 226, y: 140, when: { notFlag: RAFAEL },
          summary: 'The Vault has hundreds of untagged tickets. Nobody has escalated or sorted them, so there\'s no pattern to see yet.',
          doc: {
            title: 'Call to the Data Vault',
            source: 'Desk phone',
            body: ['"340 tickets open. None tagged."', '"Nobody escalates down here. We\'ll get to them."'],
          },
        },
        {
          id: 'tome', label: 'Glowing book', kind: 'evidence', icon: 'doc', x: 68, y: 42, secret: true,
          summary: 'Between two annual reports, a book that glows faintly: the founder\'s last memo.',
          doc: {
            title: 'Founder\'s memo, no. 4',
            source: 'Inside a glowing book on the shelf',
            body: ['"The top floor sees the furthest and the least.', 'Go down. Ask what changed. Build the people who build the Tower."', '— A. Halcyon'],
          },
        },
      ],
    },
    {
      kind: 'decision',
      id: 'cause',
      title: 'The cause',
      asker: 'sol',
      prompt: 'Board call in twenty minutes. What do we say caused this?',
      evidenceFrom: ['phase-2'],
      options: [
        {
          id: 'blame-vendor',
          label: '"Stick with the vendor explanation."',
          quality: 'weak',
          rubric: { diagnosis: 0, impact: 0 },
          outcome: {
            headline: 'The story holds. For a week.',
            narrative: ['The call goes smoothly. A week later the vendor publishes a timeline showing the outage began before their incident.'],
            reactions: [
              { characterId: 'bex', mood: 'relieved', text: 'Clean.' },
              { characterId: 'adaeze', mood: 'frustrated', text: '(A week later, by email) We found out from your vendor. That\'s the worst way.' },
            ],
            effects: { trust: -3 },
          },
          feedback: 'The evidence pointed at an internal change. Keeping the convenient story protected the story, not the client. An organisation that won\'t admit where it is can\'t get better.',
          principleIds: ['p1', 'g-test-assumptions'],
        },
        {
          id: 'quiet-rollback',
          label: '"Roll back the change quietly, but keep the vendor story."',
          quality: 'mixed',
          rubric: { diagnosis: 2, impact: 0 },
          outcome: {
            headline: 'Fixed. Hidden.',
            narrative: ['The rollback stops the last errors. The skipped review is never mentioned again.'],
            reactions: [{ characterId: 'sol', mood: 'concerned', text: 'We fixed it. I\'m not comfortable with how.' }],
            effects: { quality: 1, trust: -1 },
          },
          feedback: 'Your diagnosis was right. But hiding it leaves the process that let an unreviewed change through untouched, and the relationship now depends on nobody finding out.',
          principleIds: ['p1', 'level-2'],
        },
        {
          id: 'correct-record',
          label: '"Roll it back, and tell the board and the client the truth: it was us, and here\'s what changes."',
          quality: 'strong',
          rubric: { diagnosis: 2, impact: 2 },
          unlockedBy: ['sol-2', 'bex'],
          outcome: {
            headline: 'An uncomfortable call. A stronger relationship.',
            narrative: ['Sol tells the board, who are not happy, and then turns to the client.'],
            reactions: [
              { characterId: 'adaeze', mood: 'encouraged', text: 'First supplier who\'s told me their own root cause before I found it.' },
              { characterId: 'sol', mood: 'encouraged', text: 'Hardest call I\'ve made this year. Probably the best one.' },
              { characterId: 'bex', mood: 'concerned', text: 'Well. That\'s a new statement to write.' },
            ],
            effects: { quality: 2, trust: 2 },
          },
          feedback: 'You let the evidence overturn an explanation that had already been announced, which is the hardest kind of assumption to challenge. Being honest about the cause is also what makes it possible to fix the process behind it.',
          principleIds: ['level-2', 'p1', 'g-test-assumptions'],
          flags: ['corrected-record'],
        },
        {
          id: 'keep-investigating',
          label: '"Keep investigating both causes before saying anything."',
          quality: 'mixed',
          rubric: { diagnosis: 1, impact: 0 },
          outcome: {
            headline: 'Thorough. Late.',
            narrative: ['The investigation confirms the change, but only after the board call, where Sol had nothing new to say.'],
            reactions: [{ characterId: 'sol', mood: 'frustrated', text: 'We had the change log an hour ago.' }],
            effects: { trust: -1, quality: 1 },
          },
          feedback: 'More evidence is often right. Here the change log already pointed clearly at one cause, and waiting had a price. Knowing when you have enough to act is part of the skill.',
          principleIds: ['g-test-assumptions'],
        },
      ],
    },
    {
      kind: 'explore',
      id: 'phase-3',
      title: 'The commitment',
      goal: 'Dr. Nwosu wants a commitment before she leaves.',
      required: ['adaeze', 'team-health'],
      hotspots: [
        {
          id: 'adaeze', label: 'Dr. Nwosu', kind: 'character', characterId: 'adaeze', x: 284, y: 172,
          summary: 'The client wants a dedicated team on call around the clock for three months, or she\'ll review the contract.',
          lines: [
            { speaker: 'adaeze', text: 'I need to know this won\'t happen again.' },
            { speaker: 'adaeze', text: 'A dedicated team, on call around the clock, for three months. Otherwise I take this to my board.' },
          ],
        },
        {
          id: 'team-health', label: 'On-call rota', kind: 'evidence', icon: 'doc', x: 106, y: 52,
          summary: 'Three of the five on-call engineers have already worked more than 60 hours this week.',
          doc: {
            title: 'On-call rota: this week',
            source: 'Pinned beside the clock',
            body: ['On-call engineers: 5', 'Over 60 hours this week: 3', 'Cover from other teams: none arranged'],
          },
        },
        {
          id: 'mira-3', label: 'Mira', kind: 'character', characterId: 'mira', x: 132, y: 166,
          summary: 'Mira says the on-call team can\'t sustain round-the-clock cover on its own.',
          lines: [
            { speaker: 'mira', text: 'Three months of 24/7 with five of us? We\'ll be the next outage.' },
          ],
        },
        {
          id: 'priya', label: 'Desk phone', kind: 'character', characterId: 'priya', x: 226, y: 140, icon: 'call', when: { flag: PRIYA },
          summary: 'Priya offers two Meridian engineers for a month, using the shared rota built during the launch.',
          lines: [
            { speaker: 'priya', text: 'Priya, Floor 23. We built a shared rota for Meridian. I can lend you two engineers for a month.' },
            { speaker: 'priya', text: 'Just don\'t promise anything that only works if your people stop sleeping.' },
          ],
        },
        {
          id: 'staffing', label: 'Desk phone', kind: 'evidence', icon: 'call', x: 226, y: 140, when: { notFlag: PRIYA },
          summary: 'No team has a cover arrangement with any other. Every extra hour would come from the same five engineers.',
          doc: {
            title: 'Calls round the building',
            source: 'Desk phone',
            body: ['"Lend people? We\'re all on our own targets."', 'Contractors: three-week lead time'],
          },
        },
      ],
    },
    {
      kind: 'decision',
      id: 'commit',
      title: 'The commitment',
      asker: 'adaeze',
      prompt: 'So. What are you committing to?',
      evidenceFrom: ['phase-3'],
      options: [
        {
          id: 'promise-all',
          label: '"A dedicated 24/7 team for three months, starting tonight."',
          quality: 'weak',
          rubric: { diagnosis: 0, development: 0, impact: 0 },
          outcome: {
            headline: 'Yes to everything.',
            narrative: ['The client is satisfied. Five exhausted engineers now cover every hour of every day.'],
            reactions: [
              { characterId: 'mira', mood: 'withdrawn', text: 'Three months of this?' },
              { characterId: 'sol', mood: 'concerned', text: 'We\'ve promised the thing most likely to cause the next outage.' },
            ],
            effects: { trust: 2, wellbeing: -3, quality: -1 },
          },
          feedback: 'It wins the room and moves the cost onto a team that\'s already exhausted, the same local-win, system-cost pattern as the lounge. Tired engineers making changes at 3am is how outages happen.',
          principleIds: ['g-local-vs-system', 'level-3'],
        },
        {
          id: 'recovery-plan',
          label: '"A time-boxed plan: fix the change process, run monthly failover drills, staff a rota with cover from other teams, and report weekly. And here\'s what we won\'t promise."',
          quality: 'strong',
          rubric: { diagnosis: 2, development: 2, impact: 2 },
          unlockedBy: ['mira-3', 'priya', 'staffing'],
          outcome: {
            headline: 'A promise the building can keep.',
            narrative: ['The client pushes back on the lack of round-the-clock cover, then accepts the weekly reports and the drills. Mira volunteers to design the first drill.'],
            reactions: [
              { characterId: 'adaeze', mood: 'encouraged', text: 'Something real instead of something big. I can work with that.' },
              { characterId: 'mira', mood: 'encouraged', text: 'I\'ll run the first drill. I know exactly where people get stuck.' },
            ],
            effects: { trust: 1, capability: 2, wellbeing: 1, quality: 2 },
          },
          feedback: 'This commitment draws on all four floors: practice where skill was missing (drills), a fixed process where the assumption failed (change review), and conditions the team can sustain (cover and a rota). It\'s also honest about its limits.',
          principleIds: ['level-1', 'level-2', 'level-3', 'g-conditions'],
          flags: ['recovery-plan'],
        },
        {
          id: 'decline',
          label: '"Nothing extra. This was a one-off."',
          quality: 'weak',
          rubric: { diagnosis: 0, development: 0, impact: 0 },
          outcome: {
            headline: 'Nothing promised. Nothing learned.',
            narrative: ['Dr. Nwosu stands, thanks Sol, and starts the contract review the next morning.'],
            reactions: [{ characterId: 'adaeze', mood: 'frustrated', text: 'It wasn\'t a one-off. The process that caused it is still there.' }],
            effects: { trust: -3 },
          },
          feedback: 'Calling it a one-off ignored what you found: a skipped review, a broken runbook, no drills. Those are conditions, and conditions repeat.',
          principleIds: ['p1', 'g-symptom-vs-cause'],
        },
        {
          id: 'credit',
          label: '"A large service credit, in place of changes."',
          quality: 'mixed',
          rubric: { diagnosis: 0, development: 0, impact: 1 },
          outcome: {
            headline: 'Time, bought.',
            narrative: ['The client accepts, warily. Nothing changes operationally.'],
            reactions: [{ characterId: 'sol', mood: 'neutral', text: 'It calms things down. It doesn\'t make anything safer.' }],
            effects: { trust: 1 },
          },
          feedback: 'A credit acknowledges the client\'s cost, which matters. It does nothing about skill, process, or the team\'s conditions.',
          principleIds: ['g-symptom-vs-cause'],
        },
      ],
    },
    {
      kind: 'narrative',
      id: 'resolution',
      title: 'Dawn',
      lines: [
        { speaker: 'narrator', text: 'Dawn comes up over the city. The red light on Sol\'s desk has gone dark.' },
        { speaker: 'mira', text: 'Next time this happens, I\'ll be the one guiding someone.', when: { choice: { decision: 'stabilise', option: 'guided' } } },
        { speaker: 'mira', text: 'I still haven\'t done a failover. Next time, I\'ll be just as stuck.', when: { choice: { decision: 'stabilise', option: ['take-over', 'wait-vendor'] } } },
        { speaker: 'adaeze', text: 'I trust you more after tonight than before. I didn\'t expect to say that.', when: { choice: { decision: 'cause', option: 'correct-record' } } },
        { speaker: 'sol', text: 'The real cause is still a secret, or still unconfirmed. Either way, it can happen again.', when: { choice: { decision: 'cause', option: ['blame-vendor', 'quiet-rollback', 'keep-investigating'] } } },
        { speaker: 'sol', text: 'Four floors in one week. Go home. Then come back and tell me what you\'d do differently.' },
      ],
    },
    {
      kind: 'reflection',
      id: 'reflect',
      title: 'Your notebook',
      prompt: 'The whole Tower, in one week. Be honest: what\'s true of how you handle hard situations?',
      options: [
        { id: 'evidence-habit', text: 'I tend to check the evidence before committing.' },
        { id: 'quick-label', text: 'Under pressure, I grab the quickest explanation.' },
        { id: 'revise', text: 'I change my mind when the evidence changes.' },
        { id: 'system', text: 'I think about who else my decision lands on, and when.' },
        { id: 'develop', text: 'I look for ways to build other people\'s ability, not just fix the problem.' },
        { id: 'trade-off', text: 'I say out loud what a decision will cost.' },
      ],
      notePrompt: 'Next time you face something like this for real, what\'s one thing you\'ll do differently?',
    },
  ],
};
