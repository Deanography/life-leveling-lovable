import { describe, expect, it } from "vitest";
import { newlyUnlocked, type UnlockState } from "../unlocks";
import { CATALOG, TIER_RULES, buyTheme, catalogFor, rewardUnlocked, themeById, themeOwned } from "../rewards";
import { makePlayer } from "./fixtures";

const counters = { gatesCleared: 0, redGatesCleared: 0, prCount: 0, revives: 0, earlyDays: 0, perfectDays: 0, todosDone: 0, bossesDefeated: 0, keysUsed: 0 };
const base = (over: Partial<UnlockState> = {}): UnlockState => ({ player: makePlayer({ gold: 0 }), counters, hasGates: false, hasSideQuests: false, hasBosses: false, shadowCount: 0, ...over });

describe("feature unlocks", () => {
  it("a brand-new player has nothing unlocked", () => {
    expect(newlyUnlocked(base())).toEqual([]);
  });
  it("first Perfect Day unlocks the shop and gates", () => {
    const s = base({ player: makePlayer({ gold: 20, totalXp: 170 }), counters: { ...counters, perfectDays: 1 } });
    expect(newlyUnlocked(s)).toEqual(["shop", "gates"]);
  });
  it("level and boss gates", () => {
    const s = base({ player: makePlayer({ gold: 5, level: 3 }) });
    expect(newlyUnlocked(s)).toEqual(expect.arrayContaining(["quests", "bosses"]));
    expect(newlyUnlocked(s)).not.toContain("shadows");
  });
  it("already-used features stay unlocked for existing players", () => {
    const s = base({ player: makePlayer({ gold: 0, level: 1 }), hasGates: true, hasSideQuests: true, hasBosses: true, shadowCount: 1 });
    expect(newlyUnlocked(s)).toEqual(expect.arrayContaining(["gates", "quests", "bosses", "shadows"]));
  });
  it("does not re-announce features already shown", () => {
    const s = base({ player: makePlayer({ gold: 20, unlocked: ["shop"] }) });
    expect(newlyUnlocked(s)).not.toContain("shop");
  });
});

describe("reward catalogue", () => {
  it("tiers unlock at level 5 and C-Rank", () => {
    expect(TIER_RULES.medium.unlocked(makePlayer({ level: 4 }))).toBe(false);
    expect(TIER_RULES.medium.unlocked(makePlayer({ level: 5 }))).toBe(true);
    expect(TIER_RULES.large.unlocked(makePlayer({ rank: "D" }))).toBe(false);
    expect(TIER_RULES.large.unlocked(makePlayer({ rank: "C" }))).toBe(true);
  });
  it("path-specific rewards only show for matching paths", () => {
    const warrior = catalogFor(makePlayer({ path: { primary: "warrior", secondary: "merchant" } })).map((r) => r.id);
    expect(warrior).toContain("protein-treat");
    expect(warrior).toContain("course-tool");
    expect(warrior).not.toContain("dinner-out");
    const scholar = catalogFor(makePlayer({ path: { primary: "scholar" } })).map((r) => r.id);
    expect(scholar).not.toContain("protein-treat");
  });
  it("every reward is priced within its tier band", () => {
    for (const r of CATALOG) {
      if (r.tier === "small") expect(r.cost).toBeLessThanOrEqual(200);
      if (r.tier === "medium") expect(r.cost).toBeGreaterThanOrEqual(500);
      if (r.tier === "large") expect(r.cost).toBeGreaterThanOrEqual(2000);
    }
    expect(rewardUnlocked(makePlayer(), CATALOG.find((r) => r.id === "coffee")!)).toBe(true);
  });
});

describe("themes", () => {
  it("Ember needs level 10 and 400 Gold", () => {
    expect(buyTheme(makePlayer({ level: 9, gold: 1000 }), "ember").themes).toEqual(["system"]);
    const p = buyTheme(makePlayer({ level: 10, gold: 1000 }), "ember");
    expect(p.themes).toContain("ember");
    expect(p.gold).toBe(600);
    expect(buyTheme(p, "ember").gold).toBe(600);
  });
  it("Monarch is earned by rank and cannot be bought", () => {
    const monarch = themeById("monarch");
    expect(themeOwned(makePlayer({ rank: "A" }), monarch)).toBe(false);
    expect(themeOwned(makePlayer({ rank: "S" }), monarch)).toBe(true);
    expect(buyTheme(makePlayer({ rank: "A", gold: 99999 }), "monarch").gold).toBe(99999);
  });
});
