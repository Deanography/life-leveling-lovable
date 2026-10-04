import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGame } from "@/store/game";

/** Registers the service worker, closes pending days on focus, routes to onboarding when there is no player. */
export function Boot() {
  const hydrated = useGame((s) => s.hydrated);
  const player = useGame((s) => s.player);
  const closePendingDays = useGame((s) => s.closePendingDays);
  const navigate = useNavigate();
  const pathname = useLocation().pathname;

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFocus = () => closePendingDays();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    const id = setInterval(onFocus, 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      clearInterval(id);
    };
  }, [closePendingDays]);

  useEffect(() => {
    if (!hydrated) return;
    const unsub = useGame.subscribe((st, prev) => {
      if (st.player && (st.player !== prev.player || st.counters !== prev.counters || st.gates !== prev.gates || st.quests !== prev.quests || st.shadows !== prev.shadows)) {
        st.syncUnlocks();
      }
    });
    return unsub;
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (!player && pathname !== "/onboarding") navigate("/onboarding", { replace: true });
    if (player && pathname === "/onboarding") navigate("/daily", { replace: true });
  }, [hydrated, player, pathname, navigate]);

  return null;
}
