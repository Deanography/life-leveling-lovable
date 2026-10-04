import { CONFIG } from "./config";
import type { Player, Rank } from "./types";

export const xpForLevel = (level: number) =>
  Math.floor(CONFIG.xpCurve.base * Math.pow(level, CONFIG.xpCurve.exponent));

export function addXp(p: Player, amount: number): { player: Player; levelsGained: number } {
  let { level, xp, freePoints } = p;
  let gained = 0;
  xp += amount;
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
    freePoints += CONFIG.pointsPerLevel;
    gained += 1;
  }
  return { player: { ...p, level, xp, freePoints, totalXp: p.totalXp + amount }, levelsGained: gained };
}

export function rankForLevel(level: number): Rank {
  let rank: Rank = "E";
  for (const band of CONFIG.ranks) if (level >= band.min) rank = band.rank;
  return rank;
}

export const hpMax = (p: Pick<Player, "stats">, bonus = 0) =>
  Math.round(CONFIG.hpBase + p.stats.VIT * CONFIG.hpPerVit + bonus);

export const nextRank = (r: Rank): Rank | null => {
  const i = CONFIG.ranks.findIndex((b) => b.rank === r);
  return i >= 0 && i + 1 < CONFIG.ranks.length ? CONFIG.ranks[i + 1].rank : null;
};
export const prevRank = (r: Rank): Rank | null => {
  const i = CONFIG.ranks.findIndex((b) => b.rank === r);
  return i > 0 ? CONFIG.ranks[i - 1].rank : null;
};
export const levelForRank = (r: Rank) => CONFIG.ranks.find((b) => b.rank === r)?.min ?? 1;
