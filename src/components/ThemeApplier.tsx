import { useEffect } from "react";
import { useGame } from "@/store/game";
import { themeById } from "@/engine";

/** Applies the equipped cosmetic theme by overriding the CSS colour variables. */
export function ThemeApplier() {
  const theme = useGame((s) => s.player?.settings.theme);
  useEffect(() => {
    const t = themeById(theme);
    const root = document.documentElement.style;
    root.setProperty("--border", t.colors.border);
    root.setProperty("--glow", t.colors.glow);
    root.setProperty("--panel", t.colors.panel);
    root.setProperty("--text-dim", t.colors.textDim);
  }, [theme]);
  return null;
}
