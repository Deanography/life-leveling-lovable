import type { ReactNode } from "react";

export function SystemWindow({
  title,
  children,
  tone = "blue",
  className = "",
}: {
  title?: string;
  children: ReactNode;
  tone?: "blue" | "red" | "gold" | "shadow";
  className?: string;
}) {
  return (
    <section className={`sys-window p-4 ${tone !== "blue" ? tone : ""} ${className}`}>
      {title && (
        <header className="display mb-3 text-xs" style={{ color: "var(--text-dim)" }}>
          [{title}]
        </header>
      )}
      {children}
    </section>
  );
}
