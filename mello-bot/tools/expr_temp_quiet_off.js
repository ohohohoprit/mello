// On the temp instance: disable quiet hours via the exposed bridge (goes through main DB),
// then open the panel window for the habit check-in.
await window.melloDb.execute(
  `insert into settings (key, value) values ('app', ?)
   on conflict(key) do update set value = excluded.value`,
  [JSON.stringify({ quietStart: "22:00", quietEnd: "07:00", quietEnabled: false, nudgeProbability: 30, soundEnabled: true })],
);
await window.melloShell.openPanel("#panel");
await new Promise((r) => setTimeout(r, 800));
return "quiet off + panel opened";
