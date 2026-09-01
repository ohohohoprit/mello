/** H4–H6 DoD: simulate a pet's whole life offline — Egg → Elder Sage —
    with correct Momentum decay/never-reset behavior and stage gates.
    Run: node src/lib/simulate.ts  (Node 24 strips types natively) */

import assert from "node:assert";
import { applyDay, type DayOutcome } from "./momentum.ts";
import { computeStage, type Stage } from "./lifeJourney.ts";

const TARGET_DAYS = 60;
const targetDate = "2026-10-31";

let momentum = 50;
let carePoints = 0;
let activeDays = 0;
let hasAnyCheckin = false;
let stage: Stage = "egg";

const timeline: string[] = [];

function day(n: number, o: DayOutcome, date: string) {
  const prev = momentum;
  momentum = applyDay(momentum, o);
  if (o.completed || o.honest || o.snoozed) activeDays += 1;
  if (o.completed) carePoints += 2;
  if (o.honest) carePoints += 1;
  if (o.completed || o.honest) hasAnyCheckin = true;

  const res = computeStage({
    currentStage: stage,
    carePoints,
    activeDays,
    targetDays: TARGET_DAYS,
    hasAnyCheckin,
    today: date,
    targetDate,
  });
  const changed = res.stage !== stage;
  stage = res.stage;
  if (changed) timeline.push(`day ${n} (${date}): → ${stage} (CP=${carePoints}, progress=${(res.progress * 100).toFixed(0)}%)`);

  return { prev, momentum };
}

// — Day 1: first complete → hatch —
let { prev, momentum: m } = day(1, completed(), "2026-09-01");
assert.equal(stage, "baby", "first check-in hatches the egg");
assert.equal(m, 58, "complete day: 50 → 58");
timeline.push(`day 1: hatch! momentum 50 → 58`);

// — Days 2–20: steady completes → Teen needs CP≥40 AND progress≥25% —
for (let d = 2; d <= 20; d++) {
  day(d, completed(), iso(d));
}
assert.equal(stage, "teen", `CP=${carePoints}, activeDays=${activeDays} → teen`);
assert.equal(carePoints, 40, "20 complete days = 40 CP");

// — A miss decays gradually, never resets —
({ prev, momentum: m } = day(21, missed(), iso(21)));
assert.equal(m, prev - 5, "one missed day decays exactly 5");
assert.ok(m > 0, "never resets to zero on a miss");

// — Rough day (honest) still counts, gentler gain —
({ prev, momentum: m } = day(22, honest(), iso(22)));
assert.equal(m, prev + 4, "honest day gains +4");

// — Snooze day is neutral —
({ prev, momentum: m } = day(23, snoozed(), iso(23)));
assert.equal(m, prev, "snooze day is neutral");

// — Rest day (nothing due) is neutral, and doesn't age the pet —
const activeBefore = activeDays;
({ momentum: m } = day(24, rest(), iso(24)));
assert.equal(m, prev, "rest day neutral");
assert.equal(activeDays, activeBefore, "rest day doesn't age the pet");

// — Two more misses: gradual decline continues —
day(25, missed(), iso(25));
const afterTwoMisses = momentum;
day(26, missed(), iso(26));
assert.equal(momentum, afterTwoMisses - 5, "each miss decays 5, gradually");

// — Recover with completes through Adult (CP≥90 AND progress≥55%) —
for (let d = 27; d <= 40; d++) day(d, completed(), iso(d));
assert.equal(carePoints, 69, "40 + honest(1) + 14 completes ×2");

for (let d = 41; d <= 52; d++) day(d, completed(), iso(d));
assert.equal(stage, "adult", `CP=${carePoints}, activeDays=${activeDays} → adult`);

// — Push to the end of the journey: graduation day —
for (let d = 53; d <= 59; d++) day(d, completed(), iso(d));
assert.notEqual(stage, "elder-sage", "not graduated before target date");

day(60, completed(), "2026-10-31");
assert.equal(stage, "elder-sage", "target date reached → graduation");
assert.ok(momentum > 0, `momentum alive at graduation (${momentum})`);

// — Never-regression guard: feeding lower CP after graduation keeps Sage —
const sage = computeStage({
  currentStage: stage,
  carePoints: 0,
  activeDays: 0,
  targetDays: TARGET_DAYS,
  hasAnyCheckin: true,
  today: "2026-11-01",
  targetDate,
});
assert.equal(sage.stage, "elder-sage", "never regresses");

console.log("ALL ASSERTIONS PASSED ✓");
console.log(`final: momentum=${momentum} CP=${carePoints} activeDays=${activeDays}/${TARGET_DAYS}`);
console.log("timeline:");
for (const t of timeline) console.log("  " + t);

// — helpers —
function completed(): DayOutcome {
  return { completed: true, honest: false, snoozed: false, missed: false, hadDue: true };
}
function missed(): DayOutcome {
  return { completed: false, honest: false, snoozed: false, missed: true, hadDue: true };
}
function honest(): DayOutcome {
  return { completed: false, honest: true, snoozed: false, missed: false, hadDue: true };
}
function snoozed(): DayOutcome {
  return { completed: false, honest: false, snoozed: true, missed: false, hadDue: true };
}
function rest(): DayOutcome {
  return { completed: false, honest: false, snoozed: false, missed: false, hadDue: false };
}
function iso(dayNum: number): string {
  // day 1 = 2026-09-01 … day 60 = 2026-10-30 (day 60 asserted explicitly as target date)
  const d = new Date(2026, 8, dayNum);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
