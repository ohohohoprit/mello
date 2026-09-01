/** Onboarding — PRD F12: conversational, motivation-first, <90s, no account.
    Steps: goal → lifespan (target date) → name → personality → first tiny habit.
    Every step is instrumented into settings so the ≥80% completion gate (§16)
    is measurable from day one. */

import { useEffect, useRef, useState } from "react";
import { useHabitStore } from "../../store/habitStore";
import { usePetStore } from "../../store/petStore";
import { db } from "../../lib/db";
import { addDays, todayIso } from "../../lib/time";
import { getLine, type Personality } from "../../lib/personality";
import { DURATIONS } from "../../lib/config";
import { ensureSchema, ensureCosmetics } from "../../lib/schema";
import "../../styles/global.css";
import "./onboarding.css";

type Step = "goal" | "duration" | "name" | "personality" | "first_habit" | "done";

const ORDER: Step[] = ["goal", "duration", "name", "personality", "first_habit", "done"];

async function logStep(step: Step) {
  const raw = await db.select<{ value: string }>(
    "select value from settings where key = 'onboarding_progress'",
  );
  const trail: { step: string; at: number }[] = raw[0]?.value
    ? JSON.parse(raw[0].value)
    : [{ step: "start", at: Date.now() }];
  trail.push({ step, at: Date.now() });
  await db.execute(
    `insert into settings (key, value) values ('onboarding_progress', ?)
     on conflict(key) do update set value = excluded.value`,
    [JSON.stringify(trail)],
  );
}

export default function OnboardingApp() {
  const [step, setStep] = useState<Step>("goal");
  const [goal, setGoal] = useState("");
  const [name, setName] = useState("");
  const [habitTitle, setHabitTitle] = useState("");
  const [, setPersonality] = useState<Personality>("gentle");
  const started = useRef(Date.now());

  useEffect(() => {
    void (async () => {
      await ensureSchema();
      await ensureCosmetics();
      await usePetStore.getState().load();
    })();
  }, []);

  async function advance(next: Step) {
    await logStep(next);
    if (next === "done") {
      const completedAt = Date.now();
      await db.execute(
        `insert into settings (key, value) values ('onboarding_completed_at', ?)
         on conflict(key) do update set value = excluded.value`,
        [new Date().toISOString()],
      );
      await db.execute(
        `insert into settings (key, value) values ('onboarding_duration_ms', ?)
         on conflict(key) do update set value = excluded.value`,
        [String(completedAt - started.current)],
      );
      // leave the window — the pet takes over
      window.close();
      return;
    }
    setStep(next);
  }

  async function pickDuration(days: number) {
    usePetStore.getState().setTargetDate(addDays(todayIso(), days));
    await advance("name");
  }

  async function pickCustom(date: string) {
    if (!date) return;
    usePetStore.getState().setTargetDate(date);
    await advance("name");
  }

  async function pickPersonality(p: Personality) {
    setPersonality(p);
    usePetStore.getState().setPersonality(p);
    await advance("first_habit");
  }

  async function finishHabit() {
    const pet = usePetStore.getState();
    pet.setName(name.trim() || "Mello");
    const title = habitTitle.trim() || goal.trim() || "One tiny step";
    await useHabitStore.getState().addHabit({
      title,
      emoji: "🌱",
      mode: "build",
      schedule: { type: "daily" },
    });
    await advance("done");
  }

  const petName = usePetStore((s) => s.name);

  return (
    <div className="onb">
      <header className="onb-drag">
        <span className="onb-title display">Mello</span>
        <span className="onb-step">
          {ORDER.indexOf(step) + 1}/{ORDER.length}
        </span>
      </header>

      <main className="onb-body">
        {step === "goal" && (
          <section>
            <p className="onb-copy">{getLine("gentle", "onboarding_goal")}</p>
            <input
              className="onb-input"
              autoFocus
              placeholder="e.g. pass the CFA, evening walks, less scrolling…"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goal.trim() && void advance("duration")}
            />
            <button
              className="btn btn--gold btn--wide"
              disabled={!goal.trim()}
              onClick={() => void advance("duration")}
            >
              Continue
            </button>
          </section>
        )}

        {step === "duration" && (
          <section>
            <p className="onb-copy">{getLine("gentle", "onboarding_duration")}</p>
            <div className="onb-options">
              {DURATIONS.map((d) => (
                <button key={d} className="btn" onClick={() => void pickDuration(d)}>
                  {d} days
                </button>
              ))}
            </div>
            <label className="onb-custom">
              or until a date:{" "}
              <input
                type="date"
                min={todayIso()}
                onChange={(e) => void pickCustom(e.target.value)}
              />
            </label>
            <p className="onb-note">This becomes {petName}'s journey — graduation day included.</p>
          </section>
        )}

        {step === "name" && (
          <section>
            <p className="onb-copy">{getLine("gentle", "onboarding_name")}</p>
            <input
              className="onb-input"
              autoFocus
              placeholder="Pudding, Mello, Sir Naps-a-lot…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void advance("personality")}
            />
            <button
              className="btn btn--gold btn--wide"
              onClick={() => void advance("personality")}
            >
              Continue
            </button>
          </section>
        )}

        {step === "personality" && (
          <section>
            <p className="onb-copy">{getLine("gentle", "onboarding_personality")}</p>
            <div className="onb-personalities">
              {(["gentle", "coach", "playful"] as Personality[]).map((p) => (
                <button key={p} className="onb-pcard" onClick={() => void pickPersonality(p)}>
                  <span className="onb-pname display">{p}</span>
                  <span className="onb-psample">"{getLine(p, "due", { habit: "20 min of practice" })}"</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === "first_habit" && (
          <section>
            <p className="onb-copy">{getLine("gentle", "onboarding_first_habit")}</p>
            <input
              className="onb-input"
              autoFocus
              placeholder={goal.trim() || "One tiny step"}
              value={habitTitle}
              onChange={(e) => setHabitTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void finishHabit()}
            />
            <button className="btn btn--gold btn--wide" onClick={() => void finishHabit()}>
              Meet {name.trim() || "Mello"} 🥚
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
