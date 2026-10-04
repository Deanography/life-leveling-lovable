import type { Buff, Stat } from "./types";

/** Combine buffs: multipliers multiply, bonuses add. */
export function mergeBuffs(...buffs: (Buff | undefined)[]): Buff {
  const out: Buff = {};
  for (const b of buffs) {
    if (!b) continue;
    if (b.xpMult) out.xpMult = (out.xpMult ?? 1) * b.xpMult;
    if (b.goldMult) out.goldMult = (out.goldMult ?? 1) * b.goldMult;
    if (b.hpLossMult) out.hpLossMult = (out.hpLossMult ?? 1) * b.hpLossMult;
    if (b.fatigueMult) out.fatigueMult = (out.fatigueMult ?? 1) * b.fatigueMult;
    if (b.shieldSlots) out.shieldSlots = (out.shieldSlots ?? 0) + b.shieldSlots;
    if (b.hpMaxBonus) out.hpMaxBonus = (out.hpMaxBonus ?? 0) + b.hpMaxBonus;
    if (b.keyChanceBonus) out.keyChanceBonus = (out.keyChanceBonus ?? 0) + b.keyChanceBonus;
    if (b.statXpMult) {
      out.statXpMult = { ...(out.statXpMult ?? {}) };
      for (const [k, v] of Object.entries(b.statXpMult) as [Stat, number][]) out.statXpMult[k] = (out.statXpMult[k] ?? 1) * v;
    }
  }
  return out;
}
