#!/usr/bin/env node
// Usage: node scripts/add-portrait.mjs <image> <path> <tier>
//   path: warrior | scholar | merchant | monk | keeper | custom
//   tier: initiate | veteran | ascendant
// Crops to 3:4, resizes to 600x800, writes public/hunters/<path>-<tier>.webp,
// and registers it in src/content/portraits.json with a short content hash.
import sharp from "sharp";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PATHS = ["warrior", "scholar", "merchant", "monk", "keeper", "custom"];
const TIERS = ["initiate", "veteran", "ascendant"];
const [input, path, tier] = process.argv.slice(2);
if (!input || !PATHS.includes(path) || !TIERS.includes(tier)) {
  console.error("Usage: node scripts/add-portrait.mjs <image> <" + PATHS.join("|") + "> <" + TIERS.join("|") + ">");
  process.exit(1);
}
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "hunters");
mkdirSync(outDir, { recursive: true });
const out = join(outDir, `${path}-${tier}.webp`);
const buf = await sharp(input).resize(600, 800, { fit: "cover", position: "top", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
writeFileSync(out, buf);
const manifestPath = join(root, "src", "content", "portraits.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest[`${path}-${tier}`] = createHash("sha1").update(buf).digest("hex").slice(0, 8);
const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(manifestPath, JSON.stringify(sorted, null, 2) + "\n");
console.log(`${out} (${Math.round(buf.length / 1024)} KB) registered`);
