import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative asset URLs help avoid 404 on hashed CSS/JS after reload when the CDN path drifts.
  base: "/",
  server: {
    port: 5173,
    host: "0.0.0.0",
    strictPort: false,
    proxy: {
      "/api": {
        target: "https://luxstay.phanvanduong.site",
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 4173
  }
});
