/** Game constants — PRD §11 & §10 (F6, F7, F9). Admin-editable via the config
    table in a later milestone; hardcoded defaults tonight. */

export const MOMENTUM = {
  /** PRD F6: gradual decay on miss — never a reset to zero. */
  DECAY_PER_MISSED_DAY: 5,
  /** Day with at least one completion */
  GAIN_COMPLETE_DAY: 8,
  /** Day whose only positive check-ins were honest ("Rough day?") */
  GAIN_HONEST_DAY: 4,
  /** Snoozing keeps you neutral — no gain, no decay */
  MIN: 0,
  MAX: 100,
  START: 50,
} as const;

export const CARE_POINTS = {
  COMPLETE: 2,
  RECOVERY_STEP: 2,
  HONEST: 1,
} as const;

export const STAGE_GATES = {
  /** Teen: ≥25% of the journey AND CP≥40 (PRD §11) */
  TEEN_JOURNEY: 0.25,
  TEEN_CP: 40,
  /** Adult: ≥55% of the journey AND CP≥90 (PRD §11) */
  ADULT_JOURNEY: 0.55,
  ADULT_CP: 90,
} as const;

export const DURATIONS = [30, 60, 90, 180] as const;
