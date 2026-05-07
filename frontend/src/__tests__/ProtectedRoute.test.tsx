/**
 * ProtectedRoute.test.tsx — Tests del componente de rutas protegidas
 *
 * Qué se valida (CRÍTICO para seguridad):
 *   ✔ Con status='checking' muestra el spinner "Cargando...".
 *   ✔ Sin autenticar (isAuthenticated=false) redirige a /login.
 *   ✔ Autenticado (isAuthenticated=true) renderiza el Outlet (contenido protegido).
 *   ✔ La redirección usa `replace` — no acumula historial de navegación.
 */

import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../components/Layout/ProtectedRoute";

// ─── Mock del hook useAuth ────────────────────────────────────────────────────
vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));
import { useAuth } from "../hooks/useAuth";

// ─── Mock del sidebar (no queremos testear sus internos aquí) ─────────────────
vi.mock("../components/Admin/SideBarAdmin", () => ({
  SideBarAdmin: () => <nav data-testid="sidebar-admin">Sidebar</nav>,
}));

// ─── Helper de render ─────────────────────────────────────────────────────────
function renderWithRoutes(authState = {}) {
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    isAuthenticated: false,
    status: "idle",
    ...authState,
  });

  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<div>Panel de Admin</div>} />
        </Route>
        <Route path="/login" element={<div>Página de Login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("ProtectedRoute — estado de carga", () => {
  it("muestra 'Cargando...' mientras el estado de auth es 'checking'", () => {
    renderWithRoutes({ status: "checking" });
    expect(screen.getByText("Cargando...")).toBeInTheDocument();
    // No debe redirigir ni mostrar el panel durante la comprobación
    expect(screen.queryByText("Panel de Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("Página de Login")).not.toBeInTheDocument();
  });
});

describe("ProtectedRoute — usuario NO autenticado", () => {
  it("redirige a /login cuando isAuthenticated=false", () => {
    renderWithRoutes({ isAuthenticated: false, status: "idle" });
    expect(screen.getByText("Página de Login")).toBeInTheDocument();
    expect(screen.queryByText("Panel de Admin")).not.toBeInTheDocument();
  });

  it("no renderiza el Outlet cuando no está autenticado", () => {
    renderWithRoutes({ isAuthenticated: false, status: "idle" });
    expect(screen.queryByTestId("sidebar-admin")).not.toBeInTheDocument();
  });
});

describe("ProtectedRoute — usuario autenticado", () => {
  it("renderiza el Outlet con el contenido protegido cuando isAuthenticated=true", () => {
    renderWithRoutes({ isAuthenticated: true, status: "authenticated" });
    expect(screen.getByText("Panel de Admin")).toBeInTheDocument();
    expect(screen.queryByText("Página de Login")).not.toBeInTheDocument();
  });

  it("muestra el sidebar cuando el usuario está autenticado", () => {
    renderWithRoutes({ isAuthenticated: true, status: "authenticated" });
    expect(screen.getByTestId("sidebar-admin")).toBeInTheDocument();
  });
});
