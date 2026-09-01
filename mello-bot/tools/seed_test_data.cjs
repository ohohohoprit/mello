/* TEMP test helper: seed a habit + pet name directly into mello.db while the app is closed. */
const fs = require("node:fs");
const path = require("node:path");
const initSqlJs = require("sql.js");

const dbPath = path.join(process.env.APPDATA, "mello-bot", "mello.db");

(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(dbPath));

  // schema (same DDL as app, idempotent)
  db.run(`
    create table if not exists pets (id text primary key, name text not null default 'Mello',
      personality text not null default 'gentle', colorway text not null default 'vanilla',
      stage text not null default 'egg', care_points int not null default 0, momentum int not null default 50,
      born_on text not null, target_date text);
    create table if not exists habits (id text primary key, pet_id text not null references pets(id) on delete cascade,
      mode text not null check (mode in ('build','reduce')), title text not null, emoji text not null default '🌱',
      schedule text not null, created_at text not null default (datetime('now')));
    create table if not exists checkins (id text primary key, habit_id text not null references habits(id) on delete cascade,
      type text not null check (type in ('complete','snooze','honest','missed')), occurred_at text not null default (datetime('now')));
    create table if not exists momentum_log (seq integer primary key autoincrement, pet_id text not null references pets(id) on delete cascade,
      value int not null, recorded_at text not null default (datetime('now')));
  `);

  // pet row
  let petId;
  const r = db.exec("select id from pets limit 1");
  if (r.length === 0) {
    petId = "test-pet-0001";
    db.run("insert into pets (id, name) values (?, 'Pudding')", [petId]);
  } else {
    petId = r[0].values[0][0];
    db.run("update pets set name = 'Pudding' where id = ?", [petId]);
  }

  // test habits (only if the table is empty)
  const h = db.exec("select count(*) from habits");
  if (h[0].values[0][0] === 0) {
    db.run("insert into habits (id, pet_id, mode, title, emoji, schedule) values (?,?,?,?,?,?)", [
      "test-habit-0001", petId, "build", "20 min of practice", "📚", JSON.stringify({ type: "daily" }),
    ]);
    db.run("insert into habits (id, pet_id, mode, title, emoji, schedule) values (?,?,?,?,?,?)", [
      "test-habit-0002", petId, "reduce", "Less doom-scrolling tonight", "📱", JSON.stringify({ type: "weekly", days: [1, 3, 5] }),
    ]);
  }

  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  const count = db.exec("select count(*) from habits")[0].values[0][0];
  console.log("seeded OK — habits:", count, "pet name: Pudding");
})();
