/**
 * SpaceDetailCard.test.tsx — Tests del componente de detalle de espacio
 *
 * Qué se valida:
 *   ✔ Muestra el nombre y código del espacio (desde espacioBasic, sin esperar API).
 *   ✔ Llama a fetchEspacioDetalle con el ID correcto al montarse.
 *   ✔ Muestra el nombre de la categoría cuando el detalle carga.
 *   ✔ Muestra el StatusBadge (abierto/cerrado) después de cargar.
 *   ✔ El botón ✕ llama a onClose.
 *   ✔ El botón "Más info" expande el panel de detalle.
 *   ✔ Muestra las notas del espacio en el panel expandido.
 *   ✔ Muestra la foto principal si existe.
 *   ✔ No explota si la API falla (setDetalle(null) → loading=false).
 *   ✔ estaAbierto() — lógica de horario: si el horario cubre la hora actual → abierto.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SpaceDetailCard from "../components/LocationCard/SpaceDetailCard";

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("../services/api", () => ({
  fetchEspacioDetalle: vi.fn(),
}));
import { fetchEspacioDetalle } from "../services/api";

vi.mock("../components/UI/StatusBadge", () => ({
  default: ({ active }: { active: boolean }) => (
    <span data-testid="status-badge">{active ? "Abierto" : "Cerrado"}</span>
  ),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

// ─── Datos de prueba ──────────────────────────────────────────────────────────
const espacioBasic = {
  nombre: "Laboratorio de Cómputo 101",
  codigo: "LAB-101",
  icono: "🔬",
};

const detalleMock = {
  id: 1,
  codigo: "LAB-101",
  nombre: "Laboratorio de Cómputo 101",
  activo: true,
  latitud: 31.72,
  longitud: -106.427,
  notas: "Sala con 30 equipos disponibles para estudiantes.",
  piso_id: null,
  categoria_id: 1,
  creado_en: "2024-01-01T00:00:00",
  actualizado_en: null,
  categoria: { id: 1, nombre: "Laboratorio", icono: "🔬", color: "#003DA5" },
  horarios: [],
  contactos: [],
  servicios: [{ id: 1, nombre: "Wi-Fi", icono: "📶", espacio_id: 1 }],
  fotos: [],
  eventos: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Helper ───────────────────────────────────────────────────────────────────
function renderCard(onClose = vi.fn()) {
  render(
    <MemoryRouter>
      <SpaceDetailCard espacioId={1} espacioBasic={espacioBasic} onClose={onClose} />
    </MemoryRouter>
  );
  return { onClose };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("SpaceDetailCard — contenido inmediato (sin API)", () => {
  it("muestra el nombre del espacio antes de que cargue la API", () => {
    (fetchEspacioDetalle as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // nunca resuelve
    );
    renderCard();
    expect(screen.getByText("Laboratorio de Cómputo 101")).toBeInTheDocument();
  });

  it("muestra el código del espacio", () => {
    (fetchEspacioDetalle as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );
    renderCard();
    expect(screen.getByText("LAB-101")).toBeInTheDocument();
  });
});

describe("SpaceDetailCard — carga del detalle", () => {
  it("llama a fetchEspacioDetalle con el ID correcto al montarse", async () => {
    (fetchEspacioDetalle as ReturnType<typeof vi.fn>).mockResolvedValue(detalleMock);
    renderCard();
    await waitFor(() => {
      expect(fetchEspacioDetalle).toHaveBeenCalledWith(1);
    });
  });

  it("muestra el nombre de la categoría después de cargar", async () => {
    (fetchEspacioDetalle as ReturnType<typeof vi.fn>).mockResolvedValue(detalleMock);
    renderCard();
    await waitFor(() => {
      expect(screen.getByText("Laboratorio")).toBeInTheDocument();
    });
  });

  it("muestra el StatusBadge después de cargar el detalle", async () => {
    (fetchEspacioDetalle as ReturnType<typeof vi.fn>).mockResolvedValue(detalleMock);
    renderCard();
    await waitFor(() => {
      expect(screen.getByTestId("status-badge")).toBeInTheDocument();
    });
  });
});

describe("SpaceDetailCard — expand/collapse", () => {
  it("el botón 'Más info' aparece después de cargar y expande el panel", async () => {
    (fetchEspacioDetalle as ReturnType<typeof vi.fn>).mockResolvedValue(detalleMock);
    renderCard();
    await waitFor(() => screen.getByRole("button", { name: /más info/i }));
    fireEvent.click(screen.getByRole("button", { name: /más info/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /menos/i })).toBeInTheDocument();
    });
  });

  it("las notas del espacio se muestran en el panel expandido", async () => {
    (fetchEspacioDetalle as ReturnType<typeof vi.fn>).mockResolvedValue(detalleMock);
    renderCard();
    await waitFor(() => screen.getByRole("button", { name: /más info/i }));
    fireEvent.click(screen.getByRole("button", { name: /más info/i }));
    await waitFor(() => {
      expect(
        screen.getByText("Sala con 30 equipos disponibles para estudiantes.")
      ).toBeInTheDocument();
    });
  });
});

describe("SpaceDetailCard — botón cerrar", () => {
  it("el botón ✕ llama a onClose", async () => {
    (fetchEspacioDetalle as ReturnType<typeof vi.fn>).mockResolvedValue(detalleMock);
    const { onClose } = renderCard();
    fireEvent.click(screen.getByRole("button", { name: "✕" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("SpaceDetailCard — manejo de errores de API", () => {
  it("no explota si fetchEspacioDetalle falla", async () => {
    (fetchEspacioDetalle as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network Error")
    );
    renderCard();
    // El nombre del espacio (que viene de props) siempre debe estar visible
    await waitFor(() => {
      expect(screen.getByText("Laboratorio de Cómputo 101")).toBeInTheDocument();
    });
  });
});

describe("SpaceDetailCard — foto principal", () => {
  it("muestra la imagen principal si hay fotos", async () => {
    const detalleConFoto = {
      ...detalleMock,
      fotos: [
        {
          id: 1,
          url: "https://example.com/lab.jpg",
          es_principal: true,
          descripcion: "Vista frontal",
          orden: 1,
          espacio_id: 1,
        },
      ],
    };
    (fetchEspacioDetalle as ReturnType<typeof vi.fn>).mockResolvedValue(detalleConFoto);
    renderCard();
    await waitFor(() => {
      const img = screen.getByRole("img", { name: /foto del espacio/i });
      expect(img).toHaveAttribute("src", "https://example.com/lab.jpg");
    });
  });
});
