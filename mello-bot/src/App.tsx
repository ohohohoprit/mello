import { useCallback, useEffect, useRef, useState } from "react";
import { PetSprite } from "./components/pet/PetSprite";
import { GlanceTooltip } from "./components/overlay/GlanceTooltip";
import { ReminderCard, type ActiveReminder } from "./components/overlay/ReminderCard";
import { POSES, usePetStore } from "./store/petStore";
import { useHabitStore } from "./store/habitStore";
import { useSettingsStore } from "./store/settingsStore";
import { db, shell } from "./lib/db";
import { runDailyRollover } from "./lib/rollover";
import { isQuietHours, inRandomWindow } from "./lib/reminders";
import { addDays, todayIso } from "./lib/time";
import { getLine } from "./lib/personality";
import "./styles/global.css";
import "./styles/overlay.css";

export default function App() {
  const pose = usePetStore((s) => s.pose);
  const setPose = usePetStore((s) => s.setPose);
  const name = usePetStore((s) => s.name);
  const dbReady = useRef(false);
  const [dbStatus, setDbStatus] = useState<"checking" | "ok" | "fail">("checking");
  const [reminder, setReminder] = useState<ActiveReminder | null>(null);
  const [glanceVisible, setGlanceVisible] = useState(false);
  const [ceremony, setCeremony] = useState<null | { title: string; copy: string }>(null);

  // Boot: schema → rollover (marks past-due days, applies decay, advances journey) → stores
  useEffect(() => {
    if (dbReady.current) return;
    dbReady.current = true;
    (async () => {
      try {
        const { ensureSchema, ensureCosmetics } = await import("./lib/schema");
        await ensureSchema();
        await ensureCosmetics();
        await db.execute(
          `insert into settings (key, value) values ('boot_ping', ?)
           on conflict(key) do update set value = excluded.value`,
          [new Date().toISOString()],
        );
        const rows = await db.select<{ key: string }>(
          "select key from settings where key = 'boot_ping'",
        );
        setDbStatus(rows.length > 0 ? "ok" : "fail");
        await runDailyRollover();
        await usePetStore.getState().load();
        await useHabitStore.getState().load();
        await useSettingsStore.getState().load();

        // First run? Open the conversational onboarding (F12) once per session.
        const done = await db.select<{ n: number }>(
          "select count(*) as n from settings where key = 'onboarding_completed_at'",
        );
        if ((done[0]?.n ?? 0) === 0) {
          void shell.openPanel("#onboarding");
        }
      } catch (e) {
        console.error("[mello] boot failed", e);
        setDbStatus("fail");
      }
    })();
  }, []);

  // Reminder loop — F4 (max 1 nudge per reminder) + F5 (quiet hours, probability)
  const nudgedToday = useRef<Set<string>>(new Set());
  const nudgedDate = useRef<string>(todayIso());
  const snoozedUntil = useRef<Map<string, number>>(new Map());

  const tick = useCallback(async () => {
    // The panel window writes habits/settings to the shared DB — reload each tick
    const stageBefore = usePetStore.getState().stage;
    await useHabitStore.getState().load();
    await useSettingsStore.getState().load();
    await usePetStore.getState().load();
    const stageAfter = usePetStore.getState().stage;

    // Hatch ceremony (§11): first positive check-in cracks the egg 🥚→🐣
    if (stageBefore === "egg" && stageAfter !== "egg") {
      const pet = usePetStore.getState();
      setPose("celebrate");
      setCeremony({
        title: "CRACK!",
        copy: getLine(pet.personality, "hatch", { name: pet.name }),
      });
      window.setTimeout(() => {
        setCeremony(null);
        setPose("idle");
      }, 6000);
    }

    const habits = useHabitStore.getState();
    const settings = useSettingsStore.getState().settings;
    const now = new Date();

    // day rolled over while running → reset nudge memory
    if (nudgedDate.current !== todayIso(now)) {
      nudgedDate.current = todayIso(now);
      nudgedToday.current = new Set();
    }

    if (isQuietHours(now, settings)) {
      setReminder(null);
      return;
    }

    const due = habits.dueToday();
    const candidate = due.find(
      (h) =>
        !nudgedToday.current.has(h.id) && (snoozedUntil.current.get(h.id) ?? 0) <= now.getTime(),
    );

    if (candidate) {
      // F7 Recovery Mode: did this habit get missed yesterday?
      const missedYesterday = await db.select<{ n: number }>(
        `select count(*) as n from checkins where habit_id = ? and type = 'missed'
         and substr(occurred_at, 1, 10) = ?`,
        [candidate.id, addDays(todayIso(now), -1)],
      );
      nudgedToday.current.add(candidate.id);
      setReminder({
        habitId: candidate.id,
        isRecovery: (missedYesterday[0]?.n ?? 0) > 0,
      });
      return;
    }

    // Random gentle nudge — probability slider (default 30%)
    if (inRandomWindow(now, settings) && Math.random() * 100 < settings.nudgeProbability) {
      setPose("remind");
      window.setTimeout(() => setPose("idle"), 2400);
    }
  }, [setPose]);

  useEffect(() => {
    const t = window.setInterval(() => void tick(), 20000);
    void tick();
    return () => window.clearInterval(t);
  }, [tick]);

  const snooze = useCallback(() => {
    if (reminder) {
      snoozedUntil.current.set(reminder.habitId, Date.now() + 10 * 60 * 1000);
      setReminder(null);
    }
  }, [reminder]);

  return (
    <div className="overlay">
      <header className="overlay-drag">
        <span className="overlay-name display">{name}</span>
        <span className="overlay-hint">
          hold &amp; drag me · db {dbStatus === "ok" ? "✓" : dbStatus === "fail" ? "✗" : "…"}
        </span>
      </header>

      {ceremony && (
        <div className="ceremony" role="status">
          <span className="confetti confetti-1" />
          <span className="confetti confetti-2" />
          <span className="confetti confetti-3" />
          <p className="ceremony-title display">{ceremony.title}</p>
          <p className="ceremony-copy">{ceremony.copy}</p>
        </div>
      )}

      {reminder && <ReminderCard reminder={reminder} onSnooze={snooze} onDismiss={() => setReminder(null)} />}

      <div
        className="pet-click"
        onClick={() => setPose("wave")}
        onMouseEnter={() => setGlanceVisible(true)}
        onMouseLeave={() => setGlanceVisible(false)}
      >
        <PetSprite />
        {glanceVisible && <GlanceTooltip />}
      </div>

      {/* DEV-ONLY: pose switcher for the go/no-go check. Remove before beta. */}
      <div className="pose-switcher">
        {POSES.map((p) => (
          <button
            key={p}
            onClick={() => setPose(p)}
            style={p === pose ? { background: "var(--mello-gold)" } : undefined}
          >
            {p.slice(0, 2)}
          </button>
        ))}
      </div>
    </div>
  );
}
