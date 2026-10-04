import { useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "@/store/game";
import { SystemWindow } from "@/components/SystemWindow";
import { Nav } from "@/components/Nav";
import { LockedPage, useUnlocked } from "@/components/Locked";
import { STATS, questReward, type Difficulty, type Polarity, type Quest, type QuestKind, type Stat } from "@/engine";

const DIFFS: Difficulty[] = ["trivial", "easy", "medium", "hard", "brutal"];

export default function QuestsPage() {
  const player = useGame((s) => s.player);
  const featureOpen = useUnlocked("quests");
  const quests = useGame((s) => s.quests);
  const completions = useGame((s) => s.completions);
  const todayKey = useGame((s) => s.todayKey);
  const habitTap = useGame((s) => s.habitTap);
  const completeTodo = useGame((s) => s.completeTodo);
  const addQuest = useGame((s) => s.addQuest);
  const removeQuest = useGame((s) => s.removeQuest);
  const logProgress = useGame((s) => s.logProgress);
  const fractionFor = useGame((s) => s.fractionFor);
  const targetFor = useGame((s) => s.targetFor);
  const [tab, setTab] = useState<QuestKind>("habit");
  const [draft, setDraft] = useState<{ title: string; stat: Stat; difficulty: Difficulty; polarity: Polarity; dueAt: string }>({ title: "", stat: "STR", difficulty: "easy", polarity: "good", dueAt: "" });
  if (!player) return null;
  if (!featureOpen) return <LockedPage id="quests" />;
  const today = todayKey();
  const list = quests.filter((q) => q.kind === tab && (tab !== "todo" || !q.doneAt));
  const doneTodos = quests.filter((q) => q.kind === "todo" && q.doneAt).slice(-5).reverse();

  const add = () => {
    if (!draft.title.trim()) return;
    const base: Omit<Quest, "id" | "createdAt"> = { kind: tab, title: draft.title, stat: draft.stat, difficulty: draft.difficulty, baseTarget: 1, unit: "done", scaling: "none", isMandatory: false };
    if (tab === "habit") base.polarity = draft.polarity;
    if (tab === "todo" && draft.dueAt) base.dueAt = draft.dueAt;
    addQuest(base);
    setDraft({ ...draft, title: "" });
  };

  return (
    <div className="space-y-4">
      <SystemWindow title="Quest Log">
        <div className="mb-3 grid grid-cols-3 gap-1">
          {(["habit", "daily", "todo"] as QuestKind[]).map((k) => (
            <button key={k} className={`btn ${tab === k ? "primary" : ""}`} onClick={() => setTab(k)}>
              {k === "habit" ? "Habits" : k === "daily" ? "Dailies" : "To-dos"}
            </button>
          ))}
        </div>

        {tab === "daily" && (
          <p className="mb-2 text-xs" style={{ color: "var(--text-dim)" }}>
            Mandatory items live in the <Link to="/daily" className="underline">Daily Quest</Link>. Optional dailies below give XP but carry no penalty.
          </p>
        )}

        <ul className="space-y-2">
          {list.map((q) => {
            const r = questReward(player, q);
            const count = completions[today]?.[q.id] ?? 0;
            return (
              <li key={q.id} className="flex items-center gap-2 border px-3 py-2" style={{ borderColor: "rgba(127,163,230,0.35)" }}>
                <div className="flex-1">
                  <div className="text-sm">{q.title}</div>
                  <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                    {q.stat} · {q.difficulty} · {r.xp} XP
                    {q.kind === "habit" && count !== 0 && ` · today ${count > 0 ? "+" : ""}${count}`}
                    {q.kind === "todo" && q.dueAt && ` · due ${q.dueAt}`}
                  </div>
                </div>
                {q.kind === "habit" && (q.polarity === "good" || q.polarity === "both") && (
                  <button className="btn gold px-3 py-1" onClick={() => habitTap(q.id, true)}>
                    +
                  </button>
                )}
                {q.kind === "habit" && (q.polarity === "bad" || q.polarity === "both") && (
                  <button className="btn danger px-3 py-1" onClick={() => habitTap(q.id, false)}>
                    −
                  </button>
                )}
                {q.kind === "daily" && !q.isMandatory && (
                  <button className="btn gold px-3 py-1" disabled={fractionFor(q, today) >= 1} onClick={() => logProgress(q.id, targetFor(q, today))}>
                    {fractionFor(q, today) >= 1 ? "✓" : "Done"}
                  </button>
                )}
                {q.kind === "todo" && (
                  <button className="btn gold px-3 py-1" onClick={() => completeTodo(q.id)}>
                    Done
                  </button>
                )}
                {!q.isMandatory && (
                  <button className="btn px-2 py-1 text-xs" onClick={() => removeQuest(q.id)} aria-label="remove">
                    x
                  </button>
                )}
              </li>
            );
          })}
          {list.length === 0 && (
            <li className="text-xs" style={{ color: "var(--text-dim)" }}>
              Nothing here yet.
            </li>
          )}
        </ul>

        <div className="mt-3 space-y-1 border-t pt-3" style={{ borderColor: "rgba(127,163,230,0.35)" }}>
          <input className="input py-1" placeholder={tab === "habit" ? "New habit (e.g. Drank water / Doomscrolled)" : tab === "daily" ? "New optional daily" : "New to-do"} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <div className="grid grid-cols-3 gap-1">
            <select className="input py-1" value={draft.stat} onChange={(e) => setDraft({ ...draft, stat: e.target.value as Stat })}>
              {STATS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select className="input py-1" value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as Difficulty })}>
              {DIFFS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            {tab === "habit" ? (
              <select className="input py-1" value={draft.polarity} onChange={(e) => setDraft({ ...draft, polarity: e.target.value as Polarity })}>
                <option value="good">good (+)</option>
                <option value="bad">bad (−)</option>
                <option value="both">both</option>
              </select>
            ) : tab === "todo" ? (
              <input className="input py-1" type="date" value={draft.dueAt} onChange={(e) => setDraft({ ...draft, dueAt: e.target.value })} />
            ) : (
              <span />
            )}
          </div>
          <button className="btn w-full" disabled={!draft.title.trim()} onClick={add}>
            Add
          </button>
        </div>
      </SystemWindow>

      {tab === "todo" && doneTodos.length > 0 && (
        <SystemWindow title="Completed">
          <ul className="space-y-1 text-xs" style={{ color: "var(--text-dim)" }}>
            {doneTodos.map((q) => (
              <li key={q.id}>● {q.title}</li>
            ))}
          </ul>
        </SystemWindow>
      )}
      <Nav />
    </div>
  );
}
