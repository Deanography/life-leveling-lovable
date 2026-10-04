import { describe, expect, it } from "vitest";
import { bossReward, damageBoss, extractShadow, shadowPassiveFor } from "../bosses";
import { applyGuards, setShadowActive, shadowBuff, shadowSlots, weekKey } from "../shadows";
import { activeKeyStat, keyDropChance, keyDropped, spendKey } from "../keys";
import { beginRankUp, demote, promote, rankUpEligible, rankUpProgress, recordRankUpDay } from "../rankup";
import { mergeBuffs } from "../buffs";
import { xpMultiplier } from "../xp";
import { makePlayer, makeQuest } from "./fixtures";
import type { Shadow } from "../types";

const boss = makeQuest({ id: "b1", kind: "boss", title: "Bench 100", stat: "STR", difficulty: "boss", bossHpMax: 100, bossHp: 100, bossUnit: "kg" });
const counters = { gatesCleared: 0, redGatesCleared: 0, prCount: 0, revives: 0, earlyDays: 0, perfectDays: 0, todosDone: 0, bossesDefeated: 0, keysUsed: 0 };

describe("bosses", () => {
  it("takes damage and is defeated at 0", () => {
    const a = damageBoss(boss, 40);
    expect(a.boss.bossHp).toBe(60);
    expect(a.defeated).toBe(false);
    const b = damageBoss(a.boss, 100);
    expect(b.boss.bossHp).toBe(0);
    expect(b.defeated).toBe(true);
    expect(b.boss.defeatedAt).toBeDefined();
    expect(damageBoss(b.boss, 10).defeated).toBe(false);
  });
  it("reward scales with size but never below the minimum", () => {
    expect(bossReward(boss)).toMatchObject({ xp: 250, gold: 100 });
    expect(bossReward({ ...boss, bossHpMax: 500 })).toMatchObject({ xp: 1000, gold: 500 });
  });
  it("extracts a named shadow with a stat-based passive", () => {
    const s = extractShadow(boss, [], "s1");
    expect(s.name).toBe("Igris");
    expect(s.passive).toEqual(shadowPassiveFor("STR"));
    expect(extractShadow(boss, [s], "s2").name).toBe("Iron");
  });
});

describe("shadows", () => {
  const mk = (id: string, over: Partial<Shadow> = {}): Shadow => ({ id, name: id, fromBossId: "b", fromBossTitle: "b", stat: "STR", passive: { xpMult: 1.02 }, active: false, extractedAt: "", ...over });
  it("slots: one per 10 levels, minimum one", () => {
    expect(shadowSlots(1)).toBe(1);
    expect(shadowSlots(10)).toBe(1);
    expect(shadowSlots(25)).toBe(2);
  });
  it("cannot activate beyond the slot cap", () => {
    let arr = [mk("a"), mk("b")];
    arr = setShadowActive(arr, "a", true, 5);
    expect(arr[0].active).toBe(true);
    arr = setShadowActive(arr, "b", true, 5);
    expect(arr[1].active).toBe(false);
    arr = setShadowActive(arr, "b", true, 20);
    expect(arr[1].active).toBe(true);
  });
  it("active passives merge", () => {
    const b = shadowBuff([mk("a", { active: true }), mk("b", { active: true, passive: { xpMult: 1.03, hpMaxBonus: 10 } })]);
    expect(b.xpMult).toBeCloseTo(1.0506);
    expect(b.hpMaxBonus).toBe(10);
  });
  it("a guard absorbs one miss per week", () => {
    const arr = [mk("g", { active: true, guardingQuestId: "q1" })];
    const first = applyGuards(arr, ["q1", "q2"], "2026-09-14");
    expect(first.absorbed).toEqual(["q1"]);
    const second = applyGuards(first.shadows, ["q1"], "2026-09-16");
    expect(second.absorbed).toEqual([]);
    const nextWeek = applyGuards(first.shadows, ["q1"], "2026-09-21");
    expect(nextWeek.absorbed).toEqual(["q1"]);
  });
  it("weekKey is Monday-based", () => {
    expect(weekKey("2026-09-14")).toBe(weekKey("2026-09-20"));
    expect(weekKey("2026-09-20")).not.toBe(weekKey("2026-09-21"));
  });
});

describe("keys", () => {
  it("drop chance grows with SENSE and caps", () => {
    expect(keyDropChance(makePlayer())).toBeCloseTo(0.1);
    expect(keyDropChance(makePlayer({ stats: { STR: 10, VIT: 10, AGI: 10, INT: 10, SENSE: 30 } }))).toBeCloseTo(0.2);
    expect(keyDropChance(makePlayer(), 5)).toBe(0.4);
    expect(keyDropped(makePlayer(), 0.05)).toBe(true);
    expect(keyDropped(makePlayer(), 0.5)).toBe(false);
  });
  it("using a key doubles XP on that stat for 24h", () => {
    const now = new Date("2026-09-12T10:00:00Z");
    const p = spendKey(makePlayer({ keys: 1 }), "INT", now);
    expect(p.keys).toBe(0);
    expect(activeKeyStat(p, now)).toBe("INT");
    expect(activeKeyStat(p, new Date("2026-09-13T11:00:00Z"))).toBeUndefined();
    expect(xpMultiplier(p, { keyStat: "INT" }, "INT")).toBe(2);
    expect(xpMultiplier(p, { keyStat: "INT" }, "STR")).toBeCloseTo(1.01);
  });
});

describe("rank-up", () => {
  it("eligible when the level band is reached", () => {
    expect(rankUpEligible(makePlayer({ level: 9 }))).toBeNull();
    expect(rankUpEligible(makePlayer({ level: 10 }))).toBe("D");
  });
  it("tracks the perfect run and promotes when met", () => {
    let p = beginRankUp(makePlayer({ level: 10 }), "2026-09-12");
    expect(p.rankUp?.target).toBe("D");
    for (let i = 0; i < 6; i++) p = { ...p, rankUp: recordRankUpDay(p.rankUp, true) };
    expect(rankUpProgress(p, counters)?.met).toBe(false);
    p = { ...p, rankUp: recordRankUpDay(p.rankUp, false) };
    expect(p.rankUp?.perfectRun).toBe(0);
    for (let i = 0; i < 7; i++) p = { ...p, rankUp: recordRankUpDay(p.rankUp, true) };
    expect(rankUpProgress(p, counters)?.met).toBe(true);
    p = promote(p);
    expect(p.rank).toBe("D");
    expect(p.rankUp).toBeUndefined();
  });
  it("C needs a boss; demotion drops one rank and keeps level", () => {
    let p = beginRankUp(makePlayer({ level: 20, rank: "D" }), "2026-09-12");
    for (let i = 0; i < 7; i++) p = { ...p, rankUp: recordRankUpDay(p.rankUp, true) };
    expect(rankUpProgress(p, counters)?.met).toBe(false);
    expect(rankUpProgress(p, { ...counters, bossesDefeated: 1 })?.met).toBe(true);
    const d = demote(p);
    expect(d.rank).toBe("E");
    expect(d.level).toBe(20);
    expect(demote(d).rank).toBe("E");
  });
});

describe("mergeBuffs", () => {
  it("multiplies multipliers and adds bonuses", () => {
    const b = mergeBuffs({ xpMult: 1.1, shieldSlots: 1 }, { xpMult: 1.1, shieldSlots: 1, statXpMult: { STR: 1.1 } }, undefined, { statXpMult: { STR: 1.1 } });
    expect(b.xpMult).toBeCloseTo(1.21);
    expect(b.shieldSlots).toBe(2);
    expect(b.statXpMult?.STR).toBeCloseTo(1.21);
  });
});
