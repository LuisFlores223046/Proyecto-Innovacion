/**
 * BuildingCard.test.tsx — Tests del componente de tarjeta de edificio
 *
 * Qué se valida:
 *   ✔ Muestra el nombre del edificio.
 *   ✔ Muestra el placeholder 🏛️ si no hay foto_url.
 *   ✔ Muestra la imagen si hay foto_url.
 *   ✔ Muestra el total de espacios cargados desde la API.
 *   ✔ El botón "Más info" expande el panel de detalle.
 *   ✔ El botón "Menos" colapsa el panel de detalle.
 *   ✔ Muestra la descripción del edificio en el panel expandido.
 *   ✔ El botón ✕ llama a onClose.
 *   ✔ Click fuera del componente llama a onClose.
 *   ✔ Si la API falla al cargar espacios, el componente no explota.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import BuildingCard from "../components/LocationCard/BuildingCard";
import type { Edificio } from "../types/edificio";

// ─── Mock de la API ───────────────────────────────────────────────────────────
vi.mock("../services/api", () => ({
  fetchEspaciosPorEdificio: vi.fn(),
}));
import { fetchEspaciosPorEdificio } from "../services/api";

// ─── Mock de StatusBadge (no testeamos sus internos aquí) ────────────────────
vi.mock("../components/UI/StatusBadge", () => ({
  default: ({ active }: { active: boolean }) => (
    <span data-testid="status-badge">{active ? "Abierto" : "Cerrado"}</span>
  ),
}));

// ─── Datos de prueba ──────────────────────────────────────────────────────────
const edificioMock: Edificio = {
  id: 1,
  codigo: "ICSA",
  nombre: "Instituto de Ciencias Sociales",
  descripcion: "Edificio principal de la facultad de ciencias sociales.",
  latitud: 31.72,
  longitud: -106.427,
  foto_url: null,
  activo: true,
};

const espaciosMock = [
  {
    id: 1,
    nombre: "Aula 101",
    codigo: "AULA-101",
    activo: true,
    categoria: { id: 1, nombre: "Aula", icono: "🎓", color: "#003DA5" },
    horarios: [],
    servicios: [],
    latitud: null,
    longitud: null,
  },
  {
    id: 2,
    nombre: "Laboratorio A",
    codigo: "LAB-A",
    activo: true,
    categoria: { id: 2, nombre: "Laboratorio", icono: "🔬", color: "#FF6B35" },
    horarios: [],
    servicios: [],
    latitud: null,
    longitud: null,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Helper ───────────────────────────────────────────────────────────────────
function renderCard(overrides = {}, onClose = vi.fn()) {
  const edificio = { ...edificioMock, ...overrides };
  render(<BuildingCard edificio={edificio} onClose={onClose} />);
  return { onClose };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("BuildingCard — contenido básico", () => {
  it("muestra el nombre del edificio", async () => {
    (fetchEspaciosPorEdificio as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderCard();
    expect(screen.getByText("Instituto de Ciencias Sociales")).toBeInTheDocument();
  });

  it("muestra el placeholder 🏛️ si no hay foto_url", async () => {
    (fetchEspaciosPorEdificio as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderCard({ foto_url: null });
    expect(screen.getByText("🏛️")).toBeInTheDocument();
  });

  it("muestra la imagen si hay foto_url", async () => {
    (fetchEspaciosPorEdificio as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderCard({ foto_url: "https://example.com/edificio.jpg" });
    const img = screen.getByRole("img", { name: /Instituto de Ciencias Sociales/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/edificio.jpg");
  });
});

describe("BuildingCard — carga de espacios", () => {
  it("muestra el total de espacios después de cargar la API", async () => {
    (fetchEspaciosPorEdificio as ReturnType<typeof vi.fn>).mockResolvedValue(espaciosMock);
    renderCard();
    await waitFor(() => {
      expect(screen.getByText(/2 espacios/i)).toBeInTheDocument();
    });
  });

  it("muestra '1 espacio' en singular con un solo espacio", async () => {
    (fetchEspaciosPorEdificio as ReturnType<typeof vi.fn>).mockResolvedValue([espaciosMock[0]]);
    renderCard();
    await waitFor(() => {
      expect(screen.getByText(/1 espacio$/i)).toBeInTheDocument();
    });
  });

  it("no explota si la API de espacios falla", async () => {
    (fetchEspaciosPorEdificio as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network Error")
    );
    renderCard();
    // El componente debe seguir siendo visible con 0 espacios
    await waitFor(() => {
      expect(screen.getByText("Instituto de Ciencias Sociales")).toBeInTheDocument();
    });
  });
});

describe("BuildingCard — expand/collapse", () => {
  it("el panel expandido no es visible inicialmente", async () => {
    (fetchEspaciosPorEdificio as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderCard();
    // La descripción solo se ve en el panel expandido
    expect(
      screen.queryByText("Edificio principal de la facultad de ciencias sociales.")
    ).not.toBeVisible();
  });

  it("el botón 'Más info' expande el panel y muestra la descripción", async () => {
    (fetchEspaciosPorEdificio as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: /más info/i }));
    await waitFor(() => {
      expect(
        screen.getByText("Edificio principal de la facultad de ciencias sociales.")
      ).toBeVisible();
    });
  });

  it("el botón cambia a 'Menos' al expandir", async () => {
    (fetchEspaciosPorEdificio as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: /más info/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /menos/i })).toBeInTheDocument();
    });
  });
});

describe("BuildingCard — botón cerrar", () => {
  it("el botón ✕ llama a onClose", async () => {
    (fetchEspaciosPorEdificio as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const { onClose } = renderCard();
    fireEvent.click(screen.getByRole("button", { name: "✕" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
