// Add a daily habit via the UI, then return.
const addBtn = [...document.querySelectorAll(".card-head .btn")].find(
  (b) => b.textContent === "+ Add",
);
if (!addBtn) throw new Error("no +Add button");
addBtn.click();
await new Promise((r) => setTimeout(r, 200));
const input = document.querySelector(".title-input");
if (!input) throw new Error("form did not open");
const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
setter.call(input, "Stretch for 2 minutes");
input.dispatchEvent(new Event("input", { bubbles: true }));
await new Promise((r) => setTimeout(r, 100));
document.querySelector(".btn--wide").click();
await new Promise((r) => setTimeout(r, 400));
return JSON.stringify([...document.querySelectorAll(".habit-title")].map((e) => e.textContent));
