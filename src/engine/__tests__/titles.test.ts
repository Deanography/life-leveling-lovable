import { describe, expect, it } from "vitest";
import { equippedBuff, newlyUnlockedTitles, TITLES } from "../titles";
import { makePlayer } from "./fixtures";

const counters = { gatesCleared: 0, redGatesCleared: 0, prCount: 0, revives: 0, earlyDays: 0, perfectDays: 0, todosDone: 0, bossesDefeated: 0, keysUsed: 0 };

describe("titles", () => {
  it("ships ten titles", () => expect(TITLES).toHaveLength(10));
  it("unlocks by condition and skips ones already held", () => {
    const a = newlyUnlockedTitles({ player: makePlayer({ bestStreak: 7 }), counters, prs: {} }).map((t) => t.id);
    expect(a).toEqual(["awakened"]);
    const b = newlyUnlockedTitles({ player: makePlayer({ bestStreak: 7, titles: ["awakened"] }), counters: { ...counters, gatesCleared: 1 }, prs: {} }).map((t) => t.id);
    expect(b).toEqual(["wolf-slayer"]);
  });
  it("equipped buff comes from the equipped title only", () => {
    expect(equippedBuff(makePlayer())).toEqual({});
    expect(equippedBuff(makePlayer({ equippedTitleId: "survivor" })).hpLossMult).toBe(0.75);
  });
});
