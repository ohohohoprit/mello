import { useEffect, useState } from "react";
import { PetSprite } from "./components/PetSprite";
import { usePetStore, type Pose } from "./components/petStore";
import "./components/pet.css";

/** Cycles through the pet's poses for the hero demo — a living product, not a screenshot. */
function PoseDemo() {
  const setPose = usePetStore((s) => s.setPose);
  useEffect(() => {
    const poses: Pose[] = ["idle", "wave", "happy-bounce", "celebrate", "idle", "sleep", "remind", "idle"];
    let i = 0;
    const t = window.setInterval(() => {
      i = (i + 1) % poses.length;
      setPose(poses[i]);
    }, 2200);
    return () => window.clearInterval(t);
  }, [setPose]);
  return <PetSprite />;
}

const PAINS = [
  {
    icon: "🔥",
    title: "Streak guilt is the #1 churn driver",
    body: "Users quit trackers by day 14 over a 'weird wave of shame'; ~48% churn in 6 months. Mello replaces streaks with a Momentum score that decays gently and never resets to zero. Miss a day? It pauses growth — it never erases you.",
  },
  {
    icon: "💸",
    title: "Subscription fatigue",
    body: "People feel they rent their own life. Mello's core is free forever, and premium is one fixed public price — no dynamic pricing, ever, and your pet is never held hostage.",
  },
  {
    icon: "🔒",
    title: "Sync failures & privacy distrust",
    body: "55% cite privacy as an adoption barrier. Mello is offline-first: your data lives on your device in SQLite, works with zero internet, exports to JSON in one click, and delete means gone.",
  },
];

const STEPS = [
  { n: "1", title: "Set a target", body: "Pick a goal and a journey length — 30, 60, 90, or 180 days. That's your pet's lifespan, and its graduation day." },
  { n: "2", title: "Get gentle nudges", body: "Complete, snooze, or tap 'Rough day?' — honesty counts as a check-in. Max one nudge per reminder, quiet hours respected." },
  { n: "3", title: "Grow together", body: "Your pet hatches, grows through 5 life stages, and graduates with honors. No death, no sickness, no punishment — ever." },
];

const STAGES = [
  { icon: "🥚", name: "Egg", note: "waiting for your first step" },
  { icon: "🐣", name: "Baby", note: "freshly hatched, wobbly" },
  { icon: "🌱", name: "Teen", note: "lanky and playful" },
  { icon: "🐾", name: "Adult", note: "confident, scarf on" },
  { icon: "🎓", name: "Elder Sage", note: "graduated with honors" },
];

const PLANS = [
  {
    name: "Free forever",
    price: "$0",
    note: "",
    items: ["Unlimited habits", "All 3 personalities", "Momentum + Recovery Mode", "Full Life Journey", "Offline + JSON export", "Core cosmetics"],
    cta: "Download",
  },
  {
    name: "Plus",
    price: "$24.99",
    note: "one-time · or $14.99/yr",
    items: ["Everything in Free", "All cosmetics + themes", "Encrypted sync (opt-in)", "Deep-history view", "1 year of seasonal drops"],
    cta: "Get Plus",
    featured: true,
  },
  {
    name: "Founder",
    price: "$19.99",
    note: "first 200 slots · public counter",
    items: ["Everything in Plus", "Founder badge", "Locked price forever"],
    cta: "Become a Founder",
  },
];

export default function App() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  useEffect(() => {
    // If a release exists, the button links straight to it; otherwise scroll to pricing.
    fetch("https://api.github.com/repos/prita/mello/releases/latest")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        const asset = j.assets?.find((a: { name: string }) => a.name.endsWith(".exe"));
        if (asset) setDownloadUrl(asset.browser_download_url);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-20 backdrop-blur bg-[#FFF7E8]/85 border-b border-[#7A4E2D]/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <a href="#top" className="display text-xl font-bold">🐣 Mello</a>
          <div className="flex items-center gap-6 text-sm text-[#7A4E2D]">
            <a href="#how" className="hidden sm:inline hover:opacity-70">How it works</a>
            <a href="#journey" className="hidden sm:inline hover:opacity-70">Life Journey</a>
            <a href="#pricing" className="hidden sm:inline hover:opacity-70">Pricing</a>
            <a href={downloadUrl ?? "#pricing"} className="btn-gold !py-2 !px-4 text-sm">
              {downloadUrl ? "Download" : "Coming soon"}
            </a>
          </div>
        </div>
      </nav>

      {/* Hero — P1 */}
      <header id="top" className="mx-auto grid max-w-6xl items-center gap-10 px-6 pt-16 pb-20 md:grid-cols-2">
        <div>
          <span className="chip">for ADHD · anxiety · burnout — shame-free by design</span>
          <h1 className="display mt-4 text-5xl leading-tight font-bold">
            A habit pet that never guilt-trips you
          </h1>
          <p className="mt-4 text-lg text-[#7A4E2D]">
            Your cute reminder buddy lives on your desktop, grows with your habits,
            and graduates instead of dying.
          </p>
          <p className="mt-2 font-semibold text-[#7A4E2D]">
            No shame. No streaks. No renting your pet.
          </p>
          <div className="mt-8 flex gap-4">
            <a href={downloadUrl ?? "#pricing"} className="btn-gold">
              {downloadUrl ? "↓ Download for Windows" : "Download — coming soon"}
            </a>
            <a href="#how" className="btn-ghost">See how it works</a>
          </div>
          <p className="mt-4 text-xs text-[#7A4E2D]/70">
            Free core, forever · works offline · no account needed · &lt;90s setup
          </p>
        </div>
        <div className="relative mx-auto w-[320px]">
          <div className="card p-6 shadow-[var(--mello-shadow-overlay)]">
            <PoseDemo />
            <div className="mt-2 rounded-xl bg-[#FFF7E8] p-3 text-center text-sm text-[#7A4E2D]">
              Hey! 📚 <strong>20 min of practice</strong> today? I'll sit with you 💛
            </div>
            <div className="mt-2 flex justify-center gap-2">
              <span className="rounded-lg bg-[#A8C686] px-3 py-1 text-xs font-bold text-[#2b3a1a]">Complete</span>
              <span className="rounded-lg border border-[#7A4E2D]/25 px-3 py-1 text-xs text-[#7A4E2D]">Snooze 10m</span>
              <span className="rounded-lg bg-[#F7A8A0] px-3 py-1 text-xs text-[#5c2d28]">Rough day?</span>
            </div>
            <p className="mt-3 text-center text-xs text-[#7A4E2D]/70">
              Today 1/2 · Momentum 78 <span className="mx-1">·</span> never resets, never shames
            </p>
          </div>
        </div>
      </header>

      {/* Pain points — mirrors PRD §02 */}
      <section className="bg-white/60 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="display text-center text-3xl font-bold">Why another tracker dies on you</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PAINS.map((p) => (
              <div key={p.title} className="card p-6">
                <div className="text-3xl">{p.icon}</div>
                <h3 className="display mt-2 text-lg font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-[#3A2A1A]/90">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — P2 */}
      <section id="how" className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="display text-center text-3xl font-bold">Three steps, zero pressure</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="card p-6 text-center">
                <div className="display mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFD97A] text-xl font-bold">
                  {s.n}
                </div>
                <h3 className="display mt-3 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-[#3A2A1A]/90">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Life Journey — P3 */}
      <section id="journey" className="bg-white/60 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="display text-center text-3xl font-bold">A 5-stage journey that ends in graduation</h2>
          <p className="mt-2 text-center text-[#7A4E2D]">
            Misses pause growth; they never reverse it. Your pet is never sick, sad, or dead as punishment.
          </p>
          <div className="mt-10 flex flex-wrap items-start justify-center gap-4">
            {STAGES.map((s, i) => (
              <div key={s.name} className="flex items-center gap-4">
                <div className="card w-36 p-4 text-center">
                  <div className="text-4xl">{s.icon}</div>
                  <div className="display mt-1 font-bold">{s.name}</div>
                  <div className="text-xs text-[#7A4E2D]/75">{s.note}</div>
                </div>
                {i < STAGES.length - 1 && <span className="text-2xl text-[#7A4E2D]/40">→</span>}
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-[#7A4E2D]">
            Graduation day brings a Memory Book — then keep your Sage, or hatch a{" "}
            <strong>Legacy Egg</strong> that inherits one trait. New game+, zero loss.
          </p>
        </div>
      </section>

      {/* Pricing — P4 */}
      <section id="pricing" className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="display text-center text-3xl font-bold">One fixed price. No games.</h2>
          <p className="mt-2 text-center text-[#7A4E2D]">
            Core is free forever. Premium is a single payment.{" "}
            <span className="chip">No dynamic pricing — ever.</span>
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`card p-6 ${p.featured ? "border-[#FFD97A] shadow-[var(--mello-shadow-hover)]" : ""}`}
              >
                <h3 className="display text-lg font-bold">{p.name}</h3>
                <div className="display mt-1 text-4xl font-bold">{p.price}</div>
                <div className="text-xs text-[#7A4E2D]/70">{p.note}</div>
                <ul className="mt-4 space-y-2 text-sm">
                  {p.items.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[#A8C686]">✓</span> {i}
                    </li>
                  ))}
                </ul>
                <a href="#top" className={`btn-gold mt-6 block text-center ${p.featured ? "" : "btn-ghost !bg-transparent font-normal"}`}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-[#7A4E2D]/70">
            Prices are public and fixed. When they change, existing owners keep their price.
          </p>
        </div>
      </section>

      {/* Trust — P5 */}
      <section className="bg-white/60 py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="display text-3xl font-bold">Your data, your device</h2>
          <div className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
            <div className="card p-4">💾 Offline-first — works with zero internet</div>
            <div className="card p-4">🚫 No account to start, no email wall</div>
            <div className="card p-4">📤 One-click JSON export — it's yours</div>
            <div className="card p-4">🗑️ Delete means gone. No shadows, no backups you didn't ask for</div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 text-center">
        <h2 className="display text-3xl font-bold">Meet your pet in under 90 seconds</h2>
        <p className="mt-2 text-[#7A4E2D]">No account. No card. No guilt.</p>
        <a href={downloadUrl ?? "#pricing"} className="btn-gold mt-6 inline-block">
          {downloadUrl ? "↓ Download Mello for Windows" : "Download — coming soon"}
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#7A4E2D]/10 py-8 text-center text-xs text-[#7A4E2D]/70">
        <p>
          Mello — your cute reminder buddy · <a className="underline" href="#">Privacy Policy</a> ·{" "}
          <a className="underline" href="#">Terms of Service</a> · For ages 13+
        </p>
        <p className="mt-2">
          Mello is a habit companion, not therapy or medical care. If you're struggling, please reach
          out to a professional or a crisis line in your area. 💛
        </p>
        <p className="mt-2">© {new Date().getFullYear()} Mello</p>
      </footer>
    </div>
  );
}
