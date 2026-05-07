import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // hoặc "" để dùng relative path khi deploy lên S3/CloudFront
  server: {
    port: 5173,
    host: "0.0.0.0",
    strictPort: false,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 4173
  }
});
