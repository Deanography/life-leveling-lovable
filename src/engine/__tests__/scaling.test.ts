import { describe, expect, it } from "vitest";
import { isDeloadWeek, scaledTarget } from "../scaling";
import { makeQuest } from "./fixtures";

describe("scaledTarget", () => {
  const q = makeQuest({ baseTarget: 20, unit: "reps", scaling: "level" });
  it("level 1 is the base", () => expect(scaledTarget(q, { level: 1, deload: false })).toBe(20));
  it("level 10 = 30, level 30 = 50 (table in Game Design)", () => {
    expect(scaledTarget(q, { level: 10, deload: false })).toBe(30);
    expect(scaledTarget(q, { level: 30, deload: false })).toBe(50);
  });
  it("deload week takes 20% off", () => expect(scaledTarget(q, { level: 30, deload: true })).toBe(40));
  it("penalty zone 1.5x and recovery protocol 0.5x", () => {
    expect(scaledTarget(q, { level: 1, deload: false, penaltyZoneFactor: 1.5 })).toBe(30);
    expect(scaledTarget(q, { level: 1, deload: false, recoveryProtocol: true })).toBe(10);
  });
  it("km rounds to 0.1", () => {
    const run = makeQuest({ baseTarget: 1, unit: "km" });
    expect(scaledTarget(run, { level: 10, deload: false })).toBe(1.5);
  });
  it("recovery items never scale down under penalty", () => {
    const sleep = makeQuest({ baseTarget: 7, unit: "h", scaling: "none", isRecovery: true });
    expect(scaledTarget(sleep, { level: 5, deload: true, penaltyZoneFactor: 2, recoveryProtocol: true })).toBe(7);
  });
  it("time-based items scale slowly and cap at 2x", () => {
    const read = makeQuest({ baseTarget: 20, unit: "min", scaling: "time" });
    expect(scaledTarget(read, { level: 1, deload: false })).toBe(20);
    expect(scaledTarget(read, { level: 11, deload: false })).toBe(20); // 1.10 * 20 = 22 -> 20 (round to 5)
    expect(scaledTarget(read, { level: 26, deload: false })).toBe(25);
    expect(scaledTarget(read, { level: 200, deload: false })).toBe(40);
  });
});

describe("isDeloadWeek", () => {
  it("every 4th week", () => {
    expect(isDeloadWeek("2026-09-01", "2026-09-01")).toBe(false);
    expect(isDeloadWeek("2026-09-01", "2026-09-22")).toBe(true); // week index 3
    expect(isDeloadWeek("2026-09-01", "2026-09-29")).toBe(false);
  });
});
