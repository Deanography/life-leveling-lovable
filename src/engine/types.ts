export type Stat = "STR" | "VIT" | "AGI" | "INT" | "SENSE";
export const STATS: Stat[] = ["STR", "VIT", "AGI", "INT", "SENSE"];
export type Difficulty = "trivial" | "easy" | "medium" | "hard" | "brutal" | "boss";
export type Rank = "E" | "D" | "C" | "B" | "A" | "S" | "NATIONAL";
export type Severity = "gentle" | "standard" | "hunter";
export type PathId = "warrior" | "scholar" | "merchant" | "monk" | "keeper" | "custom";
export type Unit = "reps" | "km" | "min" | "h" | "times" | "done";
export type MissCause = "choice" | "illness" | "external";
export type QuestKind = "habit" | "daily" | "todo" | "boss";
export type GateType = "training" | "focus" | "grind";
export type Polarity = "good" | "bad" | "both";

export interface Settings {
  wakeTime: string; // "06:30"
  dayStartHour: number; // grace period: a day ends at this hour next morning
  severity: Severity;
  restDays: number[]; // 0 = Sunday
  sounds: boolean;
  haptics: boolean;
  reducedMotion: boolean;
  theme?: ThemeId;
}

export type FeatureId = "shop" | "gates" | "quests" | "titles" | "bosses" | "shadows" | "keys" | "history";
export type ThemeId = "system" | "ember" | "verdant" | "gold" | "monarch";
export type RewardTier = "small" | "medium" | "large";

export interface Player {
  id: string;
  name: string;
  createdAt: string; // ISO
  level: number;
  xp: number; // within current level
  totalXp: number;
  stats: Record<Stat, number>;
  statXp: Record<Stat, number>;
  freePoints: number;
  hp: number;
  fatigue: number;
  gold: number;
  streak: number;
  bestStreak: number;
  shields: number;
  consecutiveMisses: number;
  streakAtRisk: boolean;
  repairUntil?: string;
  repairItems?: string[];
  penaltyZoneUntil?: string;
  recoveryProtocol: boolean;
  dead: boolean;
  lastActiveDay: string;
  path: { primary: PathId; secondary?: PathId };
  titles: string[];
  equippedTitleId?: string;
  potions: number;
  rank: Rank;
  rankUp?: RankUpAttempt;
  unlocked: FeatureId[];
  tutorial: { step: number | null; done: boolean };
  themes: ThemeId[];
  keys: number;
  keyStat?: Stat;
  keyUntil?: string;
  settings: Settings;
}

export interface RankUpAttempt {
  target: Rank;
  startedDay: string;
  perfectRun: number; // consecutive perfect days since start
}

export interface Quest {
  id: string;
  kind: QuestKind;
  title: string;
  stat: Stat;
  difficulty: Difficulty;
  baseTarget: number;
  unit: Unit;
  scaling: "level" | "time" | "none";
  isMandatory: boolean;
  isRecovery?: boolean; // sleep etc: no penalty-zone scaling
  polarity?: Polarity; // habits
  dueAt?: string; // todos
  doneAt?: string; // todos
  // bosses
  bossHpMax?: number;
  bossHp?: number;
  bossUnit?: string; // "kg", "modules", "days"...
  linkedQuestIds?: string[]; // each completion of a linked quest deals 1 damage
  defeatedAt?: string;
  shadowId?: string;
  createdAt: string;
}

export interface Shadow {
  id: string;
  name: string;
  fromBossId: string;
  fromBossTitle: string;
  stat: Stat;
  passive: Buff;
  active: boolean;
  guardingQuestId?: string;
  guardUsedWeek?: string; // ISO week key when the guard last absorbed a miss
  extractedAt: string;
}

export interface ExerciseSet {
  reps: number;
  kg: number;
  done: boolean;
}

export interface GateExercise {
  name: string;
  targetSets: number;
  targetReps: number;
  restSec: number;
  note?: string;
  sets: ExerciseSet[];
}

export interface Gate {
  id: string;
  type: GateType;
  red: boolean;
  title: string;
  plannedMinutes: number;
  startedAt: string;
  endedAt?: string;
  abandoned?: boolean;
  templateId?: string;
  exercises?: GateExercise[];
  rewards?: Reward;
  prs?: string[]; // exercise names that set a PR in this gate
}

export interface GateTemplate {
  id: string;
  name: string;
  subtitle: string;
  exercises: { name: string; sets: number; reps: number; restSec: number; note?: string }[];
}

export interface PR {
  kg: number;
  reps: number;
  e1rm: number;
  at: string;
}

export interface Buff {
  xpMult?: number;
  goldMult?: number;
  hpLossMult?: number;
  shieldSlots?: number;
  hpMaxBonus?: number;
  fatigueMult?: number;
  keyChanceBonus?: number;
  statXpMult?: Partial<Record<Stat, number>>;
}

export interface TitleDef {
  id: string;
  name: string;
  condition: string;
  buff: Buff;
  hidden?: boolean;
}

export interface RewardItem {
  id: string;
  name: string;
  cost: number;
}

export interface Redemption {
  id: string;
  name: string;
  cost: number;
  at: string;
}

export interface Counters {
  gatesCleared: number;
  redGatesCleared: number;
  prCount: number;
  revives: number;
  earlyDays: number;
  perfectDays: number;
  todosDone: number;
  bossesDefeated: number;
  keysUsed: number;
}

export interface DayLog {
  date: string;
  perfect: boolean;
  closed: boolean;
  missed: string[];
  penaltyApplied?: "atRisk" | "hp" | "penaltyZone" | "recoveryProtocol" | "death" | "shield" | "none";
  missCause?: MissCause;
  sleepHours?: number;
  restDay: boolean;
  recoveryMode: boolean;
}

export interface SystemEvent {
  id: string;
  kind: "levelUp" | "perfectDay" | "penalty" | "atRisk" | "repaired" | "death" | "warning" | "info" | "title" | "gate" | "pr" | "boss" | "arise" | "key" | "rank" | "summary" | "unlock";
  title: string;
  lines: string[];
  at: string;
}

export interface Reward {
  xp: number;
  gold: number;
  fatigue: number;
  multiplier: number;
}
