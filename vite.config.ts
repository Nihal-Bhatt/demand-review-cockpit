import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * GitHub Pages project sites live at `/<repo>/`.
 * Use absolute base in CI so assets load even when users omit the trailing slash on the URL.
 * Locally, omit `VITE_BASE_URL` (defaults to `./`).
 */
const base =
  process.env.VITE_BASE_URL && process.env.VITE_BASE_URL.length > 0
    ? process.env.VITE_BASE_URL.endsWith("/")
      ? process.env.VITE_BASE_URL
      : `${process.env.VITE_BASE_URL}/`
    : "./";

export default defineConfig({
  plugins: [react()],
  base,
});
