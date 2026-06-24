import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    // El asistente de IA se consume vía el backend (/api/chatbot/emergencia).
    // La GEMINI_API_KEY vive SOLO en el backend; nunca debe exponerse al cliente.
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
    },
    // En producción (Render Static Site) el frontend se sirve desde "/"
    base: "/",
  };
});
