import { CONFIG } from "./config";
import type { Player, Quest, Reward } from "./types";

export interface RewardContext {
  titleXpMult?: number;
  titleGoldMult?: number;
  rankUpWeek?: boolean;
  keyStat?: Quest["stat"];
}

/** Shared XP multiplier: streak, fatigue, title, rank-up week. Capped. */
export function xpMultiplier(p: Player, ctx: RewardContext = {}, stat?: Quest["stat"]): number {
  let mult = 1;
  mult *= 1 + Math.min(p.streak, CONFIG.streak.capDays) * CONFIG.streak.perDay;
  mult = Math.min(mult, CONFIG.streak.cap);
  if (p.fatigue > CONFIG.fatigue.halveXp) mult *= 0.5;
  if (ctx.titleXpMult) mult *= ctx.titleXpMult;
  if (ctx.rankUpWeek) mult *= 1.25;
  if (ctx.keyStat && stat === ctx.keyStat) mult *= CONFIG.keys.xpMult;
  if (stat === "STR") mult *= 1 + Math.floor(p.stats.STR / 10) * 0.01;
  return Math.min(mult, CONFIG.multiplierCap);
}

export const goldMultiplier = (p: Player, ctx: RewardContext = {}) =>
  (1 + Math.floor(p.stats.INT / 10) * 0.01) * (ctx.titleGoldMult ?? 1);

/** Reward for completing `fraction` (0..1) of a quest. Pure. */
export function questReward(p: Player, q: Quest, fraction = 1, ctx: RewardContext = {}): Reward {
  const base = CONFIG.base[q.difficulty];
  const mult = xpMultiplier(p, ctx, q.stat);
  const f = Math.max(0, Math.min(1, fraction));
  const goldMult = goldMultiplier(p, ctx);
  return {
    xp: Math.round(base.xp * f * mult),
    gold: Math.round(base.gold * f * goldMult),
    fatigue: Math.round(base.fatigue * f * 10) / 10,
    multiplier: Math.round(mult * 100) / 100,
  };
}
