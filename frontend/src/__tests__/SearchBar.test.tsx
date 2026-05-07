/**
 * SearchBar.test.tsx — Tests unitarios del componente SearchBar
 *
 * Qué se valida:
 *   ✔ Renderiza el input con el placeholder correcto.
 *   ✔ El input acepta texto y actualiza su valor.
 *   ✔ Con texto vacío NO se hace fetch y el dropdown está cerrado.
 *   ✔ Con texto válido llama a fetchBuscarEspacios (mock) tras el debounce.
 *   ✔ Los resultados de la API se muestran en el dropdown.
 *   ✔ "No se encontraron resultados" aparece cuando la API devuelve [].
 *   ✔ Al hacer click en un resultado se llama onSelectResult con el espacio correcto.
 *   ✔ Mientras carga muestra el texto "Buscando...".
 *
 * NOTA sobre timers:
 *   Se usa vi.useFakeTimers() para controlar el debounce de 300ms.
 *   Se evita waitFor() en tests de debounce porque internamente usa setInterval
 *   que también queda mockeado y cuelga la ejecución. En su lugar:
 *     - act(sync) para avanzar timers y vaciar efectos síncronos.
 *     - await act(async) para vaciar promesas resueltas y re-renders resultantes.
 */

import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import SearchBar from "../components/Search/SearchBar";

// ─── Mock del módulo de API ───────────────────────────────────────────────────
vi.mock("../services/api", () => ({
  fetchBuscarEspacios: vi.fn(),
}));

import { fetchBuscarEspacios } from "../services/api";

// ─── Datos de prueba ──────────────────────────────────────────────────────────
const espaciosMock = [
  {
    id: 1,
    codigo: "LAB-101",
    nombre: "Laboratorio de Cómputo 101",
    latitud: 31.72,
    longitud: -106.427,
    activo: true,
    categoria: { id: 1, nombre: "Laboratorio", icono: "🔬", color: "#003DA5" },
    notas: "Sala con 30 equipos.",
    piso_id: null,
    categoria_id: 1,
    creado_en: "2024-01-01T00:00:00",
    actualizado_en: null,
  },
  {
    id: 2,
    codigo: "BIBL-01",
    nombre: "Biblioteca Central",
    latitud: 31.721,
    longitud: -106.428,
    activo: true,
    categoria: { id: 2, nombre: "Biblioteca", icono: "📚", color: "#FF6B35" },
    notas: null,
    piso_id: null,
    categoria_id: 2,
    creado_en: "2024-01-01T00:00:00",
    actualizado_en: null,
  },
];

// ─── Helper: dispara el evento change sin userEvent (evita conflicto con fake timers) ─
function escribir(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("SearchBar — renderizado inicial", () => {
  it("muestra el placeholder por defecto 'Buscar lugares...'", () => {
    render(<SearchBar onSelectResult={vi.fn()} />);
    expect(screen.getByPlaceholderText("Buscar lugares...")).toBeInTheDocument();
  });

  it("acepta un placeholder personalizado via prop", () => {
    render(<SearchBar onSelectResult={vi.fn()} placeholder="Buscar edificio..." />);
    expect(screen.getByPlaceholderText("Buscar edificio...")).toBeInTheDocument();
  });

  it("no muestra el dropdown al inicio", () => {
    render(<SearchBar onSelectResult={vi.fn()} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

describe("SearchBar — comportamiento de búsqueda", () => {
  it("con texto vacío no llama a fetchBuscarEspacios", () => {
    render(<SearchBar onSelectResult={vi.fn()} />);
    const input = screen.getByRole("textbox");

    escribir(input, "   "); // solo espacios
    act(() => vi.advanceTimersByTime(400));

    expect(fetchBuscarEspacios).not.toHaveBeenCalled();
  });

  it("llama a fetchBuscarEspacios con el término correcto tras 300ms de debounce", () => {
    (fetchBuscarEspacios as ReturnType<typeof vi.fn>).mockResolvedValue(espaciosMock);
    render(<SearchBar onSelectResult={vi.fn()} />);
    const input = screen.getByRole("textbox");

    escribir(input, "Lab");
    // act síncrono: avanza el reloj → dispara el debounce → vacía efectos React
    act(() => vi.advanceTimersByTime(350));

    // fetchBuscarEspacios ya fue llamado de forma síncrona dentro del act
    expect(fetchBuscarEspacios).toHaveBeenCalledWith("Lab");
  });

  it("muestra 'Buscando...' mientras la petición está en vuelo", () => {
    // Promesa que nunca resuelve → simula latencia infinita
    (fetchBuscarEspacios as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );
    render(<SearchBar onSelectResult={vi.fn()} />);
    const input = screen.getByRole("textbox");

    escribir(input, "Lab");
    act(() => vi.advanceTimersByTime(350));

    // setIsLoading(true) se llamó síncronamente dentro del useEffect → DOM actualizado
    expect(screen.getByText("Buscando...")).toBeInTheDocument();
  });

  it("muestra los resultados retornados por la API", async () => {
    (fetchBuscarEspacios as ReturnType<typeof vi.fn>).mockResolvedValue(espaciosMock);
    render(<SearchBar onSelectResult={vi.fn()} />);
    const input = screen.getByRole("textbox");

    escribir(input, "Lab");
    act(() => vi.advanceTimersByTime(350));
    // Vacía la promesa resuelta (microtask) y los re-renders de React resultantes
    await act(async () => {});

    expect(screen.getByText("Laboratorio de Cómputo 101")).toBeInTheDocument();
    expect(screen.getByText("Biblioteca Central")).toBeInTheDocument();
  });

  it("muestra 'No se encontraron resultados' cuando la API devuelve []", async () => {
    (fetchBuscarEspacios as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    render(<SearchBar onSelectResult={vi.fn()} />);
    const input = screen.getByRole("textbox");

    escribir(input, "xyzabc");
    act(() => vi.advanceTimersByTime(350));
    await act(async () => {});

    expect(screen.getByText("No se encontraron resultados")).toBeInTheDocument();
  });
});

describe("SearchBar — interacción con resultados", () => {
  it("llama a onSelectResult con el espacio correcto al hacer click en un resultado", async () => {
    (fetchBuscarEspacios as ReturnType<typeof vi.fn>).mockResolvedValue(espaciosMock);
    const onSelect = vi.fn();
    render(<SearchBar onSelectResult={onSelect} />);
    const input = screen.getByRole("textbox");

    escribir(input, "Lab");
    act(() => vi.advanceTimersByTime(350));
    await act(async () => {});

    fireEvent.click(screen.getByText("Laboratorio de Cómputo 101"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(espaciosMock[0]);
  });

  it("limpia el input y cierra el dropdown tras seleccionar un resultado", async () => {
    (fetchBuscarEspacios as ReturnType<typeof vi.fn>).mockResolvedValue(espaciosMock);
    render(<SearchBar onSelectResult={vi.fn()} />);
    const input = screen.getByRole("textbox");

    escribir(input, "Lab");
    act(() => vi.advanceTimersByTime(350));
    await act(async () => {});

    fireEvent.click(screen.getByText("Laboratorio de Cómputo 101"));

    expect(input).toHaveValue("");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
