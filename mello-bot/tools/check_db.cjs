/* Verify DB on disk: list habits + pet care_points. */
const fs = require("node:fs");
const path = require("node:path");
const initSqlJs = require("sql.js");

(async () => {
  const dbPath = path.join(process.env.APPDATA, "mello-bot", "mello.db");
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(dbPath));
  const habits = db.exec("select title, mode, schedule from habits order by created_at");
  const pet = db.exec("select name, care_points from pets limit 1");
  console.log("PET:", JSON.stringify(pet[0].values));
  console.log("HABITS:", JSON.stringify(habits[0].values));
})();
