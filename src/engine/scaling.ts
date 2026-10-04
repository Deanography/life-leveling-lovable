import { CONFIG } from "./config";
import type { Quest } from "./types";

export const weeksBetween = (fromISO: string, toDay: string) => {
  const a = new Date(fromISO.slice(0, 10) + "T00:00:00Z").getTime();
  const b = new Date(toDay + "T00:00:00Z").getTime();
  return Math.max(0, Math.floor((b - a) / (7 * 86400000)));
};

export const isDeloadWeek = (createdAtISO: string, day: string) =>
  weeksBetween(createdAtISO, day) % CONFIG.scaling.deloadEveryWeeks === CONFIG.scaling.deloadEveryWeeks - 1;

export interface ScaleContext {
  level: number;
  deload: boolean;
  penaltyZoneFactor?: number; // 1.5 etc
  recoveryProtocol?: boolean;
  highFatigue?: boolean;
}

/** Today's target for a quest given the player's situation. */
export function scaledTarget(q: Quest, ctx: ScaleContext): number {
  let t = q.baseTarget;
  if (q.scaling === "level") t *= 1 + CONFIG.scaling.perLevel * (ctx.level - 1);
  if (q.scaling === "time")
    t *= Math.min(CONFIG.scaling.timeCap, 1 + CONFIG.scaling.timePerFiveLevels * Math.floor((ctx.level - 1) / 5));
  if (!q.isRecovery) {
    if (ctx.deload) t *= CONFIG.scaling.deloadFactor;
    if (ctx.penaltyZoneFactor) t *= ctx.penaltyZoneFactor;
    if (ctx.recoveryProtocol || ctx.highFatigue) t *= CONFIG.penalties.recoveryProtocolReps;
  }
  return roundForUnit(t, q.unit);
}

export function roundForUnit(t: number, unit: Quest["unit"]): number {
  switch (unit) {
    case "reps":
      return Math.max(5, Math.round(t / 5) * 5);
    case "min":
      return Math.max(5, Math.round(t / 5) * 5);
    case "km":
      return Math.max(0.5, Math.round(t * 10) / 10);
    case "h":
      return Math.round(t * 2) / 2;
    default:
      return Math.max(1, Math.round(t));
  }
}
