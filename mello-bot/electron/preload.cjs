/* Context-isolated bridge: the renderer gets a minimal, typed API. */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("melloDb", {
  select: (sql, params) => ipcRenderer.invoke("db:select", sql, params),
  execute: (sql, params) => ipcRenderer.invoke("db:execute", sql, params),
  exportAll: () => ipcRenderer.invoke("db:export"),
  importAll: (bytes) => ipcRenderer.invoke("db:import", bytes),
});

contextBridge.exposeInMainWorld("melloShell", {
  openPanel: (hash) => ipcRenderer.invoke("panel:open", hash),
  exportData: () => ipcRenderer.invoke("data:export"),
  importData: () => ipcRenderer.invoke("data:import"),
});
