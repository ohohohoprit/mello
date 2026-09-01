import { db } from "./db";
import { todayIso } from "./time";
import type { Pet } from "./types";

/** Idempotent DDL — mirrors PRD §14/§17 local subset. Safe to run on every boot. */
const SCHEMA_SQL = `
create table if not exists settings (
  key text primary key,
  value text not null
);

create table if not exists pets (
  id text primary key,
  name text not null default 'Mello',
  personality text not null default 'gentle'
    check (personality in ('gentle','coach','playful')),
  colorway text not null default 'vanilla'
    check (colorway in ('vanilla','cocoa','matcha')),
  stage text not null default 'egg'
    check (stage in ('egg','baby','teen','adult','elder-sage')),
  care_points int not null default 0,
  momentum int not null default 50,
  born_on text not null,
  target_date text
);

create table if not exists habits (
  id text primary key,
  pet_id text not null references pets(id) on delete cascade,
  mode text not null check (mode in ('build','reduce')),
  title text not null,
  emoji text not null default '🌱',
  schedule text not null, -- JSON: {"type":"daily"} | {"type":"weekly","days":[0..6]}
  created_at text not null default (datetime('now'))
);

create table if not exists checkins (
  id text primary key,
  habit_id text not null references habits(id) on delete cascade,
  type text not null check (type in ('complete','snooze','honest','missed')),
  occurred_at text not null default (datetime('now'))
);

create table if not exists momentum_log (
  seq integer primary key autoincrement,
  pet_id text not null references pets(id) on delete cascade,
  value int not null,
  recorded_at text not null default (datetime('now'))
);

create index if not exists idx_checkins_habit on checkins(habit_id, occurred_at);
create index if not exists idx_momentum_pet on momentum_log(pet_id, recorded_at);

create table if not exists cosmetics (
  id text primary key,
  name text not null,
  slot text not null check (slot in ('hat','colorway')),
  pack_id text,
  price_cents int not null default 0
);

create table if not exists inventory (
  id text primary key,
  pet_id text not null references pets(id) on delete cascade,
  cosmetic_id text not null references cosmetics(id) on delete cascade,
  equipped int not null default 0,
  acquired_at text not null default (datetime('now','localtime'))
);
`;

export async function ensureSchema(): Promise<void> {
  for (const stmt of SCHEMA_SQL.split(";")) {
    const s = stmt.trim();
    if (s) await db.execute(s);
  }
}

/** Single-pet app tonight (PRD: offline-first, one user, one pet). */
export async function ensurePet(): Promise<Pet> {
  const existing = await db.select<Pet>("select * from pets limit 1");
  if (existing.length > 0) return existing[0];
  await db.execute(`insert into pets (id, name, born_on) values (?, 'Mello', ?)`, [
    crypto.randomUUID(),
    todayIso(), // local day, consistent with all day-logic
  ]);
  const created = await db.select<Pet>("select * from pets limit 1");
  return created[0];
}

/** Seed the 3 core hats (F11) once — pack 'starter'. */
export async function ensureCosmetics(): Promise<void> {
  const n = await db.select<{ n: number }>("select count(*) as n from cosmetics");
  if ((n[0]?.n ?? 0) > 0) return;
  const hats = [
    { id: "hat-beanie", name: "beanie" },
    { id: "hat-scarf", name: "scarf" },
    { id: "hat-bow", name: "bow" },
  ];
  for (const h of hats) {
    await db.execute(
      "insert into cosmetics (id, name, slot, pack_id) values (?,?, 'hat', 'starter')",
      [h.id, h.name],
    );
    const pet = await ensurePet();
    await db.execute(
      "insert into inventory (id, pet_id, cosmetic_id, equipped) values (?, ?, ?, 0)",
      [crypto.randomUUID(), pet.id, h.id],
    );
  }
}

/** Equipped hat name for the pet ('' = none). */
export async function getEquippedHat(): Promise<string> {
  const rows = await db.select<{ name: string }>(
    `select c.name from inventory i join cosmetics c on c.id = i.cosmetic_id
     where i.equipped = 1 and c.slot = 'hat' limit 1`,
  );
  return rows[0]?.name ?? "";
}

/** Equip one hat (or unequip everything when name is ''). */
export async function equipHat(name: string): Promise<void> {
  const pet = await ensurePet();
  await db.execute(
    `update inventory set equipped = case when cosmetic_id = (select id from cosmetics where name = ? and slot = 'hat')
     then 1 else 0 end where pet_id = ?`,
    [name, pet.id],
  );
}
