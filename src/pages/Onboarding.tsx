import { useState } from "react";
import { useGame } from "@/store/game";
import { SystemWindow } from "@/components/SystemWindow";
import { Typewriter } from "@/components/Typewriter";
import { COPY } from "@/content/copy";
import { PATHS } from "@/content/paths";
import { HunterPortrait } from "@/components/HunterPortrait";
import { CLASS_NAMES } from "@/content/portraits";
import type { PathId, Severity } from "@/engine";

export default function Onboarding() {
  const createPlayer = useGame((s) => s.createPlayer);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [primary, setPrimary] = useState<PathId>("warrior");
  const [secondary, setSecondary] = useState<PathId | undefined>();
  const [wakeTime, setWakeTime] = useState("06:30");
  const [severity, setSeverity] = useState<Severity>("standard");
  const [ready, setReady] = useState(false);

  const next = () => {
    setReady(false);
    setStep((s) => s + 1);
  };

  return (
    <div className="flex min-h-[80dvh] items-center">
      <div className="w-full space-y-4">
        {step === 0 && (
          <SystemWindow title="Notification">
            <Typewriter lines={[COPY.onboarding.selected]} onDone={() => setReady(true)} />
            <button className="btn primary mt-6 w-full" disabled={!ready} onClick={next}>
              {COPY.onboarding.accept}
            </button>
          </SystemWindow>
        )}
        {step === 1 && (
          <SystemWindow title="Player">
            <Typewriter lines={[COPY.onboarding.name]} onDone={() => setReady(true)} />
            <input className="input mt-4" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" autoFocus maxLength={24} />
            <button className="btn primary mt-4 w-full" disabled={!name.trim()} onClick={next}>
              Confirm
            </button>
          </SystemWindow>
        )}
        {step === 2 && (
          <SystemWindow title="Awakening Path">
            <p className="mb-3">{COPY.onboarding.path}</p>
            <div className="space-y-2">
              {PATHS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPrimary(p.id);
                    if (secondary === p.id) setSecondary(undefined);
                  }}
                  className="flex w-full items-center gap-3 border px-2 py-2 text-left"
                  style={{ borderColor: primary === p.id ? "var(--gold)" : "rgba(127,163,230,0.35)" }}
                >
                  <HunterPortrait rank={primary === p.id ? "D" : "E"} path={p.id} tier="initiate" className="w-12 shrink-0" />
                  <div className="min-w-0">
                    <div className="display text-sm">
                      {p.name}
                      {CLASS_NAMES[p.id] !== p.name && <span className="text-[10px]" style={{ color: "var(--text-dim)" }}> · {CLASS_NAMES[p.id]}</span>}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-dim)" }}>
                      {p.tagline}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <p className="mb-2 mt-4 text-xs" style={{ color: "var(--text-dim)" }}>
              {COPY.onboarding.pathSecondary}
            </p>
            <div className="flex flex-wrap gap-1">
              {PATHS.filter((p) => p.id !== primary && p.id !== "custom").map((p) => (
                <button key={p.id} className={`btn px-2 py-1 text-xs ${secondary === p.id ? "primary" : ""}`} onClick={() => setSecondary(secondary === p.id ? undefined : p.id)}>
                  {p.name}
                </button>
              ))}
            </div>
            <button className="btn primary mt-4 w-full" onClick={next}>
              Confirm
            </button>
          </SystemWindow>
        )}
        {step === 3 && (
          <SystemWindow title="Schedule">
            <label className="mb-1 block text-sm">Wake time. The Daily Quest is issued then.</label>
            <input className="input" type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
            <button className="btn primary mt-4 w-full" onClick={next}>
              Confirm
            </button>
          </SystemWindow>
        )}
        {step === 4 && (
          <SystemWindow title="Severity">
            <p className="mb-3 text-sm">{COPY.onboarding.severity}</p>
            <div className="space-y-2">
              {(Object.keys(COPY.severity) as Severity[]).map((s) => (
                <button key={s} onClick={() => setSeverity(s)} className="w-full border px-3 py-2 text-left" style={{ borderColor: severity === s ? (s === "hunter" ? "var(--red)" : "var(--gold)") : "rgba(127,163,230,0.35)" }}>
                  <div className="display text-sm">{COPY.severity[s].label}</div>
                  <div className="text-xs" style={{ color: "var(--text-dim)" }}>
                    {COPY.severity[s].desc}
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs" style={{ color: "var(--text-dim)" }}>
              {COPY.honesty}
            </p>
            <button
              className="btn primary mt-4 w-full"
              onClick={() => {
                createPlayer({ name, primary, secondary, wakeTime, severity });
              }}
            >
              Begin
            </button>
          </SystemWindow>
        )}
      </div>
    </div>
  );
}
