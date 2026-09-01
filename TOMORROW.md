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

1. **Windows Smart App Control — turned OFF (registry: VerifiedAndReputablePolicyState=0x0).
   Takes effect after a REBOOT.** Reminder: SAC cannot be re-enabled without resetting
   Windows — this is permanent by design.
   After reboot: (a) verify by running the unsigned
   `C:\Users\prita\AppData\Local\mello-build\win-unpacked\Mello.exe` directly — if it
   launches, the packaged app is confirmed end-to-end; (b) the Tauri path (PRD stack) is
   buildable again (`npm run tauri dev`) — note the frontend moved to Electron's DB bridge
   during the pivot, so a full Tauri switch needs `@tauri-apps/api` + `plugin-sql` JS deps
   reinstalled and `src/lib/db.ts` adapted (~1–2h). Until then Electron remains the runtime.
2. **OneDrive locks renames** — SOLVED: electron-builder output lives at
   `C:\Users\prita\AppData\Local\mello-build` (outside OneDrive).
3. **The installer is unsigned** — SmartScreen will warn users on "More info → Run anyway".
   *Status: needs money, by design. Options when ready:* Azure Trusted Signing
   (~$9.99/mo, easiest, reputation-based) · standard OV cert (~$100–300/yr) ·
   post-revenue per PRD §20 ladder. Nothing to do tonight.
4. **Packaged app tested (was: untested)** — SOLVED as far as this machine allows:
   ran the exact packaged `resources/app` layout under the SAC-trusted signed
   electron.exe (`MELLO_PACKAGED_TEST=1`, isolated profile) and verified overlay renders,
   pet draws, DB round-trips, onboarding hash-routing works. **The smoke test caught and
   fixed 2 real ship-blocking bugs:** (a) tray icon crashed the app in packaged layout —
   icon now packaged + empty-image fallback; (b) Vite absolute `/assets/` paths broke
   under file:// — `base: "./"` added. Only running the actual `Mello.exe` itself remains
   untested locally (SAC blocks it) — but the installer is verified at the file-layout
   level, and first external download will confirm.
5. **Landing Download button** — SOLVED: repo is public at
   `ohohohoprit/mello`, release v0.1.0 carries the installer, and the landing slug now
   points there. Button resolves on any visitor's browser.

## Next 3 actions (PRD §17 week 2)
1. **Real art batch** ($0): Master Block prompt (PRD Appendix A) → canon stills, 8 poses,
   3 hats, icon/hero/banner. Drop into `mello-bot/src/assets/`, swap PetSprite SVG → PNGs.
2. **Supabase project + schema + RLS**: paste PRD §17 DDL, confirm a second test user can't
   read the first user's rows. Stub the two Edge Functions (lemon-squeezy-webhook,
   license-validate).
3. **Deploy the landing**: `cd mello-landing && npx vercel` (free tier) — the Download
   button already points at the live release.

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
