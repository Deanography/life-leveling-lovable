import { useState } from "react";
import { useGame } from "@/store/game";
import { SystemWindow } from "@/components/SystemWindow";
import { Nav } from "@/components/Nav";
import { LockedPage, useUnlocked } from "@/components/Locked";
import { CONFIG, STATS, bossReward, type Stat } from "@/engine";
import { pathById } from "@/content/paths";

export default function BossesPage() {
  const player = useGame((s) => s.player);
  const featureOpen = useUnlocked("bosses");
  const quests = useGame((s) => s.quests);
  const addBoss = useGame((s) => s.addBoss);
  const damageBossNow = useGame((s) => s.damageBossNow);
  const removeBoss = useGame((s) => s.removeBoss);
  const ariseShadow = useGame((s) => s.ariseShadow);
  const [draft, setDraft] = useState<{ title: string; stat: Stat; hpMax: number; unit: string; linked: string[] }>({ title: "", stat: "STR", hpMax: 30, unit: "days", linked: [] });
  const [dmg, setDmg] = useState<Record<string, number>>({});
  if (!player) return null;
  if (!featureOpen) return <LockedPage id="bosses" />;
  const bosses = quests.filter((q) => q.kind === "boss");
  const alive = bosses.filter((b) => !b.defeatedAt);
  const defeated = bosses.filter((b) => b.defeatedAt).slice(-10).reverse();
  const linkable = quests.filter((q) => q.kind === "daily" || q.kind === "habit");
  const starter = pathById(player.path.primary).starterBoss;

  return (
    <div className="space-y-4">
      <SystemWindow title="Boss Quests" tone="red">
        <p className="mb-3 text-xs" style={{ color: "var(--text-dim)" }}>
          A boss is a milestone with an HP bar. Deal damage by logging progress, or link habits and dailies so every completion strikes for 1. Max {CONFIG.bosses.maxActive} active.
        </p>
        <ul className="space-y-3">
          {alive.map((b) => {
            const pct = Math.max(0, Math.min(100, ((b.bossHp ?? 0) / (b.bossHpMax ?? 1)) * 100));
            const amt = dmg[b.id] ?? 1;
            return (
              <li key={b.id} className="border px-3 py-2" style={{ borderColor: "rgba(239,68,68,0.5)" }}>
                <div className="flex items-baseline justify-between">
                  <span className="display text-sm">{b.title}</span>
                  <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                    {b.stat} · {bossReward(b).xp} XP
                  </span>
                </div>
                <div className="bar my-2">
                  <i style={{ width: `${pct}%`, background: "var(--red)" }} />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="tabular-nums">
                    {b.bossHp} / {b.bossHpMax} {b.bossUnit}
                  </span>
                  <input className="input ml-auto w-16 py-1 text-center" type="number" min={1} value={amt} onChange={(e) => setDmg({ ...dmg, [b.id]: Number(e.target.value) || 1 })} />
                  <button className="btn danger px-3 py-1" onClick={() => damageBossNow(b.id, amt)}>
                    Strike
                  </button>
                  <button className="btn px-2 py-1" onClick={() => removeBoss(b.id)} aria-label="remove">
                    x
                  </button>
                </div>
                {b.linkedQuestIds?.length ? (
                  <p className="mt-1 text-[10px]" style={{ color: "var(--text-dim)" }}>
                    Linked: {b.linkedQuestIds.map((id) => quests.find((q) => q.id === id)?.title ?? "?").join(", ")}
                  </p>
                ) : null}
              </li>
            );
          })}
          {alive.length === 0 && (
            <li className="text-xs" style={{ color: "var(--text-dim)" }}>
              No active bosses. {starter && `Your path suggests: "${starter}".`}
            </li>
          )}
        </ul>

        {alive.length < CONFIG.bosses.maxActive && (
          <div className="mt-3 space-y-1 border-t pt-3" style={{ borderColor: "rgba(127,163,230,0.35)" }}>
            <input className="input py-1" placeholder={starter || "Boss name"} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <div className="grid grid-cols-3 gap-1">
              <select className="input py-1" value={draft.stat} onChange={(e) => setDraft({ ...draft, stat: e.target.value as Stat })}>
                {STATS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <input className="input py-1" type="number" min={1} value={draft.hpMax} onChange={(e) => setDraft({ ...draft, hpMax: Number(e.target.value) || 1 })} title="HP" />
              <input className="input py-1" placeholder="unit" value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} />
            </div>
            {linkable.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {linkable.map((q) => (
                  <button key={q.id} className={`btn px-2 py-1 text-[10px] ${draft.linked.includes(q.id) ? "primary" : ""}`} onClick={() => setDraft({ ...draft, linked: draft.linked.includes(q.id) ? draft.linked.filter((x) => x !== q.id) : [...draft.linked, q.id] })}>
                    {q.title}
                  </button>
                ))}
              </div>
            )}
            <button className="btn danger w-full" disabled={!draft.title.trim()} onClick={() => { addBoss({ title: draft.title, stat: draft.stat, hpMax: draft.hpMax, unit: draft.unit || "hits", linkedQuestIds: draft.linked.length ? draft.linked : undefined }); setDraft({ ...draft, title: "", linked: [] }); }}>
              Summon boss
            </button>
            <p className="text-[10px]" style={{ color: "var(--text-dim)" }}>
              HP = how much progress it takes. Examples: 30 days, 12 modules, 100 kg total, 20 quotes.
            </p>
          </div>
        )}
      </SystemWindow>

      {defeated.length > 0 && (
        <SystemWindow title="Defeated" tone="shadow">
          <ul className="space-y-2">
            {defeated.map((b) => (
              <li key={b.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1">
                  {b.title} <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>{b.defeatedAt?.slice(0, 10)}</span>
                </span>
                {b.shadowId ? (
                  <span className="text-[10px]" style={{ color: "var(--shadow)" }}>extracted</span>
                ) : (
                  <button className="btn px-3 py-1 text-xs" style={{ borderColor: "var(--shadow)", color: "var(--shadow)" }} onClick={() => ariseShadow(b.id)}>
                    Arise
                  </button>
                )}
              </li>
            ))}
          </ul>
        </SystemWindow>
      )}
      <Nav />
    </div>
  );
}
