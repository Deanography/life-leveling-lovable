export function StatBar({ label, value, max, color, right }: { label: string; value: number; max: number; color: string; right?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="mb-2">
      <div className="mb-1 flex justify-between text-xs" style={{ color: "var(--text-dim)" }}>
        <span className="display">{label}</span>
        <span>{right ?? `${Math.round(value)} / ${Math.round(max)}`}</span>
      </div>
      <div className="bar">
        <i style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
