import { useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "@/store/game";
import { SystemWindow } from "@/components/SystemWindow";
import { Nav } from "@/components/Nav";
import { LockedPage, useUnlocked } from "@/components/Locked";
import { shadowSlots, type Buff } from "@/engine";

const passiveText = (b: Buff) =>
  [
    b.xpMult && `+${Math.round((b.xpMult - 1) * 100)}% XP`,
    b.goldMult && `+${Math.round((b.goldMult - 1) * 100)}% Gold`,
    b.hpMaxBonus && `+${b.hpMaxBonus} max HP`,
    b.fatigueMult && `-${Math.round((1 - b.fatigueMult) * 100)}% Fatigue`,
    b.shieldSlots && `+${b.shieldSlots} shield slot`,
    b.keyChanceBonus && `+${Math.round(b.keyChanceBonus * 100)}% key drops`,
    b.statXpMult && Object.entries(b.statXpMult).map(([k, v]) => `+${Math.round((v - 1) * 100)}% ${k} XP`).join(", "),
  ]
    .filter(Boolean)
    .join(" · ");

export default function ArmyPage() {
  const player = useGame((s) => s.player);
  const featureOpen = useUnlocked("shadows");
  const shadows = useGame((s) => s.shadows);
  const quests = useGame((s) => s.quests);
  const toggleShadow = useGame((s) => s.toggleShadow);
  const guardWith = useGame((s) => s.guardWith);
  const renameShadow = useGame((s) => s.renameShadow);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  if (!player) return null;
  if (!featureOpen) return <LockedPage id="shadows" />;
  const slots = shadowSlots(player.level);
  const active = shadows.filter((s) => s.active).length;
  const mandatory = quests.filter((q) => q.kind === "daily" && q.isMandatory);

  return (
    <div className="space-y-4">
      <SystemWindow title="Shadow Army" tone="shadow">
        <p className="mb-3 text-xs" style={{ color: "var(--text-dim)" }}>
          Slots {active} / {slots}. One slot per 10 levels. A shadow guarding a Daily Quest item absorbs its miss once a week.
        </p>
        <ul className="space-y-3">
          {shadows.map((sh) => (
            <li key={sh.id} className="border px-3 py-2" style={{ borderColor: sh.active ? "var(--shadow)" : "rgba(139,92,246,0.3)", opacity: sh.active ? 1 : 0.7 }}>
              <div className="flex items-center gap-2">
                {editing === sh.id ? (
                  <input className="input flex-1 py-1" value={name} maxLength={20} autoFocus onChange={(e) => setName(e.target.value)} onBlur={() => { renameShadow(sh.id, name); setEditing(null); }} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
                ) : (
                  <button className="display flex-1 text-left text-sm" onClick={() => { setEditing(sh.id); setName(sh.name); }}>
                    {sh.name}
                  </button>
                )}
                <button className={`btn px-3 py-1 text-xs ${sh.active ? "primary" : ""}`} disabled={!sh.active && active >= slots} onClick={() => toggleShadow(sh.id)}>
                  {sh.active ? "Active" : "Dormant"}
                </button>
              </div>
              <p className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                From {sh.fromBossTitle} · {sh.stat} · {passiveText(sh.passive)}
              </p>
              {sh.active && (
                <select className="input mt-1 py-1 text-xs" value={sh.guardingQuestId ?? ""} onChange={(e) => guardWith(sh.id, e.target.value || undefined)}>
                  <option value="">Not guarding</option>
                  {mandatory.map((q) => (
                    <option key={q.id} value={q.id}>
                      Guard: {q.title}
                    </option>
                  ))}
                </select>
              )}
            </li>
          ))}
          {shadows.length === 0 && (
            <li className="text-xs" style={{ color: "var(--text-dim)" }}>
              No shadows yet. Defeat a <Link to="/bosses" className="underline">Boss</Link> and choose Arise.
            </li>
          )}
        </ul>
      </SystemWindow>
      <Nav />
    </div>
  );
}
