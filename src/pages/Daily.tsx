import { useGame } from "@/store/game";
import { SystemWindow } from "@/components/SystemWindow";
import { Countdown } from "@/components/Countdown";
import { Nav } from "@/components/Nav";
import { CONFIG, dayEnd, isPenaltyZone, questReward, type Quest } from "@/engine";
import { COPY } from "@/content/copy";
import { pathById } from "@/content/paths";

function step(q: Quest, target: number) {
  if (q.unit === "reps") return 5;
  if (q.unit === "min") return 5;
  if (q.unit === "km") return 0.5;
  if (q.unit === "h") return 1;
  return Math.max(1, Math.floor(target));
}

export default function DailyPage() {
  const player = useGame((s) => s.player);
  const quests = useGame((s) => s.quests);
  const completions = useGame((s) => s.completions);
  const targetFor = useGame((s) => s.targetFor);
  const todayKey = useGame((s) => s.todayKey);
  const logProgress = useGame((s) => s.logProgress);
  const dayLogs = useGame((s) => s.dayLogs);
  const attributeMiss = useGame((s) => s.attributeMiss);

  if (!player) return null;
  const today = todayKey();
  const mandatory = quests.filter((q) => q.kind === "daily" && q.isMandatory);
  const end = dayEnd(today, player.settings.dayStartHour);
  const zone = isPenaltyZone(player, new Date());
  const perfect = dayLogs[today]?.perfect;
  const totalXp = mandatory.reduce((s, q) => s + questReward(player, q).xp, 0) + CONFIG.perfectDayXp;
  const yesterday = Object.values(dayLogs)
    .filter((l) => l.closed && !l.perfect && l.missed.length && !l.missCause && !l.restDay && !l.recoveryMode)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];

  return (
    <div className="space-y-4">
      <SystemWindow title={COPY.daily.title} tone={zone ? "red" : perfect ? "gold" : "blue"}>
        <h1 className="display mb-1 text-lg">{pathById(player.path.primary).name}&apos;s Preparation</h1>
        <p className="mb-4 text-xs" style={{ color: "var(--text-dim)" }}>
          Time remaining <Countdown to={end} />
        </p>

        <ul className="space-y-3" data-tour="daily-list">
          {mandatory.map((q) => {
            const target = targetFor(q, today);
            const v = completions[today]?.[q.id] ?? 0;
            const doneItem = v >= target;
            const repair = player.streakAtRisk && player.repairItems?.includes(q.id);
            const shown = repair ? Math.round(target * CONFIG.penalties.repairReps * 10) / 10 : target;
            const inc = step(q, target);
            return (
              <li key={q.id} className="border px-3 py-2" style={{ borderColor: doneItem ? "var(--gold)" : "rgba(127,163,230,0.35)" }}>
                <div className="flex items-center justify-between">
                  <span>
                    {doneItem ? "●" : v > 0 ? "◐" : "○"} {q.title}
                    {repair && (
                      <span className="ml-1 text-[10px]" style={{ color: "var(--red)" }}>
                        repair 1.5x
                      </span>
                    )}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                    {q.stat}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="tabular-nums text-lg">
                    {v} / {shown} {q.unit !== "done" && q.unit !== "times" ? q.unit : ""}
                  </span>
                  <div className="flex gap-1">
                    {q.unit !== "done" && (
                      <button className="btn px-3 py-1" onClick={() => logProgress(q.id, v + inc)} disabled={doneItem}>
                        +{inc}
                      </button>
                    )}
                    <button className="btn gold px-3 py-1" onClick={() => logProgress(q.id, shown)} disabled={doneItem}>
                      Done
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-xs" style={{ color: "var(--text-dim)" }}>
          Reward {totalXp} XP · {CONFIG.perfectDayGold} G · Perfect Day
        </p>
        {!perfect && (
          <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>
            {player.streakAtRisk ? COPY.daily.atRisk : zone ? COPY.daily.penaltyZone : COPY.daily.warning}
          </p>
        )}
        {perfect && <p className="mt-1 text-xs" style={{ color: "var(--gold)" }}>{COPY.daily.complete}</p>}
      </SystemWindow>

      {yesterday && (
        <SystemWindow title="Report" tone="red">
          <p className="mb-2 text-sm">The Daily Quest on {yesterday.date} was not completed. Cause?</p>
          <div className="grid grid-cols-3 gap-1">
            <button className="btn" onClick={() => attributeMiss(yesterday.date, "choice")}>
              My choice
            </button>
            <button className="btn" onClick={() => attributeMiss(yesterday.date, "illness")}>
              Illness
            </button>
            <button className="btn" onClick={() => attributeMiss(yesterday.date, "external")}>
              External
            </button>
          </div>
        </SystemWindow>
      )}
      <Nav />
    </div>
  );
}
