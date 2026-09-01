/** Reminder engine — PRD F4/F5.
    Max 1 nudge per reminder · quiet hours respected · random-nudge probability. */

import type { Settings } from "../store/settingsStore";

export function parseHm(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** True during quiet hours. Handles overnight windows like 22:00–07:00. */
export function isQuietHours(now: Date, s: Settings): boolean {
  if (!s.quietEnabled) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = parseHm(s.quietStart);
  const end = parseHm(s.quietEnd);
  if (start === end) return false;
  if (start < end) return cur >= start && cur < end; // same-day window
  return cur >= start || cur < end; // overnight window
}

export function inRandomWindow(now: Date, s: Settings): boolean {
  return !isQuietHours(now, s);
}
