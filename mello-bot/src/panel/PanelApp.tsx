/** Mello Habits & Settings panel (opened from the tray).
    Zero-shame copy per PRD §06/§12: mistakes are accidents, numbers stay neutral. */

import { useEffect, useState } from "react";
import { useHabitStore } from "../store/habitStore";
import { usePetStore, type Colorway } from "../store/petStore";
import { useSettingsStore } from "../store/settingsStore";
import { isDueOn, type HabitMode } from "../lib/types";
import "../styles/global.css";
import "./panel.css";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

const STAGE_LABELS: Record<string, string> = {
  egg: "🥚 Egg",
  baby: "🐣 Baby",
  teen: "🌱 Teen",
  adult: "🐾 Adult",
  "elder-sage": "🎓 Elder Sage",
};

const COLORWAYS: { id: Colorway; label: string; swatch: string }[] = [
  { id: "vanilla", label: "Vanilla", swatch: "#FFE9B8" },
  { id: "cocoa", label: "Cocoa", swatch: "#C99B6E" },
  { id: "matcha", label: "Matcha", swatch: "#D8E6C0" },
];

const HATS: { id: string; label: string; icon: string }[] = [
  { id: "", label: "Natural", icon: "🌱" },
  { id: "beanie", label: "Beanie", icon: "🧢" },
  { id: "scarf", label: "Scarf", icon: "🧣" },
  { id: "bow", label: "Bow", icon: "🎀" },
];

export default function PanelApp() {
  const habits = useHabitStore((s) => s.habits);
  const loaded = useHabitStore((s) => s.loaded);
  const doneToday = useHabitStore((s) => s.doneToday);
  const checkIn = useHabitStore((s) => s.checkIn);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);
  const petName = usePetStore((s) => s.name);
  const setName = usePetStore((s) => s.setName);
  const colorway = usePetStore((s) => s.colorway);
  const setColorway = usePetStore((s) => s.setColorway);
  const petStage = usePetStore((s) => s.stage);
  const petMomentum = usePetStore((s) => s.momentum);
  const petCp = usePetStore((s) => s.carePoints);
  const hat = usePetStore((s) => s.hat);
  const equipHat = usePetStore((s) => s.equipHat);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.update);

  // Add-habit form state
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🌱");
  const [mode, setMode] = useState<HabitMode>("build");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [addOpen, setAddOpen] = useState(false);
  const [exportMsg, setExportMsg] = useState("");

  useEffect(() => {
    void useHabitStore.getState().load();
    void usePetStore.getState().load();
    void useSettingsStore.getState().load();
  }, []);

  async function submitAdd() {
    const t = title.trim();
    if (!t) return;
    await useHabitStore.getState().addHabit({
      title: t,
      emoji: emoji || "🌱",
      mode,
      schedule: days.length === 7 ? { type: "daily" } : { type: "weekly", days },
    });
    setTitle("");
    setEmoji("🌱");
    setAddOpen(false);
  }

  async function doExport() {
    const r = (await window.melloShell.exportData()) as string;
    setExportMsg(r === "canceled" ? "" : "Exported ✓");
    setTimeout(() => setExportMsg(""), 3000);
  }

  async function doImport() {
    // Destructive: confirm first (PRD C6 pattern — one click, confirmed)
    const ok = window.confirm(
      "Importing replaces ALL current data with the file's data. Continue?",
    );
    if (!ok) return;
    const r = (await window.melloShell.importData()) as string;
    if (r !== "canceled") {
      await useHabitStore.getState().load();
      await usePetStore.getState().load();
      setExportMsg("Imported ✓");
      setTimeout(() => setExportMsg(""), 3000);
    }
  }

  return (
    <div className="panel">
      <header className="panel-drag">
        <span className="panel-title display">Mello</span>
        <span className="panel-sub">your cute reminder buddy</span>
      </header>

      <main className="panel-body">
        {/* My Pet */}
        <section className="card">
          <h2 className="card-title">My Pet</h2>
          <div className="pet-stats">
            <span className={`stage-chip stage-chip--${petStage}`}>{STAGE_LABELS[petStage]}</span>
            <span className="stat" title="Momentum decays gently on misses — it never resets to zero.">
              Momentum <strong>{petMomentum}</strong>
            </span>
            <span className="stat">Care <strong>{petCp}</strong></span>
          </div>
          <label className="field">
            <span>Name</span>
            <input value={petName} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="field">
            <span>Colorway</span>
            <div className="swatch-row">
              {COLORWAYS.map((c) => (
                <button
                  key={c.id}
                  className={`swatch ${colorway === c.id ? "swatch--on" : ""}`}
                  style={{ background: c.swatch }}
                  onClick={() => setColorway(c.id)}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Wardrobe — F11/F15 */}
        <section className="card">
          <h2 className="card-title">Wardrobe</h2>
          <div className="field">
            <span>Hat</span>
            <div className="hat-row">
              {HATS.map((h) => (
                <button
                  key={h.id || "none"}
                  className={`hat ${hat === h.id ? "hat--on" : ""}`}
                  onClick={() => equipHat(h.id)}
                  title={h.label}
                >
                  <span className="hat-icon">{h.icon}</span>
                  <span className="hat-label">{h.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Habits */}
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Habits</h2>
            <button className="btn btn--gold" onClick={() => setAddOpen(!addOpen)}>
              {addOpen ? "Close" : "+ Add"}
            </button>
          </div>

          {addOpen && (
            <div className="add-form">
              <div className="add-row">
                <input
                  className="emoji-input"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
                  aria-label="Habit emoji"
                />
                <input
                  className="title-input"
                  placeholder="e.g. 20 min of practice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void submitAdd()}
                />
              </div>
              <div className="add-row add-row--split">
                <div className="mode-toggle" role="group" aria-label="Habit mode">
                  <button
                    className={mode === "build" ? "on" : ""}
                    onClick={() => setMode("build")}
                  >
                    Build
                  </button>
                  <button
                    className={mode === "reduce" ? "on" : ""}
                    onClick={() => setMode("reduce")}
                  >
                    Reduce
                  </button>
                </div>
                <div className="day-picker" role="group" aria-label="Days of week">
                  {DAYS.map((d, i) => (
                    <button
                      key={i}
                      className={days.includes(i) ? "on" : ""}
                      onClick={() =>
                        setDays((prev) =>
                          prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort(),
                        )
                      }
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <button className="btn btn--gold btn--wide" onClick={() => void submitAdd()}>
                Add habit
              </button>
            </div>
          )}

          {!loaded ? (
            <p className="empty">Loading…</p>
          ) : habits.length === 0 ? (
            <div className="empty">
              <p className="empty-art display">🥚</p>
              <p>Nothing here yet. One tiny habit is a perfect start.</p>
              <button className="btn btn--gold" onClick={() => setAddOpen(true)}>
                Add your first habit
              </button>
            </div>
          ) : (
            <ul className="habit-list">
              {habits.map((h) => {
                const due = isDueOn(h.schedule, new Date());
                const done = doneToday.has(h.id);
                return (
                  <li key={h.id} className={`habit ${done ? "habit--done" : ""}`}>
                    <span className="habit-emoji">{h.emoji}</span>
                    <div className="habit-main">
                      <span className="habit-title">{h.title}</span>
                      <span className="habit-meta">
                        {h.mode === "build" ? "Build" : "Reduce"} ·{" "}
                        {h.schedule.type === "daily" ? "every day" : `${h.schedule.days.length}×/week`}
                        {!due && " · not today"}
                      </span>
                    </div>
                    {due && !done ? (
                      <div className="habit-actions">
                        <button
                          className="btn btn--sage"
                          title="Complete (+2 care)"
                          onClick={() => void checkIn(h.id, "complete")}
                        >
                          ✓
                        </button>
                        <button
                          className="btn"
                          title="Rough day? Honest check-in counts too (+1 care)"
                          onClick={() => void checkIn(h.id, "honest")}
                        >
                          Rough day?
                        </button>
                      </div>
                    ) : done ? (
                      <span className="habit-done-label">done today ✓</span>
                    ) : (
                      <span className="habit-done-label">resting</span>
                    )}
                    <button
                      className="btn btn--ghost habit-delete"
                      title="Delete habit"
                      onClick={() => void deleteHabit(h.id)}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Reminders & quiet hours — F5 */}
        <section className="card">
          <h2 className="card-title">Nudges</h2>
          <label className="field field--row">
            <input
              type="checkbox"
              checked={settings.quietEnabled}
              onChange={(e) => updateSettings({ quietEnabled: e.target.checked })}
            />
            <span>
              Quiet hours ({settings.quietStart}–{settings.quietEnd}) — I'm off duty then.
            </span>
          </label>
          {settings.quietEnabled && (
            <div className="field field--times">
              <label>
                from{" "}
                <input
                  type="time"
                  value={settings.quietStart}
                  onChange={(e) => updateSettings({ quietStart: e.target.value })}
                />
              </label>
              <label>
                to{" "}
                <input
                  type="time"
                  value={settings.quietEnd}
                  onChange={(e) => updateSettings({ quietEnd: e.target.value })}
                />
              </label>
            </div>
          )}
          <label className="field">
            <span>Random nudge chance: {settings.nudgeProbability}%</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={settings.nudgeProbability}
              onChange={(e) => updateSettings({ nudgeProbability: Number(e.target.value) })}
            />
          </label>
        </section>

        {/* Data — a trust promise, PRD F13 */}
        <section className="card">
          <h2 className="card-title">My Data</h2>
          <p className="card-note">
            Yours, on your device. Export anytime; import replaces everything.
          </p>
          <div className="btn-row">
            <button className="btn" onClick={() => void doExport()}>
              Export JSON
            </button>
            <button className="btn" onClick={() => void doImport()}>
              Import JSON
            </button>
            {exportMsg && <span className="data-msg">{exportMsg}</span>}
          </div>
        </section>
      </main>
    </div>
  );
}
