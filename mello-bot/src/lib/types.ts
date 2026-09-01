/** Mello data model — mirrors PRD §14 schema, local subset (SQLite via sql.js).
    Sync/encrypted-blob columns are v0.2 (F18) and intentionally absent tonight. */

export type HabitMode = "build" | "reduce";
export type CheckinType = "complete" | "snooze" | "honest" | "missed";

/** Simple schedule JSON tonight (PRD says rrule-style eventually; not tonight). */
export type Schedule =
  | { type: "daily" }
  | { type: "weekly"; days: number[] } // 0=Sunday … 6=Saturday

export interface Pet {
  id: string;
  name: string;
  personality: "gentle" | "coach" | "playful";
  colorway: "vanilla" | "cocoa" | "matcha";
  stage: "egg" | "baby" | "teen" | "adult" | "elder-sage";
  care_points: number;
  momentum: number;
  born_on: string; // ISO date
  target_date: string | null;
}

export interface Habit {
  id: string;
  pet_id: string;
  mode: HabitMode;
  title: string;
  emoji: string;
  schedule: Schedule; // stored as JSON string in DB
  created_at: string;
}

export interface Checkin {
  id: string;
  habit_id: string;
  type: CheckinType;
  occurred_at: string;
}

export interface MomentumPoint {
  pet_id: string;
  value: number;
  recorded_at: string;
}

/** Is this habit due on the given date? */
export function isDueOn(schedule: Schedule, date: Date): boolean {
  if (schedule.type === "daily") return true;
  return schedule.days.includes(date.getDay());
}

export function newId(): string {
  return crypto.randomUUID();
}

export { todayIso } from "./time";
