/**
 * login_admin.spec.ts — E2E: Flujo de autenticación del panel de administración
 *
 * Flujo principal:
 *   1. Navegar a /login.
 *   2. Ingresar credenciales de administrador.
 *   3. Verificar redirección a /admin.
 *   4. Verificar que el panel muestra contenido de administración.
 *   5. Cerrar sesión (si aplica).
 *
 * Casos negativos:
 *   ✔ Credenciales inválidas muestran mensaje de error.
 *   ✔ Campos vacíos muestran advertencia.
 *   ✔ Ruta protegida /admin sin sesión redirige a /login.
 *
 * Prerrequisito: el backend debe estar corriendo con un admin
 * cuyas credenciales coincidan con TEST_ADMIN_USER / TEST_ADMIN_PASS.
 * En CI, configura estas variables de entorno con valores reales.
 */

import { test, expect, Page } from "@playwright/test";

// ─── Credenciales desde variables de entorno ─────────────────────────────────
const ADMIN_USER = process.env.TEST_ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.TEST_ADMIN_PASS ?? "Admin123!";

// ─── Helper ───────────────────────────────────────────────────────────────────
async function rellenarFormulario(page: Page, username: string, password: string) {
  await page.getByPlaceholderText("Nombre de usuario").fill(username);
  await page.getByPlaceholderText("Contraseña").fill(password);
}

// ─── Tests ────────────────────────────────────────────────────────────────────
test.describe("LoginPage — renderizado", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("muestra el título 'Inicia Sesión'", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Inicia Sesión" })).toBeVisible();
  });

  test("muestra los campos de usuario y contraseña", async ({ page }) => {
    await expect(page.getByPlaceholderText("Nombre de usuario")).toBeVisible();
    await expect(page.getByPlaceholderText("Contraseña")).toBeVisible();
  });

  test("muestra el botón 'Iniciar Sesión'", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /iniciar sesión/i })
    ).toBeVisible();
  });
});

test.describe("LoginPage — validaciones de formulario", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("campos vacíos muestran toast de advertencia sin hacer login", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /iniciar sesión/i }).click();

    // El toast de sonner aparece como elemento en el DOM
    await expect(
      page.getByText(/completa todos los campos/i)
    ).toBeVisible({ timeout: 3_000 });

    // La URL no debe haber cambiado
    await expect(page).toHaveURL("/login");
  });

  test("solo username relleno también muestra advertencia", async ({ page }) => {
    await page.getByPlaceholderText("Nombre de usuario").fill("admin");
    await page.getByRole("button", { name: /iniciar sesión/i }).click();

    await expect(
      page.getByText(/completa todos los campos/i)
    ).toBeVisible({ timeout: 3_000 });
  });
});

test.describe("LoginPage — credenciales inválidas", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("contraseña incorrecta muestra toast de error", async ({ page }) => {
    await rellenarFormulario(page, ADMIN_USER, "ContraseñaMuyMal999!");
    await page.getByRole("button", { name: /iniciar sesión/i }).click();

    await expect(
      page.getByText(/no fue posible iniciar sesión/i)
    ).toBeVisible({ timeout: 5_000 });

    // No debe redirigir al panel de administración
    await expect(page).toHaveURL("/login");
  });
});

test.describe("LoginPage — login exitoso", () => {
  test("credenciales correctas redirigen a /admin", async ({ page }) => {
    await page.goto("/login");
    await rellenarFormulario(page, ADMIN_USER, ADMIN_PASS);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();

    // Esperar redirección al panel
    await page.waitForURL("/admin", { timeout: 10_000 });
    await expect(page).toHaveURL("/admin");
  });

  test("el panel de admin muestra contenido tras el login", async ({ page }) => {
    await page.goto("/login");
    await rellenarFormulario(page, ADMIN_USER, ADMIN_PASS);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();

    await page.waitForURL("/admin", { timeout: 10_000 });

    // El sidebar o algún elemento del panel debe ser visible
    await expect(
      page.locator("[class*='sidebar'], [class*='admin'], nav").first()
    ).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Rutas protegidas", () => {
  test("navegar a /admin sin sesión redirige a /login", async ({ page }) => {
    // Navegar directamente al panel sin estar autenticado
    await page.goto("/admin");

    // ProtectedRoute debe redirigir al login
    await page.waitForURL(/login/, { timeout: 5_000 });
    await expect(page).toHaveURL(/login/);
  });
});
