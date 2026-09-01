// Full onboarding walk-through on the fresh instance.
async function q(sel) {
  return document.querySelector(sel);
}
async function type(input, text) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(input, text);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 120));
}
async function clickByText(sel, text) {
  const el = [...document.querySelectorAll(sel)].find((b) => b.textContent.trim() === text);
  if (!el) throw new Error("missing element: " + text);
  el.click();
  await new Promise((r) => setTimeout(r, 250));
  return true;
}

// Step 1 — goal
let input = await q(".onb-input");
if (!input) throw new Error("onboarding did not open");
await type(input, "Pass the CFA exam");
await clickByText(".btn--wide", "Continue");

// Step 2 — duration (60 days)
await clickByText(".onb-options .btn", "60 days");

// Step 3 — name
input = await q(".onb-input");
await type(input, "Biscuit");
await clickByText(".btn--wide", "Continue");

// Step 4 — personality (playful)
await clickByText(".onb-pname", "playful");

// Step 5 — first habit
input = await q(".onb-input");
await type(input, "Do 10 practice questions");
const meetBtn = [...document.querySelectorAll(".btn--wide")].find((b) =>
  b.textContent.includes("Meet"),
);
if (!meetBtn) throw new Error("no Meet button");
meetBtn.click();
await new Promise((r) => setTimeout(r, 500));
return "walked through; window self-closed: " + !document.querySelector(".onb");
