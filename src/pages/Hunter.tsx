import { Link } from "react-router-dom";
import { useGame } from "@/store/game";
import { SystemWindow } from "@/components/SystemWindow";
import { Nav } from "@/components/Nav";
import { HunterPortrait } from "@/components/HunterPortrait";
import { CLASS_NAMES, TIERS, tierForRank } from "@/content/portraits";
import { pathById } from "@/content/paths";

export default function HunterPage() {
  const player = useGame((s) => s.player);
  const shadows = useGame((s) => s.shadows);
  if (!player) return null;
  const current = tierForRank(player.rank);
  const currentIdx = TIERS.findIndex((t) => t.id === current);
  const next = TIERS[currentIdx + 1];
  const active = shadows.filter((s) => s.active).length;
  const paths = [player.path.primary, ...(player.path.secondary ? [player.path.secondary] : [])];

  return (
    <div className="space-y-4">
      <SystemWindow title="Hunter">
        <div className="mx-auto w-48">
          <HunterPortrait rank={player.rank} path={player.path.primary} shadows={active} titled={!!player.equippedTitleId} dead={player.dead} />
        </div>
        <h1 className="display mt-3 text-center text-xl">{player.name}</h1>
        <p className="text-center text-xs" style={{ color: "var(--text-dim)" }}>
          {player.rank}-Rank {CLASS_NAMES[player.path.primary]} · Level {player.level} · {TIERS[currentIdx].name}
        </p>
        <p className="mt-2 text-center text-xs" style={{ color: "var(--gold)" }}>
          {next ? `Next evolution: ${next.name} at ${next.ranks[0]}-Rank.` : "Final evolution reached."}
        </p>
      </SystemWindow>

      {paths.map((path, i) => (
        <SystemWindow key={path} title={`${i === 0 ? "Primary" : "Secondary"} · ${pathById(path).name}`} tone={i === 0 ? "blue" : "shadow"}>
          <div className="grid grid-cols-3 gap-2">
            {TIERS.map((t, ti) => (
              <HunterPortrait key={t.id} rank={ti <= currentIdx ? player.rank : t.ranks[0]} path={path} tier={t.id} locked={ti > currentIdx} caption />
            ))}
          </div>
          <p className="mt-2 text-[10px]" style={{ color: "var(--text-dim)" }}>
            Initiate E–D · Veteran C–B · Ascendant A and above. Rank up through Rank-Up Gates.
          </p>
        </SystemWindow>
      ))}

      <Link to="/" className="btn block w-full text-center">
        Back to Status
      </Link>
      <Nav />
    </div>
  );
}
