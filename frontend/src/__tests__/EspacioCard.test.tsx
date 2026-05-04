/**
 * EspacioCard.test.tsx — Tests unitarios del componente EspacioCard
 *
 * Qué se valida:
 *   ✔ Muestra el nombre y el código del espacio.
 *   ✔ Muestra las notas si las tiene.
 *   ✔ Muestra la categoría (nombre + icono) cuando existe.
 *   ✔ Muestra el botón "Ver en mapa" si tiene latitud y longitud.
 *   ✔ NO muestra el botón "Ver en mapa" si no tiene coordenadas.
 *   ✔ El click navega a "/" con el estado flyTo y espacio correctos.
 *   ✔ Un espacio sin categoría muestra el ícono de fallback "📍".
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import EspacioCard from "../components/LocationCard/EspacioCard";
import type { Espacio } from "../types/espacio";

// ─── Mock de react-router-dom navigate ───────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ─── Datos de prueba ──────────────────────────────────────────────────────────
const espacioConCoordenadas: Espacio = {
  id: 1,
  codigo: "LAB-101",
  nombre: "Laboratorio de Cómputo 101",
  latitud: 31.72,
  longitud: -106.427,
  activo: true,
  categoria: { id: 1, nombre: "Laboratorio", icono: "🔬", color: "#003DA5" },
  notas: "Sala con 30 equipos disponibles para estudiantes.",
  piso_id: null,
  categoria_id: 1,
  creado_en: "2024-01-01T00:00:00",
  actualizado_en: null,
};

const espacioSinCoordenadas: Espacio = {
  ...espacioConCoordenadas,
  id: 2,
  codigo: "SIN-COORD",
  nombre: "Aula sin ubicación",
  latitud: null,
  longitud: null,
};

const espacioSinCategoria: Espacio = {
  ...espacioConCoordenadas,
  id: 3,
  categoria: null,
  categoria_id: null,
};

// ─── Helper: render con router ────────────────────────────────────────────────
function renderCard(espacio: Espacio) {
  return render(
    <MemoryRouter>
      <EspacioCard espacio={espacio} />
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("EspacioCard — contenido básico", () => {
  it("muestra el nombre del espacio", () => {
    renderCard(espacioConCoordenadas);
    expect(screen.getByText("Laboratorio de Cómputo 101")).toBeInTheDocument();
  });

  it("muestra el código del espacio", () => {
    renderCard(espacioConCoordenadas);
    expect(screen.getByText("LAB-101")).toBeInTheDocument();
  });

  it("muestra las notas si están presentes", () => {
    renderCard(espacioConCoordenadas);
    expect(
      screen.getByText("Sala con 30 equipos disponibles para estudiantes.")
    ).toBeInTheDocument();
  });

  it("no muestra sección de notas si notas es null", () => {
    renderCard({ ...espacioConCoordenadas, notas: null });
    expect(
      screen.queryByText("Sala con 30 equipos disponibles para estudiantes.")
    ).not.toBeInTheDocument();
  });
});

describe("EspacioCard — categoría", () => {
  it("muestra el nombre de la categoría cuando existe", () => {
    renderCard(espacioConCoordenadas);
    expect(screen.getByText(/Laboratorio/)).toBeInTheDocument();
  });

  it("muestra icono 📍 como fallback cuando no hay categoría", () => {
    renderCard(espacioSinCategoria);
    // El icono de fallback aparece en el heading del nombre
    expect(screen.getByText(/📍/)).toBeInTheDocument();
  });
});

describe("EspacioCard — botón 'Ver en mapa'", () => {
  it("muestra el botón cuando el espacio tiene coordenadas", () => {
    renderCard(espacioConCoordenadas);
    expect(screen.getByRole("button", { name: /ver en mapa/i })).toBeInTheDocument();
  });

  it("no muestra el botón cuando el espacio no tiene coordenadas", () => {
    renderCard(espacioSinCoordenadas);
    expect(
      screen.queryByRole("button", { name: /ver en mapa/i })
    ).not.toBeInTheDocument();
  });
});

describe("EspacioCard — navegación", () => {
  it("navega a '/' con el estado flyTo y espacio al hacer click en 'Ver en mapa'", () => {
    renderCard(espacioConCoordenadas);
    fireEvent.click(screen.getByRole("button", { name: /ver en mapa/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/", {
      state: {
        flyTo: { lat: 31.72, lng: -106.427 },
        espacio: espacioConCoordenadas,
      },
    });
  });

  it("no navega al hacer click en un espacio sin coordenadas", () => {
    renderCard(espacioSinCoordenadas);
    // Al no tener botón, el click en el card no debe navegar
    const card = screen.getByText("Aula sin ubicación").closest("div");
    fireEvent.click(card!);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
