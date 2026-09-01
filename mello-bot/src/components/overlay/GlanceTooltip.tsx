/** Glance view — PRD F14: the single-metric hover tooltip.
    `Today 1/2 · Momentum 78` — readable in under half a second. */

import { useHabitStore } from "../../store/habitStore";
import { usePetStore } from "../../store/petStore";
import { liveMomentum } from "../../lib/game";
import { isDueOn } from "../../lib/types";

export function GlanceTooltip() {
  const habits = useHabitStore((s) => s.habits);
  const completedToday = useHabitStore((s) => s.completedToday);
  const honestToday = useHabitStore((s) => s.honestToday);
  const snoozedToday = useHabitStore((s) => s.snoozedToday);
  const momentumStored = usePetStore((s) => s.momentum);
  const loaded = useHabitStore((s) => s.loaded);

  if (!loaded) return null;

  const now = new Date();
  const dueHabits = habits.filter((h) => isDueOn(h.schedule, now));
  const doneCount = dueHabits.filter(
    (h) => completedToday.has(h.id) || honestToday.has(h.id),
  ).length;
  const total = dueHabits.length;
  const momentum = liveMomentum(
    momentumStored,
    { completed: completedToday, honest: honestToday, snoozed: snoozedToday },
    total > 0,
  );

  return (
    <div className="glance" data-testid="glance">
      Today {doneCount}/{total} · Momentum {momentum}
    </div>
  );
}
