import { describe, expect, it } from "vitest";
import { closeDay, dayKey, addDays, tryRepair, revive } from "../day";
import { makePlayer, makeQuest } from "./fixtures";

const q = [makeQuest({ id: "a" }), makeQuest({ id: "b" })];
const all = { a: 1, b: 1 };
const some = { a: 1, b: 0.5 };
const none = {};

describe("dayKey", () => {
  it("uses the grace period", () => {
    expect(dayKey(new Date("2026-09-12T03:30:00"), 4)).toBe("2026-09-11");
    expect(dayKey(new Date("2026-09-12T04:00:00"), 4)).toBe("2026-09-12");
    expect(dayKey(new Date("2026-09-12T23:59:00"), 4)).toBe("2026-09-12");
  });
  it("addDays", () => expect(addDays("2026-09-30", 1)).toBe("2026-10-01"));
});

describe("closeDay ladder", () => {
  it("perfect day: streak +1, gold, misses cleared", () => {
    const { player, log } = closeDay(makePlayer({ consecutiveMisses: 1, streakAtRisk: true }), "2026-09-11", q, all);
    expect(log.perfect).toBe(true);
    expect(player.streak).toBe(1);
    expect(player.gold).toBe(120);
    expect(player.consecutiveMisses).toBe(0);
    expect(player.streakAtRisk).toBe(false);
  });
  it("7th perfect day grants a shield", () => {
    const { player } = closeDay(makePlayer({ streak: 6 }), "2026-09-11", q, all);
    expect(player.shields).toBe(1);
  });
  it("rest day or recovery mode: no penalty, streak held", () => {
    const p = makePlayer({ streak: 5 });
    expect(closeDay(p, "2026-09-11", q, none, { restDay: true }).player.streak).toBe(5);
    expect(closeDay(p, "2026-09-11", q, none, { recoveryMode: true }).log.penaltyApplied).toBe("none");
  });
  it("shield absorbs a miss", () => {
    const { player, log } = closeDay(makePlayer({ shields: 2, streak: 5 }), "2026-09-11", q, some);
    expect(log.penaltyApplied).toBe("shield");
    expect(player.shields).toBe(1);
    expect(player.streak).toBe(5);
    expect(player.hp).toBe(100);
  });
  it("first miss: At Risk, no HP loss, repair window opens", () => {
    const { player, log } = closeDay(makePlayer({ streak: 5 }), "2026-09-11", q, some);
    expect(log.penaltyApplied).toBe("atRisk");
    expect(player.streakAtRisk).toBe(true);
    expect(player.streak).toBe(5);
    expect(player.hp).toBe(100);
    expect(player.repairItems).toEqual(["b"]);
    expect(player.repairUntil).toBeDefined();
  });
  it("second consecutive miss: streak reset, HP -20, penalty zone", () => {
    const first = closeDay(makePlayer({ streak: 5 }), "2026-09-11", q, some).player;
    const { player, log } = closeDay(first, "2026-09-12", q, none);
    expect(log.penaltyApplied).toBe("penaltyZone");
    expect(player.streak).toBe(0);
    expect(player.hp).toBe(80);
    expect(player.penaltyZoneUntil).toBeDefined();
    expect(player.bestStreak).toBe(0);
  });
  it("third miss: recovery protocol", () => {
    const p = makePlayer({ consecutiveMisses: 2, hp: 80 });
    const { player, log } = closeDay(p, "2026-09-13", q, none);
    expect(log.penaltyApplied).toBe("recoveryProtocol");
    expect(player.recoveryProtocol).toBe(true);
    expect(player.hp).toBe(60);
  });
  it("misses never compound: two missed items cost the same as one", () => {
    const a = closeDay(makePlayer({ consecutiveMisses: 1 }), "2026-09-12", q, some).player;
    const b = closeDay(makePlayer({ consecutiveMisses: 1 }), "2026-09-12", q, none).player;
    expect(a.hp).toBe(b.hp);
  });
  it("hunter severity doubles HP loss, gentle never loses HP", () => {
    const hunter = makePlayer({ consecutiveMisses: 1, settings: { ...makePlayer().settings, severity: "hunter" } });
    expect(closeDay(hunter, "2026-09-12", q, none).player.hp).toBe(60);
    const gentle = makePlayer({ consecutiveMisses: 1, settings: { ...makePlayer().settings, severity: "gentle" } });
    const g = closeDay(gentle, "2026-09-12", q, none);
    expect(g.player.hp).toBe(100);
    expect(g.player.penaltyZoneUntil).toBeUndefined();
  });
  it("death at 0 HP: gold halved, streak 0, revive restores half HP", () => {
    const { player, log } = closeDay(makePlayer({ consecutiveMisses: 1, hp: 15, gold: 300 }), "2026-09-12", q, none);
    expect(log.penaltyApplied).toBe("death");
    expect(player.dead).toBe(true);
    expect(player.gold).toBe(150);
    const back = revive(player);
    expect(back.dead).toBe(false);
    expect(back.hp).toBe(53);
  });
  it("VIT reduces HP loss", () => {
    const p = makePlayer({ consecutiveMisses: 1, stats: { STR: 10, VIT: 50, AGI: 10, INT: 10, SENSE: 10 } });
    expect(closeDay(p, "2026-09-12", q, none).player.hp).toBe(82);
  });
});

describe("tryRepair", () => {
  const atRisk = makePlayer({ streak: 9, streakAtRisk: true, consecutiveMisses: 1, repairUntil: "2026-09-13T04:00:00.000Z" });
  it("repair inside the window restores the streak", () => {
    const p = tryRepair(atRisk, true, new Date("2026-09-12T20:00:00.000Z"));
    expect(p.streak).toBe(9);
    expect(p.streakAtRisk).toBe(false);
    expect(p.consecutiveMisses).toBe(0);
  });
  it("finishing without the repair item resets the streak", () => {
    const p = tryRepair(atRisk, false, new Date("2026-09-12T20:00:00.000Z"));
    expect(p.streak).toBe(0);
  });
  it("repair after the window expired resets the streak", () => {
    const p = tryRepair(atRisk, true, new Date("2026-09-14T20:00:00.000Z"));
    expect(p.streak).toBe(0);
  });
});
