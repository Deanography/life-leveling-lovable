import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGame, TOUR_LENGTH } from "@/store/game";
import { SystemWindow } from "./SystemWindow";

interface Step {
  route: string;
  target?: string; // data-tour attribute
  title: string;
  lines: string[];
}

export const TOUR: Step[] = [
  { route: "/", target: "status", title: "Status Window", lines: ["This is you.", "Level, HP, Fatigue and your five stats.", "After a level up, tap a stat to spend ability points."] },
  { route: "/", target: "portrait", title: "Hunter", lines: ["Your class art evolves at C-Rank and again at A-Rank.", "Tap it to see your evolution line."] },
  { route: "/", target: "daily-strip", title: "Daily Quest", lines: ["Your mandatory quest for today.", "Finish every item before the timer runs out."] },
  { route: "/daily", target: "daily-list", title: "Logging", lines: ["Log progress here. Tap +5 or Done.", "Partial progress still earns XP.", "Edit these items any time in Settings."] },
  { route: "/daily", title: "Penalties", lines: ["Miss one day and your streak is only at risk.", "Clear the next quest plus the missed item to repair it.", "Miss two days in a row and you lose HP.", "Illness never counts against you."] },
  { route: "/", target: "nav", title: "Progression", lines: ["More functions unlock as you progress: Gates, Quests, Bosses, Shadows.", "The Codex under More explains everything.", "Your first Daily Quest is waiting."] },
];

export function Tour() {
  const player = useGame((s) => s.player);
  const hasEvents = useGame((s) => s.events.length > 0);
  const hydrated = useGame((s) => s.hydrated);
  const next = useGame((s) => s.tutorialNext);
  const skip = useGame((s) => s.tutorialSkip);
  const navigate = useNavigate();
  const path = useLocation().pathname;
  const [rect, setRect] = useState<DOMRect | null>(null);

  const stepIdx = player?.tutorial.step ?? null;
  const active = hydrated && !!player && !player.tutorial.done && stepIdx !== null && !hasEvents && path !== "/onboarding";
  const step = active && stepIdx !== null ? TOUR[Math.min(stepIdx, TOUR_LENGTH - 1)] : null;

  useEffect(() => {
    if (step && path !== step.route) navigate(step.route);
  }, [step, path, navigate]);

  useEffect(() => {
    if (!step?.target || path !== step.route) {
      setRect(null);
      return;
    }
    let raf = 0;
    const find = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        el.scrollIntoView({ block: "nearest" });
        setRect(el.getBoundingClientRect());
      }
      raf = window.setTimeout(find, 300);
    };
    find();
    return () => window.clearTimeout(raf);
  }, [step, path]);

  if (!step || path !== step.route) return null;
  const pad = 6;
  // Put the card in whichever half of the screen the target is not centred in.
  const targetInTopHalf = rect ? rect.top + rect.height / 2 < window.innerHeight / 2 : true;

  return (
    <>
      {rect ? (
        <div className="tour-spot" style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />
      ) : (
        <div className="tour-dim" />
      )}
      <div
        className="fixed inset-x-0 z-[61] mx-auto max-w-md px-4"
        style={rect ? (targetInTopHalf ? { bottom: 16 } : { top: 16 }) : { top: "30%" }}
      >
        <SystemWindow title={`${step.title} · ${(stepIdx ?? 0) + 1}/${TOUR_LENGTH}`}>
          {step.lines.map((l) => (
            <p key={l} className="text-sm leading-relaxed">
              {l}
            </p>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn" onClick={skip}>
              Skip tour
            </button>
            <button className="btn primary" onClick={next}>
              {(stepIdx ?? 0) + 1 >= TOUR_LENGTH ? "Begin" : "Next"}
            </button>
          </div>
        </SystemWindow>
      </div>
    </>
  );
}
