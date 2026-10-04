import { useMemo, useState } from "react";
import { useGame } from "@/store/game";
import { SystemWindow } from "@/components/SystemWindow";
import { Nav } from "@/components/Nav";
import { LockedPage, useUnlocked } from "@/components/Locked";
import { addDays, weekKey } from "@/engine";

const DOW = ["M", "T", "W", "T", "F", "S", "S"];

export default function HistoryPage() {
  const player = useGame((s) => s.player);
  const featureOpen = useUnlocked("history");
  const dayLogs = useGame((s) => s.dayLogs);
  const xpByDay = useGame((s) => s.xpByDay);
  const gates = useGame((s) => s.gates);
  const prs = useGame((s) => s.prs);
  const todayKey = useGame((s) => s.todayKey);
  const [hover, setHover] = useState<string | null>(null);
  const today = todayKey();

  // 12 weeks of days ending today, laid out Monday-first in columns.
  const weeks = useMemo(() => {
    const end = new Date(today + "T12:00:00");
    const dowEnd = (end.getDay() + 6) % 7;
    const start = addDays(today, -(dowEnd + 7 * 11));
    const cols: string[][] = [];
    for (let w = 0; w < 12; w++) cols.push(Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
    return cols;
  }, [today]);

  const weekly = useMemo(() => {
    const map = new Map<string, number>();
    for (const col of weeks) map.set(weekKey(col[0]), 0);
    for (const [d, v] of Object.entries(xpByDay)) {
      const k = weekKey(d);
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + v.xp);
    }
    return Array.from(map.entries());
  }, [weeks, xpByDay]);
  const maxWeek = Math.max(1, ...weekly.map(([, v]) => v));

  if (!player) return null;
  if (!featureOpen) return <LockedPage id="history" />;
  const perfectCount = Object.values(dayLogs).filter((l) => l.perfect).length;
  const totalXp = Object.values(xpByDay).reduce((t, v) => t + v.xp, 0);
  const cleared = gates.filter((g) => g.endedAt && !g.abandoned).length;
  const prList = Object.entries(prs).sort((a, b) => (a[1].at < b[1].at ? 1 : -1)).slice(0, 8);
  const cell = (d: string) => {
    const l = dayLogs[d];
    if (d > today) return "transparent";
    if (l?.perfect) return "var(--border)";
    if (l?.restDay || l?.recoveryMode) return "rgba(127,163,230,0.35)";
    if (l?.closed && l.missed.length) return "rgba(239,68,68,0.55)";
    if ((xpByDay[d]?.xp ?? 0) > 0) return "rgba(59,130,246,0.45)";
    return "rgba(255,255,255,0.06)";
  };

  return (
    <div className="space-y-4">
      <SystemWindow title="Record">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            ["Perfect days", perfectCount],
            ["Best streak", player.bestStreak],
            ["Total XP", totalXp],
            ["Gates", cleared],
          ].map(([k, v]) => (
            <div key={String(k)}>
              <div className="display text-lg">{v}</div>
              <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                {k}
              </div>
            </div>
          ))}
        </div>
      </SystemWindow>

      <SystemWindow title="Last 12 weeks">
        <div className="flex gap-1">
          <div className="flex flex-col gap-[3px] pr-1 text-[9px]" style={{ color: "var(--text-dim)" }}>
            {DOW.map((d, i) => (
              <span key={i} className="flex h-[14px] items-center">
                {d}
              </span>
            ))}
          </div>
          <div className="flex flex-1 justify-between gap-[3px]">
            {weeks.map((col, w) => (
              <div key={w} className="flex flex-col gap-[3px]">
                {col.map((d) => (
                  <button
                    key={d}
                    aria-label={d}
                    className="h-[14px] w-[14px] rounded-[3px]"
                    style={{ background: cell(d), outline: hover === d ? "1px solid var(--text)" : "none" }}
                    onMouseEnter={() => setHover(d)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setHover(hover === d ? null : d)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 h-4 text-[10px]" style={{ color: "var(--text-dim)" }}>
          {hover
            ? `${hover}: ${dayLogs[hover]?.perfect ? "Perfect Day" : dayLogs[hover]?.restDay ? "rest day" : dayLogs[hover]?.closed && dayLogs[hover]?.missed.length ? `missed ${dayLogs[hover]!.missed.length}` : "no report"} · ${xpByDay[hover]?.xp ?? 0} XP`
            : "Blue: Perfect Day. Red: missed. Faint: rest or recovery."}
        </p>
      </SystemWindow>

      <SystemWindow title="XP per week">
        <div className="flex h-24 items-end gap-1">
          {weekly.map(([k, v]) => (
            <div key={k} className="group relative flex flex-1 flex-col items-center justify-end" title={`${k}: ${v} XP`}>
              <div className="w-full rounded-t-[4px]" style={{ height: `${Math.max(2, (v / maxWeek) * 88)}px`, background: "var(--border)" }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[9px]" style={{ color: "var(--text-dim)" }}>
          <span>{weekly[0]?.[0]}</span>
          <span>max {maxWeek} XP</span>
          <span>{weekly[weekly.length - 1]?.[0]}</span>
        </div>
      </SystemWindow>

      {prList.length > 0 && (
        <SystemWindow title="Records" tone="gold">
          <ul className="space-y-1 text-xs">
            {prList.map(([name, pr]) => (
              <li key={name} className="flex justify-between">
                <span>{name}</span>
                <span className="tabular-nums">
                  {pr.kg} kg × {pr.reps} <span style={{ color: "var(--text-dim)" }}>e1rm {pr.e1rm}</span>
                </span>
              </li>
            ))}
          </ul>
        </SystemWindow>
      )}
      <Nav />
    </div>
  );
}
