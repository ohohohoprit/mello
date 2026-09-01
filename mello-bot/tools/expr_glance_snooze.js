// 1) Hover the pet to trigger the glance tooltip, read it.
const pet = document.querySelector(".pet-click");
if (!pet) throw new Error("no pet-click");
pet.dispatchEvent(new Event("mouseover", { bubbles: true }));
await new Promise((r) => setTimeout(r, 250));
const glance = document.querySelector(".glance")?.textContent ?? "NO GLANCE";
pet.dispatchEvent(new Event("mouseout", { bubbles: true }));
// 2) Snooze the reminder (should hide the card).
const snoozeBtn = [...document.querySelectorAll(".reminder-actions .btn")].find(
  (b) => b.textContent === "Snooze 10m",
);
if (snoozeBtn) snoozeBtn.click();
await new Promise((r) => setTimeout(r, 300));
return JSON.stringify({ glance, reminderAfterSnooze: !!document.querySelector(".reminder") });
