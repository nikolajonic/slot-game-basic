import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/slot-game-basic/",
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
