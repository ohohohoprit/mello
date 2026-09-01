/** Landing demo store — a minimal slice of mello-bot's petStore (same shape). */

import { create } from "zustand";

export type Pose =
  | "idle"
  | "eyes-closed"
  | "wave"
  | "happy-bounce"
  | "celebrate"
  | "remind"
  | "sleep"
  | "gentle-pout";

export const POSES: Pose[] = [
  "idle",
  "eyes-closed",
  "wave",
  "happy-bounce",
  "celebrate",
  "remind",
  "sleep",
  "gentle-pout",
];

export type Colorway = "vanilla" | "cocoa" | "matcha";

interface PetState {
  name: string;
  colorway: Colorway;
  hat: string;
  pose: Pose;
  setPose: (pose: Pose) => void;
  setColorway: (c: Colorway) => void;
  equipHat: (name: string) => void;
}

export const usePetStore = create<PetState>((set) => ({
  name: "Mello",
  colorway: "vanilla",
  hat: "",
  pose: "idle",
  setPose: (pose) => set({ pose }),
  setColorway: (colorway) => set({ colorway }),
  equipHat: (hat) => set({ hat }),
}));
