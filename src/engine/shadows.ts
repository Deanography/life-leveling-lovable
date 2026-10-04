import { CONFIG } from "./config";
import { mergeBuffs } from "./buffs";
import type { Buff, Shadow } from "./types";

/** Active shadow slots: one per 10 levels, never fewer than one once you hold a shadow. */
export const shadowSlots = (level: number) => Math.max(1, Math.floor(level / CONFIG.shadows.slotsPerLevels));

export const activeShadows = (shadows: Shadow[]) => shadows.filter((s) => s.active);

export const shadowBuff = (shadows: Shadow[]): Buff => mergeBuffs(...activeShadows(shadows).map((s) => s.passive));

export function setShadowActive(shadows: Shadow[], id: string, active: boolean, level: number): Shadow[] {
  if (active && activeShadows(shadows).filter((s) => s.id !== id).length >= shadowSlots(level)) return shadows;
  return shadows.map((s) => (s.id === id ? { ...s, active } : s));
}

/** ISO-ish week key: Monday-based, YYYY-Www. */
export function weekKey(day: string): string {
  const d = new Date(day + "T12:00:00Z");
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow + 3);
  const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d.getTime() - firstThu.getTime()) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * A shadow guarding a quest absorbs that quest's miss once per week.
 * Returns the ids of missed quests that were absorbed and the updated shadows.
 */
export function applyGuards(shadows: Shadow[], missedIds: string[], day: string): { absorbed: string[]; shadows: Shadow[] } {
  const wk = weekKey(day);
  const absorbed: string[] = [];
  const next = shadows.map((s) => {
    if (!s.active || !s.guardingQuestId || !missedIds.includes(s.guardingQuestId)) return s;
    if (s.guardUsedWeek === wk) return s;
    absorbed.push(s.guardingQuestId);
    return { ...s, guardUsedWeek: wk };
  });
  return { absorbed, shadows: next };
}
