import { describe, expect, it } from "vitest";
import { addXp, hpMax, rankForLevel, xpForLevel } from "../levels";
import { makePlayer } from "./fixtures";

describe("level curve", () => {
  it("matches the table in Game Design", () => {
    expect(xpForLevel(1)).toBe(80);
    expect(xpForLevel(2)).toBe(177);
    expect(xpForLevel(10)).toBe(1130);
    expect(xpForLevel(50)).toBe(7192);
    expect(xpForLevel(100)).toBe(15962);
  });
  it("cumulative XP to level 10 is ~4693", () => {
    let cum = 0;
    for (let l = 1; l < 10; l++) cum += xpForLevel(l);
    expect(cum).toBe(4693);
  });
});

describe("addXp", () => {
  it("levels up once and grants 3 points", () => {
    const { player, levelsGained } = addXp(makePlayer(), 100);
    expect(levelsGained).toBe(1);
    expect(player.level).toBe(2);
    expect(player.xp).toBe(20);
    expect(player.freePoints).toBe(3);
    expect(player.totalXp).toBe(100);
  });
  it("can gain multiple levels in one award", () => {
    const { player, levelsGained } = addXp(makePlayer(), 80 + 177 + 10);
    expect(levelsGained).toBe(2);
    expect(player.level).toBe(3);
    expect(player.xp).toBe(10);
    expect(player.freePoints).toBe(6);
  });
});

describe("ranks and hp", () => {
  it("rank bands", () => {
    expect(rankForLevel(1)).toBe("E");
    expect(rankForLevel(9)).toBe("E");
    expect(rankForLevel(10)).toBe("D");
    expect(rankForLevel(34)).toBe("C");
    expect(rankForLevel(35)).toBe("B");
    expect(rankForLevel(70)).toBe("S");
    expect(rankForLevel(95)).toBe("NATIONAL");
  });
  it("VIT raises max HP by 5 per 10", () => {
    expect(hpMax(makePlayer())).toBe(105);
    expect(hpMax(makePlayer({ stats: { STR: 10, VIT: 30, AGI: 10, INT: 10, SENSE: 10 } }))).toBe(115);
  });
});
