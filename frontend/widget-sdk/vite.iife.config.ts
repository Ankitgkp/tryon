/**
 * Vite config for building the self-contained IIFE bundle.
 * This bundles React + ReactDOM so script-tag users don't need them.
 *
 * Build: pnpm --filter @tryon/widget-sdk build:iife
 * Output: dist/tryon-widget.iife.js
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/vanilla.ts"),
      name: "TryOn",
      formats: ["iife"],
      fileName: () => "tryon-widget.iife.js",
    },
    outDir: "dist",
    emptyOutDir: false,
    cssCodeSplit: false,
  },
});
