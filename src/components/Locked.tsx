import { Link } from "react-router-dom";
import type { FeatureId } from "@/engine";
import { featureRule } from "@/engine";
import { useGame } from "@/store/game";
import { SystemWindow } from "./SystemWindow";
import { Nav } from "./Nav";

export const useUnlocked = (id: FeatureId) => useGame((s) => !!s.player?.unlocked.includes(id));

/** Full-page placeholder for a feature the hunter has not reached yet. */
export function LockedPage({ id }: { id: FeatureId }) {
  const f = featureRule(id);
  return (
    <div className="space-y-4">
      <SystemWindow title="Locked">
        <h1 className="display text-lg">{f.name}</h1>
        <p className="mt-2 text-sm">This function has not been unlocked.</p>
        <p className="mt-1 text-sm" style={{ color: "var(--gold)" }}>
          Requirement: {f.requirement}.
        </p>
        <Link to="/codex" className="btn mt-4 block text-center">
          Open the Codex
        </Link>
      </SystemWindow>
      <Nav />
    </div>
  );
}
