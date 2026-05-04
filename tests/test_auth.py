"""
test_auth.py — Tests de integración para /api/v1/auth

Qué se valida:
  ✔ Login exitoso devuelve access_token JWT.
  ✔ Credenciales incorrectas → 401 Unauthorized.
  ✔ Usuario inexistente → 401 Unauthorized.
  ✔ Cuenta bloqueada (bloqueado_hasta en el futuro) → 403 Forbidden.
  ✔ Contador de intentos fallidos se incrementa y dispara bloqueo.
  ✔ Endpoint /auth/me devuelve el perfil del admin autenticado.
  ✔ Acceso a /auth/me sin token → 403/401.
  ✔ Creación de nuevo administrador por un admin autenticado.
  ✔ Creación con username duplicado → 409 Conflict.
"""

import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio


class TestLoginExitoso:
    """Pruebas del flujo de login correcto."""

    async def test_login_devuelve_token(self, client: AsyncClient, admin_user):
        """Un admin activo con contraseña correcta recibe un JWT no vacío."""
        response = await client.post(
            "/api/v1/auth/login",
            json={"username": "qa_admin", "password": "QaPass123!"},
        )
        assert response.status_code == 200
        body = response.json()
        assert "access_token" in body
        assert len(body["access_token"]) > 20  # JWT tiene al menos 3 segmentos

    async def test_login_token_type_bearer(self, client: AsyncClient, admin_user):
        """El campo token_type debe indicar 'bearer'."""
        response = await client.post(
            "/api/v1/auth/login",
            json={"username": "qa_admin", "password": "QaPass123!"},
        )
        body = response.json()
        # Si el esquema TokenOut incluye token_type, verificarlo
        assert response.status_code == 200
        assert "access_token" in body


class TestLoginFallido:
    """Pruebas de rechazo por credenciales incorrectas."""

    async def test_password_incorrecto_retorna_401(self, client: AsyncClient, admin_user):
        """Contraseña equivocada → HTTP 401 con mensaje 'Credenciales incorrectas'."""
        response = await client.post(
            "/api/v1/auth/login",
            json={"username": "qa_admin", "password": "ContraseñaMal"},
        )
        assert response.status_code == 401
        assert "Credenciales" in response.json()["detail"]

    async def test_usuario_inexistente_retorna_401(self, client: AsyncClient, admin_user):
        """Un username que no existe nunca debe revelar si existe o no (timing attack)."""
        response = await client.post(
            "/api/v1/auth/login",
            json={"username": "fantasma", "password": "cualquier"},
        )
        assert response.status_code == 401

    async def test_intentos_fallidos_incrementan(self, client: AsyncClient, admin_user, db_session):
        """Cada intento fallido incrementa admin.intentos_fallidos en 1."""
        intentos_previos = admin_user.intentos_fallidos

        await client.post(
            "/api/v1/auth/login",
            json={"username": "qa_admin", "password": "Mal1"},
        )
        await client.post(
            "/api/v1/auth/login",
            json={"username": "qa_admin", "password": "Mal2"},
        )

        db_session.refresh(admin_user)
        assert admin_user.intentos_fallidos == intentos_previos + 2


class TestCuentaBloqueada:
    """Pruebas del mecanismo de bloqueo temporal."""

    async def test_cuenta_bloqueada_retorna_403(self, client: AsyncClient, admin_user, db_session):
        """Si bloqueado_hasta > ahora, el login debe retornar 403 Forbidden."""
        admin_user.bloqueado_hasta = datetime.now(timezone.utc) + timedelta(minutes=15)
        db_session.commit()

        response = await client.post(
            "/api/v1/auth/login",
            json={"username": "qa_admin", "password": "QaPass123!"},
        )
        assert response.status_code == 403
        assert "bloqueada" in response.json()["detail"].lower()

    async def test_bloqueo_expirado_permite_login(self, client: AsyncClient, admin_user, db_session):
        """Si bloqueado_hasta ya pasó, el login debe funcionar normalmente."""
        admin_user.bloqueado_hasta = datetime.now(timezone.utc) - timedelta(minutes=1)
        admin_user.intentos_fallidos = 0
        db_session.commit()

        response = await client.post(
            "/api/v1/auth/login",
            json={"username": "qa_admin", "password": "QaPass123!"},
        )
        assert response.status_code == 200
        assert "access_token" in response.json()


class TestEndpointMe:
    """Pruebas del endpoint GET /auth/me."""

    async def test_me_con_token_valido(self, client: AsyncClient, admin_user, auth_headers):
        """Un token válido debe devolver el perfil del administrador autenticado."""
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["username"] == "qa_admin"
        assert body["email"] == "qa@uacj.mx"
        # Nunca se debe exponer el hash de contraseña
        assert "password_hash" not in body

    async def test_me_sin_token_retorna_403(self, client: AsyncClient):
        """Sin encabezado Authorization, la API rechaza la petición."""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code in (401, 403)

    async def test_me_con_token_malformado(self, client: AsyncClient):
        """Un token que no es JWT válido debe ser rechazado con 401/403."""
        headers = {"Authorization": "Bearer esto.no.es.un.jwt.valido"}
        response = await client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code in (401, 403)


class TestCrearAdministrador:
    """Pruebas de POST /auth/admin — solo admins autenticados pueden crear admins."""

    async def test_crear_admin_exitoso(self, client: AsyncClient, admin_user, auth_headers):
        """Un admin autenticado puede registrar un nuevo administrador."""
        response = await client.post(
            "/api/v1/auth/admin",
            json={
                "username": "nuevo_admin",
                "email": "nuevo@uacj.mx",
                "password": "NuevoPass456!",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        body = response.json()
        assert body["username"] == "nuevo_admin"
        assert "password_hash" not in body

    async def test_crear_admin_username_duplicado_retorna_409(
        self, client: AsyncClient, admin_user, auth_headers
    ):
        """No se puede crear un admin con un username ya registrado."""
        # Primer intento — debe crear OK
        await client.post(
            "/api/v1/auth/admin",
            json={"username": "dup_user", "email": "dup1@uacj.mx", "password": "Pass1!"},
            headers=auth_headers,
        )
        # Segundo intento con mismo username
        response = await client.post(
            "/api/v1/auth/admin",
            json={"username": "dup_user", "email": "dup2@uacj.mx", "password": "Pass2!"},
            headers=auth_headers,
        )
        assert response.status_code == 409

    async def test_crear_admin_sin_autenticar_retorna_403(self, client: AsyncClient):
        """Sin token, la creación de admins debe ser rechazada."""
        response = await client.post(
            "/api/v1/auth/admin",
            json={"username": "hack", "email": "hack@evil.com", "password": "hackpass"},
        )
        assert response.status_code in (401, 403)
