/** ReminderCard — PRD F4: bubble from the overlay with exactly three actions.
    Complete / Snooze 10m / "Rough day?" — honest taps are validated and count
    as check-ins (F8). All copy comes from the personality set (F10). */

import { useHabitStore } from "../../store/habitStore";
import { usePetStore } from "../../store/petStore";
import { getLine } from "../../lib/personality";

export interface ActiveReminder {
  habitId: string;
  isRecovery: boolean; // habit was missed yesterday → "never miss twice" (F7)
}

export function ReminderCard({
  reminder,
  onSnooze,
  onDismiss,
}: {
  reminder: ActiveReminder;
  onSnooze: () => void;
  onDismiss: () => void;
}) {
  const habit = useHabitStore((s) => s.habits.find((h) => h.id === reminder.habitId));
  const checkIn = useHabitStore((s) => s.checkIn);
  const setPose = usePetStore((s) => s.setPose);
  const personality = usePetStore((s) => s.personality);

  if (!habit) return null;

  async function complete() {
    await checkIn(habit!.id, "complete");
    setPose("celebrate");
    onDismiss();
  }

  async function roughDay() {
    await checkIn(habit!.id, "honest");
    setPose("gentle-pout");
    onDismiss();
  }

  const line = reminder.isRecovery
    ? getLine(personality, "recovery")
    : getLine(personality, "due", { habit: `${habit.emoji} ${habit.title}` });

  return (
    <div className="reminder" role="dialog" aria-label={`Reminder: ${habit.title}`}>
      <p className="reminder-line">{line}</p>
      <div className="reminder-actions">
        <button className="btn btn--sage" onClick={() => void complete()}>
          Complete
        </button>
        <button className="btn" onClick={onSnooze}>
          Snooze 10m
        </button>
        <button className="btn btn--coral" onClick={() => void roughDay()}>
          Rough day?
        </button>
      </div>
      <p className="reminder-hint">{getLine(personality, "honest_prompt")}</p>
    </div>
  );
}
