/**
 * LoginPage.test.tsx — Tests unitarios de la página de inicio de sesión
 *
 * Qué se valida:
 *   ✔ Renderiza los campos de usuario y contraseña.
 *   ✔ El botón "Iniciar Sesión" está presente.
 *   ✔ Campos vacíos no llaman a login() — solo muestran toast de warning.
 *   ✔ Con credenciales llama a login() con username y password correctos.
 *   ✔ Login exitoso redirige a /admin.
 *   ✔ Login fallido muestra toast de error sin redirigir.
 *   ✔ Durante la carga el botón muestra "Ingresando..." y queda deshabilitado.
 *   ✔ Si ya está autenticado redirige automáticamente a /admin.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";

// ─── Mock de sonner (toast) ───────────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));
import { toast } from "sonner";

// ─── Mock del hook useAuth ────────────────────────────────────────────────────
const mockLogin = vi.fn();
vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));
import { useAuth } from "../hooks/useAuth";

// ─── Helper de render ─────────────────────────────────────────────────────────
function renderLogin(authState = {}) {
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    login: mockLogin,
    isAuthenticated: false,
    status: "idle",
    ...authState,
  });

  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<div>Admin Panel</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("LoginPage — renderizado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el título 'Inicia Sesión'", () => {
    renderLogin();
    expect(screen.getByText("Inicia Sesión")).toBeInTheDocument();
  });

  it("renderiza el campo de nombre de usuario", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("Nombre de usuario")).toBeInTheDocument();
  });

  it("renderiza el campo de contraseña", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("Contraseña")).toBeInTheDocument();
  });

  it("renderiza el botón de envío", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
  });
});

describe("LoginPage — validación de campos vacíos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra toast.warning si el username está vacío", async () => {
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(
        expect.stringContaining("completa todos los campos")
      );
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("muestra toast.warning si la contraseña está vacía con username relleno", async () => {
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText("Nombre de usuario"), "admin");
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalled();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });
});

describe("LoginPage — flujo de login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("llama a login() con el username y password escritos en el formulario", async () => {
    mockLogin.mockResolvedValue(true);
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText("Nombre de usuario"), "qa_admin");
    await userEvent.type(screen.getByPlaceholderText("Contraseña"), "QaPass123!");
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("qa_admin", "QaPass123!");
    });
  });

  it("redirige a /admin y muestra toast.success en login exitoso", async () => {
    mockLogin.mockResolvedValue(true);
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText("Nombre de usuario"), "qa_admin");
    await userEvent.type(screen.getByPlaceholderText("Contraseña"), "QaPass123!");
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
      expect(screen.getByText("Admin Panel")).toBeInTheDocument();
    });
  });

  it("muestra toast.error y NO redirige si login() devuelve null/false", async () => {
    mockLogin.mockResolvedValue(null);
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText("Nombre de usuario"), "qa_admin");
    await userEvent.type(screen.getByPlaceholderText("Contraseña"), "MalContraseña");
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
      expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();
    });
  });
});

describe("LoginPage — estado de carga", () => {
  it("muestra 'Ingresando...' y deshabilita el botón cuando status='checking'", () => {
    renderLogin({ status: "checking" });
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.getByText(/ingresando/i)).toBeInTheDocument();
  });
});

describe("LoginPage — redirección si ya autenticado", () => {
  it("redirige automáticamente a /admin si isAuthenticated=true", async () => {
    renderLogin({ isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByText("Admin Panel")).toBeInTheDocument();
    });
  });
});
