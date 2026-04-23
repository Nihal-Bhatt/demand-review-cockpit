import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Use relative base for GitHub Pages / static hosting without server rewrites.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
