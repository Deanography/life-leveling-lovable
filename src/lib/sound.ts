// Tiny synth so there are no audio assets to ship. All sounds are short and quiet.
let ctx: AudioContext | null = null;

function tone(freq: number, at: number, dur: number, type: OscillatorType = "sine", gain = 0.08) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime + at);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + at);
  o.stop(ctx.currentTime + at + dur + 0.05);
}

export function ping(kind: string) {
  try {
    ctx = ctx ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    switch (kind) {
      case "levelUp":
      case "title":
        tone(523, 0, 0.15, "triangle");
        tone(659, 0.12, 0.15, "triangle");
        tone(784, 0.24, 0.35, "triangle");
        break;
      case "perfectDay":
      case "repaired":
        tone(660, 0, 0.12, "triangle");
        tone(880, 0.1, 0.3, "triangle");
        break;
      case "penalty":
      case "death":
      case "atRisk":
        tone(180, 0, 0.35, "sawtooth", 0.05);
        tone(140, 0.2, 0.4, "sawtooth", 0.05);
        break;
      default:
        tone(880, 0, 0.08, "sine", 0.05);
    }
  } catch {
    /* audio is optional */
  }
}
