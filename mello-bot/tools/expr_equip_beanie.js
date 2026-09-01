// Equip the beanie via the bridge (goes through main DB), then read back.
await window.melloDb.execute(
  `update inventory set equipped = case when cosmetic_id = (select id from cosmetics where name = 'beanie' and slot = 'hat')
   then 1 else 0 end where pet_id = (select id from pets limit 1)`,
  [],
);
const rows = await window.melloDb.select(
  `select c.name from inventory i join cosmetics c on c.id = i.cosmetic_id where i.equipped = 1`,
);
return "equipped: " + JSON.stringify(rows);
