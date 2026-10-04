import { CONFIG } from "./config";
import type { Buff, Quest, Reward, Shadow, Stat } from "./types";

export const isBoss = (q: Quest) => q.kind === "boss";
export const bossAlive = (q: Quest) => isBoss(q) && !q.defeatedAt && (q.bossHp ?? 0) > 0;

/** Deal damage. Returns the updated boss and whether this blow defeated it. */
export function damageBoss(q: Quest, amount: number, at = new Date()): { boss: Quest; defeated: boolean } {
  if (!isBoss(q) || q.defeatedAt) return { boss: q, defeated: false };
  const hp = Math.max(0, (q.bossHp ?? 0) - Math.max(0, amount));
  const defeated = hp === 0 && (q.bossHp ?? 0) > 0;
  return { boss: { ...q, bossHp: hp, defeatedAt: defeated ? at.toISOString() : q.defeatedAt }, defeated };
}

/** Reward scales with the boss's size. Small bosses still pay the boss minimum. */
export function bossReward(q: Quest): Reward {
  const hp = q.bossHpMax ?? 0;
  return {
    xp: Math.max(CONFIG.bosses.minXp, Math.round(hp * CONFIG.bosses.xpPerHp)),
    gold: Math.max(CONFIG.bosses.minGold, Math.round(hp * CONFIG.bosses.goldPerHp)),
    fatigue: 0,
    multiplier: 1,
  };
}

const SHADOW_NAMES = ["Igris", "Iron", "Tank", "Tusk", "Beru", "Greed", "Jima", "Kaisel", "Fang", "Bellion"];

/** The passive a shadow grants depends on the stat the boss was tagged with. */
export function shadowPassiveFor(stat: Stat): Buff {
  switch (stat) {
    case "STR":
      return { statXpMult: { STR: 1.1 }, xpMult: 1.02 };
    case "VIT":
      return { hpMaxBonus: 10, fatigueMult: 0.9 };
    case "AGI":
      return { shieldSlots: 1, xpMult: 1.02 };
    case "INT":
      return { goldMult: 1.1, statXpMult: { INT: 1.1 } };
    case "SENSE":
      return { keyChanceBonus: 0.05, xpMult: 1.03 };
  }
}

export function extractShadow(boss: Quest, existing: Shadow[], id: string, at = new Date()): Shadow {
  const name = SHADOW_NAMES[existing.length % SHADOW_NAMES.length] + (existing.length >= SHADOW_NAMES.length ? ` ${Math.floor(existing.length / SHADOW_NAMES.length) + 1}` : "");
  return {
    id,
    name,
    fromBossId: boss.id,
    fromBossTitle: boss.title,
    stat: boss.stat,
    passive: shadowPassiveFor(boss.stat),
    active: false,
    extractedAt: at.toISOString(),
  };
}
