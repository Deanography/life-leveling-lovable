import { useGame } from "@/store/game";
import { SystemWindow } from "@/components/SystemWindow";
import { Nav } from "@/components/Nav";
import { featureRule, type FeatureId } from "@/engine";

interface Entry {
  title: string;
  feature?: FeatureId;
  body: string[];
}

const ENTRIES: Entry[] = [
  { title: "Daily Quest", body: ["Your mandatory items for the day. Finish all of them before the timer runs out for a Perfect Day, bonus XP and a longer streak.", "Targets for reps and distance grow with your level. Every fourth week is a lighter deload week."] },
  { title: "Penalties", body: ["Miss one day and your streak is at risk, not lost. Repair it by clearing the next Daily Quest plus the missed item at 1.5x.", "Miss two days in a row and you lose HP and enter the Penalty Zone: harder targets and no XP from other sources until you clear it.", "Three or more misses switch on Recovery Protocol, a reduced quest to help you get back. At 0 HP you die: Gold halves and the streak resets, but levels are never lost.", "Mark a missed day as illness and it never counts against you."] },
  { title: "Stats and levels", body: ["STR, VIT, AGI, INT and SENSE grow as you complete quests tagged with them. Each level gives 3 ability points to place anywhere.", "VIT raises max HP and speeds Fatigue recovery. INT raises Gold. SENSE raises key drops."] },
  { title: "Fatigue", body: ["Every quest and Gate adds Fatigue. Sleep, rest days and recovery items lower it.", "Above 80, XP is halved and targets drop. Above 95, Gates lock until you rest."] },
  { title: "Streak Shields", body: ["A shield absorbs one missed day automatically. You start with 2, earn one every 7-day streak, and can buy more in the Shop."] },
  { title: "Ranks", body: ["E, D, C, B, A, S, then National. Reaching a level band opens a Rank-Up Gate: a run of Perfect Days plus bosses and stats for higher ranks.", "XP is 1.25x while the gate is open. Fourteen days with no activity drops one rank."] },
  { title: "Class art", body: ["Your portrait evolves at C-Rank and again at A-Rank. See your full line on the Hunter page by tapping your portrait."] },
  { title: "Shop and rewards", feature: "shop", body: ["Spend Gold on real rewards you have earned: small ones anytime, medium from level 5, large from C-Rank.", "Streak Shields, HP Potions and colour themes are here too. XP is never spent."] },
  { title: "Gates", feature: "gates", body: ["Focus and Grind Gates are timed work sessions with a boss phase in the last 5 minutes. Training Gates log your sets, reps and kg, with last session's numbers shown and personal records detected.", "Red Gates pay 25% more, but leaving early costs 25 HP."] },
  { title: "Quest Log", feature: "quests", body: ["Habits you tap + or −, optional dailies, and one-off to-dos. Extra XP with no penalties."] },
  { title: "Titles", feature: "titles", body: ["Earned from achievements. Equip one at a time for a passive bonus such as more XP or less HP loss."] },
  { title: "Boss Quests", feature: "bosses", body: ["Turn a big goal into a boss with an HP bar: 30 days alcohol-free, 12 course modules, 20 quotes sent.", "Strike it as you make progress, or link habits so each completion deals damage."] },
  { title: "Shadow Army", feature: "shadows", body: ["A defeated boss can rise as a Shadow with a permanent bonus. One slot per 10 levels.", "A Shadow guarding a Daily Quest item absorbs its miss once a week."] },
  { title: "Instant Dungeon Keys", feature: "keys", body: ["Keys drop from cleared Gates. Using one gives 24 hours of double XP on the stat you pick."] },
  { title: "History", feature: "history", body: ["A 12-week heatmap of your days, XP per week, your records, and a weekly report every Monday."] },
];

export default function CodexPage() {
  const player = useGame((s) => s.player);
  const replay = useGame((s) => s.replayTutorial);
  if (!player) return null;

  return (
    <div className="space-y-4">
      <SystemWindow title="Codex">
        <p className="text-sm">Everything the System tracks, in one place.</p>
        <button className="btn mt-3 w-full" onClick={replay}>
          Replay the tour
        </button>
      </SystemWindow>
      {ENTRIES.map((e) => {
        const locked = e.feature && !player.unlocked.includes(e.feature);
        return (
          <details key={e.title} className="sys-window p-4" style={locked ? { opacity: 0.6 } : undefined}>
            <summary className="display cursor-pointer text-sm">
              {locked ? "🔒 " : ""}
              {e.title}
            </summary>
            <div className="mt-2 space-y-2 text-sm leading-relaxed">
              {locked ? (
                <p style={{ color: "var(--gold)" }}>Unlocks: {featureRule(e.feature!).requirement}.</p>
              ) : (
                e.body.map((b) => <p key={b}>{b}</p>)
              )}
            </div>
          </details>
        );
      })}
      <Nav />
    </div>
  );
}
