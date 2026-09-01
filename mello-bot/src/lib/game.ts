/** Game glue between pure logic and stores/DB: check-in effects + live momentum. */

import { db } from "./db";
import { CARE_POINTS } from "./config";
import { applyDay, type DayOutcome } from "./momentum";
import { computeStage, type Stage } from "./lifeJourney";
import type { Pet } from "./types";
import { diffDays, todayIso } from "./time";

export interface TodaySets {
  completed: Set<string>;
  honest: Set<string>;
  snoozed: Set<string>;
}

export function todayOutcome(sets: TodaySets, hadDue: boolean): DayOutcome {
  return {
    completed: sets.completed.size > 0,
    honest: sets.honest.size > 0 && sets.completed.size === 0,
    snoozed: sets.snoozed.size > 0,
    missed: false, // today isn't over — misses land at rollover
    hadDue,
  };
}

/** Momentum including today's live gains (stored value covers through yesterday). */
export function liveMomentum(storedMomentum: number, sets: TodaySets, hadDue: boolean): number {
  return applyDay(storedMomentum, todayOutcome(sets, hadDue));
}

/** Care points + hatch/stage progression after a positive check-in. */
export async function applyCheckinEffects(
  type: "complete" | "honest" | "snooze",
): Promise<{ careAwarded: number; hatched: boolean; newStage: Stage | null }> {
  const petRows = await db.select<Pet>("select * from pets limit 1");
  if (petRows.length === 0) return { careAwarded: 0, hatched: false, newStage: null };
  const pet = petRows[0];

  const care =
    type === "complete" ? CARE_POINTS.COMPLETE : type === "honest" ? CARE_POINTS.HONEST : 0;

  const cp = pet.care_points + care;
  const anyPositive = await db.select<{ n: number }>(
    "select count(*) as n from checkins where type in ('complete','honest','snooze')",
  );
  const hasAnyCheckin = (anyPositive[0]?.n ?? 0) > 0;

  const active = await db.select<{ n: number }>(
    `select count(distinct substr(occurred_at, 1, 10)) as n from checkins
     where type in ('complete','honest','snooze')`,
  );
  const targetDays = pet.target_date ? diffDays(pet.born_on, pet.target_date) : 0;

  const journey = computeStage({
    currentStage: pet.stage as Stage,
    carePoints: cp,
    activeDays: active[0]?.n ?? 0,
    targetDays,
    hasAnyCheckin,
    today: todayIso(),
    targetDate: pet.target_date,
  });

  await db.execute("update pets set care_points = ?, stage = ? where id = ?", [
    cp,
    journey.stage,
    pet.id,
  ]);

  return {
    careAwarded: care,
    hatched: pet.stage === "egg" && journey.stage === "baby",
    newStage: journey.stage !== pet.stage ? journey.stage : null,
  };
}
