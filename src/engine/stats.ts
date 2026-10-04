import { CONFIG } from "./config";
import type { Player, Stat } from "./types";

export function addStatXp(p: Player, stat: Stat, amount: number): Player {
  let xp = p.statXp[stat] + amount;
  let value = p.stats[stat];
  while (xp >= CONFIG.statXpPerPoint) {
    xp -= CONFIG.statXpPerPoint;
    value += 1;
  }
  return { ...p, stats: { ...p.stats, [stat]: value }, statXp: { ...p.statXp, [stat]: xp } };
}

export function allocatePoint(p: Player, stat: Stat): Player {
  if (p.freePoints <= 0) return p;
  return { ...p, freePoints: p.freePoints - 1, stats: { ...p.stats, [stat]: p.stats[stat] + 1 } };
}

export function applyFatigue(p: Player, delta: number): Player {
  const vitBonus = delta < 0 ? 1 + Math.floor(p.stats.VIT / 10) * 0.05 : 1;
  return { ...p, fatigue: Math.max(0, Math.min(100, Math.round(p.fatigue + delta * vitBonus))) };
}

export function logSleep(p: Player, hours: number): Player {
  const recovery = hours >= 7 ? CONFIG.fatigue.sleepRecovery : Math.round((hours / 7) * CONFIG.fatigue.sleepRecovery);
  return applyFatigue(p, -recovery);
}
