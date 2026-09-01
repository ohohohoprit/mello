/** Local-time date helpers. All Mello day logic runs in LOCAL time
    ("your day" = when the user lives), stored as YYYY-MM-DD strings. */

export function todayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Local timestamp for DB storage: YYYY-MM-DD HH:MM:SS */
export function dbNow(now = new Date()): string {
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${todayIso(now)} ${hh}:${mi}:${ss}`;
}

/** Local timestamp on a specific date (used for rolled-over missed days) */
export function dbNowOn(dateIso: string, endOfDay = false): string {
  return endOfDay ? `${dateIso} 23:59:59` : `${dateIso} ${dbNow().slice(11)}`;
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return todayIso(dt);
}

/** Inclusive list of dates from a to b (empty if a > b) */
export function eachDate(a: string, b: string): string[] {
  const out: string[] = [];
  let cur = a;
  let guard = 0;
  while (cur <= b && guard < 1000) {
    out.push(cur);
    cur = addDays(cur, 1);
    guard += 1;
  }
  return out;
}

export function diffDays(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round(
    (new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000,
  );
}

export function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}
