/** Personality microcopy loader — PRD F10: swapping personality swaps the
    entire line set; tone shifts, meaning never does (§12 writing rules). */

import gentle from "../personalities/gentle.json";
import coach from "../personalities/coach.json";
import playful from "../personalities/playful.json";

export type Personality = "gentle" | "coach" | "playful";

const SETS: Record<Personality, Record<string, string>> = {
  gentle,
  coach,
  playful,
};

export function getLine(
  personality: Personality,
  key: string,
  vars: Record<string, string> = {},
): string {
  const line = SETS[personality]?.[key] ?? SETS.gentle[key] ?? "";
  return line.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}
