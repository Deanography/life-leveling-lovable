import { describe, expect, it } from "vitest";
import { abandonGate, e1rm, gateRank, gateReward, isPR, volumeKg } from "../gates";
import { makePlayer } from "./fixtures";
import type { Gate } from "../types";

const start = new Date("2026-09-12T10:00:00Z");
const gate = (over: Partial<Gate> = {}): Gate => ({
  id: "g1", type: "focus", red: false, title: "Deep work", plannedMinutes: 50, startedAt: start.toISOString(), ...over,
});
const after = (min: number) => new Date(start.getTime() + min * 60000);

describe("gates", () => {
  it("ranks by minutes", () => {
    expect(gateRank(25)).toBe("E");
    expect(gateRank(50)).toBe("C");
    expect(gateRank(90)).toBe("A");
  });
  it("focus gate: 2 xp per minute, gold 30% of xp", () => {
    const r = gateReward(makePlayer(), gate(), after(50));
    expect(r.xp).toBe(100);
    expect(r.gold).toBe(30);
    expect(r.fatigue).toBe(10);
  });
  it("under 5 minutes gives nothing", () => {
    expect(gateReward(makePlayer(), gate(), after(3)).xp).toBe(0);
  });
  it("elapsed is capped at 2x the plan", () => {
    expect(gateReward(makePlayer(), gate(), after(500)).xp).toBe(200);
  });
  it("red gates pay 1.25x", () => {
    expect(gateReward(makePlayer(), gate({ red: true }), after(50)).xp).toBe(125);
  });
  it("training gate adds volume xp and STR bonus", () => {
    const g = gate({ type: "training", plannedMinutes: 60, exercises: [{ name: "Squat", targetSets: 5, targetReps: 5, restSec: 180, sets: [
      { reps: 5, kg: 100, done: true }, { reps: 5, kg: 100, done: true }, { reps: 5, kg: 100, done: false },
    ] }] });
    expect(volumeKg(g)).toBe(1000);
    const r = gateReward(makePlayer(), g, after(60));
    // 2.5*60 = 150 + 10 volume = 160, * 1.01 STR -> 162
    expect(r.xp).toBe(162);
    expect(r.fatigue).toBe(24);
  });
  it("abandoning a red gate costs HP and fatigue, a normal gate costs nothing", () => {
    const p = makePlayer({ hp: 100, fatigue: 90 });
    const red = abandonGate(p, gate({ red: true }));
    expect(red.hp).toBe(75);
    expect(red.fatigue).toBe(100);
    expect(abandonGate(p, gate()).hp).toBe(100);
  });
  it("e1rm and PR detection", () => {
    expect(e1rm(100, 5)).toBe(116.7);
    expect(isPR(undefined, 100, 5)).toBe(true);
    expect(isPR({ kg: 100, reps: 5, e1rm: 116.7, at: "" }, 100, 5)).toBe(false);
    expect(isPR({ kg: 100, reps: 5, e1rm: 116.7, at: "" }, 102.5, 5)).toBe(true);
    expect(isPR(undefined, 0, 5)).toBe(false);
  });
});
