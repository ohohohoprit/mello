const btn = [...document.querySelectorAll(".habit-actions .btn--sage")].find((b) => b.title.includes("Complete"));
if (!btn) throw new Error("no complete button");
btn.click();
await new Promise((r) => setTimeout(r, 400));
return "checked in; stage chip: " + document.querySelector(".stage-chip")?.textContent;
