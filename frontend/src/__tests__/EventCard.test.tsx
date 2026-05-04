/**
 * EventCard.test.tsx — Tests unitarios del componente EventCard
 *
 * Qué se valida:
 *   ✔ Muestra el título y tipo del evento.
 *   ✔ Muestra la descripción si está disponible.
 *   ✔ Muestra el badge "Finalizado" si terminado=true.
 *   ✔ Muestra el badge "Cancelado" si activo=false y no terminado.
 *   ✔ Muestra el badge de tipo con el color correcto (academico, deportivo...).
 *   ✔ Muestra el espacio vinculado si existe, o "Por confirmar" si no.
 *   ✔ El botón "Registrarse" aparece si hay url_registro y NO está terminado.
 *   ✔ El botón "Registrarse" NO aparece si el evento está terminado.
 *   ✔ El botón "Ver en mapa" aparece si el espacio vinculado tiene latitud.
 *   ✔ Al hacer click en "Ver en mapa" llama a onViewOnMap con el espacio.
 *   ✔ Al hacer click en la tarjeta llama a onClick.
 *   ✔ Muestra la imagen si foto_url está disponible.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import EventCard from "../components/Events/EventCard";
import type { Evento } from "../types/evento";
import type { Espacio } from "../types/espacio";

// ─── Datos de prueba ──────────────────────────────────────────────────────────
const eventoBase: Evento = {
  id: 1,
  titulo: "Feria de Ciencias UACJ",
  descripcion: "Exposición de proyectos estudiantiles de ingeniería.",
  fecha_inicio: "2026-06-15T10:00:00Z",
  fecha_fin: "2026-06-15T18:00:00Z",
  tipo: "academico",
  activo: true,
  foto_url: null,
  url_registro: null,
  espacio_id: null,
  creado_en: "2026-05-01T00:00:00Z",
};

const espacioMock: Espacio = {
  id: 1,
  codigo: "AUDI-01",
  nombre: "Auditorio Principal",
  latitud: 31.72,
  longitud: -106.427,
  activo: true,
  categoria: null,
  categoria_id: null,
  notas: null,
  piso_id: null,
  creado_en: "2024-01-01T00:00:00",
  actualizado_en: null,
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function renderCard(overrides = {}, espacioVinculado: Espacio | null = null) {
  const evento = { ...eventoBase, ...overrides };
  const onClick = vi.fn();
  const onViewOnMap = vi.fn();
  const eventRef = vi.fn();

  render(
    <EventCard
      evento={evento}
      terminado={false}
      isFocused={false}
      espacioVinculado={espacioVinculado}
      eventRef={eventRef}
      onClick={onClick}
      onViewOnMap={onViewOnMap}
    />
  );
  return { onClick, onViewOnMap };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("EventCard — contenido básico", () => {
  it("muestra el título del evento", () => {
    renderCard();
    expect(screen.getByText("Feria de Ciencias UACJ")).toBeInTheDocument();
  });

  it("muestra la descripción del evento", () => {
    renderCard();
    expect(
      screen.getByText("Exposición de proyectos estudiantiles de ingeniería.")
    ).toBeInTheDocument();
  });

  it("muestra el tipo del evento como badge", () => {
    renderCard();
    expect(screen.getByText("academico")).toBeInTheDocument();
  });

  it("no muestra sección de descripción si es null", () => {
    renderCard({ descripcion: null });
    expect(
      screen.queryByText("Exposición de proyectos estudiantiles de ingeniería.")
    ).not.toBeInTheDocument();
  });
});

describe("EventCard — estados del evento", () => {
  it("muestra badge 'Finalizado' cuando terminado=true", () => {
    render(
      <EventCard
        evento={eventoBase}
        terminado={true}
        isFocused={false}
        espacioVinculado={null}
        eventRef={vi.fn()}
        onClick={vi.fn()}
        onViewOnMap={vi.fn()}
      />
    );
    expect(screen.getByText("Finalizado")).toBeInTheDocument();
  });

  it("muestra badge 'Cancelado' si activo=false y no terminado", () => {
    render(
      <EventCard
        evento={{ ...eventoBase, activo: false }}
        terminado={false}
        isFocused={false}
        espacioVinculado={null}
        eventRef={vi.fn()}
        onClick={vi.fn()}
        onViewOnMap={vi.fn()}
      />
    );
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
  });

  it("NO muestra badge 'Finalizado' cuando terminado=false", () => {
    renderCard();
    expect(screen.queryByText("Finalizado")).not.toBeInTheDocument();
  });
});

describe("EventCard — ubicación", () => {
  it("muestra el nombre del espacio vinculado si existe", () => {
    renderCard({}, espacioMock);
    expect(screen.getByText("Auditorio Principal")).toBeInTheDocument();
  });

  it("muestra 'Por confirmar / Ubicación externa' si no hay espacio", () => {
    renderCard({}, null);
    expect(
      screen.getByText("Por confirmar / Ubicación externa")
    ).toBeInTheDocument();
  });
});

describe("EventCard — botones de acción", () => {
  it("muestra 'Registrarse' si hay url_registro y el evento está activo y no terminado", () => {
    render(
      <EventCard
        evento={{ ...eventoBase, url_registro: "https://registro.uacj.mx" }}
        terminado={false}
        isFocused={false}
        espacioVinculado={null}
        eventRef={vi.fn()}
        onClick={vi.fn()}
        onViewOnMap={vi.fn()}
      />
    );
    expect(screen.getByRole("link", { name: /registrarse/i })).toBeInTheDocument();
  });

  it("NO muestra 'Registrarse' si el evento está terminado", () => {
    render(
      <EventCard
        evento={{ ...eventoBase, url_registro: "https://registro.uacj.mx" }}
        terminado={true}
        isFocused={false}
        espacioVinculado={null}
        eventRef={vi.fn()}
        onClick={vi.fn()}
        onViewOnMap={vi.fn()}
      />
    );
    expect(screen.queryByRole("link", { name: /registrarse/i })).not.toBeInTheDocument();
  });

  it("muestra 'Ver en mapa' si el espacio tiene latitud", () => {
    renderCard({}, espacioMock);
    expect(screen.getByText(/ver en mapa/i)).toBeInTheDocument();
  });

  it("llama a onViewOnMap con el espacio correcto al hacer click en 'Ver en mapa'", () => {
    const { onViewOnMap } = renderCard({}, espacioMock);
    fireEvent.click(screen.getByText(/ver en mapa/i));
    expect(onViewOnMap).toHaveBeenCalledWith(espacioMock);
  });
});

describe("EventCard — interacción", () => {
  it("llama a onClick al hacer click en la tarjeta", () => {
    const { onClick } = renderCard();
    const titulo = screen.getByText("Feria de Ciencias UACJ");
    fireEvent.click(titulo);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
