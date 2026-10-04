import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/store/game";
import { SystemWindow } from "./SystemWindow";
import { Typewriter } from "./Typewriter";
import { useEffect, useState } from "react";
import { ping } from "@/lib/sound";

const toneFor = (kind: string): "blue" | "red" | "gold" | "shadow" =>
  kind === "levelUp" || kind === "perfectDay" || kind === "title" ? "gold" : kind === "penalty" || kind === "death" || kind === "atRisk" ? "red" : kind === "repaired" ? "shadow" : "blue";

export function EventOverlay() {
  const ev = useGame((s) => s.events[0]);
  const dismiss = useGame((s) => s.dismissEvent);
  const sounds = useGame((s) => s.player?.settings.sounds ?? false);
  const haptics = useGame((s) => s.player?.settings.haptics ?? false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    if (ev && sounds) ping(ev.kind);
    // Vibrate only when enabled and after the user has interacted (browsers block it otherwise).
    const activated = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? true;
    if (ev && haptics && activated && "vibrate" in navigator) navigator.vibrate?.(ev.kind === "levelUp" ? [30, 40, 60] : 20);
  }, [ev?.id, ev, sounds, haptics]);
  return (
    <AnimatePresence>
      {ev && (
        <motion.div
          key={ev.id}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => ready && dismiss()}
        >
          <motion.div
            className={`w-full max-w-sm ${ev.kind === "levelUp" ? "glitch" : ""}`}
            initial={{ scale: 0.96, y: -12 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.12 }}
          >
            <SystemWindow title={ev.title} tone={toneFor(ev.kind)}>
              <Typewriter lines={ev.lines} onDone={() => setReady(true)} />
              <button className="btn mt-4 w-full" onClick={dismiss}>
                {ev.kind === "death" ? "Acknowledge" : "Confirm"}
              </button>
            </SystemWindow>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
