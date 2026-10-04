import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/store/game";
import { SystemWindow } from "@/components/SystemWindow";
import { Nav } from "@/components/Nav";
import { LockedPage, useUnlocked } from "@/components/Locked";
import { CONFIG, gateRank, type GateType } from "@/engine";
import { GATE_TEMPLATES } from "@/content/gates";
import { COPY } from "@/content/copy";

export default function GatesPage() {
  const player = useGame((s) => s.player);
  const featureOpen = useUnlocked("gates");
  const gates = useGame((s) => s.gates);
  const startGate = useGame((s) => s.startGate);
  const navigate = useNavigate();
  const [type, setType] = useState<GateType>("focus");
  const [minutes, setMinutes] = useState(50);
  const [red, setRed] = useState(false);
  const [title, setTitle] = useState("");
  if (!player) return null;
  if (!featureOpen) return <LockedPage id="gates" />;
  const active = gates.find((g) => !g.endedAt);
  const locked = player.fatigue > CONFIG.fatigue.lockGates;
  const recent = gates.filter((g) => g.endedAt).slice(-5).reverse();

  const open = (id: string) => navigate(id ? "/gate" : "/gates");

  return (
    <div className="space-y-4">
      {active && (
        <SystemWindow title="Gate open" tone={active.red ? "red" : "gold"}>
          <p className="mb-2">{active.title}</p>
          <button className="btn primary w-full" onClick={() => open(active.id)}>
            Return to Gate
          </button>
        </SystemWindow>
      )}
      {locked && (
        <SystemWindow title="Warning" tone="red">
          <p className="text-sm">{COPY.events.fatigueLock.join(" ")}</p>
        </SystemWindow>
      )}
      {!active && !locked && (
        <>
          <SystemWindow title="Open a Gate">
            <div className="mb-3 grid grid-cols-2 gap-1">
              {(["focus", "grind"] as GateType[]).map((t) => (
                <button key={t} className={`btn ${type === t ? "primary" : ""}`} onClick={() => setType(t)}>
                  {t === "focus" ? "Focus" : "Grind"}
                </button>
              ))}
            </div>
            <input className="input mb-3" placeholder={type === "focus" ? "What are you working on?" : "What needs doing?"} value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="mb-3 grid grid-cols-4 gap-1">
              {[25, 50, 90, 120].map((m) => (
                <button key={m} className={`btn px-0 ${minutes === m ? "primary" : ""}`} onClick={() => setMinutes(m)}>
                  {m}m
                </button>
              ))}
            </div>
            <button className={`btn mb-3 w-full ${red ? "danger" : ""}`} onClick={() => setRed(!red)}>
              Red Gate: {red ? "on. Leaving early costs 25 HP." : "off"}
            </button>
            <button className="btn primary w-full" onClick={() => open(startGate({ type, red, title, plannedMinutes: minutes }))}>
              Open {gateRank(minutes)}-Rank Gate
            </button>
          </SystemWindow>

          <SystemWindow title="Training Gates">
            <ul className="space-y-2">
              {GATE_TEMPLATES.map((t) => (
                <li key={t.id}>
                  <button className="w-full border px-3 py-2 text-left" style={{ borderColor: "rgba(127,163,230,0.35)" }} onClick={() => open(startGate({ type: "training", red, title: t.name, plannedMinutes: 75, templateId: t.id }))}>
                    <div className="display text-sm">{t.name}</div>
                    <div className="text-xs" style={{ color: "var(--text-dim)" }}>
                      {t.subtitle}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs" style={{ color: "var(--text-dim)" }}>
              Red Gate toggle above applies to training too.
            </p>
          </SystemWindow>
        </>
      )}
      {recent.length > 0 && (
        <SystemWindow title="Recent">
          <ul className="space-y-1 text-xs">
            {recent.map((g) => (
              <li key={g.id} className="flex justify-between">
                <span>
                  {g.abandoned ? "✕" : "●"} {g.title}
                </span>
                <span style={{ color: g.abandoned ? "var(--red)" : "var(--gold)" }}>{g.abandoned ? "abandoned" : `${g.rewards?.xp ?? 0} XP`}</span>
              </li>
            ))}
          </ul>
        </SystemWindow>
      )}
      <Nav />
    </div>
  );
}
