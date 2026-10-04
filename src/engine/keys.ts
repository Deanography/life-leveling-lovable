import { CONFIG } from "./config";
import type { Player, Stat } from "./types";

export function keyDropChance(p: Player, bonus = 0): number {
  const sense = Math.max(0, p.stats.SENSE - CONFIG.statStart) * CONFIG.keys.perSensePoint;
  return Math.min(CONFIG.keys.maxChance, CONFIG.keys.baseDropChance + sense + bonus);
}

/** Deterministic given a roll in [0,1). The store supplies Math.random(). */
export const keyDropped = (p: Player, roll: number, bonus = 0) => roll < keyDropChance(p, bonus);

export function spendKey(p: Player, stat: Stat, now = new Date()): Player {
  if (p.keys <= 0) return p;
  return { ...p, keys: p.keys - 1, keyStat: stat, keyUntil: new Date(now.getTime() + CONFIG.keys.hours * 3600000).toISOString() };
}

export const activeKeyStat = (p: Player, now = new Date()): Stat | undefined =>
  p.keyUntil && now.getTime() < new Date(p.keyUntil).getTime() ? p.keyStat : undefined;
