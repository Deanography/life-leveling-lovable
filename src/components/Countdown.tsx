import { useEffect, useState } from "react";

export function Countdown({ to }: { to: Date }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = Math.max(0, to.getTime() - now);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const pad = (x: number) => String(x).padStart(2, "0");
  const urgent = ms < 3600000;
  return (
    <span className="tabular-nums" style={{ color: urgent ? "var(--red)" : "var(--text)" }}>
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}
