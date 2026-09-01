/* Inspect rollover results: missed rows, momentum_log, lastRolloverDate. */
const fs = require("node:fs");
const path = require("node:path");
const initSqlJs = require("sql.js");

(async () => {
  const dbPath = path.join(process.env.APPDATA, "mello-bot", "mello.db");
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(dbPath));
  const missed = db.exec("select substr(occurred_at,1,10) as d, count(*) from checkins where type='missed' group by d");
  const log = db.exec("select substr(recorded_at,1,10) as d, value from momentum_log order by recorded_at");
  const last = db.exec("select value from settings where key='lastRolloverDate'");
  const pet = db.exec("select momentum, stage, care_points from pets limit 1");
  console.log("PET (momentum, stage, cp):", JSON.stringify(pet[0]?.values ?? []));
  console.log("MISSED ROWS:", JSON.stringify(missed[0]?.values ?? []));
  console.log("MOMENTUM LOG:", JSON.stringify(log[0]?.values ?? []));
  console.log("LAST ROLLOVER:", JSON.stringify(last[0]?.values ?? []));
})();
