/**
 * BadgesEspacios.test.tsx — Tests del componente de filtros por categoría
 *
 * Qué se valida:
 *   ✔ Mientras carga muestra "Cargando categorias...".
 *   ✔ Después de cargar muestra un botón por cada categoría.
 *   ✔ Cada botón muestra el icono y el nombre de la categoría.
 *   ✔ Al hacer click en una categoría inactiva llama a onSelect con esa categoría.
 *   ✔ Al hacer click en la categoría activa (selectedId == cat.id) llama a onSelect(null) — deselecciona.
 *   ✔ El botón activo tiene la clase de fondo azul (--003DA5).
 *   ✔ Si la API falla, el componente no explota (muestra nada o lista vacía).
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { BadgesEspacios } from "../components/Filters/BadgesEspacios";

// ─── Mock de la API ───────────────────────────────────────────────────────────
vi.mock("../services/api", () => ({
  fetchCategorias: vi.fn(),
}));
import { fetchCategorias } from "../services/api";

// ─── Datos de prueba ──────────────────────────────────────────────────────────
const categoriasMock = [
  { id: 1, nombre: "Laboratorio", icono: "🔬", color: "#003DA5" },
  { id: 2, nombre: "Biblioteca", icono: "📚", color: "#FF6B35" },
  { id: 3, nombre: "Cafetería", icono: "☕", color: "#8B4513" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("BadgesEspacios — estado de carga", () => {
  it("muestra 'Cargando categorias...' mientras la API no ha respondido", () => {
    (fetchCategorias as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // nunca resuelve
    );
    render(<BadgesEspacios selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText("Cargando categorias...")).toBeInTheDocument();
  });
});

describe("BadgesEspacios — renderizado de categorías", () => {
  it("renderiza un botón por cada categoría devuelta por la API", async () => {
    (fetchCategorias as ReturnType<typeof vi.fn>).mockResolvedValue(categoriasMock);
    render(<BadgesEspacios selectedId={null} onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Laboratorio")).toBeInTheDocument();
      expect(screen.getByText("Biblioteca")).toBeInTheDocument();
      expect(screen.getByText("Cafetería")).toBeInTheDocument();
    });
  });

  it("muestra el icono de cada categoría", async () => {
    (fetchCategorias as ReturnType<typeof vi.fn>).mockResolvedValue(categoriasMock);
    render(<BadgesEspacios selectedId={null} onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("🔬")).toBeInTheDocument();
      expect(screen.getByText("📚")).toBeInTheDocument();
    });
  });
});

describe("BadgesEspacios — interacción de selección", () => {
  it("llama a onSelect con la categoría al hacer click en un badge inactivo", async () => {
    (fetchCategorias as ReturnType<typeof vi.fn>).mockResolvedValue(categoriasMock);
    const onSelect = vi.fn();
    render(<BadgesEspacios selectedId={null} onSelect={onSelect} />);

    await waitFor(() => screen.getByText("Laboratorio"));
    fireEvent.click(screen.getByText("Laboratorio"));

    expect(onSelect).toHaveBeenCalledWith(categoriasMock[0]);
  });

  it("llama a onSelect(null) al hacer click en el badge activo (deselecciona)", async () => {
    (fetchCategorias as ReturnType<typeof vi.fn>).mockResolvedValue(categoriasMock);
    const onSelect = vi.fn();
    render(<BadgesEspacios selectedId={1} onSelect={onSelect} />);

    await waitFor(() => screen.getByText("Laboratorio"));
    // El badge de Laboratorio ya está activo (selectedId=1)
    fireEvent.click(screen.getByText("Laboratorio"));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("el badge activo tiene el fondo azul (#003DA5)", async () => {
    (fetchCategorias as ReturnType<typeof vi.fn>).mockResolvedValue(categoriasMock);
    render(<BadgesEspacios selectedId={2} onSelect={vi.fn()} />);

    await waitFor(() => screen.getByText("Biblioteca"));
    const botonBiblioteca = screen.getByText("Biblioteca").closest("button")!;
    expect(botonBiblioteca.className).toContain("bg-[#003DA5]");
  });

  it("el badge inactivo NO tiene el fondo azul", async () => {
    (fetchCategorias as ReturnType<typeof vi.fn>).mockResolvedValue(categoriasMock);
    render(<BadgesEspacios selectedId={1} onSelect={vi.fn()} />);

    await waitFor(() => screen.getByText("Biblioteca"));
    const botonBiblioteca = screen.getByText("Biblioteca").closest("button")!;
    expect(botonBiblioteca.className).not.toContain("bg-[#003DA5]");
  });
});

describe("BadgesEspacios — manejo de errores", () => {
  it("no explota si la API falla — muestra lista vacía", async () => {
    (fetchCategorias as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network Error")
    );
    render(<BadgesEspacios selectedId={null} onSelect={vi.fn()} />);

    await waitFor(() => {
      // El loading debe desaparecer
      expect(screen.queryByText("Cargando categorias...")).not.toBeInTheDocument();
      // No debe haber ningún botón de categoría
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });
});
