import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config: enables React (JSX + fast refresh) and runs the dev server on port 5173,
// which is the origin our backend allows via CORS (FRONTEND_URL).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
});
