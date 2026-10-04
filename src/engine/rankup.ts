import { CONFIG } from "./config";
import { levelForRank, nextRank, prevRank } from "./levels";
import { STATS, type Counters, type Player, type Rank, type RankUpAttempt } from "./types";

export interface RankUpProgress {
  target: Rank;
  perfectRun: number;
  perfectNeeded: number;
  bosses: number;
  bossesNeeded: number;
  statsMet: number;
  statsNeeded: number;
  statAtLeast: number;
  met: boolean;
}

export const rankUpEligible = (p: Player): Rank | null => {
  const next = nextRank(p.rank);
  return next && p.level >= levelForRank(next) ? next : null;
};

export function beginRankUp(p: Player, day: string): Player {
  const target = rankUpEligible(p);
  if (!target || p.rankUp?.target === target) return p;
  return { ...p, rankUp: { target, startedDay: day, perfectRun: 0 } };
}

export function rankUpProgress(p: Player, counters: Counters): RankUpProgress | null {
  const a = p.rankUp;
  if (!a) return null;
  const req = CONFIG.rankUp[a.target as keyof typeof CONFIG.rankUp];
  if (!req) return null;
  const statsMet = STATS.filter((s) => p.stats[s] >= req.statAtLeast).length;
  const met = a.perfectRun >= req.perfectStreak && counters.bossesDefeated >= req.bosses && statsMet >= req.statsNeeded;
  return { target: a.target, perfectRun: a.perfectRun, perfectNeeded: req.perfectStreak, bosses: counters.bossesDefeated, bossesNeeded: req.bosses, statsMet, statsNeeded: req.statsNeeded, statAtLeast: req.statAtLeast, met };
}

/** Called once per closed day. Perfect days extend the run; a miss resets it (the attempt stays open). */
export function recordRankUpDay(a: RankUpAttempt | undefined, perfect: boolean): RankUpAttempt | undefined {
  if (!a) return a;
  return { ...a, perfectRun: perfect ? a.perfectRun + 1 : 0 };
}

export function promote(p: Player): Player {
  const prog = p.rankUp;
  if (!prog) return p;
  return { ...p, rank: prog.target, rankUp: undefined };
}

/** Demote one rank after inactivity. Level is untouched. */
export function demote(p: Player): Player {
  const lower = prevRank(p.rank);
  return lower ? { ...p, rank: lower, rankUp: undefined } : p;
}

export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b + "T12:00:00Z").getTime() - new Date(a + "T12:00:00Z").getTime()) / 86400000);
