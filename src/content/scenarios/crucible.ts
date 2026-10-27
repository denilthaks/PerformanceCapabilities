// Zone 4, the Integration Trial: a game-design capstone combining the three
// published levels. It is NOT presented as a fourth level of the framework.
// Earlier decisions (flags) change who is available and what evidence exists.

import type { Scenario } from '../../engine/types';

const KAI = 'stalled-rig:paired-practice';
const RAFAEL = 'signal-room:redesigned-routing';
const MERIDIAN = 'meridian-launch:shared-measure';

export const crucible: Scenario = {
  id: 'crucible',
  zone: 'trial',
  title: 'The Crucible',
  tagline: 'One crisis, three layers. Everything you have practised, at once.',
  setting: 'Halcyon\'s incident room. A client\'s payment platform has gone down an hour before their executive call.',
  objectives: [
    'Phase 1: stabilise the service without leaving capability behind.',
    'Phase 2: find the real cause, even though leadership has already named one.',
    'Phase 3: make a commitment that balances the client, the team and the long term.',
  ],
  characters: ['sol', 'mira'],
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
      title: 'What you bring',
      intro: 'Your earlier decisions shaped the people and resources around you today. Review them before the alarm sounds.',
      scenarioIds: ['stalled-rig', 'signal-room', 'meridian-launch'],
    },
    {
      kind: 'narrative',
      id: 'alarm',
      title: 'The alarm',
      lines: [
        { speaker: 'narrator', text: 'Every screen in the Crucible turns crimson. Halcyon\'s payment platform is down for its largest client.' },
        { speaker: 'sol', text: 'We have one hour before the client\'s executive call. Mira is on call. It\'s her first rotation.' },
        { speaker: 'narrator', text: 'Kai Mensah, who now runs hands-on practice sessions for engineers across the network, has joined the bridge.', when: { flag: KAI } },
        { speaker: 'narrator', text: 'Halcyon never built a hands-on training programme. On-call preparation here means reading the runbook.', when: { notFlag: KAI } },
        { speaker: 'sol', text: 'Phase one: get us back up. Go.' },
      ],
    },
    {
      kind: 'explore',
      id: 'phase-1',
      title: 'Phase 1: Stabilise',
      instructions: 'Find out what Mira needs to run the failover. Speak to Mira and check the runbook.',
      required: ['mira', 'runbook'],
      hotspots: [
        {
          id: 'mira', label: 'Mira Chen', kind: 'character', characterId: 'mira', x: 46, y: 68,
          summary: 'Mira has read the failover runbook but has never performed a failover.',
          lines: [
            { speaker: 'mira', text: 'I know the runbook. I\'ve read it three times.' },
            { speaker: 'mira', text: 'I\'ve never actually done a failover. Not even in a drill. What if I make it worse?' },
          ],
        },
        {
          id: 'runbook', label: 'Failover runbook', kind: 'evidence', x: 20, y: 28,
          summary: 'The runbook has 14 steps and was last tested nine months ago. Two steps refer to a server that has since been replaced.',
          doc: {
            title: 'Runbook: payment platform failover',
            source: 'Operations wiki',
            body: [
              '14 steps · last tested: 9 months ago',
              'Steps 6 and 9 reference server PAY-02 (decommissioned)',
              'On-call onboarding requirement: "read runbook"',
            ],
          },
        },
        {
          id: 'kai', label: 'Kai Mensah', kind: 'character', characterId: 'kai', x: 76, y: 66, when: { flag: KAI },
          summary: 'Kai offers to guide Mira through the failover live, the way Theo once guided him.',
          lines: [
            { speaker: 'kai', text: 'I\'ve been where Mira is: knew the steps, never done it.' },
            { speaker: 'kai', text: 'I can stand beside her and talk her through it. She\'ll be slower than a senior today, and faster than anyone next time.' },
          ],
        },
        {
          id: 'drill-log', label: 'Drill log', kind: 'evidence', x: 76, y: 30, when: { notFlag: KAI },
          summary: 'No failover drills have been run this year. On-call engineers are trained by reading only.',
          doc: {
            title: 'On-call drill log',
            source: 'Operations calendar',
            body: ['Failover drills this year: 0', 'Training method: self-study of runbooks'],
          },
        },
      ],
    },
    {
      kind: 'decision',
      id: 'stabilise',
      title: 'Phase 1: Stabilise',
      prompt: 'How do you get the platform back up?',
      evidenceFrom: ['phase-1'],
      options: [
        {
          id: 'take-over',
          label: 'Take the keyboard from Mira and have the most senior engineer run the failover.',
          quality: 'mixed',
          rubric: { diagnosis: 1, development: 0, impact: 1 },
          outcome: {
            headline: 'Back up in twenty minutes.',
            narrative: ['The senior engineer works around the outdated steps from memory. Service returns. Mira watches from the side.'],
            reactions: [
              { characterId: 'mira', mood: 'withdrawn', text: 'I guess I\'m not ready for on-call.' },
              { characterId: 'sol', mood: 'relieved', text: 'Good. Next.' },
            ],
            effects: { output: 5, wellbeing: -1 },
          },
          feedback: 'Fast and defensible in a crisis. But the outdated runbook is still outdated, and the gap between reading a runbook and performing a failover is still there for the next on-call engineer.',
          principleIds: ['g-knowing-vs-doing', 'level-1'],
        },
        {
          id: 'guided',
          label: 'Have Mira run the failover with an experienced engineer guiding her live, correcting the runbook as they go.',
          quality: 'strong',
          rubric: { diagnosis: 2, development: 2, impact: 2 },
          outcome: {
            headline: 'Back up in thirty minutes, with two people who can do it.',
            narrative: [
              'Mira runs it step by step with guidance beside her. They hit the outdated steps, fix them in the runbook and carry on.',
              'Service returns ten minutes later than the fastest option would have managed.',
            ],
            reactions: [
              { characterId: 'mira', mood: 'encouraged', text: 'I did it. And the runbook\'s right now.' },
              { characterId: 'kai', mood: 'encouraged', text: 'That\'s how I learned too.', when: { flag: KAI } },
              { characterId: 'sol', mood: 'neutral', text: 'Ten minutes slower. I can live with that, if it means we\'re not here again.' },
            ],
            effects: { output: 4, capability: 3, quality: 1 },
          },
          feedback: 'You treated the crisis as the practice Mira had never had, under guidance, and fixed the process while you were in it. It cost ten minutes. It closed a practice gap and an outdated-process gap at the same time: Level 1 thinking under pressure.',
          principleIds: ['level-1', 'g-knowing-vs-doing', 'p4'],
          flags: ['guided-failover'],
        },
        {
          id: 'wait-vendor',
          label: 'Wait for the infrastructure vendor\'s support team before touching anything.',
          quality: 'weak',
          rubric: { diagnosis: 0, development: 0, impact: 0 },
          outcome: {
            headline: 'Forty minutes of nothing.',
            narrative: ['The vendor replies after forty minutes to say their systems are healthy. The client\'s call is now twenty minutes away.'],
            reactions: [{ characterId: 'sol', mood: 'frustrated', text: 'We had people who could have acted.' }],
            effects: { output: 2, trust: -2 },
          },
          feedback: 'Waiting for an outside party passed the decision to someone else, without evidence that the problem was theirs.',
          principleIds: ['g-test-assumptions'],
        },
      ],
    },
    {
      kind: 'explore',
      id: 'phase-2',
      title: 'Phase 2: The cause',
      instructions: 'Leadership has already told the client it was the vendor. Check the change log, then find out what really happened.',
      required: ['change-log'],
      hotspots: [
        {
          id: 'vendor-status', label: 'Vendor status page', kind: 'evidence', x: 22, y: 28, misleading: true,
          summary: 'The vendor reports "degraded performance" in one region, starting after the outage began.',
          doc: {
            title: 'Vendor status page',
            source: 'Public status feed',
            body: ['"Degraded performance: EU region"', 'Started: 6 minutes after Halcyon\'s first customer errors'],
          },
        },
        {
          id: 'change-log', label: 'Change log', kind: 'evidence', x: 50, y: 24,
          summary: 'A connection-pool configuration change was deployed 47 minutes before the outage, outside the agreed change window.',
          doc: {
            title: 'Deployment change log',
            source: 'Release system',
            body: [
              'Deploy 47 min before outage: connection-pool limit 400 → 40',
              'Window: outside agreed change window',
              'Review: skipped ("urgent performance tweak")',
            ],
          },
        },
        {
          id: 'sol-2', label: 'Sol Andersen', kind: 'character', characterId: 'sol', x: 50, y: 70,
          summary: 'Leadership has already told the client the outage was the vendor\'s fault, and Sol is under pressure to stick with that.',
          lines: [
            { speaker: 'sol', text: 'Leadership told the client it was the vendor. Correcting that is going to be painful.' },
            { speaker: 'sol', text: 'Whatever you find, I need to know before the call.' },
          ],
        },
        {
          id: 'rafael', label: 'Rafael Duarte', kind: 'character', characterId: 'rafael', x: 80, y: 66, when: { flag: RAFAEL },
          summary: 'Rafael\'s escalation habit surfaced a clear ticket pattern: customer errors began two minutes after the config change.',
          lines: [
            { speaker: 'rafael', text: 'We escalate early now, so the tickets were tagged within minutes.' },
            { speaker: 'rafael', text: 'First customer errors: two minutes after the connection-pool deploy. Before the vendor\'s status changed.' },
          ],
        },
        {
          id: 'ticket-queue', label: 'Ticket queue', kind: 'evidence', x: 80, y: 30, when: { notFlag: RAFAEL },
          summary: 'Hundreds of untagged tickets. Nobody has escalated or sorted them, so no pattern is visible yet.',
          doc: {
            title: 'Incident ticket queue',
            source: 'Ticketing system',
            body: ['Open tickets: 340', 'Tagged or escalated: 0', 'Pattern analysis: not available'],
          },
        },
      ],
    },
    {
      kind: 'decision',
      id: 'cause',
      title: 'Phase 2: The cause',
      prompt: 'The client call is in twenty minutes. What do you do about the cause?',
      evidenceFrom: ['phase-2'],
      options: [
        {
          id: 'blame-vendor',
          label: 'Stay with the vendor explanation leadership has already given.',
          quality: 'weak',
          rubric: { diagnosis: 0, impact: 0 },
          outcome: {
            headline: 'The story holds, for a week.',
            narrative: ['The call goes smoothly. A week later the vendor publishes a timeline showing the outage began before their incident.'],
            reactions: [{ characterId: 'sol', mood: 'frustrated', text: 'The client found out from the vendor. That\'s the worst way.' }],
            effects: { trust: -3 },
          },
          feedback: 'The evidence pointed to an internal change. Keeping a convenient explanation protected the story, not the client. You can\'t develop what you don\'t accept, and that applies to organisations as well as people.',
          principleIds: ['p1', 'g-test-assumptions'],
        },
        {
          id: 'quiet-rollback',
          label: 'Quietly roll back the config change, but keep the vendor explanation.',
          quality: 'mixed',
          rubric: { diagnosis: 2, impact: 0 },
          outcome: {
            headline: 'Fixed, and hidden.',
            narrative: ['The rollback stops the residual errors. Internally, the skipped review is never discussed.'],
            reactions: [{ characterId: 'sol', mood: 'concerned', text: 'We fixed it. I\'m not comfortable with how.' }],
            effects: { quality: 1, trust: -1 },
          },
          feedback: 'Your diagnosis was right. But hiding it means the process that let an unreviewed change through stays as it is, and the client relationship now depends on nobody finding out.',
          principleIds: ['p1', 'level-2'],
        },
        {
          id: 'correct-record',
          label: 'Roll back the change, and correct the record with leadership and the client: the cause was internal, and here is what changes.',
          quality: 'strong',
          rubric: { diagnosis: 2, impact: 2 },
          outcome: {
            headline: 'An uncomfortable call. A stronger relationship.',
            narrative: [
              'Sol briefs leadership, who are unhappy, and then the client.',
              'The client\'s CTO says it\'s the first time a supplier has corrected its own root cause before they found it.',
            ],
            reactions: [
              { characterId: 'sol', mood: 'encouraged', text: 'Hardest call I\'ve made this year. Probably the best one.' },
            ],
            effects: { quality: 2, trust: 2 },
          },
          feedback: 'You let the evidence override an explanation that had already been announced, which is the hardest kind of assumption to challenge. Being honest about the cause also makes it possible to fix the process that allowed it.',
          principleIds: ['level-2', 'p1', 'g-test-assumptions'],
          flags: ['corrected-record'],
        },
        {
          id: 'keep-investigating',
          label: 'Keep investigating both possible causes before acting on either.',
          quality: 'mixed',
          rubric: { diagnosis: 1, impact: 0 },
          outcome: {
            headline: 'Thorough, and late.',
            narrative: ['The investigation confirms the config change, but only after the client call, where Sol had nothing new to say.'],
            reactions: [{ characterId: 'sol', mood: 'frustrated', text: 'We had the change log an hour ago.' }],
            effects: { trust: -1, quality: 1 },
          },
          feedback: 'Gathering more evidence is often right. Here the change log already pointed clearly at one cause, and waiting had a cost. Part of the skill is knowing when you have enough evidence to act.',
          principleIds: ['g-test-assumptions'],
        },
      ],
    },
    {
      kind: 'explore',
      id: 'phase-3',
      title: 'Phase 3: The commitment',
      instructions: 'The client wants a commitment today. Check the client\'s demand and the state of the team before deciding.',
      required: ['client-demand', 'team-health'],
      hotspots: [
        {
          id: 'client-demand', label: 'Client demand', kind: 'evidence', x: 24, y: 28,
          summary: 'The client wants a dedicated team on call around the clock for three months, or a contract review.',
          doc: {
            title: 'Message from the client\'s CTO',
            source: 'Email, 14 minutes ago',
            body: ['"We need a dedicated 24/7 team for three months."', '"Otherwise we will need to review the contract."'],
          },
        },
        {
          id: 'team-health', label: 'Team health', kind: 'evidence', x: 50, y: 24,
          summary: 'Three of the five on-call engineers have worked more than 60 hours this week.',
          doc: {
            title: 'On-call rota: this week',
            source: 'Rota system',
            body: ['On-call engineers: 5', 'Working 60+ hours this week: 3', 'Cover from other teams: none arranged'],
          },
        },
        {
          id: 'priya', label: 'Priya Nair', kind: 'character', characterId: 'priya', x: 78, y: 66, when: { flag: MERIDIAN },
          summary: 'Priya can lend two Meridian engineers for a month, using the shared rota built during the launch.',
          lines: [
            { speaker: 'priya', text: 'We built a shared rota at Meridian last quarter. I can lend you two engineers for a month.' },
            { speaker: 'priya', text: 'Don\'t promise anything that only works if your people stop sleeping.' },
          ],
        },
        {
          id: 'staffing', label: 'Staffing options', kind: 'evidence', x: 78, y: 30, when: { notFlag: MERIDIAN },
          summary: 'No cross-team cover arrangements exist. Every extra hour would come from the current five engineers.',
          doc: {
            title: 'Staffing options',
            source: 'Resource planning',
            body: ['Cross-team cover agreements: none', 'Contractors: 3-week lead time'],
          },
        },
      ],
    },
    {
      kind: 'decision',
      id: 'commit',
      title: 'Phase 3: The commitment',
      prompt: 'What do you commit to?',
      evidenceFrom: ['phase-3'],
      options: [
        {
          id: 'promise-all',
          label: 'Promise the client a dedicated 24/7 team made up of the current on-call engineers.',
          quality: 'weak',
          rubric: { diagnosis: 0, development: 0, impact: 0 },
          outcome: {
            headline: 'Yes to everything.',
            narrative: ['The client is satisfied. Your five engineers are now covering every hour of the day, for three months.'],
            reactions: [
              { characterId: 'mira', mood: 'withdrawn', text: 'Three months of this?' },
              { characterId: 'sol', mood: 'concerned', text: 'We\'ve just promised the client the thing most likely to cause the next outage.' },
            ],
            effects: { trust: 2, wellbeing: -3, quality: -1 },
          },
          feedback: 'This wins the call and moves the cost onto an exhausted team, which is the local-win, system-cost pattern from the Meridian. Tired engineers making changes at 3am is how outages happen.',
          principleIds: ['g-local-vs-system', 'level-3'],
        },
        {
          id: 'recovery-plan',
          label: 'Offer a time-boxed recovery plan: fix the change process, run monthly failover drills, staff a rotation with cross-team cover, and report weekly. Be explicit about what you won\'t promise.',
          quality: 'strong',
          rubric: { diagnosis: 2, development: 2, impact: 2 },
          outcome: {
            headline: 'A plan the system can keep.',
            narrative: [
              'The client pushes back on the absence of round-the-clock cover, then accepts the weekly reporting and the drill programme.',
              'Mira volunteers to help design the first drill.',
            ],
            reactions: [
              { characterId: 'sol', mood: 'encouraged', text: 'We gave them something real instead of something big.' },
              { characterId: 'mira', mood: 'encouraged', text: 'I\'ll run the first drill. I know exactly where people will get stuck.' },
            ],
            effects: { trust: 1, capability: 2, wellbeing: 1, quality: 2 },
          },
          feedback: 'This commitment links all three levels: practice where capability was missing (drills), a corrected process where the assumption failed (change review), and conditions the team can sustain (cover and a rotation). It is also honest about its limits.',
          principleIds: ['level-1', 'level-2', 'level-3', 'g-conditions'],
          flags: ['recovery-plan'],
        },
        {
          id: 'decline',
          label: 'Decline any extra commitment. The outage was a one-off.',
          quality: 'weak',
          rubric: { diagnosis: 0, development: 0, impact: 0 },
          outcome: {
            headline: 'Nothing promised, nothing learned.',
            narrative: ['The client starts the contract review the next morning.'],
            reactions: [{ characterId: 'sol', mood: 'frustrated', text: 'It wasn\'t a one-off. The process that caused it is still there.' }],
            effects: { trust: -3 },
          },
          feedback: 'Calling it a one-off ignores the evidence: a skipped review, an outdated runbook and no drills. Those are conditions, and conditions repeat.',
          principleIds: ['p1', 'g-symptom-vs-cause'],
        },
        {
          id: 'credit',
          label: 'Offer the client a large service credit instead of operational changes.',
          quality: 'mixed',
          rubric: { diagnosis: 0, development: 0, impact: 1 },
          outcome: {
            headline: 'Bought time.',
            narrative: ['The client accepts the credit, warily. Nothing changes operationally.'],
            reactions: [{ characterId: 'sol', mood: 'neutral', text: 'It calms things down. It doesn\'t make anything safer.' }],
            effects: { trust: 1 },
          },
          feedback: 'A credit recognises the client\'s cost, which matters to the relationship. But it does nothing about capability, process or the team\'s conditions.',
          principleIds: ['g-symptom-vs-cause'],
        },
      ],
    },
    {
      kind: 'narrative',
      id: 'resolution',
      title: 'Resolution',
      lines: [
        { speaker: 'narrator', text: 'The Crucible\'s screens fade from crimson to black. The incident is closed.' },
        { speaker: 'mira', text: 'Next time this happens, I\'ll be the one guiding someone.', when: { choice: { decision: 'stabilise', option: 'guided' } } },
        { speaker: 'mira', text: 'I still haven\'t done a failover. Next time, I\'ll be just as stuck.', when: { choice: { decision: 'stabilise', option: ['take-over', 'wait-vendor'] } } },
        { speaker: 'sol', text: 'The client trusts us more after this than before. I didn\'t expect to say that today.', when: { choice: { decision: 'cause', option: 'correct-record' } } },
        { speaker: 'sol', text: 'The real cause is still a secret, or still unconfirmed. Either way, it can happen again.', when: { choice: { decision: 'cause', option: ['blame-vendor', 'quiet-rollback', 'keep-investigating'] } } },
        { speaker: 'narrator', text: 'Your debrief will show how your reasoning held up across all three layers.' },
      ],
    },
    {
      kind: 'reflection',
      id: 'reflect',
      title: 'Final reflection',
      prompt: 'Across the whole journey, which of these are true of how you tend to approach difficult situations?',
      options: [
        { id: 'evidence-habit', text: 'I tend to check the evidence before committing.' },
        { id: 'quick-label', text: 'Under pressure, I reach for the quickest explanation.' },
        { id: 'revise', text: 'I change my mind when the evidence changes.' },
        { id: 'system', text: 'I think about who else my decision affects, and when.' },
        { id: 'develop', text: 'I look for ways to build other people\'s capability, not just fix the problem.' },
        { id: 'trade-off', text: 'I name the short-term cost of a decision rather than hide it.' },
      ],
      notePrompt: 'What is one thing you will do differently the next time you face a real situation like this one?',
    },
  ],
};
