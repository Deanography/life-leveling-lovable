import type { PathId, Rank } from "@/engine";
import { CLASS_NAMES, portraitSrc, tierForRank, type Tier } from "@/content/portraits";
import { HunterAvatar } from "./HunterAvatar";

/**
 * Illustrated class portrait with the System hologram treatment.
 * Tier (from rank) picks the art; rank within the tier sets the glow.
 * Falls back to the SVG hologram when a portrait file is not present yet.
 */
export function HunterPortrait({
  rank,
  path,
  tier,
  shadows = 0,
  titled = false,
  dead = false,
  locked = false,
  className = "",
  caption = false,
}: {
  rank: Rank;
  path: PathId;
  tier?: Tier;
  shadows?: number;
  titled?: boolean;
  dead?: boolean;
  locked?: boolean;
  className?: string;
  caption?: boolean;
}) {
  const t = tier ?? tierForRank(rank);
  const src = portraitSrc(path, t);
  const glow = rank === "E" ? 0 : rank === "S" || rank === "NATIONAL" ? 3 : rank === "A" || rank === "B" ? 2 : 1;
  const monarch = rank === "S" || rank === "NATIONAL";

  return (
    <figure className={`hunter-portrait relative ${className}`} data-glow={glow} data-dead={dead || undefined} data-locked={locked || undefined} data-monarch={monarch || undefined}>
      <div className="hunter-portrait-frame relative aspect-[3/4] w-full overflow-hidden">
        {src ? (
          <img src={src} alt={`${CLASS_NAMES[path]}, ${t}`} className="h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-1">
            <HunterAvatar rank={locked ? "E" : rank} path={path} shadows={shadows} titled={titled} dead={dead} className="h-full" />
          </div>
        )}
        <div className="hunter-portrait-tint" aria-hidden />
        <div className="hunter-portrait-scan" aria-hidden />
        {src && shadows > 0 && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 pb-1" aria-hidden>
            {Array.from({ length: Math.min(3, shadows) }, (_, i) => (
              <span key={i} className="hunter-wisp-dot" style={{ animationDelay: `${i * 0.6}s` }} />
            ))}
          </div>
        )}
        {src && titled && <span className="absolute right-1 top-1 h-2 w-2 rotate-45 border" style={{ borderColor: "var(--gold)", background: "rgba(245,197,66,0.4)" }} aria-hidden />}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <span className="display text-[10px]" style={{ color: "var(--text-dim)" }}>
              LOCKED
            </span>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="mt-1 text-center">
          <span className="display block text-[10px]">{CLASS_NAMES[path]}</span>
          <span className="block text-[9px] capitalize" style={{ color: "var(--text-dim)" }}>
            {t}
          </span>
        </figcaption>
      )}
    </figure>
  );
}
