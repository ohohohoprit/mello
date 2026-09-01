import { create } from "zustand";
import { db } from "../lib/db";

export interface Settings {
  quietStart: string; // "22:00"
  quietEnd: string; // "07:00"
  quietEnabled: boolean;
  nudgeProbability: number; // 0–100, default 30 (PRD F5)
  soundEnabled: boolean;
}

const DEFAULTS: Settings = {
  quietStart: "22:00",
  quietEnd: "07:00",
  quietEnabled: true,
  nudgeProbability: 30,
  soundEnabled: true,
};

interface SettingsState {
  loaded: boolean;
  settings: Settings;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  loaded: false,
  settings: DEFAULTS,

  load: async () => {
    const rows = await db.select<{ key: string; value: string }>("select * from settings");
    const stored: Partial<Settings> = {};
    for (const r of rows) {
      try {
        Object.assign(stored, JSON.parse(r.value));
      } catch {
        // ignore malformed rows
      }
    }
    set({ loaded: true, settings: { ...DEFAULTS, ...stored } });
  },

  update: (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    void db.execute(
      `insert into settings (key, value) values ('app', ?)
       on conflict(key) do update set value = excluded.value`,
      [JSON.stringify(next)],
    );
  },
}));
