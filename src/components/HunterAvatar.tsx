import type { PathId, Rank } from "@/engine";

/**
 * Holographic hunter projection. Pure SVG, no assets.
 * Evolves by Rank: E faint wireframe -> D solid + eyes -> C pauldrons + path weapon
 * -> B chestplate + cape -> A aura -> S crown + Monarch wisps -> NATIONAL brighter.
 * Active shadows add purple wisps at the feet; an equipped Title adds a gold core.
 */
const RANK_STAGE: Record<Rank, number> = { E: 0, D: 1, C: 2, B: 3, A: 4, S: 5, NATIONAL: 6 };

export function HunterAvatar({
  rank,
  path,
  shadows = 0,
  titled = false,
  dead = false,
  className = "",
}: {
  rank: Rank;
  path: PathId;
  shadows?: number;
  titled?: boolean;
  dead?: boolean;
  className?: string;
}) {
  const stage = RANK_STAGE[rank] ?? 0;
  const line = dead ? "var(--red)" : "var(--border)";
  const bright = dead ? "var(--red)" : "#9CC4FF";
  const baseOpacity = stage === 0 ? 0.55 : 1;
  const dash = stage === 0 ? "3 3" : undefined;

  return (
    <svg viewBox="0 0 120 170" className={`hunter-avatar ${className}`} role="img" aria-label={`${rank}-Rank hunter`}>
      <defs>
        <filter id="hglow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="hfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={line} stopOpacity="0.9" />
          <stop offset="1" stopColor={line} stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {/* aura: A-rank and up */}
      {stage >= 4 && (
        <g className="hunter-aura" opacity={stage >= 5 ? 0.9 : 0.5}>
          <ellipse cx="60" cy="88" rx="46" ry="72" fill="none" stroke={bright} strokeWidth="0.8" strokeDasharray="1 5" />
          {stage >= 5 &&
            [200, 240, 280, 320, 20, 60].map((a) => (
              <line key={a} x1={60 + 40 * Math.cos((a * Math.PI) / 180)} y1={88 + 62 * Math.sin((a * Math.PI) / 180)} x2={60 + 50 * Math.cos((a * Math.PI) / 180)} y2={88 + 76 * Math.sin((a * Math.PI) / 180)} stroke={stage >= 5 ? "var(--shadow)" : bright} strokeWidth="1" opacity="0.7" />
            ))}
        </g>
      )}

      <g filter="url(#hglow)" stroke={line} strokeWidth="1.6" fill="none" opacity={baseOpacity} strokeDasharray={dash} strokeLinecap="round" strokeLinejoin="round" className="hunter-body">
        {/* head */}
        <circle cx="60" cy="30" r="12" />
        {/* eyes: D-rank and up */}
        {stage >= 1 && (
          <g stroke="none" fill={stage >= 5 ? "var(--shadow)" : bright} className="hunter-eyes">
            <rect x="53" y="28" width="5" height="2.4" rx="1" />
            <rect x="62" y="28" width="5" height="2.4" rx="1" />
          </g>
        )}
        {/* crown: S-rank */}
        {stage >= 5 && <path d="M50 17 L54 10 L60 16 L66 10 L70 17" stroke="var(--gold)" strokeWidth="1.4" />}
        {/* torso */}
        <path d="M45 48 L75 48 L71 92 L49 92 Z" />
        {/* neck */}
        <path d="M56 42 L56 48 M64 42 L64 48" />
        {/* pauldrons: C-rank */}
        {stage >= 2 && <path d="M41 48 Q45 42 52 46 M79 48 Q75 42 68 46" strokeWidth="2" stroke={bright} />}
        {/* chestplate: B-rank */}
        {stage >= 3 && <path d="M50 56 L70 56 M52 64 L68 64 M54 72 L66 72" stroke={bright} strokeWidth="1.2" />}
        {/* title core */}
        {titled && <circle cx="60" cy="60" r="3.2" stroke="var(--gold)" strokeWidth="1.4" className="hunter-core" />}
        {/* cape: B-rank */}
        {stage >= 3 && <path d="M46 50 Q34 92 44 128 M74 50 Q86 92 76 128" stroke="url(#hfade)" strokeWidth="1.4" />}
        {/* arms */}
        <path d="M45 50 L36 78 L38 96 M75 50 L84 78 L82 96" />
        {/* legs */}
        <path d="M52 92 L48 128 L47 148 M68 92 L72 128 L73 148" />
        {/* feet */}
        <path d="M47 148 L41 152 M73 148 L79 152" />
        {/* path weapon: C-rank */}
        {stage >= 2 && <PathWeapon path={path} color={bright} />}
      </g>

      {/* scanlines for the hologram feel */}
      <g stroke={line} strokeWidth="0.4" opacity="0.18">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1="26" y1={22 + i * 16} x2="94" y2={22 + i * 16} />
        ))}
      </g>

      {/* ground ring + shadow wisps */}
      <ellipse cx="60" cy="156" rx="34" ry="6" fill="none" stroke={line} strokeWidth="0.8" opacity="0.5" />
      {Array.from({ length: Math.min(3, shadows) }, (_, i) => (
        <path key={i} d={`M${38 + i * 22} 156 q3 -10 0 -18 q-3 8 0 18`} fill="var(--shadow)" opacity="0.6" className="hunter-wisp" style={{ animationDelay: `${i * 0.7}s` }} />
      ))}
    </svg>
  );
}

function PathWeapon({ path, color }: { path: PathId; color: string }) {
  switch (path) {
    case "warrior": // greatsword on the back
      return <path d="M84 78 L96 40 M92 48 L100 52" stroke={color} strokeWidth="1.8" />;
    case "scholar": // tome at the hip
      return <path d="M34 92 h12 v9 h-12 z M34 96 h12" stroke={color} strokeWidth="1.2" />;
    case "merchant": // coin + dagger
      return (
        <g stroke={color} strokeWidth="1.2">
          <circle cx="86" cy="92" r="4.5" />
          <path d="M36 92 L30 104" strokeWidth="1.6" />
        </g>
      );
    case "monk": // staff
      return <path d="M84 40 L84 120 M80 44 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0" stroke={color} strokeWidth="1.4" />;
    case "keeper": // shield
      return <path d="M30 84 q8 -4 12 0 v10 q-4 6 -6 6 q-2 0 -6 -6 z" stroke={color} strokeWidth="1.2" />;
    default:
      return null;
  }
}
