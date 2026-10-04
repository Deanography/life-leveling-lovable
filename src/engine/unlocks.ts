import type { Counters, FeatureId, Player } from "./types";

export interface UnlockState {
  player: Player;
  counters: Counters;
  hasGates: boolean; // any gate ever opened
  hasSideQuests: boolean; // any habit/todo/optional daily created
  hasBosses: boolean;
  shadowCount: number;
}

interface FeatureRule {
  id: FeatureId;
  name: string;
  requirement: string;
  test: (s: UnlockState) => boolean;
}

/**
 * Features appear as they become relevant instead of all at once.
 * Every rule also passes if the player has already used the feature, so nothing
 * they rely on can disappear after an update.
 */
export const FEATURES: FeatureRule[] = [
  { id: "shop", name: "Shop", requirement: "Earn your first Gold", test: (s) => s.player.gold > 0 || s.player.totalXp > 0 },
  { id: "gates", name: "Gates", requirement: "Complete your first Daily Quest", test: (s) => s.counters.perfectDays >= 1 || s.hasGates },
  { id: "quests", name: "Quest Log", requirement: "Reach level 2", test: (s) => s.player.level >= 2 || s.hasSideQuests },
  { id: "titles", name: "Titles", requirement: "Earn your first Title", test: (s) => s.player.titles.length > 0 },
  { id: "bosses", name: "Boss Quests", requirement: "Reach level 3", test: (s) => s.player.level >= 3 || s.hasBosses },
  { id: "shadows", name: "Shadow Army", requirement: "Defeat your first Boss", test: (s) => s.counters.bossesDefeated >= 1 || s.shadowCount > 0 },
  { id: "keys", name: "Instant Dungeon Keys", requirement: "Find a key in a Gate", test: (s) => s.player.keys > 0 || s.counters.keysUsed > 0 },
  { id: "history", name: "History", requirement: "Complete 3 Daily Quests", test: (s) => s.counters.perfectDays >= 3 },
];

export const featureRule = (id: FeatureId) => FEATURES.find((f) => f.id === id)!;

/** Features whose conditions are met but that the player has not been shown yet. */
export function newlyUnlocked(s: UnlockState): FeatureId[] {
  return FEATURES.filter((f) => !s.player.unlocked.includes(f.id) && f.test(s)).map((f) => f.id);
}

export const isUnlocked = (p: Player, id: FeatureId) => p.unlocked.includes(id);
