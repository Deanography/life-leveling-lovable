import { describe, expect, it } from "vitest";
import { questReward } from "../xp";
import { makePlayer, makeQuest } from "./fixtures";

describe("questReward", () => {
  it("base medium quest with no modifiers except STR 10", () => {
    const r = questReward(makePlayer(), makeQuest());
    // STR 10 -> +1%. 25 * 1.01 = 25.25 -> 25
    expect(r.xp).toBe(25);
    expect(r.gold).toBe(5);
    expect(r.fatigue).toBe(5);
  });
  it("streak multiplier caps at 1.5", () => {
    const r = questReward(makePlayer({ streak: 200 }), makeQuest({ stat: "INT" }));
    expect(r.multiplier).toBe(1.5);
    expect(r.xp).toBe(38);
  });
  it("fatigue above 80 halves XP", () => {
    const r = questReward(makePlayer({ fatigue: 85 }), makeQuest({ stat: "INT" }));
    expect(r.xp).toBe(13);
  });
  it("partial completion is proportional", () => {
    const r = questReward(makePlayer(), makeQuest({ stat: "INT" }), 0.5);
    expect(r.xp).toBe(13);
    expect(r.gold).toBe(3);
  });
  it("total multiplier never exceeds 3", () => {
    const r = questReward(makePlayer({ streak: 30, stats: { STR: 200, VIT: 10, AGI: 10, INT: 10, SENSE: 10 } }), makeQuest(), 1, {
      titleXpMult: 2,
      rankUpWeek: true,
    });
    expect(r.multiplier).toBeLessThanOrEqual(3);
  });
});
