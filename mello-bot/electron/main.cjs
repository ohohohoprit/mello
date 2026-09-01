/* Mello desktop overlay — Electron main process.
   Fallback runtime while Smart App Control blocks locally-built Rust binaries
   (Tauri source kept in src-tauri/ for the future switch). */

const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, dialog } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { initDb, exportDb, importDb, dumpAll, restoreAll } = require("./db.cjs");

const DEV_URL = "http://127.0.0.1:1420";

let win = null; // pet overlay
let panel = null; // habits & settings panel
let tray = null;

function createOverlay() {
  win = new BrowserWindow({
    width: 240,
    height: 280,
    transparent: true,
    frame: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    fullscreenable: false,
    maximizable: false,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  } else {
    win.loadURL(DEV_URL);
  }

  win.on("closed", () => (win = null));
}

function openPanel(hash = "") {
  if (panel && !hash) {
    panel.show();
    panel.focus();
    return;
  }
  if (panel) {
    // navigate the existing panel to a different route
    const url = app.isPackaged
      ? undefined
      : DEV_URL + hash;
    if (url) panel.loadURL(url);
    panel.show();
    panel.focus();
    return;
  }
  panel = new BrowserWindow({
    width: 380,
    height: 620,
    minWidth: 340,
    minHeight: 480,
    transparent: true,
    frame: false,
    hasShadow: true,
    alwaysOnTop: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (app.isPackaged) {
    panel.loadFile(path.join(__dirname, "..", "dist", "index.html"), { hash: hash.replace("#", "") });
  } else {
    panel.loadURL(DEV_URL + hash);
  }
  panel.once("ready-to-show", () => panel.show());
  panel.on("closed", () => (panel = null));
}

function createTray() {
  const iconPath = path.join(app.getAppPath(), "src-tauri", "icons", "icon.ico");
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);

  const menu = Menu.buildFromTemplate([
    { label: "Show / Hide Mello", click: () => win && win.setVisible(!win.isVisible()) },
    { label: "Habits & Settings", click: () => openPanel() },
    {
      label: "Click-through (let clicks pass through me)",
      type: "checkbox",
      click: (item) => win && win.setIgnoreCursorEvents(item.checked),
    },
    { type: "separator" },
    { label: "Quit Mello", click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);
  tray.setToolTip("Mello — your cute reminder buddy");
}

function registerIpc() {
  ipcMain.handle("db:select", (_e, sql, params) => {
    const { select } = require("./db.cjs");
    return select(sql, params);
  });
  ipcMain.handle("db:execute", (_e, sql, params) => {
    const { execute } = require("./db.cjs");
    return execute(sql, params);
  });
  ipcMain.handle("db:export", () => exportDb());
  ipcMain.handle("db:import", (_e, jsonBytes) => importDb(jsonBytes));

  ipcMain.handle("panel:open", (_e, hash) => openPanel(hash ?? ""));

  // F13 — JSON export to a user-chosen file
  ipcMain.handle("data:export", async () => {
    const { canceled, filePath } = await dialog.showSaveDialog(panel ?? win, {
      title: "Export my Mello data",
      defaultPath: `mello-export-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (canceled || !filePath) return "canceled";
    fs.writeFileSync(filePath, JSON.stringify(dumpAll(), null, 2));
    return filePath;
  });

  // F13 — import replaces all data (confirmed in UI before this is called)
  ipcMain.handle("data:import", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(panel ?? win, {
      title: "Import my Mello data",
      filters: [{ name: "JSON", extensions: ["json"] }],
      properties: ["openFile"],
    });
    if (canceled || filePaths.length === 0) return "canceled";
    const json = JSON.parse(fs.readFileSync(filePaths[0], "utf-8"));
    restoreAll(json);
    return filePaths[0];
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  // Isolated test instance: MELLO_USER_DATA gives a fresh profile (dev only)
  if (process.env.MELLO_USER_DATA) app.setPath("userData", process.env.MELLO_USER_DATA);

  app.on("second-instance", () => {
    if (win) {
      win.show();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    // MELLO_DB_PATH: fresh-install simulation for onboarding tests (dev only)
    const dbPath = process.env.MELLO_DB_PATH ?? path.join(app.getPath("userData"), "mello.db");
    await initDb(dbPath);
    registerIpc();
    createOverlay();
    createTray();
    // DEV-ONLY: auto-open the habits panel for verification runs
    if (process.env.MELLO_OPEN_PANEL) openPanel("#panel");
  });

  app.on("window-all-closed", () => {
    app.quit();
  });
}
