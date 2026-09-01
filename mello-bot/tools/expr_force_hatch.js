// Insert a complete checkin + flip stage to baby via the main-process DB.
// The overlay's next tick will observe egg → baby and fire the ceremony.
await window.melloDb.execute(
  "insert into checkins (id, habit_id, type, occurred_at) values (?, (select id from habits limit 1), 'complete', datetime('now','localtime'))",
  [crypto.randomUUID()],
);
await window.melloDb.execute("update pets set stage = 'baby'", []);
return "checkin inserted + stage=baby";
