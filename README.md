# Life Leveling

> **Lovable copy.** This repo is the Life Leveling app ported from Next.js to Vite + React Router and connected to [Lovable](https://lovable.dev). The original lives in `Deanography/life-leveling`. See `LOVABLE.md`.

A real-life RPG. The System issues your Daily Quest, tracks your stats, levels you up, and applies a penalty when you slack. Inspired by the leveling-system genre.

Design docs live in the Obsidian vault under `projects/Solo Leveling App/`.

## What's built

**Phase 0: Awakening**
- Onboarding: name, Awakening Path (primary + secondary), wake time, severity
- Daily Quest with level-scaled targets, deload weeks, rest days, partial progress
- XP, levels, free ability points, stat XP, Gold, Fatigue, sleep logging
- Perfect Day, streak, Streak Shields, At Risk + repair window, miss attribution, Penalty Zone, Recovery Protocol, death and revival
- System windows with typewriter text, synth sounds, haptics
- Local-first: everything lives in IndexedDB on the device. Export to JSON from Settings
- Installable PWA with an offline shell

**Phase 1: Gates**
- Focus and Grind Gates: timed sessions (25/50/90/120 min), boss phase in the last 5 minutes, Red Gate commitment mode (leaving early costs 25 HP and 20 Fatigue)
- Training Gates: the 3-day strength program preloaded as templates, sets × reps × kg logging, last session's numbers as ghost values, auto rest timer, PR detection with Epley e1rm, volume XP
- Quest Log: habits (+ / −), optional dailies, to-dos with due dates
- Shop: Streak Shields, HP Potions, your own real-life rewards bought with Gold
- Ten Titles with passive buffs, one equipped at a time
- Gates lock above 95 Fatigue; XP halves above 80

**Phase 2: Shadow Army**
- Boss Quests: milestones with an HP bar, manual strikes or link habits and dailies so each completion deals 1 damage, up to 3 active
- Arise: a defeated boss can be extracted as a Shadow with a stat-based passive; slots grow with level; a Shadow can guard a Daily Quest item and absorb its miss once a week
- Instant Dungeon Keys: drop on cleared gates (SENSE raises the odds), open a 24-hour double-XP window on one stat
- Rank-Up Gates: promotion needs a run of perfect days plus bosses and stats per rank; XP is 1.25x while open; 14 days inactive demotes one rank
- History: 12-week heatmap, XP per week, records list; Monday weekly report window
- JSON import alongside export; the gate route is now static so the whole app works offline

**Class art**
- Each Path has an illustrated class portrait in three evolution tiers: Initiate (E–D), Veteran (C–B), Ascendant (A+), shown in the Status Window, onboarding, and the Hunter page
- Art lives in `public/hunters/<path>-<tier>.webp`; add one with `npm run add-portrait -- <image> <path> <tier>`. Prompts in `docs/art-prompts.md`. Missing art falls back to the SVG hologram

**Onboarding and rewards**
- Six-step guided tour after picking a class, with spotlighted screens; skippable and replayable from the Codex
- Progressive unlocks: Shop, Gates, Quest Log, Titles, Bosses, Shadows, Keys and History appear as they become relevant, each announced by a System window; locked tabs explain their requirement
- Codex page explaining every system
- Preset reward catalogue in three tiers (small anytime, medium from level 5, large from C-Rank), with path-specific rewards; custom rewards kept but tucked away. XP is never spent
- Cosmetic colour themes: Ember and Verdant (earn, then buy), Gilded and Monarch (earned by rank)

Not yet: push reminders and sync (Phase 4), Job Change and classes (Phase 3).

## Run

```bash
npm install
npm run dev        # http://localhost:8080
npm test           # engine unit tests (vitest)
npm run lint
npm run build
```

## Layout

```
src/engine/     pure TypeScript game rules, no React. Tested.
src/content/    Awakening Path presets and System copy
src/store/      Zustand store persisted to IndexedDB via Dexie
src/components/ SystemWindow, Typewriter, StatBar, Countdown, EventOverlay, Nav, Boot
src/pages/      React Router pages (routes in src/App.tsx): / (Status), /daily, /gates, /gate, /quests, /bosses, /army, /history, /hunter, /codex, /more, /onboarding, /settings
public/sw.js    offline shell service worker
```

All tunable numbers are in `src/engine/config.ts`.
