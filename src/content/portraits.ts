import type { PathId, Rank } from "@/engine";
import manifest from "./portraits.json";

export type Tier = "initiate" | "veteran" | "ascendant";

export const TIERS: { id: Tier; name: string; ranks: Rank[] }[] = [
  { id: "initiate", name: "Initiate", ranks: ["E", "D"] },
  { id: "veteran", name: "Veteran", ranks: ["C", "B"] },
  { id: "ascendant", name: "Ascendant", ranks: ["A", "S", "NATIONAL"] },
];

export const tierForRank = (r: Rank): Tier => TIERS.find((t) => t.ranks.includes(r))?.id ?? "initiate";

/** Class names shown with the art. Paths stay the mechanical choice; this is the fantasy. */
export const CLASS_NAMES: Record<PathId, string> = {
  warrior: "Warrior",
  scholar: "Arcanist",
  merchant: "Rogue-Merchant",
  monk: "Monk",
  keeper: "Guardian",
  custom: "Wanderer",
};

/**
 * Art files present in /public/hunters. Missing entries fall back to the SVG hologram,
 * so art can be added one image at a time. Filenames: <path>-<tier>.webp
 */
export const PORTRAITS = manifest as Partial<Record<`${PathId}-${Tier}`, string>>;

/** Value in the manifest is a short content hash, used to bust caches when art is replaced. */
export const portraitSrc = (path: PathId, tier: Tier) => {
  const v = PORTRAITS[`${path}-${tier}`];
  return v ? `/hunters/${path}-${tier}.webp?v=${v}` : null;
};
