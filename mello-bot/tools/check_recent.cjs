const fs = require("node:fs");
const path = require("node:path");
const initSqlJs = require("sql.js");

(async () => {
  const dbPath = path.join(process.env.APPDATA, "mello-bot", "mello.db");
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(dbPath));
  const recent = db.exec("select c.type, h.title, c.occurred_at from checkins c join habits h on h.id=c.habit_id order by c.occurred_at desc limit 5");
  const quiet = db.exec("select value from settings where key='app'");
  console.log("RECENT CHECKINS:", JSON.stringify(recent[0]?.values ?? []));
  console.log("APP SETTINGS:", quiet[0]?.values?.[0]?.[0] ?? "none");
})();
