import type { PathId, Quest, Stat } from "@/engine/types";

export type QuestTemplate = Omit<Quest, "id" | "createdAt" | "kind" | "isMandatory">;

export interface AwakeningPath {
  id: PathId;
  name: string;
  tagline: string;
  stats: Stat[];
  starterBoss: string;
  quests: QuestTemplate[]; // first 3 are used as primary, first 2 as secondary
}

const sleep: QuestTemplate = { title: "Sleep", stat: "VIT", difficulty: "easy", baseTarget: 7, unit: "h", scaling: "none", isRecovery: true };

export const PATHS: AwakeningPath[] = [
  {
    id: "warrior",
    name: "Warrior",
    tagline: "Body. Strength, sport, the gym.",
    stats: ["STR", "VIT", "AGI"],
    starterBoss: "Bench your bodyweight",
    quests: [
      { title: "Push-ups", stat: "STR", difficulty: "medium", baseTarget: 20, unit: "reps", scaling: "level" },
      { title: "Squats", stat: "STR", difficulty: "medium", baseTarget: 20, unit: "reps", scaling: "level" },
      { title: "Sit-ups", stat: "STR", difficulty: "easy", baseTarget: 20, unit: "reps", scaling: "level" },
      { title: "Walk or run", stat: "AGI", difficulty: "medium", baseTarget: 1, unit: "km", scaling: "level" },
      sleep,
    ],
  },
  {
    id: "scholar",
    name: "Scholar",
    tagline: "Mind. Study, courses, reading, code.",
    stats: ["INT", "SENSE"],
    starterBoss: "Finish one course",
    quests: [
      { title: "Read", stat: "INT", difficulty: "easy", baseTarget: 20, unit: "min", scaling: "time" },
      { title: "Course or practice", stat: "INT", difficulty: "medium", baseTarget: 25, unit: "min", scaling: "time" },
      { title: "Review notes", stat: "SENSE", difficulty: "easy", baseTarget: 10, unit: "min", scaling: "none" },
      sleep,
    ],
  },
  {
    id: "merchant",
    name: "Merchant",
    tagline: "Business and money. Side business, freelancing, sales.",
    stats: ["INT", "AGI", "SENSE"],
    starterBoss: "First $1,000 month",
    quests: [
      { title: "Outreach or quote sent", stat: "AGI", difficulty: "hard", baseTarget: 1, unit: "times", scaling: "none" },
      { title: "Focus Gate on the business", stat: "INT", difficulty: "hard", baseTarget: 50, unit: "min", scaling: "time" },
      { title: "Ledger check", stat: "SENSE", difficulty: "easy", baseTarget: 1, unit: "done", scaling: "none" },
      { title: "Plan tomorrow's top task", stat: "SENSE", difficulty: "trivial", baseTarget: 1, unit: "done", scaling: "none" },
      sleep,
    ],
  },
  {
    id: "monk",
    name: "Monk",
    tagline: "Discipline and mental health. Routine, calm, control.",
    stats: ["SENSE", "VIT"],
    starterBoss: "30 days clean",
    quests: [
      { title: "Meditate", stat: "SENSE", difficulty: "medium", baseTarget: 10, unit: "min", scaling: "time" },
      { title: "Journal", stat: "SENSE", difficulty: "easy", baseTarget: 5, unit: "min", scaling: "none" },
      { title: "No phone for the first 30 min", stat: "VIT", difficulty: "medium", baseTarget: 1, unit: "done", scaling: "none" },
      { title: "In bed by set time", stat: "VIT", difficulty: "medium", baseTarget: 1, unit: "done", scaling: "none", isRecovery: true },
      sleep,
    ],
  },
  {
    id: "keeper",
    name: "Keeper",
    tagline: "Home and life admin. Chores, cooking, budget, people.",
    stats: ["AGI", "SENSE", "VIT"],
    starterBoss: "Inbox and paperwork zero",
    quests: [
      { title: "Tidy", stat: "AGI", difficulty: "easy", baseTarget: 15, unit: "min", scaling: "none" },
      { title: "Cook one meal", stat: "VIT", difficulty: "medium", baseTarget: 1, unit: "done", scaling: "none" },
      { title: "Budget check", stat: "SENSE", difficulty: "easy", baseTarget: 1, unit: "done", scaling: "none" },
      { title: "One overdue admin task", stat: "AGI", difficulty: "hard", baseTarget: 1, unit: "done", scaling: "none" },
      sleep,
    ],
  },
  {
    id: "custom",
    name: "Custom",
    tagline: "You know what you want. Start empty.",
    stats: ["STR", "VIT", "AGI", "INT", "SENSE"],
    starterBoss: "",
    quests: [sleep],
  },
];

export const pathById = (id: PathId) => PATHS.find((p) => p.id === id)!;

/** Primary supplies 3 items, secondary 2, plus one recovery item. Cap 5. */
export function buildDailyQuest(primary: PathId, secondary?: PathId): QuestTemplate[] {
  const p = pathById(primary).quests.filter((q) => !q.isRecovery);
  const s = secondary ? pathById(secondary).quests.filter((q) => !q.isRecovery) : [];
  const items = [...p.slice(0, secondary ? 3 : 4), ...s.slice(0, 2)];
  const out = items.slice(0, 4);
  out.push(sleep);
  return out;
}
