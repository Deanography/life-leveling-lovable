import { CONFIG } from "./config";
import { hpMax } from "./levels";
import type { DayLog, Player, Quest } from "./types";

/** The player's "day" key (YYYY-MM-DD) for a timestamp, honouring the grace period. */
export function dayKey(date: Date, dayStartHour: number): string {
  const d = new Date(date.getTime());
  if (d.getHours() < dayStartHour) d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export const addDays = (day: string, n: number) => {
  const d = new Date(day + "T12:00:00");
  d.setDate(d.getDate() + n);
  return dayKey(d, 0);
};

/** Midnight (plus grace) that ends the given day key. */
export function dayEnd(day: string, dayStartHour: number): Date {
  const d = new Date(day + "T00:00:00");
  d.setDate(d.getDate() + 1);
  d.setHours(dayStartHour, 0, 0, 0);
  return d;
}

export const weekdayOf = (day: string) => new Date(day + "T12:00:00").getDay();

export interface CloseResult {
  player: Player;
  log: DayLog;
}

/**
 * Close a day. Ladder from Game Design §5:
 * miss 1 = At Risk + repair window, miss 2 = reset + HP + Penalty Zone,
 * miss 3+ = HP + Recovery Protocol. Never punish the first miss, never compound.
 */
export function closeDay(
  p: Player,
  day: string,
  mandatory: Quest[],
  fractions: Record<string, number>,
  partial: Partial<DayLog> = {},
  hpLossMult = 1,
): CloseResult {
  const missed = mandatory.filter((q) => (fractions[q.id] ?? 0) < 1).map((q) => q.id);
  const base: DayLog = {
    date: day,
    perfect: false,
    closed: true,
    missed,
    restDay: partial.restDay ?? false,
    recoveryMode: partial.recoveryMode ?? false,
    sleepHours: partial.sleepHours,
    missCause: partial.missCause,
  };
  const sev = p.settings.severity;
  const nextDayEnd = dayEnd(addDays(day, 1), p.settings.dayStartHour).toISOString();

  if (missed.length === 0) {
    return { player: perfectDay(p), log: { ...base, perfect: true, penaltyApplied: "none" } };
  }
  if (base.restDay || base.recoveryMode) {
    return { player: p, log: { ...base, penaltyApplied: "none" } };
  }
  if (p.shields > 0) {
    return { player: { ...p, shields: p.shields - 1 }, log: { ...base, penaltyApplied: "shield" } };
  }
  const run = p.consecutiveMisses + 1;
  if (run === 1 && !p.streakAtRisk) {
    return {
      player: { ...p, consecutiveMisses: 1, streakAtRisk: true, repairUntil: nextDayEnd, repairItems: missed },
      log: { ...base, penaltyApplied: "atRisk" },
    };
  }
  let next: Player = { ...p, consecutiveMisses: run, streakAtRisk: false, repairUntil: undefined, repairItems: undefined };
  const vitFactor = Math.max(0.5, 1 - Math.floor(Math.max(0, p.stats.VIT - CONFIG.statStart) / 10) * 0.02);
  const hpLoss = Math.round(CONFIG.penalties.hpOnSecondMiss[sev] * vitFactor * hpLossMult);
  next.hp = Math.max(0, next.hp - hpLoss);
  let applied: DayLog["penaltyApplied"] = "hp";
  if (run === 2) {
    next.streak = 0;
    if (sev !== "gentle") {
      next.penaltyZoneUntil = nextDayEnd;
      applied = "penaltyZone";
    }
  }
  if (run >= 3) {
    next.streak = 0;
    next.recoveryProtocol = true;
    applied = "recoveryProtocol";
  }
  if (next.hp <= 0 && sev !== "gentle") {
    next = death(next);
    applied = "death";
  }
  return { player: next, log: { ...base, penaltyApplied: applied } };
}

export function perfectDay(p: Player): Player {
  const streak = p.streak + 1;
  const shields =
    streak % CONFIG.shields.perStreakDays === 0
      ? Math.min(CONFIG.shields.max[p.settings.severity], p.shields + 1)
      : p.shields;
  return {
    ...p,
    streak,
    bestStreak: Math.max(p.bestStreak, streak),
    shields,
    consecutiveMisses: 0,
    streakAtRisk: false,
    repairUntil: undefined,
    repairItems: undefined,
    recoveryProtocol: false,
    gold: p.gold + CONFIG.perfectDayGold,
  };
}

export function death(p: Player): Player {
  return {
    ...p,
    hp: 0,
    dead: true,
    gold: Math.floor(p.gold * CONFIG.penalties.deathGoldFactor),
    streak: 0,
    penaltyZoneUntil: undefined,
  };
}

export function revive(p: Player): Player {
  return { ...p, dead: false, hp: Math.round(hpMax(p) * 0.5), consecutiveMisses: 0, recoveryProtocol: false };
}

/** Called when today's Daily Quest is completed while the streak is At Risk. */
export function tryRepair(p: Player, repairDone: boolean, now: Date): Player {
  if (!p.streakAtRisk) return p;
  const inWindow = !!p.repairUntil && now.getTime() < new Date(p.repairUntil).getTime();
  if (repairDone && inWindow) {
    return { ...p, streakAtRisk: false, consecutiveMisses: 0, repairUntil: undefined, repairItems: undefined };
  }
  return { ...p, streakAtRisk: false, streak: 0, consecutiveMisses: 0, repairUntil: undefined, repairItems: undefined };
}

export function isPenaltyZone(p: Player, now: Date) {
  return !!p.penaltyZoneUntil && now.getTime() < new Date(p.penaltyZoneUntil).getTime();
}
