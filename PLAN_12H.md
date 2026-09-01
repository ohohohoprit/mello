# Mello — One-Night Build Plan (12 Hours)

**Goal:** By morning, have a working v0.1 demo of the core product loop: a desktop pet that lives on your desktop, habits you can create/check-in, Momentum, and the 5-stage Life Journey — plus a one-page landing site. Everything else (sync, payments, Admin, Client dashboard) is **explicitly out of scope tonight**.

**Stack (from PRD §14):** Tauri v2 + React + TypeScript + Zustand + SQLite (`tauri-plugin-sql`) + pure CSS animation. Landing: single Next.js or static page.

**Ground rules for the night**
- The PRD's own build plan spans 12 weeks. One night = we cut to the demo-critical core and stub everything cloud-related.
- Every feature follows the Design Principles (§06): no streaks, no death, no shame copy. Momentum never resets to zero.
- Don't polish the landing page before the Bot works. Pet first, marketing last.
- If the Tauri transparent overlay is unstable after ~60 minutes of fighting it (the PRD calls this the go/no-go checkpoint), fall back to a normal small always-on-top window — never block the night on it.

---

## Hour-by-hour schedule

### H0–H1 · Scaffold + skeleton
- Create `mello-bot/` with `npm create tauri-app@latest` (React + TS + Vite template). Add Zustand, `@tauri-apps/plugin-sql`.
- Create `mello-web/` (can be deferred to H10; scaffold only if fast).
- `tauri.conf.json`: transparent window, `always_on_top`, no decorations, ~200×220 px, `skip_taskbar`. Verify it renders on Windows 10/11 **now** (go/no-go).
- Define the design tokens from PRD §08 as CSS variables: `#FFF7E8` cream bg, `#FFD97A` gold, `#7A4E2D` brown, `#F7A8A0` coral, `#A8C686` sage. Fonts: Baloo 2 (display), Inter (body).
- DoD: app launches as a floating transparent window with the cream/gold theme.

### H1–H2 · Pet on screen
- Drop in placeholder pet art: the PRD's Master Block description (chubby pudding-soft puppy, cream-golden fur, cocoa ear tips, sprout on head) → generate with your image tool of choice **or** use a simple drawn PNG tonight; real art pipeline is a Week-2 task.
- `PetSprite.tsx`: renders current pose; CSS bob/blink/breathe micro-motion loops; pose swap ≤200ms.
- Implement 8 pose states as data (`idle, eyes-closed, wave, happy-bounce, celebrate, remind, sleep, gentle-pout`) — even if art is placeholders, the state machine is real.
- Draggable window, click-through toggle, system tray icon with menu (Show/Hide, Click-through, Quit).
- DoD: a cute pet floats on the desktop, breathes/blinks, can be dragged.

### H2–H4 · Local data + habit engine (F3, F13)
- SQLite via `tauri-plugin-sql`; migration mirrors PRD §17 DDL, local subset: `pets`, `habits`, `checkins`, `momentum_log`, `settings`.
- Habit CRUD: Build/Reduce mode, title, emoji, schedule + repeat (simple daily/weekly JSON, not full rrule tonight).
- Zustand stores: `petStore`, `habitStore`, `settingsStore`.
- JSON export/import (F13) — trivial and it's a PRD trust promise; do it now.
- DoD: habits survive app restart; export produces valid JSON.

### H4–H6 · Core game logic (F6, F7, F8, F9, F14)
- `lib/momentum.ts` (unit-test this one file): 0–100, gradual decay on miss, **never resets to zero**; missed days render gray/neutral.
- `lib/lifeJourney.ts`: 5-stage state machine (Egg → Baby → Teen → Adult → Elder Sage). Care points: complete +2, recovery step +2, honest +1. Stage gates: Teen = ≥25% journey + CP≥40; Adult = ≥55% + CP≥90. Aging pauses on miss; never regresses.
- Check-in types: `complete | snooze | honest | missed`.
- Glance tooltip (F14): hovering pet shows `"Today 1/2 · Momentum 78"`.
- DoD: simulate days in a test script — a pet can go Egg → Elder Sage offline with correct thresholds.

### H6–H7 · Reminder UX + settings (F4, F5, F10, F11)
- `ReminderCard.tsx` bubble from the overlay: **Complete / Snooze 10m / "Rough day?"** — max 1 nudge per reminder, honest tap validates and counts as a check-in.
- Quiet hours (default 22:00–07:00) + random-nudge probability slider (default 30%).
- Personality selector (Gentle/Coach/Playful) as three JSON microcopy files — write ~10 lines each tonight using PRD §12 samples; full 60–100 line sets come later.
- Rename pet, 3 colorways, 3 hats as simple asset swaps.
- DoD: a reminder fires, all three actions behave, quiet hours suppress nudges.

### H7–H8 · Onboarding (F12) + food/rest of the loop
- Conversational first-run: "What are we working toward?" → pick goal + duration (30/60/90/180 days or custom date → that's the pet's lifespan) → name the pet → pick personality. No account, <90s.
- Egg hatches after first check-in (small celebrate animation + copy).
- DoD: fresh install → named, customized, ticking pet in under 90 seconds.

### H8–H9 · Buffer + dogfood pass
- Catch-up on anything late. Then use the app yourself for 30 real minutes: create your own habit, tick it, miss one (edit the clock), check Momentum decays gently.
- Fix every crash and every piece of copy that could read as guilt on a worst day (PRD §12 writing checklist).

### H9–H11 · Landing page (P1 only tonight)
- One page: hero with the pet + tagline "Your cute reminder buddy", trust line "No shame. No streaks. No renting your pet.", the 3 pain-point cards (streak guilt / subscription fatigue / sync-privacy), Life Journey 5-stage strip, Download button (GitHub Release artifact or "coming soon" capture), footer with Privacy/Terms stubs.
- Static (Next.js or plain HTML+Tailwind), deployable to Vercel free.

### H11–H12 · Ship it
- Build the Windows installer (`tauri build`), attach to GitHub Release.
- Deploy landing. Push everything to GitHub.
- Write `TOMORROW.md`: what's stubbed, what breaks, and the next 3 actions per PRD §17 Week 2+ (real art batch, Lemon Squeezy products + webhook stubs, Supabase project + RLS schema).

---

## Explicitly deferred (do NOT start tonight)
| Item | When (per PRD §17) |
|---|---|
| Supabase schema, RLS, Auth | Week 1 |
| Lemon Squeezy payments, license keys, webhooks | Week 5–6 |
| E2E encrypted sync | v0.2 (F18) |
| Client dashboard (8 pages) + Admin panel (10 pages) | Weeks 7–10 |
| LLM chat (F23) | v1 — templated copy only until guardrails signed off |

## Overnight fallback ladder
1. Overlay window unstable → plain always-on-top window (still demoable).
2. Tauri toolchain (Rust) won't build on this machine → pivot to Electron for the night, note the migration.
3. Art generation blocked → colored-shape placeholder pet; the state machine is the product tonight, the art is next.
4. Running out of time → cut landing page and hats/personalities first; **never** cut Momentum, Life Journey, or the reminder card — those are the product's soul.
