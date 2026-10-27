// Content and state types for the scenario engine. Scenarios are plain data
// (src/content/scenarios) so new ones can be added without touching the engine.

export type ZoneId = 'foundation' | 'shift' | 'horizon' | 'trial';
export type Mood = 'neutral' | 'relieved' | 'encouraged' | 'concerned' | 'frustrated' | 'withdrawn';
export type Quality = 'strong' | 'mixed' | 'weak';

/** Rubric criteria. Every scenario is scored against the subset it uses. */
export type CriterionId = 'evidence' | 'diagnosis' | 'development' | 'impact' | 'reflection';
/** Criteria that come from the options a player picks (0–2 points each). */
export type ChoiceCriterion = 'diagnosis' | 'development' | 'impact';

/**
 * Flags record what a player decided, namespaced by scenario
 * ("foundation-stalled-rig:paired-practice"). Later scenarios read them to
 * change context, which is how earlier decisions carry forward.
 */
export interface Condition {
  flag?: string;
  notFlag?: string;
  /** A decision made earlier in this same run. */
  choice?: { decision: string; option: string | string[] };
}

export interface Line {
  /** A character id, 'narrator' or 'player'. */
  speaker: string;
  text: string;
  when?: Condition;
}

export interface EvidenceDoc {
  title: string;
  /** Short lines, rendered as a record. */
  body: string[];
  source: string;
}

export interface Hotspot {
  id: string;
  label: string;
  kind: 'character' | 'evidence';
  characterId?: string;
  /** Position on the scene, as a percentage of its width and height. */
  x: number;
  y: number;
  /** What the player learned, shown in the evidence record after inspection. */
  summary: string;
  lines?: Line[];
  doc?: EvidenceDoc;
  /** Hidden until this decision (in the same run) has been made. */
  revealAfter?: string;
  when?: Condition;
  /** Plausible but misleading. Revealed in the debrief, never during play. */
  misleading?: boolean;
}

export type MeterId = 'output' | 'quality' | 'trust' | 'capability' | 'wellbeing' | 'cohesion';

export interface Reaction {
  characterId: string;
  mood: Mood;
  text: string;
  when?: Condition;
}

export interface Outcome {
  headline: string;
  narrative: string[];
  reactions: Reaction[];
  /** Simulated, in-story changes to the scenario's meters (−3 … +3). */
  effects: Partial<Record<MeterId, number>>;
  /** Delayed consequences, shown by a later 'aftermath' stage. */
  later?: string[];
  laterEffects?: Partial<Record<MeterId, number>>;
}

export interface Option {
  id: string;
  label: string;
  detail?: string;
  quality: Quality;
  rubric: Partial<Record<ChoiceCriterion, 0 | 1 | 2>>;
  outcome: Outcome;
  /** Why this choice played out as it did, linked to the framework. */
  feedback: string;
  principleIds: string[];
  flags?: string[];
}

interface StageBase {
  id: string;
  title: string;
}

export interface NarrativeStage extends StageBase {
  kind: 'narrative';
  lines: Line[];
}

export interface ExploreStage extends StageBase {
  kind: 'explore';
  instructions: string;
  hotspots: Hotspot[];
  /** Hotspots that must be inspected before moving on. */
  required: string[];
}

export interface DecisionStage extends StageBase {
  kind: 'decision';
  prompt: string;
  /** Which explore stages' hotspots count as evidence available for this decision. */
  evidenceFrom: string[];
  options: Option[];
}

/** Shows the delayed consequences ("later") of an earlier decision. */
export interface AftermathStage extends StageBase {
  kind: 'aftermath';
  decision: string;
  intro: string;
}

/** Looks back at the player's decisions in earlier scenarios. */
export interface ReviewStage extends StageBase {
  kind: 'review';
  intro: string;
  scenarioIds: string[];
}

export interface ReflectionStage extends StageBase {
  kind: 'reflection';
  prompt: string;
  options: { id: string; text: string }[];
  /** Prompt for an optional written note (stored in the learning journal). */
  notePrompt: string;
}

export type Stage = NarrativeStage | ExploreStage | DecisionStage | AftermathStage | ReviewStage | ReflectionStage;

export interface MeterDef {
  id: MeterId;
  label: string;
  start: number; // 0–10
}

export interface Scenario {
  id: string;
  zone: ZoneId;
  title: string;
  tagline: string;
  setting: string;
  objectives: string[];
  characters: string[];
  principleIds: string[];
  meters: MeterDef[];
  criteria: CriterionId[];
  estimatedMinutes: number;
  stages: Stage[];
}

export interface Character {
  id: string;
  name: string;
  role: string;
  goal: string;
  perspective: string;
  look: { skin: string; hair: string; hairStyle: 'short' | 'long' | 'bun' | 'shaved' | 'curly' | 'fade'; accent: string; outfit: string };
}

// ---- Run state ----

export interface Run {
  scenarioId: string;
  stageId: string;
  inspected: string[];
  /** decision id → option id */
  choices: Record<string, string>;
  /** decision id → number of available hotspots inspected when it was made */
  evidenceAtDecision: Record<string, { inspected: number; available: number }>;
  reflection: { selected: string[]; note: string } | null;
  completed: boolean;
}

export interface CriterionResult {
  id: CriterionId;
  score: number; // 0–1
  detail: string;
}

export interface Result {
  scenarioId: string;
  criteria: CriterionResult[];
  /** Mean of the criteria, 0–100. */
  overall: number;
  xp: number;
  meters: Record<string, number>;
  choices: Record<string, string>;
  flags: string[];
}
