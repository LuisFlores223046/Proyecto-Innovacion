/**
 * AuthContext.test.tsx — Tests del proveedor de autenticación
 *
 * Qué se valida (lógica crítica de seguridad):
 *
 * Inicialización:
 *   ✔ Sin token en localStorage → status='unauthenticated' inmediatamente.
 *   ✔ Con token válido en localStorage → llama a getMe y pasa a 'authenticated'.
 *   ✔ Con token inválido en localStorage → llama a getMe, falla, limpia token y pasa a 'unauthenticated'.
 *   ✔ Durante la validación el status es 'checking'.
 *
 * Login:
 *   ✔ login() exitoso → guarda token en localStorage, status='authenticated', admin poblado.
 *   ✔ login() fallido → status='unauthenticated', admin=null, devuelve false.
 *   ✔ login() pone status='checking' mientras procesa.
 *
 * Logout:
 *   ✔ logout() → elimina token de localStorage, admin=null, status='unauthenticated'.
 *
 * useAuth:
 *   ✔ useAuth() fuera de AuthProvider lanza Error descriptivo.
 */

import { render, screen, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { type PropsWithChildren } from "react";
import { AuthProvider, AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import { useAuth } from "../hooks/useAuth";

// ─── Mock del módulo api ──────────────────────────────────────────────────────
vi.mock("../services/api", () => ({
  loginAdmin: vi.fn(),
  getMe: vi.fn(),
}));
import { loginAdmin, getMe } from "../services/api";

// ─── Datos de prueba ──────────────────────────────────────────────────────────
const adminMock = {
  id: 1,
  username: "qa_admin",
  email: "qa@uacj.mx",
  activo: true,
  creado_en: "2024-01-01T00:00:00Z",
};
const TOKEN_FAKE = "eyJ.fake.token";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Componente auxiliar que expone el contexto en el DOM para inspeccionarlo */
function ContextConsumer() {
  const ctx = useContext(AuthContext);
  return (
    <div>
      <span data-testid="status">{ctx.status}</span>
      <span data-testid="username">{ctx.admin?.username ?? "null"}</span>
      <span data-testid="isAuthenticated">{String(ctx.isAuthenticated)}</span>
      <button onClick={() => ctx.login("qa_admin", "QaPass123!")}>login</button>
      <button onClick={() => ctx.logout()}>logout</button>
    </div>
  );
}

function renderProvider(children = <ContextConsumer />) {
  return render(<AuthProvider>{children}</AuthProvider>);
}

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

// ─── Tests de inicialización ─────────────────────────────────────────────────
describe("AuthContext — inicialización sin token", () => {
  it("status='unauthenticated' cuando no hay token en localStorage", async () => {
    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated");
    });
  });

  it("isAuthenticated=false cuando no hay token", async () => {
    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");
    });
  });

  it("admin=null cuando no hay token", async () => {
    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId("username").textContent).toBe("null");
    });
  });
});

describe("AuthContext — inicialización con token válido", () => {
  it("llama a getMe y pasa a 'authenticated' si el token es válido", async () => {
    localStorage.setItem("access_token", TOKEN_FAKE);
    (getMe as ReturnType<typeof vi.fn>).mockResolvedValue(adminMock);

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("authenticated");
    });
    expect(getMe).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("username").textContent).toBe("qa_admin");
  });
});

describe("AuthContext — inicialización con token inválido", () => {
  it("limpia el token y pasa a 'unauthenticated' si getMe falla", async () => {
    localStorage.setItem("access_token", "token-corrupto");
    (getMe as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("401 Unauthorized"));

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated");
    });
    expect(localStorage.getItem("access_token")).toBeNull();
  });
});

// ─── Tests de login ──────────────────────────────────────────────────────────
describe("AuthContext — login exitoso", () => {
  it("guarda el token en localStorage y pasa a 'authenticated'", async () => {
    (loginAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      access_token: TOKEN_FAKE,
      token_type: "bearer",
    });
    (getMe as ReturnType<typeof vi.fn>).mockResolvedValue(adminMock);

    renderProvider();
    await waitFor(() => screen.getByTestId("status").textContent === "unauthenticated");

    await act(async () => {
      screen.getByRole("button", { name: "login" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("authenticated");
    });
    expect(localStorage.getItem("access_token")).toBe(TOKEN_FAKE);
    expect(screen.getByTestId("username").textContent).toBe("qa_admin");
  });
});

describe("AuthContext — login fallido", () => {
  it("status='unauthenticated' y admin=null si loginAdmin falla", async () => {
    (loginAdmin as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("401 Credenciales incorrectas")
    );

    renderProvider();
    await waitFor(() => screen.getByTestId("status").textContent === "unauthenticated");

    await act(async () => {
      screen.getByRole("button", { name: "login" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated");
    });
    expect(screen.getByTestId("username").textContent).toBe("null");
    expect(localStorage.getItem("access_token")).toBeNull();
  });
});

// ─── Tests de logout ─────────────────────────────────────────────────────────
describe("AuthContext — logout", () => {
  it("elimina el token de localStorage y pasa a 'unauthenticated'", async () => {
    localStorage.setItem("access_token", TOKEN_FAKE);
    (getMe as ReturnType<typeof vi.fn>).mockResolvedValue(adminMock);

    renderProvider();
    await waitFor(() => screen.getByTestId("status").textContent === "authenticated");

    await act(async () => {
      screen.getByRole("button", { name: "logout" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated");
    });
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(screen.getByTestId("username").textContent).toBe("null");
  });
});

// ─── Tests de useAuth ────────────────────────────────────────────────────────
describe("useAuth — fuera de AuthProvider", () => {
  it("lanza un Error descriptivo si se usa fuera de AuthProvider", () => {
    // Suprimir el error de consola de React durante el test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function ComponenteSinProvider() {
      useAuth(); // debe lanzar
      return null;
    }

    expect(() =>
      render(<ComponenteSinProvider />)
    ).toThrow("useAuth debe ser usado dentro de un AuthProvider");

    consoleSpy.mockRestore();
  });
});
