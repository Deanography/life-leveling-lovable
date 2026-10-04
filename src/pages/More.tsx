import { useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "@/store/game";
import { SystemWindow } from "@/components/SystemWindow";
import { Nav } from "@/components/Nav";
import { CONFIG, TIER_RULES, THEMES, TITLES, catalogFor, equippedBuff, shieldCap, themeOwned, type FeatureId, type RewardTier } from "@/engine";

const buffText = (b: ReturnType<typeof equippedBuff>) =>
  [
    b.xpMult && `+${Math.round((b.xpMult - 1) * 100)}% XP`,
    b.goldMult && `+${Math.round((b.goldMult - 1) * 100)}% Gold`,
    b.hpLossMult && `-${Math.round((1 - b.hpLossMult) * 100)}% HP loss`,
    b.shieldSlots && `+${b.shieldSlots} shield slot`,
    b.statXpMult && Object.entries(b.statXpMult).map(([k, v]) => `+${Math.round((v - 1) * 100)}% ${k} XP`).join(", "),
  ]
    .filter(Boolean)
    .join(" · ");

const TIERS: RewardTier[] = ["small", "medium", "large"];
const HUB_TEXT = { fontFamily: "var(--font-body), ui-monospace, monospace", textTransform: "none" as const, letterSpacing: 0, fontSize: 13 };

export default function MorePage() {
  const player = useGame((s) => s.player);
  const rewards = useGame((s) => s.rewards);
  const redemptions = useGame((s) => s.redemptions);
  const counters = useGame((s) => s.counters);
  const buyShieldNow = useGame((s) => s.buyShieldNow);
  const buyPotionNow = useGame((s) => s.buyPotionNow);
  const drinkPotionNow = useGame((s) => s.drinkPotionNow);
  const addReward = useGame((s) => s.addReward);
  const removeReward = useGame((s) => s.removeReward);
  const redeemReward = useGame((s) => s.redeemReward);
  const redeemCatalog = useGame((s) => s.redeemCatalog);
  const buyThemeNow = useGame((s) => s.buyThemeNow);
  const setTheme = useGame((s) => s.setTheme);
  const equipTitle = useGame((s) => s.equipTitle);
  const maxHp = useGame((s) => s.maxHp);
  const [draft, setDraft] = useState({ name: "", cost: 300 });
  const [confirm, setConfirm] = useState<string | null>(null);
  if (!player) return null;
  const cap = shieldCap(player, equippedBuff(player).shieldSlots ?? 0);
  const has = (f: FeatureId) => player.unlocked.includes(f);
  const catalog = catalogFor(player);

  const hub: { href: string; label: string; feature: FeatureId; color?: string }[] = [
    { href: "/bosses", label: "Bosses", feature: "bosses", color: "var(--red)" },
    { href: "/army", label: "Shadows", feature: "shadows", color: "var(--shadow)" },
    { href: "/history", label: "History", feature: "history" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1">
        {hub.map((h) => (
          <Link key={h.href} to={h.href} className="btn text-center" style={{ ...HUB_TEXT, borderColor: has(h.feature) ? h.color : undefined, opacity: has(h.feature) ? 1 : 0.5 }}>
            {has(h.feature) ? h.label : `🔒 ${h.label}`}
          </Link>
        ))}
        <Link to="/codex" className="btn text-center" style={HUB_TEXT}>
          Codex
        </Link>
      </div>

      {has("shop") ? (
        <SystemWindow title="Shop" tone="gold">
          <p className="mb-3 text-sm">
            Gold <b style={{ color: "var(--gold)" }}>{player.gold}</b>
          </p>

          <h2 className="display mb-2 text-xs" style={{ color: "var(--text-dim)" }}>
            Items
          </h2>
          <div className="grid grid-cols-2 gap-1">
            <button className="btn text-[11px]" disabled={player.gold < CONFIG.shop.shield || player.shields >= cap} onClick={buyShieldNow}>
              Streak Shield {CONFIG.shop.shield}g ({player.shields}/{cap})
            </button>
            <button className="btn text-[11px]" disabled={player.gold < CONFIG.shop.potion} onClick={buyPotionNow}>
              HP Potion {CONFIG.shop.potion}g ({player.potions})
            </button>
          </div>
          <button className="btn mt-1 w-full text-[11px]" disabled={player.potions <= 0 || player.hp >= maxHp() || player.dead} onClick={drinkPotionNow}>
            Use potion (+{CONFIG.shop.potionHp} HP)
          </button>

          {TIERS.map((tier) => {
            const rule = TIER_RULES[tier];
            const open = rule.unlocked(player);
            const items = catalog.filter((r) => r.tier === tier);
            return (
              <div key={tier} className="mt-4">
                <h2 className="display mb-2 flex justify-between text-xs" style={{ color: "var(--text-dim)" }}>
                  <span>{rule.name} rewards</span>
                  {!open && <span style={{ color: "var(--gold)" }}>🔒 {rule.requirement}</span>}
                </h2>
                <ul className="space-y-1" style={open ? undefined : { opacity: 0.45 }}>
                  {items.map((r) => (
                    <li key={r.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1">{r.name}</span>
                      {confirm === r.id ? (
                        <button className="btn gold px-3 py-1 text-xs" onClick={() => { redeemCatalog(r.id); setConfirm(null); }}>
                          Claim?
                        </button>
                      ) : (
                        <button className="btn gold px-3 py-1 text-xs" disabled={!open || player.gold < r.cost} onClick={() => setConfirm(r.id)}>
                          {r.cost}g
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          <h2 className="display mb-2 mt-4 text-xs" style={{ color: "var(--text-dim)" }}>
            Themes
          </h2>
          <ul className="space-y-1">
            {THEMES.map((t) => {
              const owned = themeOwned(player, t);
              const equipped = (player.settings.theme ?? "system") === t.id;
              const earned = t.earned(player);
              return (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: t.colors.border, boxShadow: `0 0 6px ${t.colors.border}` }} />
                  <span className="flex-1">
                    {t.name}
                    {!owned && (
                      <span className="block text-[10px]" style={{ color: "var(--text-dim)" }}>
                        {earned ? `Available: ${t.cost}g` : `🔒 ${t.requirement}${t.cost ? `, then ${t.cost}g` : ""}`}
                      </span>
                    )}
                  </span>
                  {owned ? (
                    <button className={`btn px-3 py-1 text-xs ${equipped ? "gold" : ""}`} disabled={equipped} onClick={() => setTheme(t.id)}>
                      {equipped ? "Active" : "Use"}
                    </button>
                  ) : (
                    <button className="btn gold px-3 py-1 text-xs" disabled={!earned || !t.cost || player.gold < t.cost} onClick={() => buyThemeNow(t.id)}>
                      {t.cost ? `${t.cost}g` : "Locked"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <details className="mt-4">
            <summary className="display cursor-pointer text-xs" style={{ color: "var(--text-dim)" }}>
              Custom rewards {rewards.length ? `(${rewards.length})` : ""}
            </summary>
            <ul className="mt-2 space-y-1">
              {rewards.map((r) => (
                <li key={r.id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1">{r.name}</span>
                  <button className="btn gold px-3 py-1 text-xs" disabled={player.gold < r.cost} onClick={() => redeemReward(r.id)}>
                    {r.cost}g
                  </button>
                  <button className="btn px-2 py-1 text-xs" onClick={() => removeReward(r.id)} aria-label="remove">
                    x
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-1">
              <input className="input py-1" placeholder="Your own reward" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              <input className="input w-20 py-1" type="number" value={draft.cost} onChange={(e) => setDraft({ ...draft, cost: Number(e.target.value) || 1 })} />
              <button className="btn px-3 py-1 text-xs" disabled={!draft.name.trim()} onClick={() => { addReward(draft.name, draft.cost); setDraft({ ...draft, name: "" }); }}>
                Add
              </button>
            </div>
          </details>

          {redemptions.length > 0 && (
            <p className="mt-3 text-[10px]" style={{ color: "var(--text-dim)" }}>
              Last claimed: {redemptions.slice(-3).reverse().map((r) => r.name).join(", ")}
            </p>
          )}
        </SystemWindow>
      ) : (
        <SystemWindow title="Shop">
          <p className="text-sm">🔒 Unlocks when you earn your first Gold. Complete a Daily Quest item to start.</p>
        </SystemWindow>
      )}

      {has("titles") ? (
        <SystemWindow title="Titles">
          <ul className="space-y-2">
            {TITLES.map((t) => {
              const owned = player.titles.includes(t.id);
              const equipped = player.equippedTitleId === t.id;
              return (
                <li key={t.id} className="flex items-center gap-2 border px-3 py-2" style={{ borderColor: equipped ? "var(--gold)" : owned ? "var(--border)" : "rgba(127,163,230,0.2)", opacity: owned ? 1 : 0.6 }}>
                  <div className="flex-1">
                    <div className="display text-sm">{t.name}</div>
                    <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                      {owned ? buffText(t.buff) : `Locked: ${t.condition}`}
                    </div>
                  </div>
                  {owned && (
                    <button className={`btn px-3 py-1 text-xs ${equipped ? "gold" : ""}`} onClick={() => equipTitle(equipped ? undefined : t.id)}>
                      {equipped ? "Equipped" : "Equip"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[10px]" style={{ color: "var(--text-dim)" }}>
            Gates cleared {counters.gatesCleared} · Red {counters.redGatesCleared} · Records {counters.prCount} · Perfect days {counters.perfectDays}
          </p>
        </SystemWindow>
      ) : (
        <SystemWindow title="Titles">
          <p className="text-sm">🔒 Unlocks with your first Title. The first comes from a 7-day streak or your first cleared Gate.</p>
        </SystemWindow>
      )}

      <Link to="/settings" className="btn block w-full text-center">
        Settings
      </Link>
      <Nav />
    </div>
  );
}
