/** Typed bridge to the main-process SQLite (sql.js WASM), exposed via preload. */

interface MelloDbBridge {
  select<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<{ rowsAffected: number }>;
  exportAll(): Promise<Uint8Array>;
  importAll(bytes: Uint8Array): Promise<boolean>;
}

interface MelloShellBridge {
  openPanel(hash?: string): Promise<void>;
  exportData(): Promise<string>;
  importData(): Promise<string>;
}

declare global {
  interface Window {
    melloDb: MelloDbBridge;
    melloShell: MelloShellBridge;
  }
}

export const db: MelloDbBridge = window.melloDb;
export const shell: MelloShellBridge = window.melloShell;
