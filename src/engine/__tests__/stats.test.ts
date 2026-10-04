import { describe, expect, it } from "vitest";
import { addStatXp, allocatePoint, applyFatigue, logSleep } from "../stats";
import { makePlayer } from "./fixtures";

describe("stats", () => {
  it("100 stat XP = +1", () => {
    const p = addStatXp(makePlayer(), "STR", 250);
    expect(p.stats.STR).toBe(12);
    expect(p.statXp.STR).toBe(50);
  });
  it("allocatePoint spends free points", () => {
    const p = allocatePoint(makePlayer({ freePoints: 1 }), "INT");
    expect(p.stats.INT).toBe(11);
    expect(p.freePoints).toBe(0);
    expect(allocatePoint(p, "INT").stats.INT).toBe(11);
  });
  it("fatigue clamps 0..100 and sleep recovers 30", () => {
    expect(applyFatigue(makePlayer({ fatigue: 95 }), 20).fatigue).toBe(100);
    expect(logSleep(makePlayer({ fatigue: 50 }), 8).fatigue).toBe(19); // VIT 10 -> 5% bonus
    expect(logSleep(makePlayer({ fatigue: 50 }), 3.5).fatigue).toBe(34);
  });
});
