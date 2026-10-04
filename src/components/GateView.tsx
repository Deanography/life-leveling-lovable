import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/store/game";
import { SystemWindow } from "@/components/SystemWindow";
import { CONFIG, elapsedMinutes, gateRank, inBossPhase, type Gate } from "@/engine";
import { COPY } from "@/content/copy";
import { ping } from "@/lib/sound";

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const mmss = (sec: number) => `${String(Math.floor(Math.max(0, sec) / 60)).padStart(2, "0")}:${String(Math.floor(Math.max(0, sec) % 60)).padStart(2, "0")}`;

export function GateView({ gate }: { gate: Gate }) {
  const navigate = useNavigate();
  const player = useGame((s) => s.player);
  const logSet = useGame((s) => s.logSet);
  const finishGate = useGame((s) => s.finishGate);
  const abandonGateNow = useGame((s) => s.abandonGateNow);
  const addGateExercise = useGame((s) => s.addGateExercise);
  const lastSetsFor = useGame((s) => s.lastSetsFor);
  const now = useNow();
  const [restEnd, setRestEnd] = useState<number | null>(null);
  const [restFor, setRestFor] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [newEx, setNewEx] = useState({ name: "", sets: 3, reps: 8, rest: 90 });
  const sounds = player?.settings.sounds ?? false;
  const haptics = player?.settings.haptics ?? false;

  useEffect(() => {
    if (restEnd && now.getTime() >= restEnd) {
      setRestEnd(null);
      if (sounds) ping("info");
      if (haptics && "vibrate" in navigator) navigator.vibrate?.([40, 40, 40]);
    }
  }, [now, restEnd, sounds, haptics]);

  if (!player) return null;
  const elapsed = elapsedMinutes(gate, now);
  const remainingSec = Math.max(0, gate.plannedMinutes * 60 - elapsed * 60);
  const timed = gate.type !== "training";
  const boss = timed && inBossPhase(gate, now);
  const timeUp = timed && elapsed >= gate.plannedMinutes;
  const anySetDone = (gate.exercises ?? []).some((e) => e.sets.some((s) => s.done));
  const canClear = gate.type === "training" ? anySetDone : timeUp;
  const lastEx = (gate.exercises ?? []).slice(-1)[0];

  return (
    <div className="space-y-4">
      <SystemWindow title={`${gate.red ? "Red " : ""}Gate · Rank ${gateRank(gate.plannedMinutes)}`} tone={gate.red ? "red" : boss ? "gold" : "blue"}>
        <h1 className="display text-lg">{gate.title}</h1>
        <div className="my-3 text-center">
          <div className="display text-5xl tabular-nums">{timed ? mmss(remainingSec) : mmss(elapsed * 60)}</div>
          <div className="text-xs" style={{ color: "var(--text-dim)" }}>
            {timed ? "remaining" : "elapsed"}
          </div>
        </div>
        {boss && <p className="text-center text-xs" style={{ color: "var(--gold)" }}>{COPY.gates.boss}</p>}
        {restEnd && (
          <p className="text-center text-sm" style={{ color: "var(--fatigue)" }}>
            Rest {mmss((restEnd - now.getTime()) / 1000)} · next: {restFor}
          </p>
        )}
      </SystemWindow>

      {gate.type === "training" && (
        <SystemWindow title="Session">
          <ul className="space-y-4">
            {(gate.exercises ?? []).map((ex, ei) => {
              const ghost = lastSetsFor(ex.name);
              const rows = Math.max(ex.targetSets, ex.sets.length);
              const isBoss = lastEx?.name === ex.name;
              return (
                <li key={ei}>
                  <div className="flex items-baseline justify-between">
                    <span className="display text-sm">{ex.name}</span>
                    <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                      {ex.targetSets}×{ex.targetReps} · rest {Math.round(ex.restSec / 60)}m
                    </span>
                  </div>
                  {ghost && (
                    <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                      last: {ghost.map((s) => `${s.reps}×${s.kg}`).join("  ")}
                    </div>
                  )}
                  {ex.note && <div className="mb-1 text-[10px]" style={{ color: "var(--text-dim)" }}>{ex.note}</div>}
                  <div className="mt-1 space-y-1">
                    {Array.from({ length: rows }).map((_, si) => {
                      const set = ex.sets[si] ?? { reps: ex.targetReps, kg: ghost?.[si]?.kg ?? ghost?.[0]?.kg ?? 0, done: false };
                      const bossSet = isBoss && si === rows - 1;
                      return (
                        <div key={si} className="flex items-center gap-1">
                          <span className="w-5 text-xs" style={{ color: bossSet ? "var(--gold)" : "var(--text-dim)" }}>
                            {si + 1}
                          </span>
                          <input className="input w-16 py-1 text-center" type="number" inputMode="numeric" value={set.reps} onChange={(e) => logSet(gate.id, ei, si, { reps: Number(e.target.value) || 0, kg: set.kg })} disabled={set.done} />
                          <span className="text-xs">×</span>
                          <input className="input w-20 py-1 text-center" type="number" inputMode="decimal" step="0.5" value={set.kg} onChange={(e) => logSet(gate.id, ei, si, { kg: Number(e.target.value) || 0, reps: set.reps })} disabled={set.done} />
                          <span className="text-xs">kg</span>
                          <button
                            className={`btn ml-auto px-3 py-1 text-xs ${set.done ? "gold" : ""}`}
                            onClick={() => {
                              if (set.done) return logSet(gate.id, ei, si, { done: false });
                              logSet(gate.id, ei, si, { reps: set.reps, kg: set.kg, done: true });
                              setRestEnd(Date.now() + ex.restSec * 1000);
                              setRestFor(si + 1 < rows ? `${ex.name} set ${si + 2}` : gate.exercises?.[ei + 1]?.name ?? "boss set");
                            }}
                          >
                            {set.done ? "✓" : bossSet ? "Boss" : "Done"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 space-y-1 border-t pt-3" style={{ borderColor: "rgba(127,163,230,0.35)" }}>
            <input className="input py-1" placeholder="Add exercise" value={newEx.name} onChange={(e) => setNewEx({ ...newEx, name: e.target.value })} />
            <div className="grid grid-cols-4 gap-1">
              <input className="input py-1" type="number" value={newEx.sets} onChange={(e) => setNewEx({ ...newEx, sets: Number(e.target.value) || 1 })} title="sets" />
              <input className="input py-1" type="number" value={newEx.reps} onChange={(e) => setNewEx({ ...newEx, reps: Number(e.target.value) || 1 })} title="reps" />
              <input className="input py-1" type="number" value={newEx.rest} onChange={(e) => setNewEx({ ...newEx, rest: Number(e.target.value) || 30 })} title="rest seconds" />
              <button className="btn px-0 text-xs" disabled={!newEx.name.trim()} onClick={() => { addGateExercise(gate.id, newEx.name, newEx.sets, newEx.reps, newEx.rest); setNewEx({ ...newEx, name: "" }); }}>
                Add
              </button>
            </div>
            <p className="text-[10px]" style={{ color: "var(--text-dim)" }}>
              sets · reps · rest (s)
            </p>
          </div>
        </SystemWindow>
      )}

      <div className="grid grid-cols-2 gap-2">
        {!confirmLeave ? (
          <button className="btn danger" onClick={() => setConfirmLeave(true)}>
            Leave Gate
          </button>
        ) : (
          <button className="btn danger" onClick={() => { abandonGateNow(gate.id); navigate("/gates"); }}>
            {gate.red ? `Confirm: -${CONFIG.gates.abandonHp} HP` : "Confirm leave"}
          </button>
        )}
        <button className="btn gold" disabled={!canClear} onClick={() => { finishGate(gate.id); navigate("/gates"); }}>
          Clear Gate
        </button>
      </div>
      {!canClear && (
        <p className="text-center text-xs" style={{ color: "var(--text-dim)" }}>
          {gate.type === "training" ? "Log at least one set to clear." : "Clear unlocks when the timer ends."}
        </p>
      )}
    </div>
  );
}
