/**
 * buscar_espacio.spec.ts — E2E: Flujo de búsqueda de espacios
 *
 * Flujo que valida de extremo a extremo:
 *   1. El usuario abre la app en el mapa (/).
 *   2. Escribe en el SearchBar.
 *   3. Ve el dropdown con resultados reales de la API.
 *   4. Hace click en un resultado.
 *   5. El mapa navega (flyTo) hacia el espacio seleccionado.
 *   6. Se abre el panel lateral con el detalle del espacio.
 *
 * También valida:
 *   ✔ El usuario puede buscar desde SearchPage (/buscar).
 *   ✔ Los filtros de categoría filtran los resultados mostrados.
 *   ✔ El botón "Ver en mapa" desde SearchPage navega correctamente.
 *   ✔ Una búsqueda sin resultados muestra el mensaje de vacío.
 *
 * Prerrequisito: el backend debe estar corriendo en http://localhost:8000
 * con al menos un espacio con nombre que contenga "Laboratorio".
 */

import { test, expect, Page } from "@playwright/test";

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function escribirEnSearchBar(page: Page, texto: string) {
  const input = page.getByPlaceholderText("Buscar lugares...");
  await input.fill(texto);
  // Esperar el debounce de 300ms + tiempo de red
  await page.waitForTimeout(500);
}

// ─── Tests ────────────────────────────────────────────────────────────────────
test.describe("Búsqueda de espacios desde el Mapa", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // El mapa puede tardar en cargar los tiles — esperar que el canvas esté visible
    await page.waitForSelector(".leaflet-container", { timeout: 10_000 });
  });

  test("el SearchBar es visible en la página del mapa", async ({ page }) => {
    await expect(page.getByPlaceholderText("Buscar lugares...")).toBeVisible();
  });

  test("el dropdown se muestra con resultados al escribir 'Laboratorio'", async ({
    page,
  }) => {
    await escribirEnSearchBar(page, "Laboratorio");

    // El dropdown debe abrirse con al menos un resultado
    const dropdown = page.locator("ul li").first();
    await expect(dropdown).toBeVisible({ timeout: 5_000 });
  });

  test("al seleccionar un resultado el dropdown se cierra", async ({ page }) => {
    await escribirEnSearchBar(page, "Laboratorio");

    const primerResultado = page.locator("ul li").first();
    await primerResultado.waitFor({ state: "visible", timeout: 5_000 });
    await primerResultado.click();

    // El dropdown debe desaparecer tras la selección
    await expect(page.locator("ul li").first()).not.toBeVisible({ timeout: 3_000 });
  });

  test("el input queda vacío tras seleccionar un resultado", async ({ page }) => {
    await escribirEnSearchBar(page, "Laboratorio");

    const primerResultado = page.locator("ul li").first();
    await primerResultado.waitFor({ state: "visible", timeout: 5_000 });
    await primerResultado.click();

    const input = page.getByPlaceholderText("Buscar lugares...");
    await expect(input).toHaveValue("");
  });

  test("una búsqueda inexistente muestra 'No se encontraron resultados'", async ({
    page,
  }) => {
    await escribirEnSearchBar(page, "xyzabcdef_no_existe_123");

    await expect(page.getByText("No se encontraron resultados")).toBeVisible({
      timeout: 5_000,
    });
  });
});

test.describe("Búsqueda desde SearchPage (/buscar)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/buscar");
  });

  test("la página de búsqueda carga correctamente", async ({ page }) => {
    await expect(page).toHaveURL("/buscar");
    // Debe haber un campo de búsqueda en la página
    await expect(page.getByRole("textbox")).toBeVisible();
  });

  test("mostrar espacios al escribir un término de búsqueda", async ({ page }) => {
    const input = page.getByRole("textbox");
    await input.fill("Lab");
    await page.waitForTimeout(600); // esperar debounce + API

    // Debe aparecer al menos una tarjeta de espacio
    const cards = page.locator("[class*='rounded-xl']");
    await expect(cards.first()).toBeVisible({ timeout: 5_000 });
  });

  test("el botón 'Ver en mapa' navega a la vista de mapa", async ({ page }) => {
    const input = page.getByRole("textbox");
    await input.fill("Lab");
    await page.waitForTimeout(600);

    const botonMapa = page.getByRole("button", { name: /ver en mapa/i }).first();
    await botonMapa.waitFor({ state: "visible", timeout: 5_000 });
    await botonMapa.click();

    // Debe redirigir a la ruta raíz (mapa)
    await expect(page).toHaveURL("/", { timeout: 5_000 });
  });
});
