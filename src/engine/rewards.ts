import { CONFIG } from "./config";
import type { PathId, Player, Rank, RewardTier, ThemeId } from "./types";

const rankIndex = (r: Rank) => CONFIG.ranks.findIndex((b) => b.rank === r);

export interface CatalogReward {
  id: string;
  name: string;
  cost: number;
  tier: RewardTier;
  paths?: PathId[]; // shown only to these primary or secondary paths
}

export const TIER_RULES: Record<RewardTier, { name: string; requirement: string; unlocked: (p: Player) => boolean }> = {
  small: { name: "Small", requirement: "Available now", unlocked: () => true },
  medium: { name: "Medium", requirement: "Reach level 5", unlocked: (p) => p.level >= 5 },
  large: { name: "Large", requirement: "Reach C-Rank", unlocked: (p) => rankIndex(p.rank) >= rankIndex("C") },
};

/** Priced against roughly 60 to 100 Gold on a good day. */
export const CATALOG: CatalogReward[] = [
  { id: "coffee", name: "Coffee out", cost: 120, tier: "small" },
  { id: "episode", name: "An episode of a show, guilt-free", cost: 100, tier: "small" },
  { id: "dessert", name: "Dessert", cost: 150, tier: "small" },
  { id: "gaming-hour", name: "An hour of gaming", cost: 150, tier: "small" },
  { id: "sleep-in", name: "Sleep in", cost: 180, tier: "small" },
  { id: "protein-treat", name: "Protein treat", cost: 140, tier: "small", paths: ["warrior"] },
  { id: "podcast-hour", name: "An hour of podcasts, no working", cost: 120, tier: "small", paths: ["merchant", "scholar"] },

  { id: "takeaway", name: "Takeaway night", cost: 600, tier: "medium" },
  { id: "movie", name: "Movie night", cost: 500, tier: "medium" },
  { id: "book", name: "A new book", cost: 500, tier: "medium" },
  { id: "night-off", name: "A full night off", cost: 700, tier: "medium" },
  { id: "course-tool", name: "Buy a course or tool for the business", cost: 800, tier: "medium", paths: ["merchant"] },
  { id: "sauna", name: "Sauna or massage session", cost: 750, tier: "medium", paths: ["warrior", "monk"] },
  { id: "dinner-out", name: "Nice dinner out", cost: 800, tier: "medium", paths: ["keeper"] },

  { id: "gear", name: "New training gear", cost: 2000, tier: "large", paths: ["warrior", "monk"] },
  { id: "day-trip", name: "A day trip", cost: 2500, tier: "large" },
  { id: "new-game", name: "A new game", cost: 2200, tier: "large" },
  { id: "splurge", name: "One thing you have wanted for a while", cost: 3000, tier: "large" },
  { id: "business-upgrade", name: "A real upgrade for the business", cost: 2800, tier: "large", paths: ["merchant"] },
];

export const catalogFor = (p: Player) =>
  CATALOG.filter((r) => !r.paths || r.paths.includes(p.path.primary) || (p.path.secondary ? r.paths.includes(p.path.secondary) : false));

export const rewardUnlocked = (p: Player, r: CatalogReward) => TIER_RULES[r.tier].unlocked(p);

export interface ThemeDef {
  id: ThemeId;
  name: string;
  requirement: string;
  cost?: number; // purchasable once the requirement is met; undefined = free once earned
  earned: (p: Player) => boolean;
  colors: { border: string; glow: string; panel: string; textDim: string };
}

export const THEMES: ThemeDef[] = [
  { id: "system", name: "System Blue", requirement: "Default", earned: () => true, colors: { border: "#3b82f6", glow: "59, 130, 246", panel: "rgba(24, 64, 150, 0.32)", textDim: "#7fa3e6" } },
  { id: "ember", name: "Ember", requirement: "Reach level 10", cost: 400, earned: (p) => p.level >= 10, colors: { border: "#f97316", glow: "249, 115, 22", panel: "rgba(120, 45, 10, 0.32)", textDim: "#f0a877" } },
  { id: "verdant", name: "Verdant", requirement: "Reach a 30-day streak", cost: 600, earned: (p) => p.bestStreak >= 30, colors: { border: "#22c55e", glow: "34, 197, 94", panel: "rgba(15, 90, 45, 0.32)", textDim: "#86d9a4" } },
  { id: "gold", name: "Gilded", requirement: "Reach B-Rank", earned: (p) => rankIndex(p.rank) >= rankIndex("B"), colors: { border: "#f5c542", glow: "245, 197, 66", panel: "rgba(110, 85, 10, 0.3)", textDim: "#e6cf8a" } },
  { id: "monarch", name: "Monarch", requirement: "Reach S-Rank", earned: (p) => rankIndex(p.rank) >= rankIndex("S"), colors: { border: "#8b5cf6", glow: "139, 92, 246", panel: "rgba(70, 30, 140, 0.32)", textDim: "#b8a3f0" } },
];

export const themeById = (id: ThemeId | undefined) => THEMES.find((t) => t.id === id) ?? THEMES[0];

/** Owned themes can be equipped. Free themes are owned once earned; paid ones need the requirement and the Gold. */
export const themeOwned = (p: Player, t: ThemeDef) => (t.cost ? p.themes.includes(t.id) : t.earned(p));

export function buyTheme(p: Player, id: ThemeId): Player {
  const t = themeById(id);
  if (!t.cost || !t.earned(p) || p.themes.includes(id) || p.gold < t.cost) return p;
  return { ...p, gold: p.gold - t.cost, themes: [...p.themes, id] };
}
