# TOMORROW.md — Mello handoff (end of the 12-hour night)

**What exists now:** a working v0.1 desktop pet (`mello-bot`, Electron + sql.js) with habit
engine, Momentum, Life Journey, reminders, onboarding, personalities, wardrobe — plus a
landing page (`mello-landing`) and an unsigned Windows installer.

---

## What's real vs. stubbed

**Working (verified end-to-end):**
- Transparent always-on-top overlay pet: 8 poses, drag, tray, click-through toggle
- SQLite (sql.js WASM) — habits/checkins/momentum_log/pets/cosmetics/inventory/settings
- Habit CRUD, Build/Reduce, daily/weekly schedules, due logic
- Momentum: +8 complete day / +4 honest / 0 snooze / −5 missed; gradual decay, never resets
- Life Journey: egg→baby→teen→adult→elder-sage; CP gates 40/90, journey gates 25%/55%;
  graduation at target date; never regresses; misses pause aging
- Daily rollover (idempotent missed-day marking + decay + momentum_log)
- Reminder card: Complete / Snooze 10m / Rough day? · max 1 nudge · quiet hours + nudge slider
- Recovery Mode copy on habits missed yesterday
- Onboarding (5 steps, instrumented, auto-opens until completed)
- Personalities: gentle/coach/playful full microcopy sets
- Wardrobe: 3 hats (beanie/scarf/bow) + 3 colorways, persisted
- JSON export/import with native dialogs
- Landing page (single page) — `mello-landing`, production build passes

**Stubbed / not started (per PRD §17 weeks 2–10):**
- Supabase (schema + RLS + auth) — the DDL in PRD §17 is ready to paste
- Lemon Squeezy: products, checkout, webhook, license keys (F16)
- E2E encrypted sync (F18, v0.2)
- Client dashboard (C1–C8) + Admin panel (A1–A10)
- Real art batch (AI pipeline, PRD §17 Day 3–4) — pet is SVG placeholder tonight
- LLM chat (F23) — deliberately banned until guardrails reviewed (PRD §14/§22)
- Hatch/graduation *videos* (V-02/V-03) — CSS ceremonies tonight

## Known landmines
1. **Windows Smart App Control is ON on this machine** — blocks all locally-compiled exes.
   That's why the app runs on **Electron, not Tauri** (PRD stack). Tauri source is kept in
   `mello-bot/src-tauri/` and compiles fine up to link stage. If SAC is ever turned off
   (permanent until Windows reset!), `npm run tauri dev` resumes the PRD path.
2. **OneDrive locks renames** — electron-builder output is pointed at
   `C:\Users\prita\AppData\Local\mello-build` (outside OneDrive) for this reason.
3. **The installer is unsigned** — SmartScreen will warn other users. Signing needs a cert
   (post-revenue; PRD §20 reinvestment ladder).
4. **Packaged app untested on a clean machine** — `win-unpacked\Mello.exe` and
   `Mello-Setup-0.1.0.exe` exist but were never run end-to-end (SAC blocks running locally-
   built exes on this machine too — install on a different PC to test).
5. Landing's Download button tries `github.com/prita/mello` releases API — replace repo
   slug once the GitHub repo exists.

## Next 3 actions (PRD §17 week 2)
1. **Real art batch** ($0): Master Block prompt (PRD Appendix A) → canon stills, 8 poses,
   3 hats, icon/hero/banner. Drop into `mello-bot/src/assets/`, swap PetSprite SVG → PNGs.
2. **Supabase project + schema + RLS**: paste PRD §17 DDL, confirm a second test user can't
   read the first user's rows. Stub the two Edge Functions (lemon-squeezy-webhook,
   license-validate).
3. **GitHub + release**: `winget install GitHub.cli` → `gh auth login` →
   `gh repo create mello --private --source . --push` →
   `gh release create v0.1.0 "C:\Users\prita\AppData\Local\mello-build\Mello-Setup-0.1.0.exe"`.

## How to run
```
cd mello-bot && npm install && npm run dev        # pet + panel
cd mello-bot && npm run dist                      # installer (output: %LOCALAPPDATA%\mello-build)
cd mello-landing && npm install && npm run dev    # landing at localhost:5173
node src/lib/simulate.ts                          # game-logic self-test
```

## The 12-hour night, in one line each
- H0–1: scaffold + overlay window (pivoted Tauri→Electron due to Smart App Control)
- H2–4: schema, habit engine, panel window, JSON export (verified: restart-persistence)
- H4–6: momentum/journey pure engine (simulation test green), rollover, glance, reminders
- H7–8: onboarding flow, personalities, wardrobe, hatch ceremony (fresh-install test green)
- H9–12: landing, installer, git, this file
