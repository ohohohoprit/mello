const btn = [...document.querySelectorAll(".reminder-actions .btn")].find(
  (b) => b.textContent === "Complete",
);
if (!btn) throw new Error("no Complete button on reminder");
btn.click();
await new Promise((r) => setTimeout(r, 500));
return JSON.stringify({ cardGone: !document.querySelector(".reminder") });
