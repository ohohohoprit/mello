// Re-enable quiet hours via the panel checkbox (restores PRD default).
const cb = document.querySelector('.field--row input[type="checkbox"]');
if (!cb) throw new Error("quiet-hours checkbox not found");
if (!cb.checked) cb.click();
await new Promise((r) => setTimeout(r, 300));
return "quietEnabled now: " + cb.checked;
