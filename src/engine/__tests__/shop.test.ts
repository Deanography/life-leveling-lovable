import { describe, expect, it } from "vitest";
import { buyPotion, buyShield, spendGold, drinkPotion } from "../shop";
import { makePlayer } from "./fixtures";

describe("shop", () => {
  it("buys a shield for 100 up to the cap", () => {
    const p = buyShield(makePlayer({ gold: 250, shields: 2 }));
    expect(p.shields).toBe(3);
    expect(p.gold).toBe(150);
    expect(buyShield(p).shields).toBe(3); // cap for standard is 3
    expect(buyShield(p, 1).shields).toBe(4); // Iron Will adds a slot
  });
  it("refuses without gold", () => expect(buyShield(makePlayer({ gold: 50 })).shields).toBe(0));
  it("potions heal 25 up to max", () => {
    let p = buyPotion(makePlayer({ gold: 60, hp: 90, potions: 0 }));
    expect(p.potions).toBe(1);
    p = drinkPotion(p);
    expect(p.hp).toBe(105);
    expect(p.potions).toBe(0);
  });
  it("spendGold returns null when short", () => {
    expect(spendGold(makePlayer({ gold: 10 }), 20)).toBeNull();
    expect(spendGold(makePlayer({ gold: 30 }), 20)?.gold).toBe(10);
  });
});
