import { defineConfig, devices } from "@playwright/test";

/**
 * playwright.config.ts — Configuración de tests E2E para Mapa Interactivo CU UACJ
 *
 * Levanta el servidor de Vite automáticamente antes de correr los tests.
 * Se ejecuta en Chromium (desktop) y Mobile Chrome para validar responsividad.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],

  // Levanta el frontend automáticamente antes de los tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    cwd: "./frontend",
  },
});
