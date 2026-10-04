import { Link, useLocation } from "react-router-dom";
import { useGame } from "@/store/game";
import type { FeatureId } from "@/engine";

const items: { href: string; label: string; feature?: FeatureId }[] = [
  { href: "/", label: "Status" },
  { href: "/daily", label: "Daily" },
  { href: "/gates", label: "Gates", feature: "gates" },
  { href: "/quests", label: "Quests", feature: "quests" },
  { href: "/more", label: "More" },
];

export function Nav() {
  const path = useLocation().pathname;
  const unlocked = useGame((s) => s.player?.unlocked ?? []);
  return (
    <nav data-tour="nav" className="fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-md grid-cols-5 gap-1 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]" style={{ background: "linear-gradient(transparent, var(--bg) 40%)", paddingTop: 12 }}>
      {items.map((i) => (
        <Link
          key={i.href}
          to={i.href}
          className={`btn min-w-0 overflow-hidden text-center ${path === i.href || (i.href === "/more" && path === "/settings") ? "primary" : ""}`}
          style={{ paddingInline: 2, fontFamily: "var(--font-body), ui-monospace, monospace", textTransform: "none", letterSpacing: 0, fontSize: 12 }}
        >
          {i.feature && !unlocked.includes(i.feature) ? <span style={{ opacity: 0.45 }}>🔒 {i.label}</span> : i.label}
        </Link>
      ))}
    </nav>
  );
}
