import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  base: "./", // required for loadFile() in packaged Electron (no absolute /assets)
  clearScreen: false,
  // Electron main.cjs dev URL points at this fixed port
  server: {
    port: 1420,
    strictPort: true,
    host: "127.0.0.1",
  },
  build: {
    outDir: "dist",
  },
}));
