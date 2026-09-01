/* Seed a missed-day scenario: pretend the app last ran 2026-08-30 and the
   daily habit existed since 08-29, so rollover must mark 08-31 as missed. */
const fs = require("node:fs");
const path = require("node:path");
const initSqlJs = require("sql.js");

(async () => {
  const dbPath = path.join(process.env.APPDATA, "mello-bot", "mello.db");
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(dbPath));

  db.run(`insert into settings (key, value) values ('lastRolloverDate', '2026-08-30')
          on conflict(key) do update set value = '2026-08-30'`);
  db.run(`update habits set created_at = '2026-08-29 10:00:00' where title = '20 min of practice'`);

  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  console.log("seeded: lastRolloverDate=2026-08-30, habit backdated to 08-29");
})();
