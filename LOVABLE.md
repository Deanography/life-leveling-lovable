# Life Leveling in Lovable

This repo is the Life Leveling PWA ported from Next.js to the stack Lovable uses: **Vite + React 18 + TypeScript + Tailwind + React Router**. Same features, same look, same saved-data format. It is an experiment; the live app is still the Next.js version in `Deanography/life-leveling`.

## Working with it

This repo is connected to Lovable and syncs with its `main` branch. Edits made in Lovable land here as commits, and commits pushed here show up in Lovable.

Paste the **Knowledge** section below into Lovable's Project Settings → Knowledge so its AI keeps to the app's rules.

Run locally: `npm install`, `npm run dev` (http://localhost:8080). Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Knowledge (paste into Lovable)

Life Leveling is a gamified real-life RPG PWA inspired by Solo Leveling. A cold, terse "System" issues a Daily Quest; the user earns XP, levels, Gold and stats (STR, VIT, AGI, INT, SENSE) and takes penalties for missed days.

Architecture rules:
- `src/engine/` is pure TypeScript game logic with no React. Every tunable number lives in `src/engine/config.ts`. Engine changes need unit tests in `src/engine/__tests__` (Vitest).
- `src/store/game.ts` is a single Zustand store persisted to IndexedDB (Dexie) under the key `life-leveling`, currently version 4. Never rename the key. When the saved shape changes, bump `version` and extend `migrate` so existing players keep their data.
- `src/content/` holds text and presets: Awakening Paths (`paths.ts`), System copy (`copy.ts`), workout templates (`gates.ts`), class portraits (`portraits.ts`, art in `public/hunters/`).
- Pages are in `src/pages/`, routes in `src/App.tsx`. Shared UI in `src/components/` (SystemWindow, Nav, Tour, EventOverlay, Locked).
- Local-first: no backend, no accounts, no network calls for user data.
- Style: dark navy "System window" panels with blue glow, Orbitron display font, Share Tech Mono body font, theme colours as CSS variables in `src/index.css`. Mobile first, max width 28rem, fixed 5-tab bottom nav.
- Voice: System messages are short, cold and declarative. No exclamation marks or emoji in System text.
- Features unlock progressively (`src/engine/unlocks.ts`); a new screen should be gated the same way with `useUnlocked` and `LockedPage`.

## What changed in the port

- `src/app/*/page.tsx` → `src/pages/*.tsx`; `next/link` → React Router `Link`; `useRouter`/`usePathname` → `useNavigate`/`useLocation`.
- `layout.tsx` → `index.html` + `src/App.tsx`; `next/font` → Google Fonts link; `manifest.ts` → `public/manifest.webmanifest`.
- ESLint flat config (typescript-eslint + react-hooks), `vercel.json` with a SPA rewrite so deep links work.
- Service worker cache renamed so it does not mix with the Next.js build.
