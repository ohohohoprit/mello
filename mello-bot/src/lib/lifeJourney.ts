/** Life Journey state machine — PRD §11 (F9).
    5 stages · care-point gates · aging pauses on miss (active days only) ·
    graduation not death · never regresses. */

import { STAGE_GATES } from "./config.ts";

export type Stage = "egg" | "baby" | "teen" | "adult" | "elder-sage";

export const STAGES: Stage[] = ["egg", "baby", "teen", "adult", "elder-sage"];

export const STAGE_INFO: Record<Stage, { label: string; blurb: string }> = {
  egg: { label: "Egg", blurb: "A speckled egg, waiting for your first step." },
  baby: { label: "Baby", blurb: "Freshly hatched — wobbly and delighted." },
  teen: { label: "Teen", blurb: "Lanky, long-eared, full of playful energy." },
  adult: { label: "Adult", blurb: "Confident, scarf on, up for anything." },
  "elder-sage": { label: "Elder Sage", blurb: "Graduated with honors. A keepsake." },
};

export interface JourneyInput {
  currentStage: Stage;
  carePoints: number;
  /** distinct days with any engagement (complete/honest/snooze) — miss days don't age the pet */
  activeDays: number;
  /** total journey length in days (target); 0 = no target set yet */
  targetDays: number;
  /** has any positive check-in ever happened (hatch trigger) */
  hasAnyCheckin: boolean;
  /** today as YYYY-MM-DD (local) */
  today: string;
  /** journey end date, or null if no target set */
  targetDate: string | null;
}

export interface JourneyResult {
  stage: Stage;
  graduated: boolean;
  /** 0–1 through the journey (active days / target days), capped at 1 */
  progress: number;
}

/** Highest stage the pet qualifies for — never lower than the current one. */
export function computeStage(input: JourneyInput): JourneyResult {
  const { currentStage, carePoints, activeDays, targetDays, hasAnyCheckin, today, targetDate } =
    input;

  const graduated = targetDate !== null && today >= targetDate;
  const progress = targetDays > 0 ? Math.min(1, activeDays / targetDays) : 0;

  let idx = STAGES.indexOf(currentStage);
  if (idx < 0) idx = 0;

  const eligible: Stage[] = [];
  // Egg → Baby: hatch happens on the first check-in (hatch ceremony, V-02 later)
  if (hasAnyCheckin) eligible.push("baby");
  if (hasAnyCheckin && progress >= STAGE_GATES.TEEN_JOURNEY && carePoints >= STAGE_GATES.TEEN_CP)
    eligible.push("teen");
  if (hasAnyCheckin && progress >= STAGE_GATES.ADULT_JOURNEY && carePoints >= STAGE_GATES.ADULT_CP)
    eligible.push("adult");
  if (graduated) eligible.push("elder-sage");

  for (const s of eligible) {
    const sIdx = STAGES.indexOf(s);
    if (sIdx > idx) idx = sIdx;
  }

  return { stage: STAGES[idx], graduated, progress };
}
