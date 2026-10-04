import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { dexieStorage } from "@/db/db";
import {
  CONFIG,
  addStatXp,
  addXp,
  allocatePoint,
  applyFatigue,
  closeDay,
  dayKey,
  addDays,
  hpMax,
  isDeloadWeek,
  isPenaltyZone,
  logSleep,
  perfectDay,
  questReward,
  revive,
  scaledTarget,
  tryRepair,
  weekdayOf,
  abandonGate,
  buyPotion,
  buyShield,
  e1rm,
  equippedBuff,
  gateRank,
  gateReward,
  isPR,
  newlyUnlockedTitles,
  spendGold,
  statForGate,
  drinkPotion,
  activeKeyStat,
  applyGuards,
  beginRankUp,
  bossReward,
  damageBoss,
  daysBetween,
  demote,
  extractShadow,
  keyDropped,
  mergeBuffs,
  promote,
  rankUpEligible,
  rankUpProgress,
  recordRankUpDay,
  setShadowActive,
  shadowBuff,
  spendKey,
  weekKey,
  newlyUnlocked,
  CATALOG,
  buyTheme,
  rewardUnlocked,
  themeById,
  themeOwned,
} from "@/engine";
import type {
  FeatureId,
  ThemeId,
  Buff,
  Counters,
  Shadow,
  DayLog,
  ExerciseSet,
  Gate,
  GateType,
  MissCause,
  PR,
  PathId,
  Player,
  Quest,
  Redemption,
  RewardItem,
  Settings,
  Severity,
  Stat,
  SystemEvent,
} from "@/engine";
import { buildDailyQuest } from "@/content/paths";
import { COPY } from "@/content/copy";
import { templateById } from "@/content/gates";

export interface GameState {
  player: Player | null;
  quests: Quest[];
  /** dayKey -> questId -> logged value */
  completions: Record<string, Record<string, number>>;
  dayLogs: Record<string, DayLog>;
  lastClosedDay: string | null;
  events: SystemEvent[];
  hydrated: boolean;
  gates: Gate[];
  prs: Record<string, PR>;
  rewards: RewardItem[];
  redemptions: Redemption[];
  counters: Counters;
  shadows: Shadow[];
  xpByDay: Record<string, { xp: number; gold: number }>;
  lastSummaryWeek?: string;

  createPlayer: (input: { name: string; primary: PathId; secondary?: PathId; wakeTime: string; severity: Severity }) => void;
  todayKey: () => string;
  targetFor: (q: Quest, day?: string) => number;
  fractionFor: (q: Quest, day?: string) => number;
  logProgress: (questId: string, value: number) => void;
  closePendingDays: () => void;
  attributeMiss: (day: string, cause: MissCause) => void;
  allocate: (stat: Stat) => void;
  logSleepHours: (hours: number) => void;
  reviveNow: () => void;
  dismissEvent: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateQuest: (id: string, patch: Partial<Quest>) => void;
  removeQuest: (id: string) => void;
  addQuest: (q: Omit<Quest, "id" | "createdAt">) => void;
  resetAll: () => void;

  // Phase 1
  startGate: (input: { type: GateType; red: boolean; title: string; plannedMinutes: number; templateId?: string }) => string;
  addGateExercise: (gateId: string, name: string, targetSets: number, targetReps: number, restSec: number) => void;
  logSet: (gateId: string, exIdx: number, setIdx: number, patch: Partial<ExerciseSet>) => void;
  finishGate: (gateId: string) => void;
  abandonGateNow: (gateId: string) => void;
  lastSetsFor: (name: string) => ExerciseSet[] | undefined;
  habitTap: (questId: string, good: boolean) => void;
  completeTodo: (questId: string) => void;
  buyShieldNow: () => void;
  buyPotionNow: () => void;
  drinkPotionNow: () => void;
  addReward: (name: string, cost: number) => void;
  removeReward: (id: string) => void;
  redeemReward: (id: string) => void;
  equipTitle: (id?: string) => void;

  // Phase 2
  buff: () => Buff;
  maxHp: () => number;
  addBoss: (input: { title: string; stat: Stat; hpMax: number; unit: string; linkedQuestIds?: string[] }) => void;
  damageBossNow: (bossId: string, amount: number) => void;
  removeBoss: (bossId: string) => void;
  ariseShadow: (bossId: string) => void;
  toggleShadow: (id: string) => void;
  guardWith: (shadowId: string, questId?: string) => void;
  renameShadow: (id: string, name: string) => void;
  spendKeyNow: (stat: Stat) => void;
  importState: (json: string) => boolean;

  // Onboarding and rewards
  syncUnlocks: (silent?: boolean) => void;
  tutorialNext: () => void;
  tutorialSkip: () => void;
  replayTutorial: () => void;
  redeemCatalog: (id: string) => void;
  buyThemeNow: (id: ThemeId) => void;
  setTheme: (id: ThemeId) => void;
}

/** Number of steps in the first-run tour (see components/Tour.tsx). */
export const TOUR_LENGTH = 6;

const ZERO_COUNTERS: Counters = { gatesCleared: 0, redGatesCleared: 0, prCount: 0, revives: 0, earlyDays: 0, perfectDays: 0, todosDone: 0, bossesDefeated: 0, keysUsed: 0 };

const addLedger = (led: Record<string, { xp: number; gold: number }>, day: string, xp: number, gold: number) => ({ ...led, [day]: { xp: (led[day]?.xp ?? 0) + xp, gold: (led[day]?.gold ?? 0) + gold } });

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const event = (kind: SystemEvent["kind"], title: string, lines: string[]): SystemEvent => ({
  id: uid(),
  kind,
  title,
  lines,
  at: new Date().toISOString(),
});

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      player: null,
      quests: [],
      completions: {},
      dayLogs: {},
      lastClosedDay: null,
      events: [],
      hydrated: false,
      gates: [],
      prs: {},
      rewards: [],
      redemptions: [],
      counters: ZERO_COUNTERS,
      shadows: [],
      xpByDay: {},
      lastSummaryWeek: undefined,

      createPlayer: ({ name, primary, secondary, wakeTime, severity }) => {
        const now = new Date();
        const settings: Settings = {
          wakeTime,
          dayStartHour: 4,
          severity,
          restDays: [],
          sounds: true,
          haptics: true,
          reducedMotion: false,
          theme: "system",
        };
        const stats = { STR: 10, VIT: 10, AGI: 10, INT: 10, SENSE: 10 } as Record<Stat, number>;
        const player: Player = {
          id: uid(),
          name: name.trim() || "Hunter",
          createdAt: now.toISOString(),
          level: 1,
          xp: 0,
          totalXp: 0,
          stats,
          statXp: { STR: 0, VIT: 0, AGI: 0, INT: 0, SENSE: 0 },
          freePoints: 0,
          hp: 0,
          fatigue: 20,
          gold: 0,
          streak: 0,
          bestStreak: 0,
          shields: CONFIG.shields.start,
          consecutiveMisses: 0,
          streakAtRisk: false,
          recoveryProtocol: false,
          dead: false,
          lastActiveDay: dayKey(now, settings.dayStartHour),
          path: { primary, secondary },
          titles: [],
          potions: 0,
          rank: "E",
          keys: 0,
          unlocked: [],
          tutorial: { step: 0, done: false },
          themes: ["system"],
          settings,
        };
        player.hp = hpMax(player);
        if (severity === "hunter") player.shields = 1;
        const quests: Quest[] = buildDailyQuest(primary, secondary).map((t) => ({
          ...t,
          id: uid(),
          kind: "daily",
          isMandatory: true,
          createdAt: now.toISOString(),
        }));
        set({
          player,
          quests,
          completions: {},
          dayLogs: {},
          lastClosedDay: addDays(player.lastActiveDay, -1),
          events: [event("info", COPY.daily.title, [COPY.onboarding.arrived])],
          gates: [],
          prs: {},
          rewards: [],
          redemptions: [],
          counters: ZERO_COUNTERS,
          shadows: [],
          xpByDay: {},
          lastSummaryWeek: weekKey(player.lastActiveDay),
        });
      },

      todayKey: () => {
        const p = get().player;
        return dayKey(new Date(), p?.settings.dayStartHour ?? 4);
      },

      targetFor: (q, day) => {
        const p = get().player!;
        const d = day ?? get().todayKey();
        const now = new Date();
        return scaledTarget(q, {
          level: p.level,
          deload: isDeloadWeek(p.createdAt, d),
          penaltyZoneFactor: isPenaltyZone(p, now) ? CONFIG.penalties.penaltyZoneReps[p.settings.severity] : undefined,
          recoveryProtocol: p.recoveryProtocol,
          highFatigue: p.fatigue > CONFIG.fatigue.halveXp,
        });
      },

      fractionFor: (q, day) => {
        const d = day ?? get().todayKey();
        const v = get().completions[d]?.[q.id] ?? 0;
        const t = get().targetFor(q, d);
        return Math.min(1, t > 0 ? v / t : 0);
      },

      logProgress: (questId, value) => {
        const s = get();
        let p = s.player;
        if (!p || p.dead) return;
        const q = s.quests.find((x) => x.id === questId);
        if (!q) return;
        const day = s.todayKey();
        const target = s.targetFor(q, day);
        const before = Math.min(1, (s.completions[day]?.[questId] ?? 0) / target);
        const clamped = Math.max(0, Math.min(target, value));
        const after = Math.min(1, clamped / target);
        const events: SystemEvent[] = [];
        const buff = s.buff();
        const ctx = { titleXpMult: buff.xpMult, titleGoldMult: buff.goldMult, rankUpWeek: !!p.rankUp, keyStat: activeKeyStat(p) };
        if (after > before) {
          const r = questReward(p, q, after - before, ctx);
          const zone = isPenaltyZone(p, new Date());
          const { player: leveled, levelsGained } = addXp(p, zone && !q.isMandatory ? 0 : r.xp);
          const statMult = buff.statXpMult?.[q.stat] ?? 1;
          p = applyFatigue(addStatXp({ ...leveled, gold: leveled.gold + r.gold }, q.stat, Math.round((r.xp / 2) * statMult)), r.fatigue * (buff.fatigueMult ?? 1));
          for (let i = 0; i < levelsGained; i++) events.push(event("levelUp", "Level Up", COPY.events.levelUp(p.level - levelsGained + i + 1)));
          if (p.fatigue > CONFIG.fatigue.halveXp && leveled.fatigue <= CONFIG.fatigue.halveXp)
            events.push(event("warning", "Warning", COPY.events.fatigue(p.fatigue)));
        }
        let xpByDay = s.xpByDay;
        if (after > before) {
          const r = questReward(s.player!, q, after - before, ctx);
          xpByDay = addLedger(xpByDay, day, r.xp, r.gold);
        }
        const completions = { ...s.completions, [day]: { ...(s.completions[day] ?? {}), [questId]: clamped } };
        // Linked bosses take 1 damage when an item is completed.
        let quests = s.quests;
        let counters = s.counters;
        const pendingArise: string[] = [];
        if (after >= 1 && before < 1) {
          for (const b of quests.filter((x) => x.kind === "boss" && !x.defeatedAt && x.linkedQuestIds?.includes(questId))) {
            const { boss, defeated } = damageBoss(b, 1);
            quests = quests.map((x) => (x.id === b.id ? boss : x));
            if (defeated) pendingArise.push(b.id);
          }
        }
        // Perfect Day the moment every mandatory item hits 100%.
        const mandatory = quests.filter((x) => x.kind === "daily" && x.isMandatory);
        const allDone = mandatory.every((x) => (completions[day]?.[x.id] ?? 0) >= s.targetFor(x, day));
        let dayLogs = s.dayLogs;
        if (allDone && !s.dayLogs[day]?.perfect) {
          counters = { ...counters, perfectDays: counters.perfectDays + 1, earlyDays: counters.earlyDays + (new Date().getHours() < 8 ? 1 : 0) };
          xpByDay = addLedger(xpByDay, day, CONFIG.perfectDayXp, CONFIG.perfectDayGold);
          const wasAtRisk = p.streakAtRisk;
          const repairDone = wasAtRisk ? (p.repairItems ?? []).every((id) => (completions[day]?.[id] ?? 0) >= s.targetFor(mandatory.find((m) => m.id === id) ?? q, day) * CONFIG.penalties.repairReps) : false;
          p = tryRepair(p, repairDone, new Date());
          if (wasAtRisk && repairDone) events.push(event("repaired", "Streak", COPY.events.repaired));
          p = perfectDay(p);
          const { player: bonus, levelsGained } = addXp(p, CONFIG.perfectDayXp);
          p = bonus;
          for (let i = 0; i < levelsGained; i++) events.push(event("levelUp", "Level Up", COPY.events.levelUp(p.level - levelsGained + i + 1)));
          events.push(event("perfectDay", COPY.daily.title, COPY.events.perfectDay(p.streak)));
          if (p.streak === 7 && !p.titles.includes("awakened")) {
            p = { ...p, titles: [...p.titles, "awakened"], shields: Math.min(CONFIG.shields.max[p.settings.severity], p.shields + 1) };
            events.push(event("title", "Title", COPY.events.day7));
          }
          if (p.penaltyZoneUntil) p = { ...p, penaltyZoneUntil: undefined };
          dayLogs = { ...s.dayLogs, [day]: { date: day, perfect: true, closed: false, missed: [], restDay: false, recoveryMode: false, penaltyApplied: "none" } };
          // Rank-Up Gate: opens when eligible, and today's perfect day counts immediately.
          if (!p.rankUp && rankUpEligible(p)) {
            p = beginRankUp(p, day);
            events.push(event("rank", "Rank-Up Gate", COPY.events.rankUpOpen(p.rankUp!.target)));
          }
        }
        for (const id of pendingArise) {
          const b = quests.find((x) => x.id === id)!;
          const r = bossReward(b);
          const { player: lv, levelsGained } = addXp(p, r.xp);
          p = { ...lv, gold: lv.gold + r.gold };
          xpByDay = addLedger(xpByDay, day, r.xp, r.gold);
          counters = { ...counters, bossesDefeated: counters.bossesDefeated + 1 };
          events.push(event("boss", "Boss", COPY.events.bossDefeated(b.title, r.xp, r.gold)));
          for (let i = 0; i < levelsGained; i++) events.push(event("levelUp", "Level Up", COPY.events.levelUp(p.level - levelsGained + i + 1)));
        }
        const unlocked = newlyUnlockedTitles({ player: p, counters, prs: s.prs });
        for (const t of unlocked) {
          p = { ...p, titles: [...p.titles, t.id] };
          events.push(event("title", "Title", COPY.events.title(t.name)));
        }
        set({ player: { ...p, lastActiveDay: day }, quests, completions, dayLogs, counters, xpByDay, events: [...s.events, ...events] });
      },

      closePendingDays: () => {
        const s = get();
        let p = s.player;
        if (!p) return;
        const today = s.todayKey();
        let last = s.lastClosedDay ?? addDays(dayKey(new Date(p.createdAt), p.settings.dayStartHour), -1);
        const dayLogs = { ...s.dayLogs };
        const events: SystemEvent[] = [];
        const mandatory = s.quests.filter((q) => q.kind === "daily" && q.isMandatory);
        let shadows = s.shadows;
        const counters = s.counters;
        let guard = 0;
        while (addDays(last, 1) < today && guard++ < 60) {
          const day = addDays(last, 1);
          const existing = dayLogs[day];
          if (existing?.closed) {
            last = day;
            continue;
          }
          if (existing?.perfect) {
            dayLogs[day] = { ...existing, closed: true };
            p = { ...p, rankUp: recordRankUpDay(p.rankUp, true) };
            last = day;
            continue;
          }
          const fractions: Record<string, number> = {};
          for (const q of mandatory) fractions[q.id] = s.fractionFor(q, day);
          // Shadows guarding a quest absorb its miss once a week.
          const missedIds = mandatory.filter((q) => (fractions[q.id] ?? 0) < 1).map((q) => q.id);
          const g = applyGuards(shadows, missedIds, day);
          shadows = g.shadows;
          for (const id of g.absorbed) fractions[id] = 1;
          const restDay = p.settings.restDays.includes(weekdayOf(day));
          const hpBefore = p.hp;
          const { player, log } = closeDay(p, day, mandatory, fractions, { restDay, recoveryMode: existing?.recoveryMode ?? false, sleepHours: existing?.sleepHours }, s.buff().hpLossMult ?? 1);
          p = player;
          dayLogs[day] = log;
          if (g.absorbed.length) events.push(event("info", "Shadow", COPY.events.guardAbsorbed(g.absorbed.length)));
          p = { ...p, rankUp: recordRankUpDay(p.rankUp, log.perfect || restDay || (existing?.recoveryMode ?? false)) };
          // Inactivity demotion: exactly 14 days after the last active day.
          if (daysBetween(p.lastActiveDay, day) === CONFIG.penalties.inactiveDaysToDemote && p.rank !== "E") {
            p = demote(p);
            events.push(event("rank", "Rank", COPY.events.demoted(p.rank)));
          }
          const lost = hpBefore - p.hp;
          switch (log.penaltyApplied) {
            case "atRisk": events.push(event("atRisk", "Penalty", COPY.events.atRisk)); break;
            case "shield": events.push(event("info", "Streak Shield", COPY.events.shield)); break;
            case "penaltyZone": events.push(event("penalty", "Penalty", COPY.events.penaltyZone(lost))); break;
            case "hp": events.push(event("penalty", "Penalty", [`Penalty applied. HP -${lost}.`])); break;
            case "recoveryProtocol": events.push(event("penalty", "Penalty", COPY.events.recovery(lost))); break;
            case "death": events.push(event("death", "The System", COPY.events.death)); break;
          }
          last = day;
        }
        // Rank-Up promotion check
        const prog = rankUpProgress(p, counters);
        if (prog?.met) {
          p = promote(p);
          events.push(event("rank", "Rank", COPY.events.promoted(p.rank)));
        }
        // Monday summary: once per week, for the previous week.
        const wk = weekKey(today);
        let lastSummaryWeek = s.lastSummaryWeek;
        if (lastSummaryWeek && lastSummaryWeek !== wk && daysBetween(p.createdAt.slice(0, 10), today) >= 7) {
          const days = Object.keys(dayLogs).filter((d) => weekKey(d) === lastSummaryWeek);
          const perfect = days.filter((d) => dayLogs[d].perfect).length;
          const xp = Object.entries(s.xpByDay).filter(([d]) => weekKey(d) === lastSummaryWeek).reduce((t, [, v]) => t + v.xp, 0);
          const gatesN = s.gates.filter((gt) => gt.endedAt && !gt.abandoned && weekKey(gt.endedAt.slice(0, 10)) === lastSummaryWeek).length;
          const prsN = Object.values(s.prs).filter((pr) => weekKey(pr.at.slice(0, 10)) === lastSummaryWeek).length;
          events.push(event("summary", "Weekly Report", COPY.events.weekly(perfect, xp, gatesN, prsN, p.streak)));
        }
        lastSummaryWeek = wk;
        if (last !== s.lastClosedDay || events.length || lastSummaryWeek !== s.lastSummaryWeek)
          set({ player: p, dayLogs, lastClosedDay: last, shadows, counters, lastSummaryWeek, events: [...s.events, ...events] });
      },

      attributeMiss: (day, cause) => {
        const s = get();
        const log = s.dayLogs[day];
        if (!log || !s.player) return;
        let p = s.player;
        const dayLogs = { ...s.dayLogs, [day]: { ...log, missCause: cause } };
        if (cause === "illness" && !log.recoveryMode) {
          // Retroactive Recovery Mode: undo the At Risk state for a single first miss.
          dayLogs[day] = { ...dayLogs[day], recoveryMode: true, penaltyApplied: "none" };
          if (log.penaltyApplied === "atRisk") p = { ...p, streakAtRisk: false, consecutiveMisses: 0, repairUntil: undefined, repairItems: undefined };
        }
        set({ player: p, dayLogs });
      },

      allocate: (stat) => {
        const p = get().player;
        if (!p) return;
        const next = allocatePoint(p, stat);
        set({ player: { ...next, hp: Math.min(next.hp, hpMax(next)) } });
      },

      logSleepHours: (hours) => {
        const s = get();
        if (!s.player) return;
        const day = s.todayKey();
        const sleepQuest = s.quests.find((q) => q.isRecovery && q.unit === "h");
        if (sleepQuest) s.logProgress(sleepQuest.id, hours);
        const p = logSleep(get().player!, hours);
        const prev = get().dayLogs[day] ?? { date: day, perfect: false, closed: false, missed: [], restDay: false, recoveryMode: false };
        set({ player: p, dayLogs: { ...get().dayLogs, [day]: { ...prev, sleepHours: hours } } });
      },

      reviveNow: () => {
        const s = get();
        const p = s.player;
        if (!p?.dead) return;
        const counters = { ...s.counters, revives: s.counters.revives + 1 };
        let next = revive(p);
        const events: SystemEvent[] = [];
        for (const t of newlyUnlockedTitles({ player: next, counters, prs: s.prs })) {
          next = { ...next, titles: [...next.titles, t.id] };
          events.push(event("title", "Title", COPY.events.title(t.name)));
        }
        set({ player: next, counters, events: [...s.events, ...events] });
      },

      dismissEvent: () => set((s) => ({ events: s.events.slice(1) })),

      updateSettings: (patch) => {
        const p = get().player;
        if (!p) return;
        set({ player: { ...p, settings: { ...p.settings, ...patch } } });
      },

      updateQuest: (id, patch) => set((s) => ({ quests: s.quests.map((q) => (q.id === id ? { ...q, ...patch } : q)) })),
      removeQuest: (id) => set((s) => ({ quests: s.quests.filter((q) => q.id !== id) })),
      addQuest: (q) =>
        set((s) => ({
          quests: s.quests.filter((x) => x.isMandatory).length >= 5 && q.isMandatory ? s.quests : [...s.quests, { ...q, id: uid(), createdAt: new Date().toISOString() }],
        })),

      resetAll: () => set({ player: null, quests: [], completions: {}, dayLogs: {}, lastClosedDay: null, events: [], gates: [], prs: {}, rewards: [], redemptions: [], counters: ZERO_COUNTERS, shadows: [], xpByDay: {}, lastSummaryWeek: undefined }),

      // ---------- Phase 1: Gates ----------
      startGate: ({ type, red, title, plannedMinutes, templateId }) => {
        const s = get();
        const id = uid();
        const tpl = templateId ? templateById(templateId) : undefined;
        const gate: Gate = {
          id,
          type,
          red,
          title: title.trim() || (tpl?.name ?? (type === "focus" ? "Focus Gate" : type === "grind" ? "Grind Gate" : "Training Gate")),
          plannedMinutes,
          startedAt: new Date().toISOString(),
          templateId,
          exercises: type === "training" ? (tpl?.exercises ?? []).map((e) => ({ name: e.name, targetSets: e.sets, targetReps: e.reps, restSec: e.restSec, note: e.note, sets: [] })) : undefined,
        };
        set({ gates: [...s.gates, gate], events: [...s.events, event("gate", "Gate", COPY.events.gateOpen(gateRank(plannedMinutes), red))] });
        return id;
      },

      addGateExercise: (gateId, name, targetSets, targetReps, restSec) =>
        set((s) => ({
          gates: s.gates.map((g) => (g.id === gateId ? { ...g, exercises: [...(g.exercises ?? []), { name: name.trim(), targetSets, targetReps, restSec, sets: [] }] } : g)),
        })),

      logSet: (gateId, exIdx, setIdx, patch) => {
        const s = get();
        const g = s.gates.find((x) => x.id === gateId);
        if (!g || g.endedAt || !g.exercises?.[exIdx]) return;
        const ex = g.exercises[exIdx];
        const sets = [...ex.sets];
        while (sets.length <= setIdx) sets.push({ reps: ex.targetReps, kg: 0, done: false });
        sets[setIdx] = { ...sets[setIdx], ...patch };
        const exercises = g.exercises.map((e, i) => (i === exIdx ? { ...e, sets } : e));
        let prs = s.prs;
        let counters = s.counters;
        let gatePrs = g.prs ?? [];
        const events: SystemEvent[] = [];
        const set_ = sets[setIdx];
        if (patch.done && set_.kg > 0 && isPR(prs[ex.name], set_.kg, set_.reps)) {
          prs = { ...prs, [ex.name]: { kg: set_.kg, reps: set_.reps, e1rm: e1rm(set_.kg, set_.reps), at: new Date().toISOString() } };
          counters = { ...counters, prCount: counters.prCount + 1 };
          if (!gatePrs.includes(ex.name)) gatePrs = [...gatePrs, ex.name];
          events.push(event("pr", "Record", COPY.events.pr(ex.name, set_.kg, set_.reps)));
        }
        set({ gates: s.gates.map((x) => (x.id === gateId ? { ...x, exercises, prs: gatePrs } : x)), prs, counters, events: [...s.events, ...events] });
      },

      finishGate: (gateId) => {
        const s = get();
        let p = s.player;
        const g = s.gates.find((x) => x.id === gateId);
        if (!p || !g || g.endedAt) return;
        const now = new Date();
        const buff = s.buff();
        const zone = isPenaltyZone(p, now);
        const r = gateReward(p, g, now, { titleXpMult: buff.xpMult, titleGoldMult: buff.goldMult, rankUpWeek: !!p.rankUp, keyStat: activeKeyStat(p, now) });
        const xp = zone ? 0 : r.xp;
        const { player: leveled, levelsGained } = addXp(p, xp);
        const stat = statForGate(g.type);
        p = applyFatigue(addStatXp({ ...leveled, gold: leveled.gold + r.gold }, stat, Math.round((xp / 2) * (buff.statXpMult?.[stat] ?? 1))), r.fatigue * (buff.fatigueMult ?? 1));
        const events: SystemEvent[] = [event("gate", "Gate", COPY.events.gateCleared(xp, r.gold))];
        for (let i = 0; i < levelsGained; i++) events.push(event("levelUp", "Level Up", COPY.events.levelUp(p.level - levelsGained + i + 1)));
        const counters = { ...s.counters, gatesCleared: s.counters.gatesCleared + 1, redGatesCleared: s.counters.redGatesCleared + (g.red ? 1 : 0) };
        for (const t of newlyUnlockedTitles({ player: p, counters, prs: s.prs })) {
          p = { ...p, titles: [...p.titles, t.id] };
          events.push(event("title", "Title", COPY.events.title(t.name)));
        }
        if (xp > 0 && keyDropped(p, Math.random(), buff.keyChanceBonus ?? 0)) {
          p = { ...p, keys: p.keys + 1 };
          events.push(event("key", "Drop", COPY.events.keyDrop));
        }
        set({
          player: { ...p, lastActiveDay: s.todayKey() },
          counters,
          xpByDay: addLedger(s.xpByDay, s.todayKey(), xp, r.gold),
          gates: s.gates.map((x) => (x.id === gateId ? { ...x, endedAt: now.toISOString(), rewards: { ...r, xp } } : x)),
          events: [...s.events, ...events],
        });
      },

      abandonGateNow: (gateId) => {
        const s = get();
        const g = s.gates.find((x) => x.id === gateId);
        if (!s.player || !g || g.endedAt) return;
        const p = abandonGate(s.player, g);
        set({
          player: p,
          gates: s.gates.map((x) => (x.id === gateId ? { ...x, endedAt: new Date().toISOString(), abandoned: true } : x)),
          events: [...s.events, event(g.red ? "penalty" : "info", "Gate", COPY.events.gateAbandoned(g.red))],
        });
      },

      lastSetsFor: (name) => {
        const done = get()
          .gates.filter((g) => g.endedAt && !g.abandoned && g.exercises?.some((e) => e.name === name && e.sets.some((x) => x.done)))
          .sort((a, b) => (a.endedAt! < b.endedAt! ? 1 : -1));
        return done[0]?.exercises?.find((e) => e.name === name)?.sets.filter((x) => x.done);
      },

      // ---------- Phase 1: Habits and To-dos ----------
      habitTap: (questId, good) => {
        const s = get();
        let p = s.player;
        const q = s.quests.find((x) => x.id === questId && x.kind === "habit");
        if (!p || p.dead || !q) return;
        const events: SystemEvent[] = [];
        if (good) {
          const buff = s.buff();
          const r = questReward(p, q, 1, { titleXpMult: buff.xpMult, titleGoldMult: buff.goldMult, rankUpWeek: !!p.rankUp, keyStat: activeKeyStat(p) });
          const xp = isPenaltyZone(p, new Date()) ? 0 : r.xp;
          const { player: leveled, levelsGained } = addXp(p, xp);
          p = applyFatigue(addStatXp({ ...leveled, gold: leveled.gold + r.gold }, q.stat, Math.round(xp / 2)), r.fatigue);
          for (let i = 0; i < levelsGained; i++) events.push(event("levelUp", "Level Up", COPY.events.levelUp(p.level - levelsGained + i + 1)));
        } else {
          p = { ...p, hp: Math.max(0, p.hp - CONFIG.habits.badHp), statXp: { ...p.statXp, [q.stat]: Math.max(0, p.statXp[q.stat] - CONFIG.habits.badStatXp) } };
        }
        const day = s.todayKey();
        const prev = s.completions[day]?.[questId] ?? 0;
        let quests = s.quests;
        let counters = s.counters;
        let xpByDay = s.xpByDay;
        if (good) {
          const r = questReward(s.player!, q, 1, { titleXpMult: s.buff().xpMult });
          xpByDay = addLedger(xpByDay, day, isPenaltyZone(s.player!, new Date()) ? 0 : r.xp, r.gold);
          for (const b of quests.filter((x) => x.kind === "boss" && !x.defeatedAt && x.linkedQuestIds?.includes(questId))) {
            const { boss, defeated } = damageBoss(b, 1);
            quests = quests.map((x) => (x.id === b.id ? boss : x));
            if (defeated) {
              const br = bossReward(boss);
              const { player: lv, levelsGained } = addXp(p, br.xp);
              p = { ...lv, gold: lv.gold + br.gold };
              xpByDay = addLedger(xpByDay, day, br.xp, br.gold);
              counters = { ...counters, bossesDefeated: counters.bossesDefeated + 1 };
              events.push(event("boss", "Boss", COPY.events.bossDefeated(boss.title, br.xp, br.gold)));
              for (let i = 0; i < levelsGained; i++) events.push(event("levelUp", "Level Up", COPY.events.levelUp(p.level - levelsGained + i + 1)));
            }
          }
        }
        set({ player: p, quests, counters, xpByDay, completions: { ...s.completions, [day]: { ...(s.completions[day] ?? {}), [questId]: prev + (good ? 1 : -1) } }, events: [...s.events, ...events] });
      },

      completeTodo: (questId) => {
        const s = get();
        let p = s.player;
        const q = s.quests.find((x) => x.id === questId && x.kind === "todo");
        if (!p || p.dead || !q || q.doneAt) return;
        const buff = s.buff();
        const r = questReward(p, q, 1, { titleXpMult: buff.xpMult, titleGoldMult: buff.goldMult, rankUpWeek: !!p.rankUp, keyStat: activeKeyStat(p) });
        const xp = isPenaltyZone(p, new Date()) ? 0 : r.xp;
        const { player: leveled, levelsGained } = addXp(p, xp);
        p = applyFatigue(addStatXp({ ...leveled, gold: leveled.gold + r.gold }, q.stat, Math.round(xp / 2)), r.fatigue);
        const events: SystemEvent[] = [];
        for (let i = 0; i < levelsGained; i++) events.push(event("levelUp", "Level Up", COPY.events.levelUp(p.level - levelsGained + i + 1)));
        set({
          player: p,
          quests: s.quests.map((x) => (x.id === questId ? { ...x, doneAt: new Date().toISOString() } : x)),
          counters: { ...s.counters, todosDone: s.counters.todosDone + 1 },
          xpByDay: addLedger(s.xpByDay, s.todayKey(), xp, r.gold),
          events: [...s.events, ...events],
        });
      },

      // ---------- Phase 1: Shop and Titles ----------
      buyShieldNow: () => {
        const p = get().player;
        if (!p) return;
        set({ player: buyShield(p, get().buff().shieldSlots ?? 0) });
      },
      buyPotionNow: () => {
        const p = get().player;
        if (p) set({ player: buyPotion(p) });
      },
      drinkPotionNow: () => {
        const p = get().player;
        if (p) set({ player: drinkPotion(p) });
      },
      addReward: (name, cost) => set((s) => (name.trim() ? { rewards: [...s.rewards, { id: uid(), name: name.trim(), cost: Math.max(1, Math.round(cost)) }] } : {})),
      removeReward: (id) => set((s) => ({ rewards: s.rewards.filter((r) => r.id !== id) })),
      redeemReward: (id) => {
        const s = get();
        const r = s.rewards.find((x) => x.id === id);
        if (!s.player || !r) return;
        const p = spendGold(s.player, r.cost);
        if (!p) return;
        set({
          player: p,
          redemptions: [...s.redemptions, { id: uid(), name: r.name, cost: r.cost, at: new Date().toISOString() }],
          events: [...s.events, event("info", "Shop", [`${r.name} redeemed.`, `Gold -${r.cost}.`])],
        });
      },
      equipTitle: (id) => {
        const p = get().player;
        if (!p) return;
        if (id && !p.titles.includes(id)) return;
        set({ player: { ...p, equippedTitleId: id } });
      },

      // ---------- Phase 2 ----------
      buff: () => {
        const s = get();
        return s.player ? mergeBuffs(equippedBuff(s.player), shadowBuff(s.shadows)) : {};
      },
      maxHp: () => {
        const s = get();
        return s.player ? hpMax(s.player, s.buff().hpMaxBonus ?? 0) : 0;
      },

      addBoss: ({ title, stat, hpMax: hp, unit, linkedQuestIds }) =>
        set((s) => {
          if (!title.trim() || hp < 1) return {};
          if (s.quests.filter((q) => q.kind === "boss" && !q.defeatedAt).length >= CONFIG.bosses.maxActive) return {};
          const boss: Quest = { id: uid(), kind: "boss", title: title.trim(), stat, difficulty: "boss", baseTarget: hp, unit: "done", scaling: "none", isMandatory: false, bossHpMax: Math.round(hp), bossHp: Math.round(hp), bossUnit: unit, linkedQuestIds, createdAt: new Date().toISOString() };
          return { quests: [...s.quests, boss] };
        }),

      damageBossNow: (bossId, amount) => {
        const s = get();
        let p = s.player;
        const b = s.quests.find((q) => q.id === bossId && q.kind === "boss");
        if (!p || p.dead || !b || b.defeatedAt || amount <= 0) return;
        const { boss, defeated } = damageBoss(b, amount);
        const events: SystemEvent[] = [];
        let counters = s.counters;
        let xpByDay = s.xpByDay;
        if (defeated) {
          const r = bossReward(boss);
          const { player: lv, levelsGained } = addXp(p, r.xp);
          p = { ...lv, gold: lv.gold + r.gold };
          xpByDay = addLedger(xpByDay, s.todayKey(), r.xp, r.gold);
          counters = { ...counters, bossesDefeated: counters.bossesDefeated + 1 };
          events.push(event("boss", "Boss", COPY.events.bossDefeated(boss.title, r.xp, r.gold)));
          for (let i = 0; i < levelsGained; i++) events.push(event("levelUp", "Level Up", COPY.events.levelUp(p.level - levelsGained + i + 1)));
        }
        set({ player: p, counters, xpByDay, quests: s.quests.map((q) => (q.id === bossId ? boss : q)), events: [...s.events, ...events] });
      },

      removeBoss: (bossId) => set((s) => ({ quests: s.quests.filter((q) => q.id !== bossId) })),

      ariseShadow: (bossId) => {
        const s = get();
        const b = s.quests.find((q) => q.id === bossId && q.kind === "boss");
        if (!s.player || !b?.defeatedAt || b.shadowId) return;
        const shadow = extractShadow(b, s.shadows, uid());
        const shadows = setShadowActive([...s.shadows, shadow], shadow.id, true, s.player.level);
        set({
          shadows,
          quests: s.quests.map((q) => (q.id === bossId ? { ...q, shadowId: shadow.id } : q)),
          events: [...s.events, event("arise", "Arise", COPY.events.arise(shadow.name))],
        });
      },

      toggleShadow: (id) =>
        set((s) => {
          const sh = s.shadows.find((x) => x.id === id);
          if (!sh || !s.player) return {};
          return { shadows: setShadowActive(s.shadows, id, !sh.active, s.player.level) };
        }),
      guardWith: (shadowId, questId) => set((s) => ({ shadows: s.shadows.map((x) => (x.id === shadowId ? { ...x, guardingQuestId: questId } : x)) })),
      renameShadow: (id, name) => set((s) => (name.trim() ? { shadows: s.shadows.map((x) => (x.id === id ? { ...x, name: name.trim().slice(0, 20) } : x)) } : {})),

      spendKeyNow: (stat) => {
        const s = get();
        if (!s.player || s.player.keys <= 0 || activeKeyStat(s.player)) return;
        set({ player: spendKey(s.player, stat), counters: { ...s.counters, keysUsed: s.counters.keysUsed + 1 }, events: [...s.events, event("key", "Instant Dungeon", COPY.events.keyUsed(stat))] });
      },

      importState: (json) => {
        try {
          const raw = JSON.parse(json) as Partial<GameState>;
          const st = (raw && typeof raw === "object" && "player" in raw ? raw : null) as Partial<GameState> | null;
          if (!st?.player?.id) return false;
          set({
            player: { ...st.player, potions: st.player.potions ?? 0, rank: st.player.rank ?? "E", keys: st.player.keys ?? 0, unlocked: st.player.unlocked ?? [], tutorial: st.player.tutorial ?? { step: null, done: true }, themes: st.player.themes ?? ["system"] },
            quests: st.quests ?? [],
            completions: st.completions ?? {},
            dayLogs: st.dayLogs ?? {},
            lastClosedDay: st.lastClosedDay ?? null,
            events: [],
            gates: st.gates ?? [],
            prs: st.prs ?? {},
            rewards: st.rewards ?? [],
            redemptions: st.redemptions ?? [],
            counters: { ...ZERO_COUNTERS, ...(st.counters ?? {}) },
            shadows: st.shadows ?? [],
            xpByDay: st.xpByDay ?? {},
            lastSummaryWeek: st.lastSummaryWeek,
          });
          return true;
        } catch {
          return false;
        }
      },

      // ---------- Onboarding: unlocks and tour ----------
      syncUnlocks: (silent = false) => {
        const s = get();
        const p = s.player;
        if (!p) return;
        const ids = newlyUnlocked({
          player: p,
          counters: s.counters,
          hasGates: s.gates.length > 0,
          hasSideQuests: s.quests.some((q) => q.kind === "habit" || q.kind === "todo" || (q.kind === "daily" && !q.isMandatory)),
          hasBosses: s.quests.some((q) => q.kind === "boss"),
          shadowCount: s.shadows.length,
        });
        if (!ids.length) return;
        const events = silent ? [] : ids.map((id: FeatureId) => event("unlock", "Unlocked", COPY.unlocks[id]));
        set({ player: { ...p, unlocked: [...p.unlocked, ...ids] }, events: [...s.events, ...events] });
      },
      tutorialNext: () => {
        const p = get().player;
        if (!p || p.tutorial.done || p.tutorial.step === null) return;
        const step = p.tutorial.step + 1;
        set({ player: { ...p, tutorial: step >= TOUR_LENGTH ? { step: null, done: true } : { step, done: false } } });
      },
      tutorialSkip: () => {
        const p = get().player;
        if (p) set({ player: { ...p, tutorial: { step: null, done: true } } });
      },
      replayTutorial: () => {
        const p = get().player;
        if (p) set({ player: { ...p, tutorial: { step: 0, done: false } } });
      },

      // ---------- Rewards catalogue and themes ----------
      redeemCatalog: (id) => {
        const s = get();
        const r = CATALOG.find((x) => x.id === id);
        if (!s.player || !r || !rewardUnlocked(s.player, r)) return;
        const p = spendGold(s.player, r.cost);
        if (!p) return;
        set({
          player: p,
          redemptions: [...s.redemptions, { id: uid(), name: r.name, cost: r.cost, at: new Date().toISOString() }],
          events: [...s.events, event("info", "Reward", COPY.events.redeemed(r.name, r.cost))],
        });
      },
      buyThemeNow: (id) => {
        const p = get().player;
        if (!p) return;
        const next = buyTheme(p, id);
        if (next !== p) set({ player: { ...next, settings: { ...next.settings, theme: id } } });
      },
      setTheme: (id) => {
        const p = get().player;
        if (!p || !themeOwned(p, themeById(id))) return;
        set({ player: { ...p, settings: { ...p.settings, theme: id } } });
      },
    }),
    {
      name: "life-leveling",
      version: 4,
      storage: createJSONStorage(() => dexieStorage),
      partialize: (s) => ({
        player: s.player,
        quests: s.quests,
        completions: s.completions,
        dayLogs: s.dayLogs,
        lastClosedDay: s.lastClosedDay,
        events: s.events,
        gates: s.gates,
        prs: s.prs,
        rewards: s.rewards,
        redemptions: s.redemptions,
        counters: s.counters,
        shadows: s.shadows,
        xpByDay: s.xpByDay,
        lastSummaryWeek: s.lastSummaryWeek,
      }),
      migrate: (persisted) => {
        const st = persisted as Partial<GameState>;
        const player = st.player
          ? {
              ...st.player,
              potions: st.player.potions ?? 0,
              rank: st.player.rank ?? "E",
              keys: st.player.keys ?? 0,
              titles: (st.player.titles ?? []).map((t) => (t === "Awakened" ? "awakened" : t)),
              // Existing hunters see the new tour once; unlocks are filled in silently on load.
              unlocked: st.player.unlocked ?? [],
              tutorial: st.player.tutorial ?? { step: 0, done: false },
              themes: st.player.themes ?? ["system"],
              settings: { ...st.player.settings, theme: st.player.settings?.theme ?? "system" },
            }
          : null;
        return {
          ...st,
          player,
          quests: (st.quests ?? []).map((q) => ({ ...q, kind: q.kind ?? "daily" })),
          gates: st.gates ?? [],
          prs: st.prs ?? {},
          rewards: st.rewards ?? [],
          redemptions: st.redemptions ?? [],
          counters: { ...ZERO_COUNTERS, ...(st.counters ?? {}) },
          shadows: st.shadows ?? [],
          xpByDay: st.xpByDay ?? {},
          lastSummaryWeek: st.lastSummaryWeek,
        } as GameState;
      },
      onRehydrateStorage: () => (state) => {
        state?.closePendingDays();
        // First load after an update: grant already-earned features without a flood of popups.
        if (state?.player && state.player.unlocked.length === 0) state.syncUnlocks(true);
        useGame.setState({ hydrated: true });
      },
    },
  ),
);
