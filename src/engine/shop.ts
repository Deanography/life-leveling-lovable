import { CONFIG } from "./config";
import { hpMax } from "./levels";
import type { Player } from "./types";

export const shieldCap = (p: Player, extraSlots = 0) => CONFIG.shields.max[p.settings.severity] + extraSlots;

export function buyShield(p: Player, extraSlots = 0): Player {
  if (p.gold < CONFIG.shop.shield || p.shields >= shieldCap(p, extraSlots)) return p;
  return { ...p, gold: p.gold - CONFIG.shop.shield, shields: p.shields + 1 };
}

export function buyPotion(p: Player): Player {
  if (p.gold < CONFIG.shop.potion) return p;
  return { ...p, gold: p.gold - CONFIG.shop.potion, potions: p.potions + 1 };
}

export function drinkPotion(p: Player): Player {
  if (p.potions <= 0 || p.dead || p.hp >= hpMax(p)) return p;
  return { ...p, potions: p.potions - 1, hp: Math.min(hpMax(p), p.hp + CONFIG.shop.potionHp) };
}

export function spendGold(p: Player, cost: number): Player | null {
  if (cost < 0 || p.gold < cost) return null;
  return { ...p, gold: p.gold - cost };
}
