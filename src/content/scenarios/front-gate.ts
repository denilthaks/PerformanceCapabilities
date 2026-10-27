// Ground floor, the Grand Lobby. Zone 1, The Foundation (Level 1: Transactional).
// Fictional. Learning lives in what the player finds and what follows their
// choices; framework references appear only in the debrief and journal.

import type { Scenario } from '../../engine/types';

export const frontGate: Scenario = {
  id: 'front-gate',
  zone: 'foundation',
  room: 'lobby',
  floor: 'Ground',
  title: 'The Front Gate',
  hook: 'Fourteen gate incidents this month. Everyone has already decided whose fault it is.',
  start: { x: 262, y: 270 },
  characters: ['dana', 'kai', 'margit', 'luis', 'ines'],
  principleIds: ['level-1', 'p1', 'p4', 'g-knowing-vs-doing', 'g-symptom-vs-cause'],
  meters: [
    { id: 'output', label: 'Lobby flow', start: 6 },
    { id: 'quality', label: 'Gate safety', start: 4 },
    { id: 'trust', label: 'Team trust', start: 5 },
    { id: 'capability', label: 'Kai\'s confidence', start: 3 },
  ],
  criteria: ['evidence', 'diagnosis', 'development', 'impact', 'reflection'],
  estimatedMinutes: 8,
  stages: [
    {
      kind: 'narrative',
      id: 'arrival',
      title: 'First night',
      lines: [
        { speaker: 'narrator', text: 'Halcyon Tower. Your first night as its performance lead. The lobby hums, and a red light blinks on the new gates.' },
        { speaker: 'dana', text: 'You\'re the new performance person? Perfect timing.' },
        { speaker: 'dana', text: 'Kai let another visitor through the wrong way last night. Fourteen incidents this month. He passed the gate training with full marks, so I\'m writing him up. Unless you see something I don\'t.' },
      ],
    },
    {
      kind: 'explore',
      id: 'investigate',
      title: 'The lobby',
      goal: 'Find out what\'s really going on at the gates. Dana wants an answer.',
      required: ['dana', 'kai'],
      hotspots: [
        {
          id: 'dana', label: 'Dana', kind: 'character', characterId: 'dana', x: 240, y: 120,
          summary: 'Dana sees a trained person making avoidable mistakes, and head office is watching her numbers.',
          lines: [
            { speaker: 'dana', text: 'Head office reads the incident count every Monday. Mine is the worst in the region.' },
            { speaker: 'player', text: 'When do the incidents happen?' },
            { speaker: 'dana', text: 'Nights, mostly. I\'m not here then. Margit does days.' },
            { speaker: 'dana', text: 'Everyone did the same training. Everyone else copes. What am I supposed to think?' },
          ],
        },
        {
          id: 'kai', label: 'Kai', kind: 'character', characterId: 'kai', x: 444, y: 212,
          summary: 'Kai knows the written procedure by heart, but says the new gates don\'t behave the way it describes. He\'s stopped asking for help.',
          lines: [
            { speaker: 'kai', text: 'Let me guess. Dana sent you.' },
            { speaker: 'kai', text: 'I do exactly what the binder says: scan the pass, wave them through. On the old gates that worked. On these, half the time it jams or lets two people in.' },
            { speaker: 'kai', text: 'When Margit\'s around she does something with the panel and it\'s fine. I asked once. I didn\'t want to ask twice.', when: { notInspected: 'margit' } },
            { speaker: 'kai', text: 'Margit showed you the amber light thing? Nobody ever showed me that.', when: { inspected: 'margit' } },
          ],
        },
        {
          id: 'margit', label: 'Margit', kind: 'character', characterId: 'margit', x: 432, y: 78,
          summary: 'Margit says the new gates need a wait for the amber light and a PIN before release. It isn\'t in the binder; she learned it by doing it.',
          lines: [
            { speaker: 'margit', text: 'Off shift, technically. What do you need?' },
            { speaker: 'margit', text: 'These gates want you to scan, wait for the amber light, then key the PIN. Wave someone through before amber and it either jams or opens wide.' },
            { speaker: 'player', text: 'Is that in the procedure?' },
            { speaker: 'margit', text: 'The binder\'s for the old turnstiles. I worked it out in week one and showed whoever was on with me. Kai\'s on nights. Nobody\'s on with Kai.' },
          ],
        },
        {
          id: 'luis', label: 'Visitor', kind: 'character', characterId: 'luis', x: 86, y: 166,
          summary: 'A contractor says the gate jams when security waves people through quickly, and that it only happens at night.',
          lines: [
            { speaker: 'luis', text: 'Third night in a row. The guard scans me, waves me on, the gate slams shut. Then it lets two of us in at once.' },
            { speaker: 'luis', text: 'The guard looked more stressed than me. Days are fine, for what it\'s worth.' },
          ],
        },
        {
          id: 'ines', label: 'Candidate', kind: 'character', characterId: 'ines', x: 62, y: 214,
          summary: 'An interview candidate for the night role says it\'s been advertised three times this year.',
          lines: [
            { speaker: 'ines', text: 'I\'m interviewing for night security. Third time they\'ve advertised it this year.' },
            { speaker: 'ines', text: 'The ad says "full training provided, a 45-minute online module". Is that normal here?' },
          ],
        },
        {
          id: 'training-record', label: 'Reception terminal', kind: 'evidence', icon: 'screen', x: 197, y: 120, misleading: true,
          summary: 'Kai scored 100% on a 45-minute online gate module. No hands-on sign-off is recorded.',
          doc: {
            title: 'Training record: K. Mensah',
            source: 'Reception terminal',
            body: ['"Smart Gate Essentials" (online, 45 min): passed', 'Quiz: 20 / 20', 'Hands-on sign-off on the new gates: none recorded'],
          },
        },
        {
          id: 'gate-log', label: 'West gate', kind: 'evidence', icon: 'screen', x: 120, y: 178,
          summary: '12 of 14 incidents happened on the new gates, and 11 of 14 at night. Almost all at the same step: release before confirmation.',
          doc: {
            title: 'Gate incident log: this month',
            source: 'West gate console',
            body: ['Incidents: 14', 'New gates: 12 · Old service gate: 2', 'Night: 11 · Day: 3', 'Fault: released before PIN confirmation (13 of 14)'],
          },
        },
        {
          id: 'binder', label: 'Procedure binder', kind: 'evidence', icon: 'doc', x: 283, y: 124,
          summary: 'The security procedure was written for the old turnstiles, two years ago. Nothing covers the new gates.',
          doc: {
            title: 'Front-of-House Security Procedure, revision 3',
            source: 'Binder on the reception desk',
            body: ['Written for: turnstile model T2 (replaced six weeks ago)', 'Step 4: "scan pass, wave visitor through"', 'No amber light, no PIN step', 'Last updated: two years ago'],
          },
        },
        {
          id: 'gate-console', label: 'East gate', kind: 'evidence', icon: 'screen', x: 360, y: 178,
          summary: 'Working days beside Margit, Kai cleared every visitor correctly. Alone at night, about one in three went wrong.',
          doc: {
            title: 'East gate: clearances by K. Mensah',
            source: 'East gate console',
            body: ['Day shifts, with M. Lindqvist present: 41 cleared, 0 faults', 'Night shifts, alone: 33 cleared, 11 faults', 'Fault pattern: release pressed before amber'],
          },
        },
        {
          id: 'emblem', label: 'The emblem', kind: 'evidence', icon: 'doc', x: 240, y: 46, secret: true,
          summary: 'A brass plate under the Tower\'s emblem: the founder\'s first memo.',
          doc: {
            title: 'Founder\'s memo, no. 1',
            source: 'A brass plate behind the emblem',
            body: ['"We built a gate that checks every badge.', 'We forgot to build one that checks understanding."', '— A. Halcyon'],
          },
        },
      ],
    },
    {
      kind: 'decision',
      id: 'diagnose',
      title: 'Your read',
      asker: 'dana',
      prompt: 'So? Before I sign this write-up: what\'s actually wrong?',
      evidenceFrom: ['investigate'],
      options: [
        {
          id: 'attitude',
          label: '"Honestly? Kai isn\'t taking it seriously."',
          quality: 'weak',
          rubric: { diagnosis: 0 },
          outcome: {
            headline: 'The label sticks before the facts do.',
            narrative: ['Dana nods. It\'s what she expected to hear.'],
            reactions: [
              { characterId: 'dana', mood: 'relieved', text: 'Thank you. I thought I was going mad.' },
              { characterId: 'kai', mood: 'withdrawn', text: 'Right. Course I\'m not.' },
            ],
            effects: { trust: -1 },
          },
          feedback: 'Nothing you could find points to Kai not caring. The faults cluster on the new gates, at one step, on shifts with nobody experienced around. Blaming his attitude closed the question before the evidence could answer it.',
          principleIds: ['g-symptom-vs-cause', 'p1'],
        },
        {
          id: 'forgot',
          label: '"He\'s forgotten the training. He needs a refresher."',
          quality: 'mixed',
          rubric: { diagnosis: 1 },
          outcome: {
            headline: 'Close, but he never lacked the information.',
            narrative: ['Kai overhears, and recites the binder\'s procedure word for word.'],
            reactions: [{ characterId: 'kai', mood: 'frustrated', text: 'I know the steps. The steps are wrong for these gates.' }],
            effects: {},
          },
          feedback: 'Something is missing from Kai\'s preparation, so you were half right. But he scored 100% and knows the procedure by heart. He has the information. What he doesn\'t have is the ability to work the new gates.',
          principleIds: ['g-knowing-vs-doing', 'level-1'],
        },
        {
          id: 'practice-gap',
          label: '"He knows the steps on paper. Nobody has ever shown him how these gates actually work, and the binder\'s wrong."',
          quality: 'strong',
          rubric: { diagnosis: 2 },
          unlockedBy: ['margit', 'gate-console'],
          outcome: {
            headline: 'The pattern fits.',
            narrative: ['You walk Dana through it: new gates, nights, one step, an out-of-date binder, and a clean record whenever Margit is beside him.'],
            reactions: [
              { characterId: 'dana', mood: 'concerned', text: 'So the module told him what to do, and nobody showed him how. That\'s on us as much as him.' },
              { characterId: 'kai', mood: 'encouraged', text: 'Someone finally looked at when it happens, not just who.' },
            ],
            effects: { trust: 1 },
          },
          feedback: 'This read fits everything you found. Kai has the knowledge: full marks, and the procedure by heart. What\'s missing is practised skill on the new gates, at night, made worse by a binder that describes different equipment.',
          principleIds: ['level-1', 'p1', 'g-knowing-vs-doing'],
          flags: ['diagnosed-practice-gap'],
        },
        {
          id: 'paperwork',
          label: '"It\'s the binder. Fix the procedure and he\'ll be fine."',
          quality: 'mixed',
          rubric: { diagnosis: 1 },
          unlockedBy: ['binder'],
          outcome: {
            headline: 'Half the picture.',
            narrative: ['Dana agrees the binder is out of date, then asks why the day shift copes with the same binder.'],
            reactions: [{ characterId: 'margit', mood: 'neutral', text: 'The binder\'s wrong, sure. I didn\'t learn these gates from a binder either.' }],
            effects: {},
          },
          feedback: 'The out-of-date binder is real, and it matters. But Kai succeeds when he can watch and practise beside Margit. A better document gives him better information. It doesn\'t give him practised skill.',
          principleIds: ['g-symptom-vs-cause', 'p4'],
        },
      ],
    },
    {
      kind: 'decision',
      id: 'act',
      title: 'What happens to Kai',
      asker: 'dana',
      prompt: 'Fine. Then what do we do about it? I need something I can tell head office.',
      evidenceFrom: ['investigate'],
      options: [
        {
          id: 'warning',
          label: '"Write him up. It puts it on record."',
          quality: 'weak',
          rubric: { development: 0, impact: 0 },
          outcome: {
            headline: 'The incidents go quiet. They don\'t go away.',
            narrative: ['The warning goes on file. Kai stops asking anyone anything. Night incidents carry on, and Margit starts coming in early to check his shift.'],
            reactions: [
              { characterId: 'kai', mood: 'withdrawn', text: 'Fine. Head down, then.' },
              { characterId: 'margit', mood: 'frustrated', text: 'Now he won\'t tell anyone when he\'s stuck. That\'s worse.' },
              { characterId: 'dana', mood: 'neutral', text: 'At least it\'s documented.' },
            ],
            effects: { output: -1, quality: -1, trust: -3, capability: -1 },
          },
          feedback: 'A warning treats the faults as a motivation problem. The evidence showed a gap in hands-on skill, so the faults continued, and the team\'s trust fell. People who fear blame hide problems, which makes the real gap harder to see.',
          principleIds: ['p1', 'g-symptom-vs-cause'],
          flags: ['formal-warning'],
        },
        {
          id: 'retake',
          label: '"Send him back through the online module."',
          quality: 'weak',
          rubric: { development: 0, impact: 1 },
          outcome: {
            headline: '20 out of 20. Again.',
            narrative: ['Kai retakes the module and scores full marks. That night, the east gate jams twice.'],
            reactions: [
              { characterId: 'kai', mood: 'frustrated', text: 'I could have told you I\'d pass. Passing was never the problem.' },
              { characterId: 'dana', mood: 'concerned', text: 'So the training says he\'s fine, and the gate says he isn\'t.' },
            ],
            effects: { output: -1, trust: -1 },
          },
          feedback: 'More information doesn\'t close a skill gap. The module checks whether Kai knows the written steps, and he does. It can\'t check whether he can work the new gates, and it describes the old ones anyway.',
          principleIds: ['level-1', 'g-knowing-vs-doing'],
          flags: ['retake'],
        },
        {
          id: 'reassign',
          label: '"Put him on the old service gate until he\'s ready."',
          quality: 'mixed',
          rubric: { development: 0, impact: 1 },
          outcome: {
            headline: 'Fixed. For now.',
            narrative: ['Incidents drop straight away. But the service gate is being removed next quarter, and only Margit can now run the new gates on her own.'],
            reactions: [
              { characterId: 'dana', mood: 'relieved', text: 'Numbers already look better.' },
              { characterId: 'margit', mood: 'concerned', text: 'So when the old gate goes, it\'s all on me?' },
              { characterId: 'kai', mood: 'withdrawn', text: 'Guess I\'m not a new-gates person.' },
            ],
            effects: { quality: 2, trust: -1, capability: -1 },
          },
          feedback: 'Moving Kai removes the symptom and protects safety for now, which has some value. But it builds no skill, it piles risk onto Margit, and it tells Kai the problem is him. The gap is still there when the old gate goes.',
          principleIds: ['g-symptom-vs-cause', 'p1'],
          flags: ['reassigned'],
        },
        {
          id: 'paired-practice',
          label: '"Put Kai on two shifts with Margit at the new gates, have them rewrite the binder together, and check in after a week."',
          quality: 'strong',
          rubric: { development: 2, impact: 2 },
          unlockedBy: ['margit'],
          outcome: {
            headline: 'A slower week. A different lobby.',
            narrative: [
              'Two nights of Kai and Margit side by side, talking through every clearance. The queue moves slower while they do.',
              'By Friday, Kai runs a night shift without a single fault. The new binder has a page called "Wait for amber".',
            ],
            reactions: [
              { characterId: 'kai', mood: 'encouraged', text: 'It wasn\'t that I couldn\'t do it. Nobody had ever shown me.' },
              { characterId: 'margit', mood: 'encouraged', text: 'Should\'ve written it down six weeks ago. Now it\'s not all in my head.' },
              { characterId: 'dana', mood: 'relieved', text: 'Slower week. I\'ll take that trade.' },
            ],
            effects: { output: -1, quality: 3, trust: 2, capability: 4 },
          },
          feedback: 'This response matches what was actually wrong. It starts from an honest view of where Kai really is, builds the skill through guided practice rather than more information, and fixes the procedure so there\'s something reliable to follow. The slower week was a real cost, and worth it.',
          principleIds: ['p1', 'p4', 'level-1', 'g-knowing-vs-doing'],
          flags: ['paired-practice'],
        },
      ],
    },
    {
      kind: 'reflection',
      id: 'reflect',
      title: 'Your notebook',
      prompt: 'Back at your desk, you jot down how that went. What\'s true?',
      options: [
        { id: 'early-view', text: 'I had a view about Kai before I had looked around.' },
        { id: 'looked-pattern', text: 'I looked at where and when things went wrong before deciding.' },
        { id: 'score-proof', text: 'The perfect quiz score made me assume Kai could do the job.' },
        { id: 'whole-team', text: 'I thought about Margit and Dana too, not just Kai.' },
        { id: 'differently', text: 'I\'d play this differently next time.' },
      ],
      notePrompt: 'Someone you know who "had the training" but still struggled: what were they missing?',
    },
  ],
};
