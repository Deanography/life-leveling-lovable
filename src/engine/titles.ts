import type { Buff, Counters, PR, Player, TitleDef } from "./types";

export interface TitleContext {
  player: Player;
  counters: Counters;
  prs: Record<string, PR>;
}

type Condition = (c: TitleContext) => boolean;

const defs: (TitleDef & { test: Condition })[] = [
  { id: "awakened", name: "Awakened", condition: "Reach a 7-day streak", buff: { xpMult: 1.03 }, test: (c) => c.player.bestStreak >= 7 },
  { id: "wolf-slayer", name: "Wolf Slayer", condition: "Clear your first Gate", buff: { goldMult: 1.05 }, test: (c) => c.counters.gatesCleared >= 1 },
  { id: "iron-will", name: "Iron Will", condition: "Reach a 30-day streak", buff: { shieldSlots: 1, xpMult: 1.05 }, test: (c) => c.player.bestStreak >= 30 },
  { id: "gate-breaker", name: "Gate Breaker", condition: "Clear 25 Gates", buff: { xpMult: 1.08 }, test: (c) => c.counters.gatesCleared >= 25 },
  { id: "red-walker", name: "Red Gate Walker", condition: "Clear 5 Red Gates", buff: { xpMult: 1.1 }, test: (c) => c.counters.redGatesCleared >= 5 },
  { id: "survivor", name: "Survivor", condition: "Come back from 0 HP", buff: { hpLossMult: 0.75 }, test: (c) => c.counters.revives >= 1 },
  { id: "record-holder", name: "Record Holder", condition: "Set 5 personal records", buff: { xpMult: 1.05, statXpMult: { STR: 1.1 } }, test: (c) => c.counters.prCount >= 5 },
  { id: "scholar", name: "Scholar", condition: "INT 25", buff: { statXpMult: { INT: 1.15 } }, test: (c) => c.player.stats.INT >= 25 },
  { id: "berserker", name: "Berserker", condition: "STR 25", buff: { statXpMult: { STR: 1.15 } }, test: (c) => c.player.stats.STR >= 25 },
  { id: "early-riser", name: "Early Riser", condition: "Finish the Daily Quest before 08:00 on 7 days", buff: { xpMult: 1.05, goldMult: 1.05 }, test: (c) => c.counters.earlyDays >= 7 },
];

const toDef = (d: (typeof defs)[number]): TitleDef => ({ id: d.id, name: d.name, condition: d.condition, buff: d.buff, hidden: d.hidden });

export const TITLES: TitleDef[] = defs.map(toDef);

export const titleById = (id: string) => TITLES.find((t) => t.id === id);

/** Titles unlocked by the current state that the player does not yet hold. */
export function newlyUnlockedTitles(c: TitleContext): TitleDef[] {
  return defs.filter((d) => !c.player.titles.includes(d.id) && d.test(c)).map(toDef);
}

export const equippedBuff = (p: Player): Buff => titleById(p.equippedTitleId ?? "")?.buff ?? {};
