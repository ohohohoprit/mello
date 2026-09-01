// Panel: add a daily habit via the real UI form.
const addBtn = [...document.querySelectorAll(".card-head .btn")].find(
  (b) => b.textContent === "+ Add",
);
if (!addBtn) throw new Error("no +Add button");
addBtn.click();
await new Promise((r) => setTimeout(r, 200));
const input = document.querySelector(".title-input");
if (!input) throw new Error("form did not open");
const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
const emojiInput = document.querySelector(".emoji-input");
const emojiSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
emojiSetter.call(emojiInput, "💧");
emojiInput.dispatchEvent(new Event("input", { bubbles: true }));
setter.call(input, "Drink water");
input.dispatchEvent(new Event("input", { bubbles: true }));
await new Promise((r) => setTimeout(r, 100));
const submit = document.querySelector(".btn--wide");
submit.click();
await new Promise((r) => setTimeout(r, 400));
return JSON.stringify([...document.querySelectorAll(".habit-title")].map((e) => e.textContent));
