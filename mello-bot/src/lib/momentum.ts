/** Momentum math — PRD F6. Pure functions only (unit-testable, no DB, no React).
    Rules: 0–100 · gradual decay on miss · NEVER resets to zero on a single miss. */

import { MOMENTUM } from "./config.ts";

export interface DayOutcome {
  completed: boolean; // ≥1 complete check-in that day
  honest: boolean; // ≥1 honest check-in ("Rough day?")
  snoozed: boolean;
  missed: boolean; // ≥1 due habit with no positive check-in that day
  hadDue: boolean; // anything was scheduled that day
}

/** Momentum change for one day. Rest days (nothing due) are neutral. */
export function momentumDelta(o: DayOutcome): number {
  if (o.completed) return MOMENTUM.GAIN_COMPLETE_DAY;
  if (o.honest) return MOMENTUM.GAIN_HONEST_DAY;
  if (o.snoozed) return 0;
  if (o.hadDue && o.missed) return -MOMENTUM.DECAY_PER_MISSED_DAY;
  return 0;
}

/** Clamp into 0–100. A miss decays gradually; it can drift low over many
    misses but a single bad day can never zero you (Design Principle 1). */
export function applyDelta(current: number, delta: number): number {
  return Math.min(MOMENTUM.MAX, Math.max(MOMENTUM.MIN, current + delta));
}

export function applyDay(current: number, o: DayOutcome): number {
  return applyDelta(current, momentumDelta(o));
}
