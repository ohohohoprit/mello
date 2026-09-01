/* Seed: Stretch habit missed yesterday → reminder should offer Recovery Mode. */
const fs = require("node:fs");
const path = require("node:path");
const initSqlJs = require("sql.js");

(async () => {
  const dbPath = path.join(process.env.APPDATA, "mello-bot", "mello.db");
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(dbPath));
  const id = db.exec("select id from habits where title = 'Stretch for 2 minutes'")[0].values[0][0];
  db.run("insert into checkins (id, habit_id, type, occurred_at) values (?,?,?,?)", [
    "test-missed-stretch", id, "missed", "2026-08-31 23:59:59",
  ]);
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  console.log("seeded missed row for Stretch on 2026-08-31");
})();
