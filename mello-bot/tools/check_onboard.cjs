/* Inspect the isolated onboarding-test DB. */
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const initSqlJs = require("sql.js");

(async () => {
  const dbPath = path.join(os.tmpdir(), "mello-onboard-test", "mello.db");
  if (!fs.existsSync(dbPath)) {
    console.log("NO DB at", dbPath);
    return;
  }
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(dbPath));
  const pet = db.exec("select name, personality, born_on, target_date, momentum from pets limit 1");
  const habits = db.exec("select title, mode, schedule from habits");
  const onboard = db.exec("select key, value from settings where key like 'onboarding%'");
  console.log("PET:", JSON.stringify(pet[0]?.values ?? []));
  console.log("HABITS:", JSON.stringify(habits[0]?.values ?? []));
  console.log("ONBOARDING:", JSON.stringify(onboard[0]?.values ?? []));
})();
