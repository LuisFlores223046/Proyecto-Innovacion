/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * vitest.config.ts — Configuración del runner de tests para el frontend.
 *
 * Usa jsdom como entorno virtual de DOM para simular el navegador.
 * setupFiles carga los matchers extendidos de @testing-library/jest-dom
 * (toBeInTheDocument, toHaveValue, etc.) antes de cada test.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    css: false,        // No procesar CSS en tests (más rápido)
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/components/**", "src/pages/**"],
      exclude: ["src/__tests__/**", "src/main.tsx"],
    },
  },
});
