/* sql.js (WASM SQLite) with file persistence.
   Pure WASM: no native modules, so Smart App Control never blocks it. */

const fs = require("node:fs");
const path = require("node:path");
const initSqlJs = require("sql.js");

let db = null;
let dbPath = null;
let saveTimer = null;

function persistNow() {
  if (!db || !dbPath) return;
  const data = Buffer.from(db.export());
  fs.writeFileSync(dbPath, data);
}

function persistDebounced() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(persistNow, 400);
}

const APP_SCHEMA = `
create table if not exists settings (key text primary key, value text not null);
create table if not exists pets (id text primary key, name text not null default 'Mello',
  personality text not null default 'gentle' check (personality in ('gentle','coach','playful')),
  colorway text not null default 'vanilla' check (colorway in ('vanilla','cocoa','matcha')),
  stage text not null default 'egg' check (stage in ('egg','baby','teen','adult','elder-sage')),
  care_points int not null default 0, momentum int not null default 50,
  born_on text not null, target_date text);
create table if not exists habits (id text primary key, pet_id text not null references pets(id) on delete cascade,
  mode text not null check (mode in ('build','reduce')), title text not null, emoji text not null default '🌱',
  schedule text not null, created_at text not null default (datetime('now')));
create table if not exists checkins (id text primary key, habit_id text not null references habits(id) on delete cascade,
  type text not null check (type in ('complete','snooze','honest','missed')),
  occurred_at text not null default (datetime('now','localtime')));
create table if not exists momentum_log (seq integer primary key autoincrement,
  pet_id text not null references pets(id) on delete cascade, value int not null,
  recorded_at text not null default (datetime('now','localtime')));
create table if not exists cosmetics (id text primary key, name text not null,
  slot text not null check (slot in ('hat','colorway')), pack_id text, price_cents int not null default 0);
create table if not exists inventory (id text primary key, pet_id text not null references pets(id) on delete cascade,
  cosmetic_id text not null references cosmetics(id) on delete cascade, equipped int not null default 0,
  acquired_at text not null default (datetime('now','localtime')));
create index if not exists idx_checkins_habit on checkins(habit_id, occurred_at);
create index if not exists idx_momentum_pet on momentum_log(pet_id, recorded_at);
`;

async function initDb(filePath) {
  dbPath = filePath;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const SQL = await initSqlJs();
  db = fs.existsSync(filePath)
    ? new SQL.Database(fs.readFileSync(filePath))
    : new SQL.Database();
  // Main process owns schema creation — no window can race a missing table.
  db.run(APP_SCHEMA);
  persistNow();
  return true;
}

/** SELECT → array of row objects */
function select(sql, params = []) {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    return rows;
  } finally {
    stmt.free();
  }
}

/** Mutation (INSERT/UPDATE/DELETE/DDL). Persists to disk (debounced). */
function execute(sql, params = []) {
  db.run(sql, params);
  persistDebounced();
  return { rowsAffected: db.getRowsModified() };
}

/** Full DB as Uint8Array — powers the PRD F13 JSON export/import. */
function exportDb() {
  persistNow();
  return db.export();
}

function importDb(bytes) {
  const SQL = require("sql.js");
  db.close();
  db = new SQL.Database(bytes);
  persistNow();
  return true;
}

/* ---------- JSON export / import (PRD F13) ---------- */

const DUMP_TABLES = ["pets", "habits", "checkins", "momentum_log", "settings"];

/** Full human-readable JSON dump of every table. */
function dumpAll() {
  const out = { meta: { app: "mello", exported_at: new Date().toISOString() } };
  for (const t of DUMP_TABLES) {
    out[t] = select(`select * from ${t}`);
  }
  return out;
}

/** Replace table contents from a dump JSON. FK-safe order. */
function restoreAll(json) {
  db.run("begin transaction");
  try {
    db.run("delete from checkins");
    db.run("delete from momentum_log");
    db.run("delete from habits");
    db.run("delete from pets");
    db.run("delete from settings");
    for (const t of DUMP_TABLES) {
      const rows = json[t];
      if (!Array.isArray(rows)) continue;
      for (const row of rows) {
        const cols = Object.keys(row);
        const vals = cols.map((c) => row[c]);
        const ph = cols.map(() => "?").join(",");
        db.run(`insert into ${t} (${cols.join(",")}) values (${ph})`, vals);
      }
    }
    db.run("commit");
  } catch (e) {
    db.run("rollback");
    throw e;
  }
  persistNow();
  return true;
}

module.exports = { initDb, select, execute, exportDb, importDb, dumpAll, restoreAll };
