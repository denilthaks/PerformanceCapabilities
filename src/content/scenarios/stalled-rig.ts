// Zone 1, The Foundation (Level 1: Transactional). Fictional scenario written
// for this prototype. Principle references point at src/content/principles.ts.

import type { Scenario } from '../../engine/types';

export const stalledRig: Scenario = {
  id: 'stalled-rig',
  zone: 'foundation',
  title: 'The Stalled Rig',
  tagline: 'A trained technician keeps getting it wrong. Is it the person, or something else?',
  setting: 'Calibration Bay 3, a training and production facility. Night shift has just ended.',
  objectives: [
    'Talk to the people involved and inspect the records.',
    'Diagnose what is really behind the errors.',
    'Decide what to do and see how the team responds.',
  ],
  characters: ['dana', 'kai', 'theo'],
  principleIds: ['level-1', 'p1', 'p4', 'g-knowing-vs-doing', 'g-symptom-vs-cause'],
  meters: [
    { id: 'output', label: 'Output', start: 6 },
    { id: 'quality', label: 'Quality', start: 4 },
    { id: 'trust', label: 'Trust', start: 5 },
    { id: 'capability', label: 'Capability', start: 3 },
    { id: 'wellbeing', label: 'Wellbeing', start: 5 },
  ],
  criteria: ['evidence', 'diagnosis', 'development', 'impact', 'reflection'],
  estimatedMinutes: 8,
  stages: [
    {
      kind: 'narrative',
      id: 'arrival',
      title: 'Arrival',
      lines: [
        { speaker: 'narrator', text: 'The bay hums under red work-lights. Two calibration rigs stand side by side: the old Rig A, and Rig B, installed six weeks ago.' },
        { speaker: 'dana', text: 'Good, you\'re here. Kai failed another calibration last night. That\'s fourteen errors this month, and every one is rework for my team.' },
        { speaker: 'dana', text: 'He passed the induction module with a perfect score. He knows what to do. I\'m ready to put a formal warning on his file, but I want a second opinion first.' },
        { speaker: 'narrator', text: 'Before you answer, look around. Speak to people and check the records. What you find will shape what you can decide.' },
      ],
    },
    {
      kind: 'explore',
      id: 'investigate',
      title: 'Investigate',
      instructions: 'Select people and objects in the bay to investigate. Speak to Dana and Kai before deciding. The other sources are optional, but the more you examine, the better your evidence.',
      required: ['dana', 'kai'],
      hotspots: [
        {
          id: 'dana', label: 'Dana Reyes', kind: 'character', characterId: 'dana', x: 20, y: 64,
          summary: 'Dana sees a trained person making avoidable mistakes, and is under pressure to hit the weekly target.',
          lines: [
            { speaker: 'dana', text: 'My target is two hundred calibrations a week. Rework is eating a fifth of that.' },
            { speaker: 'player', text: 'When do the errors happen?' },
            { speaker: 'dana', text: 'Mostly nights, I think. I\'m not here then. Theo works days.' },
            { speaker: 'dana', text: 'Look, everyone did the same module. Everyone else manages. What am I supposed to conclude?' },
          ],
        },
        {
          id: 'kai', label: 'Kai Mensah', kind: 'character', characterId: 'kai', x: 52, y: 68,
          summary: 'Kai knows the documented steps but says Rig B behaves differently, and doesn\'t want to look slow by asking.',
          lines: [
            { speaker: 'kai', text: 'I know what they\'re saying about me.' },
            { speaker: 'player', text: 'Walk me through what happens on Rig B.' },
            { speaker: 'kai', text: 'I follow the manual exactly. Step six: tighten A, then B, then C. On Rig A that\'s fine. On Rig B the reading drifts at step seven and it fails.' },
            { speaker: 'kai', text: 'On days, when Theo\'s around, he does something different with the sequence and it works. I didn\'t want to keep asking. Everyone already thinks I\'m the slow one.' },
          ],
        },
        {
          id: 'theo', label: 'Theo Lindqvist', kind: 'character', characterId: 'theo', x: 80, y: 62,
          summary: 'Theo says Rig B needs a different sequence that isn\'t written down anywhere. Experienced staff learned it by doing.',
          lines: [
            { speaker: 'theo', text: 'Kai\'s not careless. He\'s careful to a fault.' },
            { speaker: 'theo', text: 'Rig B wants C, then A, then B, with a thirty-second settle before step seven. It\'s not in the manual. I worked it out the first week and showed whoever was next to me.' },
            { speaker: 'player', text: 'Did anyone show Kai?' },
            { speaker: 'theo', text: 'He\'s on nights. Nobody senior is on nights.' },
          ],
        },
        {
          id: 'training-record', label: 'Training record', kind: 'evidence', x: 11, y: 34, misleading: true,
          summary: 'Kai scored 100% on a 45-minute multiple-choice module. No practical sign-off is recorded.',
          doc: {
            title: 'Training record: K. Mensah',
            source: 'Learning system export',
            body: [
              'Module CR-7 "Calibration Fundamentals": Complete',
              'Format: e-learning, 45 minutes',
              'Assessment: 20 / 20 (multiple choice)',
              'Practical sign-off on Rig B: not recorded',
            ],
          },
        },
        {
          id: 'error-log', label: 'Error log', kind: 'evidence', x: 37, y: 28,
          summary: '12 of 14 errors were on Rig B and 11 of 14 on night shifts. All fail at steps 6–8 of the torque sequence.',
          doc: {
            title: 'Rework log: Calibration Bay 3, this month',
            source: 'Quality system',
            body: [
              'Errors: 14',
              'By rig: Rig B 12 · Rig A 2',
              'By shift: Night 11 · Day 3',
              'Failure point: torque sequence, steps 6–8 (13 of 14)',
            ],
          },
        },
        {
          id: 'sop-binder', label: 'Procedure binder', kind: 'evidence', x: 66, y: 30,
          summary: 'The procedure is two years old and written for Rig A. It has never been updated for Rig B.',
          doc: {
            title: 'Standard Operating Procedure CR-7, revision 3',
            source: 'Bay binder (dated two years ago)',
            body: [
              'Scope: calibration rig, model A',
              'Step 6: tighten clamps in sequence A, B, C',
              'Step 7: record reading immediately',
              'No revision covers Rig B (installed six weeks ago)',
            ],
          },
        },
        {
          id: 'rig-console', label: 'Rig B console', kind: 'evidence', x: 89, y: 30,
          summary: 'On day shifts working beside Theo, Kai passed 6 of 6 calibrations on Rig B. Alone on nights, he passed 3 of 5.',
          doc: {
            title: 'Rig B console: recent runs by K. Mensah',
            source: 'Rig B controller',
            body: [
              'Day shift (with T. Lindqvist present): 6 runs, 6 passed',
              'Night shift (alone): 5 runs, 3 passed, 2 failed at step 7',
              'Failed runs: reading taken immediately after clamping',
            ],
          },
        },
      ],
    },
    {
      kind: 'decision',
      id: 'diagnose',
      title: 'Diagnosis',
      prompt: 'Dana wants your read before the next shift. What do you think is really behind Kai\'s errors?',
      evidenceFrom: ['investigate'],
      options: [
        {
          id: 'attitude',
          label: 'Kai isn\'t taking the work seriously enough.',
          quality: 'weak',
          rubric: { diagnosis: 0 },
          outcome: {
            headline: 'The label sticks before the facts do.',
            narrative: ['You tell Dana it looks like an attitude problem. She nods: it\'s what she expected to hear.'],
            reactions: [
              { characterId: 'dana', mood: 'relieved', text: 'That\'s what I thought. Good to hear it from someone else.' },
              { characterId: 'theo', mood: 'concerned', text: 'You talked to him. Did he sound like someone who doesn\'t care?' },
            ],
            effects: { trust: -1 },
          },
          feedback: 'Nothing you could inspect points to low effort. The errors cluster on one rig, at one step, on shifts with no experienced colleague nearby. Judging a person\'s attitude before testing the conditions around them closes the investigation too early.',
          principleIds: ['g-symptom-vs-cause', 'p1'],
        },
        {
          id: 'forgot',
          label: 'Kai has forgotten the training and needs a refresher.',
          quality: 'mixed',
          rubric: { diagnosis: 1 },
          outcome: {
            headline: 'Close, but the information was never the gap.',
            narrative: ['You suggest Kai needs reminding of the steps. Kai, overhearing, recites the procedure word for word.'],
            reactions: [
              { characterId: 'kai', mood: 'frustrated', text: 'I know the steps. That\'s the problem: the steps are wrong for this rig.' },
            ],
            effects: {},
          },
          feedback: 'You were right that something about Kai\'s preparation is missing, but Kai scored 100% and can recite the procedure. Kai has the information. What\'s missing is the ability to perform on Rig B, which the procedure doesn\'t describe.',
          principleIds: ['g-knowing-vs-doing', 'level-1'],
        },
        {
          id: 'practice-gap',
          label: 'Kai has the information but hasn\'t had guided practice on Rig B, and the procedure doesn\'t cover it.',
          quality: 'strong',
          rubric: { diagnosis: 2 },
          outcome: {
            headline: 'The pattern fits.',
            narrative: ['You lay out the pattern for Dana: Rig B, nights, steps 6–8, an out-of-date procedure, and a perfect record whenever Theo is nearby.'],
            reactions: [
              { characterId: 'dana', mood: 'concerned', text: 'So the module told him what to do, and nobody ever showed him how on the new rig. That\'s on us as much as him.' },
              { characterId: 'theo', mood: 'encouraged', text: 'Finally, someone looked at when it happens and not just who.' },
            ],
            effects: { trust: 1 },
          },
          feedback: 'This diagnosis fits all of the evidence. Kai has the knowledge: 100% on the module, and he recites the steps. The gap is practised skill on Rig B under real conditions, made worse by a procedure that describes the wrong rig. Level 1 of the framework deals with mastering the content, the "what and how". Here the "how" for Rig B was never taught.',
          principleIds: ['level-1', 'p1', 'g-knowing-vs-doing'],
          flags: ['diagnosed-practice-gap'],
        },
        {
          id: 'paperwork',
          label: 'It\'s purely a paperwork problem. Fix the procedure and Kai will be fine.',
          quality: 'mixed',
          rubric: { diagnosis: 1 },
          outcome: {
            headline: 'Half the picture.',
            narrative: ['You point Dana at the out-of-date binder. She agrees it needs updating, but asks why the day shift copes with the same binder.'],
            reactions: [
              { characterId: 'theo', mood: 'neutral', text: 'The binder\'s wrong, sure. But I didn\'t learn Rig B from a binder either.' },
            ],
            effects: {},
          },
          feedback: 'The out-of-date procedure is real and it matters. But the console shows Kai succeeding when he can watch and practise beside Theo. Correcting the document gives him better information. It doesn\'t give him the practised skill.',
          principleIds: ['g-symptom-vs-cause', 'p4'],
        },
      ],
    },
    {
      kind: 'decision',
      id: 'act',
      title: 'Your response',
      prompt: 'Dana asks what you\'ll do. Your choice will affect output, quality, trust and Kai\'s development.',
      evidenceFrom: ['investigate'],
      options: [
        {
          id: 'warning',
          label: 'Back Dana: issue Kai a formal warning.',
          detail: 'Fast, documented, and puts the responsibility on Kai.',
          quality: 'weak',
          rubric: { development: 0, impact: 0 },
          outcome: {
            headline: 'The errors go quiet. They don\'t go away.',
            narrative: [
              'The warning goes on file. Over the next week Kai stops asking questions altogether.',
              'Night-shift errors carry on at the same rate. Theo starts coming in early to redo Kai\'s runs, so his own work slips.',
            ],
            reactions: [
              { characterId: 'kai', mood: 'withdrawn', text: 'Fine. I\'ll keep my head down.' },
              { characterId: 'theo', mood: 'frustrated', text: 'Now he won\'t tell anyone when he\'s stuck. That makes it worse.' },
              { characterId: 'dana', mood: 'neutral', text: 'At least it\'s on record.' },
            ],
            effects: { output: -1, quality: -1, trust: -3, wellbeing: -2 },
          },
          feedback: 'A warning treats the symptom (errors) as a motivation problem. The evidence showed a capability gap on one rig, so the errors continued and the team\'s trust fell. People who fear blame hide problems, so the real gap gets harder to see.',
          principleIds: ['p1', 'g-symptom-vs-cause'],
          flags: ['formal-warning'],
        },
        {
          id: 'retake',
          label: 'Send Kai to retake the e-learning module.',
          detail: 'Low cost, quick, and the module is already built.',
          quality: 'weak',
          rubric: { development: 0, impact: 1 },
          outcome: {
            headline: '100%, again.',
            narrative: [
              'Kai retakes the module and scores 20 out of 20 again.',
              'That night, Rig B fails at step seven.',
            ],
            reactions: [
              { characterId: 'kai', mood: 'frustrated', text: 'I could have told you I\'d pass it. Passing it was never the problem.' },
              { characterId: 'dana', mood: 'concerned', text: 'So the training says he\'s fine, and the rig says he isn\'t.' },
            ],
            effects: { output: -1, trust: -1 },
          },
          feedback: 'More information doesn\'t close a practice gap. The module tests whether Kai knows the documented steps, and he does. It can\'t test whether he can perform on Rig B, and its content describes the old rig anyway. Ben\'s podcast on Level 1 distinguishes knowledge-based from practice-based development. This situation needed practice.',
          principleIds: ['level-1', 'g-knowing-vs-doing'],
          flags: ['retake'],
        },
        {
          id: 'reassign',
          label: 'Move Kai off Rig B and back onto the older Rig A.',
          detail: 'Removes the errors immediately.',
          quality: 'mixed',
          rubric: { development: 0, impact: 1 },
          outcome: {
            headline: 'Problem solved, for now.',
            narrative: [
              'Errors drop straight away. Dana is pleased.',
              'But Rig A is being retired next quarter, and only Theo can now run Rig B reliably. Kai\'s confidence takes a knock.',
            ],
            reactions: [
              { characterId: 'dana', mood: 'relieved', text: 'Numbers look better already.' },
              { characterId: 'theo', mood: 'concerned', text: 'So when Rig A goes, it\'s all on me?' },
              { characterId: 'kai', mood: 'withdrawn', text: 'I guess I\'m just not a Rig B person.' },
            ],
            effects: { quality: 2, trust: -1, capability: -1, wellbeing: -1 },
          },
          feedback: 'Moving Kai removes the symptom and protects quality in the short term, which has some value. But it builds no capability, it concentrates risk on Theo, and it tells Kai the problem is him. The gap is still there when Rig A is retired.',
          principleIds: ['g-symptom-vs-cause', 'p1'],
          flags: ['reassigned'],
        },
        {
          id: 'paired-practice',
          label: 'Pair Kai with Theo for guided practice on Rig B, have them rewrite the procedure together, and review after a week.',
          detail: 'Costs some output this week, and Theo\'s time.',
          quality: 'strong',
          rubric: { development: 2, impact: 2 },
          outcome: {
            headline: 'A slower week. A different bay.',
            narrative: [
              'For two days Kai and Theo run Rig B together, talking through every step. Output dips while Theo is off his own line.',
              'By Friday, Kai completes a night shift on Rig B with no errors. He and Theo have drafted revision 4 of the procedure, which includes the settle time.',
            ],
            reactions: [
              { characterId: 'kai', mood: 'encouraged', text: 'It wasn\'t that I couldn\'t do it. I\'d never actually been shown.' },
              { characterId: 'theo', mood: 'encouraged', text: 'Should have written it down six weeks ago. Now it\'s not all in my head.' },
              { characterId: 'dana', mood: 'relieved', text: 'We lost a few hours this week. I\'ll take that trade.' },
            ],
            effects: { output: -1, quality: 3, trust: 2, capability: 3, wellbeing: 1 },
          },
          feedback: 'This response matches the diagnosis. It starts from an accurate view of where performance really is (Principle 1), develops skill through guided practice rather than more information, and fixes the procedure. An accurate procedure is what makes disciplined, consistent practice possible (Principle 4). The short-term cost to output was real, and worth naming.',
          principleIds: ['p1', 'p4', 'level-1', 'g-knowing-vs-doing'],
          flags: ['paired-practice'],
        },
      ],
    },
    {
      kind: 'reflection',
      id: 'reflect',
      title: 'Reflection',
      prompt: 'Be honest with yourself: which of these were true of your approach?',
      options: [
        { id: 'early-view', text: 'I formed a view about Kai before I looked at the evidence.' },
        { id: 'looked-pattern', text: 'I looked at where and when the errors happened before deciding.' },
        { id: 'score-proof', text: 'I treated the perfect quiz score as proof that Kai could do the job.' },
        { id: 'whole-team', text: 'I thought about what Theo and Dana needed, not just Kai.' },
        { id: 'differently', text: 'Next time I\'d approach this differently.' },
      ],
      notePrompt: 'Think of a real situation where someone "had the training" but still struggled. What might they have been missing?',
    },
  ],
};
