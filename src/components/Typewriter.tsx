import { useEffect, useState } from "react";

export function Typewriter({ lines, speed = 22, onDone }: { lines: string[]; speed?: number; onDone?: () => void }) {
  const full = lines.join("\n");
  const [n, setN] = useState(0);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    if (reduced) {
      setN(full.length);
      onDone?.();
      return;
    }
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= full.length) {
        clearInterval(id);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full]);
  return (
    <pre className="whitespace-pre-wrap font-[inherit] text-base leading-relaxed" onClick={() => setN(full.length)}>
      {full.slice(0, n)}
      {n < full.length && <span className="animate-pulse">▌</span>}
    </pre>
  );
}
