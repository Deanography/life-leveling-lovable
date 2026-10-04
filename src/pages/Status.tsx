import { Link } from "react-router-dom";
import { useGame } from "@/store/game";
import { SystemWindow } from "@/components/SystemWindow";
import { StatBar } from "@/components/StatBar";
import { Countdown } from "@/components/Countdown";
import { Nav } from "@/components/Nav";
import { HunterPortrait } from "@/components/HunterPortrait";
import { CLASS_NAMES } from "@/content/portraits";
import { CONFIG, STATS, activeKeyStat, dayEnd, isPenaltyZone, rankUpProgress, titleById, xpForLevel, type Stat } from "@/engine";
import { COPY } from "@/content/copy";

export default function StatusPage() {
  const player = useGame((s) => s.player);
  const quests = useGame((s) => s.quests);
  const fractionFor = useGame((s) => s.fractionFor);
  const todayKey = useGame((s) => s.todayKey);
  const allocate = useGame((s) => s.allocate);
  const reviveNow = useGame((s) => s.reviveNow);
  const logSleepHours = useGame((s) => s.logSleepHours);
  const dayLogs = useGame((s) => s.dayLogs);
  const counters = useGame((s) => s.counters);
  const maxHp = useGame((s) => s.maxHp);
  const spendKeyNow = useGame((s) => s.spendKeyNow);
  const shadows = useGame((s) => s.shadows);

  if (!player) return null;
  const hpMaxNow = maxHp();
  const prog = rankUpProgress(player, counters);
  const keyStat = activeKeyStat(player);
  const today = todayKey();
  const mandatory = quests.filter((q) => q.isMandatory);
  const done = mandatory.filter((q) => fractionFor(q, today) >= 1).length;
  const end = dayEnd(today, player.settings.dayStartHour);
  const zone = isPenaltyZone(player, new Date());
  const sleepLogged = dayLogs[today]?.sleepHours != null;

  return (
    <div className="space-y-4">
      <div data-tour="status">
      <SystemWindow title={COPY.statusTitle} tone={player.dead ? "red" : "blue"}>
        <div className="mb-3 flex items-baseline justify-between">
          <h1 className="display text-2xl">{player.name}</h1>
          <span className="display text-lg" style={{ color: "var(--gold)" }}>
            {player.rank}-Rank
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/hunter" className="w-24 shrink-0" aria-label="Hunter profile" data-tour="portrait">
            <HunterPortrait
              rank={player.rank}
              path={player.path.primary}
              shadows={shadows.filter((s) => s.active).length}
              titled={!!player.equippedTitleId}
              dead={player.dead}
            />
            <span className="display mt-1 block text-center text-[9px]" style={{ color: "var(--text-dim)" }}>
              {CLASS_NAMES[player.path.primary]}
            </span>
          </Link>
          <div className="min-w-0 flex-1">
            <StatBar label={`LV ${player.level}`} value={player.xp} max={xpForLevel(player.level)} color="var(--border)" />
            <StatBar label="HP" value={player.hp} max={hpMaxNow} color={player.hp < hpMaxNow * 0.3 ? "var(--red)" : "var(--green)"} />
            <StatBar label="Fatigue" value={player.fatigue} max={100} color="var(--fatigue)" right={String(player.fatigue)} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-1 text-center">
          {STATS.map((s) => (
            <button
              key={s}
              disabled={player.freePoints <= 0}
              onClick={() => allocate(s)}
              className="border px-1 py-2 disabled:border-transparent"
              style={{ borderColor: player.freePoints > 0 ? "var(--gold)" : undefined }}
            >
              <div className="display text-[10px]" style={{ color: "var(--text-dim)" }}>
                {s}
              </div>
              <div className="text-lg">{player.stats[s]}</div>
            </button>
          ))}
        </div>
        {player.freePoints > 0 && (
          <p className="mt-2 text-center text-xs" style={{ color: "var(--gold)" }}>
            {player.freePoints} ability point{player.freePoints > 1 ? "s" : ""} available. Tap a stat.
          </p>
        )}

        <div className="mt-4 flex justify-between text-sm">
          <span>
            Gold <b style={{ color: "var(--gold)" }}>{player.gold}</b>
          </span>
          <span>
            Streak <b>{player.streak}</b>
            {player.streakAtRisk && <span style={{ color: "var(--red)" }}> at risk</span>}
          </span>
          <span>
            Shields <b>{player.shields}</b>
          </span>
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--text-dim)" }}>
          Title: {titleById(player.equippedTitleId ?? "")?.name ?? "none"} · Potions {player.potions} · Keys {player.keys} · Shadows {shadows.filter((s) => s.active).length}
        </p>
        {keyStat && (
          <p className="mt-1 text-xs" style={{ color: "var(--gold)" }}>
            Instant Dungeon open: {keyStat} quests give double XP.
          </p>
        )}
      </SystemWindow>
      </div>

      {prog && (
        <SystemWindow title={`Rank-Up Gate · ${prog.target}`} tone="gold">
          <p className="text-xs">
            Perfect days in a row {prog.perfectRun} / {prog.perfectNeeded}
            {prog.bossesNeeded > 0 && ` · Bosses ${prog.bosses} / ${prog.bossesNeeded}`}
            {prog.statsNeeded > 0 && ` · Stats ≥ ${prog.statAtLeast}: ${prog.statsMet} / ${prog.statsNeeded}`}
          </p>
          <p className="mt-1 text-[10px]" style={{ color: "var(--text-dim)" }}>
            XP is 1.25x while the gate is open. A missed day resets the run, not the gate.
          </p>
        </SystemWindow>
      )}

      {player.keys > 0 && !keyStat && !player.dead && (
        <SystemWindow title="Instant Dungeon Key">
          <p className="mb-2 text-xs">Choose a stat. Its quests give double XP for 24 hours.</p>
          <div className="grid grid-cols-5 gap-1">
            {STATS.map((s) => (
              <button key={s} className="btn px-0 text-xs" onClick={() => spendKeyNow(s as Stat)}>
                {s}
              </button>
            ))}
          </div>
        </SystemWindow>
      )}

      {player.dead ? (
        <SystemWindow title="Revival" tone="red">
          <p className="mb-3 text-sm">You have died. Clear the revival quest: complete today&apos;s full Daily Quest at Penalty Zone targets.</p>
          <button className="btn danger w-full" onClick={reviveNow}>
            Accept revival quest
          </button>
        </SystemWindow>
      ) : (
        <Link to="/daily" className="block" data-tour="daily-strip">
          <SystemWindow title={COPY.daily.title} tone={zone ? "red" : done === mandatory.length ? "gold" : "blue"}>
            <div className="flex items-center justify-between">
              <span className="display text-lg">
                {done} / {mandatory.length}
              </span>
              <Countdown to={end} />
            </div>
            {zone && <p className="mt-2 text-xs" style={{ color: "var(--red)" }}>{COPY.daily.penaltyZone}</p>}
            {player.recoveryProtocol && <p className="mt-2 text-xs">{COPY.daily.recovery}</p>}
          </SystemWindow>
        </Link>
      )}

      {!sleepLogged && (
        <SystemWindow title="Report">
          <p className="mb-2 text-sm">Hours slept last night?</p>
          <div className="grid grid-cols-6 gap-1">
            {[4, 5, 6, 7, 8, 9].map((h) => (
              <button key={h} className="btn px-0" onClick={() => logSleepHours(h)}>
                {h}
              </button>
            ))}
          </div>
        </SystemWindow>
      )}

      {player.fatigue > CONFIG.fatigue.warn && (
        <p className="text-center text-xs" style={{ color: "var(--fatigue)" }}>
          Fatigue {player.fatigue}. {player.fatigue > CONFIG.fatigue.halveXp ? "XP gain reduced. Quest targets reduced." : "Rest is recommended."}
        </p>
      )}
      <Nav />
    </div>
  );
}
