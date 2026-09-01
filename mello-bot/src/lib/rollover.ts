/** Daily rollover — runs at app boot (and could run at midnight).
    Marks past-due days as `missed` (idempotent), applies gradual momentum
    decay day by day, appends momentum_log, and advances the Life Journey.
    Missed days pause aging: they never add activeDays. PRD F6/F9. */

import { db } from "./db";
import { MOMENTUM } from "./config";
import { applyDay, type DayOutcome } from "./momentum";
import { computeStage, type Stage } from "./lifeJourney";
import { isDueOn, type Habit, type Pet } from "./types";
import { addDays, dbNowOn, diffDays, eachDate, todayIso } from "./time";

export interface RolloverSummary {
  processedDays: string[];
  missedRows: number;
  momentum: number;
  stage: string;
  graduated: boolean;
}

export async function runDailyRollover(): Promise<RolloverSummary | null> {
  const petRows = await db.select<Pet>("select * from pets limit 1");
  if (petRows.length === 0) return null;
  const pet = petRows[0];

  const today = todayIso();
  const yesterday = addDays(today, -1);

  const lastRows = await db.select<{ value: string }>(
    "select value from settings where key = 'lastRolloverDate'",
  );
  const lastDate = lastRows[0]?.value ?? addDays(pet.born_on, -1);
  if (lastDate >= today) return null; // already current

  const habits = await db.select<Habit & { schedule: string; created_at: string }>(
    "select * from habits",
  );
  const habitsParsed: Habit[] = habits.map((h) => ({
    ...h,
    schedule: JSON.parse(h.schedule),
    created_at: h.created_at,
  }));

  const days = eachDate(addDays(lastDate, 1), yesterday);
  let momentum = pet.momentum;
  let missedRows = 0;

  for (const day of days) {
    const outcome: DayOutcome = {
      completed: false,
      honest: false,
      snoozed: false,
      missed: false,
      hadDue: false,
    };

    for (const h of habitsParsed) {
      // habit only counts for days after it was created
      if (h.created_at.slice(0, 10) > day) continue;
      if (!isDueOn(h.schedule, new Date(day + "T12:00:00"))) continue;
      outcome.hadDue = true;

      const positive = await db.select<{ n: number }>(
        `select count(*) as n from checkins
         where habit_id = ? and type in ('complete','honest','snooze')
           and substr(occurred_at, 1, 10) = ?`,
        [h.id, day],
      );
      if ((positive[0]?.n ?? 0) > 0) {
        // categorize the day's best outcome
        const kinds = await db.select<{ type: string }>(
          `select distinct type from checkins
           where habit_id = ? and type in ('complete','honest','snooze')
             and substr(occurred_at, 1, 10) = ?`,
          [h.id, day],
        );
        const types = kinds.map((k) => k.type);
        if (types.includes("complete")) outcome.completed = true;
        else if (types.includes("honest")) outcome.honest = true;
        else if (types.includes("snooze")) outcome.snoozed = true;
        continue;
      }

      // missed — but only write the row once (idempotent)
      const existingMiss = await db.select<{ n: number }>(
        `select count(*) as n from checkins
         where habit_id = ? and type = 'missed' and substr(occurred_at, 1, 10) = ?`,
        [h.id, day],
      );
      if ((existingMiss[0]?.n ?? 0) === 0) {
        await db.execute(
          "insert into checkins (id, habit_id, type, occurred_at) values (?,?,?,?)",
          [crypto.randomUUID(), h.id, "missed", dbNowOn(day, true)],
        );
        missedRows += 1;
        outcome.missed = true;
      }
    }

    momentum = applyDay(momentum, outcome);
    await db.execute(
      "insert into momentum_log (pet_id, value, recorded_at) values (?,?,?)",
      [pet.id, momentum, dbNowOn(day, true)],
    );
  }

  // Life Journey recompute (active days only age the pet — misses pause aging)
  const active = await db.select<{ n: number }>(
    `select count(distinct substr(occurred_at, 1, 10)) as n from checkins
     where type in ('complete','honest','snooze')`,
  );
  const any = await db.select<{ n: number }>(
    "select count(*) as n from checkins where type in ('complete','honest','snooze')",
  );
  const activeDays = active[0]?.n ?? 0;
  const hasAnyCheckin = (any[0]?.n ?? 0) > 0;
  const targetDays = pet.target_date ? diffDays(pet.born_on, pet.target_date) : 0;

  const journey = computeStage({
    currentStage: pet.stage as Stage,
    carePoints: pet.care_points,
    activeDays,
    targetDays,
    hasAnyCheckin,
    today,
    targetDate: pet.target_date,
  });

  await db.execute("update pets set momentum = ?, stage = ? where id = ?", [
    momentum,
    journey.stage,
    pet.id,
  ]);
  await db.execute(
    `insert into settings (key, value) values ('lastRolloverDate', ?)
     on conflict(key) do update set value = excluded.value`,
    [today],
  );

  return {
    processedDays: days,
    missedRows,
    momentum,
    stage: journey.stage,
    graduated: journey.graduated,
  };
}

export { MOMENTUM };
