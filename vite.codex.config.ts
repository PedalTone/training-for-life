import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/training-for-life/app/",
  plugins: [react()],
  server: {
    hmr: false,
  },
});
