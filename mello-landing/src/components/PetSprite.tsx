import { useEffect, useMemo } from "react";
import { usePetStore, type Colorway } from "./petStore";
import "./pet.css";

const COLORWAYS: Record<Colorway, { fur: string; furDeep: string }> = {
  vanilla: { fur: "#FFE9B8", furDeep: "#FFD97A" },
  cocoa: { fur: "#C99B6E", furDeep: "#B08050" },
  matcha: { fur: "#D8E6C0", furDeep: "#A8C686" },
};

/**
 * Placeholder pet art: the PRD Master Block rendered as inline SVG —
 * chubby pudding-soft puppy, cream-golden fur, cocoa ear tips, black button
 * eyes, blush cheeks, green two-leaf sprout. Vector = tintable colorways.
 * Real illustrated art batch replaces this in the art pipeline (PRD §17 Day 3–4).
 */
export function PetSprite() {
  const pose = usePetStore((s) => s.pose);
  const colorway = usePetStore((s) => s.colorway);
  const hat = usePetStore((s) => s.hat);
  const setPose = usePetStore((s) => s.setPose);

  // Idle micro-life: occasionally close eyes for a moment (blink handled in CSS,
  // this simulates longer eye-rest + returns to idle after transient poses)
  useEffect(() => {
    if (pose === "idle") return;
    const t = window.setTimeout(() => setPose("idle"), 2400);
    return () => window.clearTimeout(t);
  }, [pose, setPose]);

  const c = COLORWAYS[colorway];
  const eyesClosed = pose === "eyes-closed" || pose === "sleep";
  const sleeping = pose === "sleep";
  const happy = pose === "happy-bounce" || pose === "celebrate";
  const pouty = pose === "gentle-pout";
  const waving = pose === "wave";
  const celebrating = pose === "celebrate";
  const reminding = pose === "remind";

  const leftPawTransform = useMemo(() => {
    if (celebrating) return "rotate(40deg)";
    if (waving) return "rotate(-50deg)";
    return "rotate(0deg)";
  }, [celebrating, waving]);

  const rightPawTransform = useMemo(
    () => (celebrating ? "rotate(-40deg)" : "rotate(0deg)"),
    [celebrating],
  );

  return (
    <div className={`pet pet--${pose}`} aria-label={`${usePetStore.getState().name} the pet`}>
      {reminding && <div className="pet-bubble">!</div>}
      {sleeping && <div className="pet-zzz">z z</div>}
      {celebrating && (
        <>
          <span className="confetti confetti-1" />
          <span className="confetti confetti-2" />
          <span className="confetti confetti-3" />
        </>
      )}
      <svg viewBox="0 0 120 120" width="150" height="150" className="pet-svg">
        {/* cushion */}
        <ellipse cx="60" cy="106" rx="42" ry="8" fill="#F3E3C2" opacity="0.8" />
        {/* ears (cocoa tips) */}
        <g className="pet-ears" style={{ transform: pouty ? "rotate(-4deg)" : undefined }}>
          <ellipse cx="28" cy="46" rx="12" ry="20" fill="#7A4E2D" transform="rotate(-18 28 46)" />
          <ellipse cx="92" cy="46" rx="12" ry="20" fill="#7A4E2D" transform="rotate(18 92 46)" />
        </g>
        {/* body */}
        <ellipse cx="60" cy="70" rx="38" ry="34" fill={c.fur} />
        <ellipse cx="60" cy="80" rx="26" ry="20" fill={c.furDeep} opacity="0.45" />
        {/* head */}
        <circle cx="60" cy="52" r="30" fill={c.fur} />
        {/* sprout on head (hidden under the beanie) */}
        {hat !== "beanie" && (
          <g className="pet-sprout">
            <path d="M60 22 C 58 14, 52 12, 48 14 C 50 20, 55 22, 60 22 Z" fill="#A8C686" />
            <path d="M60 22 C 62 14, 68 12, 72 14 C 70 20, 65 22, 60 22 Z" fill="#8FB56C" />
            <line x1="60" y1="22" x2="60" y2="16" stroke="#7A9B5A" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
        {/* hats — F11: beanie / scarf / bow */}
        {hat === "beanie" && (
          <g>
            <path d="M32 44 C 32 26, 88 26, 88 44 Z" fill="#A8C686" />
            <rect x="30" y="42" width="60" height="8" rx="4" fill="#8FB56C" />
            <circle cx="60" cy="24" r="5" fill="#F7A8A0" />
          </g>
        )}
        {hat === "scarf" && (
          <g>
            <rect x="36" y="76" width="48" height="10" rx="5" fill="#F7A8A0" />
            <path d="M78 80 l 8 16 l -10 2 l -6 -14 Z" fill="#F7A8A0" />
            <line x1="40" y1="81" x2="80" y2="81" stroke="#e58b82" strokeWidth="2" />
          </g>
        )}
        {hat === "bow" && (
          <g transform="rotate(-14 88 30)">
            <path d="M88 30 C 82 22, 74 24, 76 32 C 78 38, 86 36, 88 30 Z" fill="#F7A8A0" />
            <path d="M88 30 C 94 22, 102 24, 100 32 C 98 38, 90 36, 88 30 Z" fill="#F7A8A0" />
            <circle cx="88" cy="30" r="3.5" fill="#e58b82" />
          </g>
        )}
        {/* eyes */}
        {eyesClosed ? (
          <g stroke="#2b1d10" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <path d="M46 54 q 5 4 10 0" />
            <path d="M64 54 q 5 4 10 0" />
          </g>
        ) : (
          <g className="pet-eyes" fill="#1d1d1d">
            <circle cx="50" cy="52" r="4.5" />
            <circle cx="70" cy="52" r="4.5" />
            <circle cx="51.5" cy="50.5" r="1.4" fill="#fff" />
            <circle cx="71.5" cy="50.5" r="1.4" fill="#fff" />
          </g>
        )}
        {/* blush */}
        <ellipse cx="40" cy="60" rx="5" ry="3" fill="#F7A8A0" opacity="0.7" />
        <ellipse cx="80" cy="60" rx="5" ry="3" fill="#F7A8A0" opacity="0.7" />
        {/* mouth */}
        {happy ? (
          <path d="M52 64 q 8 8 16 0" stroke="#2b1d10" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : pouty ? (
          <path d="M54 66 q 6 -3 12 0" stroke="#2b1d10" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M56 64 q 4 4 8 0" stroke="#2b1d10" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}
        {/* paws */}
        <g style={{ transform: leftPawTransform, transformOrigin: "40px 88px" }} className="pet-paw">
          <ellipse cx="36" cy="90" rx="9" ry="7" fill={c.fur} />
        </g>
        <g style={{ transform: rightPawTransform, transformOrigin: "80px 88px" }} className="pet-paw">
          <ellipse cx="84" cy="90" rx="9" ry="7" fill={c.fur} />
        </g>
      </svg>
    </div>
  );
}
