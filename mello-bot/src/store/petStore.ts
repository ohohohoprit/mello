import { create } from "zustand";
import { db } from "../lib/db";
import type { Pet } from "../lib/types";

/** PRD F2 — the 8 canonical poses. Art may be placeholders tonight; the state machine is real. */
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

export type Colorway = Pet["colorway"];

interface PetState {
  loaded: boolean;
  id: string | null;
  name: string;
  personality: Pet["personality"];
  colorway: Colorway;
  stage: Pet["stage"];
  hat: string;
  targetDate: string | null;
  carePoints: number;
  momentum: number;
  pose: Pose;
  load: () => Promise<void>;
  setName: (name: string) => void;
  setPersonality: (p: Pet["personality"]) => void;
  setColorway: (c: Colorway) => void;
  equipHat: (name: string) => void;
  setTargetDate: (iso: string) => void;
  setPose: (pose: Pose) => void;
  applyStage: (stage: Pet["stage"]) => void;
  applyMomentum: (v: number) => void;
  addCarePoints: (n: number) => void;
}

function rowToState(p: Pet, hat = "") {
  return {
    id: p.id,
    name: p.name,
    personality: p.personality,
    colorway: p.colorway,
    stage: p.stage,
    hat,
    targetDate: p.target_date,
    carePoints: p.care_points,
    momentum: p.momentum,
  };
}

export const usePetStore = create<PetState>((set, get) => ({
  loaded: false,
  id: null,
  name: "Mello",
  personality: "gentle",
  colorway: "vanilla",
  stage: "egg",
  hat: "",
  targetDate: null,
  carePoints: 0,
  momentum: 50,
  pose: "idle",

  load: async () => {
    const schema = await import("../lib/schema");
    const pet = await schema.ensurePet();
    const hat = await schema.getEquippedHat();
    set({ loaded: true, ...rowToState(pet, hat) });
  },

  setTargetDate: (iso) => {
    set({ targetDate: iso });
    if (get().id)
      void db.execute("update pets set target_date = ? where id = ?", [iso, get().id]);
  },

  setName: (name) => {
    set({ name });
    if (get().id) void db.execute("update pets set name = ? where id = ?", [name, get().id]);
  },
  setPersonality: (personality) => {
    set({ personality });
    if (get().id)
      void db.execute("update pets set personality = ? where id = ?", [personality, get().id]);
  },
  setColorway: (colorway) => {
    set({ colorway });
    if (get().id)
      void db.execute("update pets set colorway = ? where id = ?", [colorway, get().id]);
  },
  equipHat: (name) => {
    set({ hat: name });
    void import("../lib/schema").then((m) => m.equipHat(name));
  },
  setPose: (pose) => set({ pose }),
  applyStage: (stage) => {
    set({ stage });
    if (get().id) void db.execute("update pets set stage = ? where id = ?", [stage, get().id]);
  },
  applyMomentum: (momentum) => {
    set({ momentum });
    if (get().id) void db.execute("update pets set momentum = ? where id = ?", [momentum, get().id]);
  },
  addCarePoints: (n) => {
    const cp = get().carePoints + n;
    set({ carePoints: cp });
    if (get().id)
      void db.execute("update pets set care_points = ? where id = ?", [cp, get().id]);
  },
}));
