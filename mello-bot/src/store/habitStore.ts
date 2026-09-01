import { create } from "zustand";
import { db } from "../lib/db";
import { applyCheckinEffects } from "../lib/game";
import { isDueOn, newId, type CheckinType, type Habit, type HabitMode, type Schedule } from "../lib/types";

interface HabitState {
  loaded: boolean;
  habits: Habit[];
  /** days's positive check-ins by type (drives glance + live momentum) */
  completedToday: Set<string>;
  honestToday: Set<string>;
  snoozedToday: Set<string>;
  /** habit ids with any positive check-in today (list UI state) */
  doneToday: Set<string>;
  load: () => Promise<void>;
  addHabit: (input: { title: string; emoji: string; mode: HabitMode; schedule: Schedule }) => Promise<void>;
  updateHabit: (id: string, patch: Partial<Pick<Habit, "title" | "emoji" | "mode" | "schedule">>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  checkIn: (
    habitId: string,
    type: Exclude<CheckinType, "missed">,
  ) => Promise<{ careAwarded: number; hatched: boolean; newStage: string | null }>;
  dueToday: () => Habit[];
}

export const useHabitStore = create<HabitState>((set, get) => ({
  loaded: false,
  habits: [],
  completedToday: new Set(),
  honestToday: new Set(),
  snoozedToday: new Set(),
  doneToday: new Set(),

  load: async () => {
    const rows = await db.select<Habit & { schedule: string }>(
      "select * from habits order by created_at asc",
    );
    const habits = rows.map((r) => ({ ...r, schedule: JSON.parse(r.schedule) as Schedule }));
    const todays = await db.select<{ habit_id: string; type: string }>(
      `select distinct habit_id, type from checkins
       where substr(occurred_at, 1, 10) = date('now', 'localtime')
         and type in ('complete','honest','snooze')`,
    );
    const completedToday = new Set<string>();
    const honestToday = new Set<string>();
    const snoozedToday = new Set<string>();
    for (const t of todays) {
      if (t.type === "complete") completedToday.add(t.habit_id);
      else if (t.type === "honest") honestToday.add(t.habit_id);
      else if (t.type === "snooze") snoozedToday.add(t.habit_id);
    }
    set({
      loaded: true,
      habits,
      completedToday,
      honestToday,
      snoozedToday,
      doneToday: new Set([...completedToday, ...honestToday]),
    });
  },

  addHabit: async ({ title, emoji, mode, schedule }) => {
    const petId = await getPetId();
    const habit: Habit = {
      id: newId(),
      pet_id: petId,
      mode,
      title,
      emoji,
      schedule,
      created_at: new Date().toISOString(),
    };
    await db.execute(
      "insert into habits (id, pet_id, mode, title, emoji, schedule, created_at) values (?,?,?,?,?,?,?)",
      [
        habit.id,
        habit.pet_id,
        habit.mode,
        habit.title,
        habit.emoji,
        JSON.stringify(habit.schedule),
        habit.created_at.slice(0, 19).replace("T", " "),
      ],
    );
    set((s) => ({ habits: [...s.habits, habit] }));
  },

  updateHabit: async (id, patch) => {
    const current = get().habits.find((h) => h.id === id);
    if (!current) return;
    const next = { ...current, ...patch };
    await db.execute("update habits set mode = ?, title = ?, emoji = ?, schedule = ? where id = ?", [
      next.mode,
      next.title,
      next.emoji,
      JSON.stringify(next.schedule),
      id,
    ]);
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? next : h)) }));
  },

  deleteHabit: async (id) => {
    await db.execute("delete from habits where id = ?", [id]);
    set((s) => {
      const drop = (xs: Set<string>) => new Set([...xs].filter((x) => x !== id));
      return {
        habits: s.habits.filter((h) => h.id !== id),
        doneToday: drop(s.doneToday),
        completedToday: drop(s.completedToday),
        honestToday: drop(s.honestToday),
        snoozedToday: drop(s.snoozedToday),
      };
    });
  },

  checkIn: async (habitId, type) => {
    await db.execute("insert into checkins (id, habit_id, type, occurred_at) values (?,?,?,datetime('now','localtime'))", [
      newId(),
      habitId,
      type,
    ]);
    const effects = await applyCheckinEffects(type);

    // pet store mirrors care points + stage (incl. hatch)
    const { usePetStore } = await import("./petStore");
    const pet = usePetStore.getState();
    if (effects.careAwarded > 0) pet.addCarePoints(effects.careAwarded);
    if (effects.newStage) pet.applyStage(effects.newStage);

    set((s) => {
      const add = (xs: Set<string>) => new Set([...xs, habitId]);
      return {
        completedToday: type === "complete" ? add(s.completedToday) : s.completedToday,
        honestToday: type === "honest" ? add(s.honestToday) : s.honestToday,
        snoozedToday: type === "snooze" ? add(s.snoozedToday) : s.snoozedToday,
        doneToday: type === "complete" || type === "honest" ? add(s.doneToday) : s.doneToday,
      };
    });

    return effects;
  },

  dueToday: () => {
    const now = new Date();
    return get().habits.filter((h) => isDueOn(h.schedule, now) && !get().doneToday.has(h.id));
  },
}));

async function getPetId(): Promise<string> {
  const { ensurePet } = await import("../lib/schema");
  const pet = await ensurePet();
  return pet.id;
}
