import { CONFIG } from "./config";
import { goldMultiplier, xpMultiplier, type RewardContext } from "./xp";
import type { Gate, GateType, PR, Player, Rank, Reward, Stat } from "./types";

export function gateRank(minutes: number): Rank {
  if (minutes < 30) return "E";
  if (minutes < 45) return "D";
  if (minutes < 60) return "C";
  if (minutes < 90) return "B";
  return "A";
}

export const elapsedMinutes = (g: Gate, now: Date) =>
  Math.max(0, (now.getTime() - new Date(g.startedAt).getTime()) / 60000);

export const volumeKg = (g: Gate) =>
  (g.exercises ?? []).reduce((s, e) => s + e.sets.filter((x) => x.done).reduce((t, x) => t + x.reps * x.kg, 0), 0);

/** Reward for clearing a gate. Minutes are capped at 2x the plan so a forgotten timer can't farm XP. */
export function gateReward(p: Player, g: Gate, now: Date, ctx: RewardContext = {}): Reward {
  const minutes = Math.min(elapsedMinutes(g, now), g.plannedMinutes * 2);
  if (minutes < CONFIG.gates.minMinutesForReward) return { xp: 0, gold: 0, fatigue: 0, multiplier: 0 };
  let mult = xpMultiplier(p, ctx, g.type === "training" ? "STR" : undefined);
  if (g.red) mult *= CONFIG.gates.redBonus;
  mult = Math.min(mult, CONFIG.multiplierCap);
  let xp = CONFIG.gates.xpPerMin[g.type] * minutes;
  if (g.type === "training") xp += Math.floor(volumeKg(g) / 100) * CONFIG.gates.volumeXpPer100kg;
  xp = Math.round(xp * mult);
  const gold = Math.round(xp * CONFIG.gates.goldPerXp * goldMultiplier(p, ctx));
  const fatigue = Math.round(CONFIG.gates.fatiguePerMin[g.type] * minutes);
  return { xp, gold, fatigue, multiplier: Math.round(mult * 100) / 100 };
}

export function abandonGate(p: Player, g: Gate): Player {
  if (!g.red) return p;
  return {
    ...p,
    hp: Math.max(0, p.hp - CONFIG.gates.abandonHp),
    fatigue: Math.min(100, p.fatigue + CONFIG.gates.abandonFatigue),
  };
}

/** Epley estimated one-rep max. */
export const e1rm = (kg: number, reps: number) => (reps <= 0 || kg <= 0 ? 0 : Math.round(kg * (1 + reps / 30) * 10) / 10);

export function isPR(prev: PR | undefined, kg: number, reps: number): boolean {
  const est = e1rm(kg, reps);
  if (est <= 0) return false;
  return !prev || est > prev.e1rm;
}

export const statForGate = (t: GateType): Stat => (t === "training" ? "STR" : t === "focus" ? "INT" : "AGI");

/** True during the last N minutes of a planned focus/grind gate. */
export const inBossPhase = (g: Gate, now: Date) =>
  g.plannedMinutes - elapsedMinutes(g, now) <= CONFIG.gates.bossMinutes && elapsedMinutes(g, now) < g.plannedMinutes;
