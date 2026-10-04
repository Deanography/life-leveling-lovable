import { useState } from "react";
import { useGame } from "@/store/game";
import { SystemWindow } from "@/components/SystemWindow";
import { Nav } from "@/components/Nav";
import { COPY } from "@/content/copy";
import type { Quest, Severity, Stat, Unit } from "@/engine";
import { STATS } from "@/engine";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SettingsPage() {
  const player = useGame((s) => s.player);
  const quests = useGame((s) => s.quests);
  const updateSettings = useGame((s) => s.updateSettings);
  const updateQuest = useGame((s) => s.updateQuest);
  const removeQuest = useGame((s) => s.removeQuest);
  const addQuest = useGame((s) => s.addQuest);
  const resetAll = useGame((s) => s.resetAll);
  const importState = useGame((s) => s.importState);
  const [importMsg, setImportMsg] = useState("");
  const [draft, setDraft] = useState<{ title: string; stat: Stat; unit: Unit; baseTarget: number; difficulty: Quest["difficulty"] }>({ title: "", stat: "STR", unit: "reps", baseTarget: 10, difficulty: "medium" });
  const [confirmReset, setConfirmReset] = useState(false);
  if (!player) return null;
  const s = player.settings;
  const mandatory = quests.filter((q) => q.isMandatory);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(useGame.getState(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `life-leveling-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <SystemWindow title="Settings">
        <label className="mb-1 block text-xs">Wake time</label>
        <input className="input mb-3" type="time" value={s.wakeTime} onChange={(e) => updateSettings({ wakeTime: e.target.value })} />
        <label className="mb-1 block text-xs">Day ends at (grace period)</label>
        <select className="input mb-3" value={s.dayStartHour} onChange={(e) => updateSettings({ dayStartHour: Number(e.target.value) })}>
          {[0, 1, 2, 3, 4, 5].map((h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, "0")}:00
            </option>
          ))}
        </select>
        <label className="mb-1 block text-xs">Severity</label>
        <div className="mb-3 grid grid-cols-3 gap-1">
          {(Object.keys(COPY.severity) as Severity[]).map((sev) => (
            <button key={sev} className={`btn ${s.severity === sev ? "primary" : ""}`} onClick={() => updateSettings({ severity: sev })}>
              {COPY.severity[sev].label}
            </button>
          ))}
        </div>
        <label className="mb-1 block text-xs">Rest days</label>
        <div className="mb-3 grid grid-cols-7 gap-1">
          {days.map((d, i) => (
            <button key={d} className={`btn px-0 text-xs ${s.restDays.includes(i) ? "primary" : ""}`} onClick={() => updateSettings({ restDays: s.restDays.includes(i) ? s.restDays.filter((x) => x !== i) : [...s.restDays, i] })}>
              {d}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button className={`btn ${s.sounds ? "primary" : ""}`} onClick={() => updateSettings({ sounds: !s.sounds })}>
            Sounds {s.sounds ? "on" : "off"}
          </button>
          <button className={`btn ${s.haptics ? "primary" : ""}`} onClick={() => updateSettings({ haptics: !s.haptics })}>
            Haptics {s.haptics ? "on" : "off"}
          </button>
        </div>
      </SystemWindow>

      <SystemWindow title="Daily Quest items">
        <ul className="space-y-2">
          {mandatory.map((q) => (
            <li key={q.id} className="flex items-center gap-2 text-sm">
              <input className="input flex-1 py-1" value={q.title} onChange={(e) => updateQuest(q.id, { title: e.target.value })} />
              <input className="input w-16 py-1" type="number" value={q.baseTarget} onChange={(e) => updateQuest(q.id, { baseTarget: Number(e.target.value) || 1 })} />
              <span className="w-8 text-xs">{q.unit}</span>
              <button className="btn danger px-2 py-1 text-xs" onClick={() => removeQuest(q.id)} disabled={mandatory.length <= 1}>
                x
              </button>
            </li>
          ))}
        </ul>
        {mandatory.length < 5 && (
          <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: "rgba(127,163,230,0.35)" }}>
            <input className="input py-1" placeholder="New item" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <div className="grid grid-cols-4 gap-1">
              <select className="input py-1" value={draft.stat} onChange={(e) => setDraft({ ...draft, stat: e.target.value as Stat })}>
                {STATS.map((st) => (
                  <option key={st}>{st}</option>
                ))}
              </select>
              <select className="input py-1" value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value as Unit })}>
                {(["reps", "min", "km", "times", "done"] as Unit[]).map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
              <input className="input py-1" type="number" value={draft.baseTarget} onChange={(e) => setDraft({ ...draft, baseTarget: Number(e.target.value) || 1 })} />
              <select className="input py-1" value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as Quest["difficulty"] })}>
                {(["trivial", "easy", "medium", "hard", "brutal"] as const).map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <button
              className="btn w-full"
              disabled={!draft.title.trim()}
              onClick={() => {
                addQuest({ ...draft, kind: "daily", scaling: draft.unit === "reps" || draft.unit === "km" ? "level" : draft.unit === "min" ? "time" : "none", isMandatory: true });
                setDraft({ ...draft, title: "" });
              }}
            >
              Add item
            </button>
          </div>
        )}
        <p className="mt-2 text-xs" style={{ color: "var(--text-dim)" }}>
          Targets are the level 1 base. Reps and km scale with level, minutes scale slower. Max 5 items.
        </p>
      </SystemWindow>

      <SystemWindow title="Data">
        <div className="grid grid-cols-3 gap-1">
          <button className="btn" onClick={exportJson}>
            Export JSON
          </button>
          <label className="btn cursor-pointer text-center">
            Import
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const ok = importState(await f.text());
                setImportMsg(ok ? "Import complete." : "Import failed: not a Life Leveling export.");
              }}
            />
          </label>
          {!confirmReset ? (
            <button className="btn danger" onClick={() => setConfirmReset(true)}>
              Reset
            </button>
          ) : (
            <button className="btn danger" onClick={() => { resetAll(); setConfirmReset(false); }}>
              Confirm reset
            </button>
          )}
        </div>
        {importMsg && <p className="mt-2 text-xs">{importMsg}</p>}
        <p className="mt-2 text-xs" style={{ color: "var(--text-dim)" }}>
          Best streak {player.bestStreak}. Total XP {player.totalXp}. Local only, nothing leaves this device.
        </p>
      </SystemWindow>
      <Nav />
    </div>
  );
}
