"""
test_horarios_contactos_servicios.py — Tests de integración para
/api/v1/horarios, /api/v1/contactos y /api/v1/servicios

Estos routers son de soporte (datos anidados en EspacioCompleto).
Se agrupan en un solo archivo por ser CRUD simples sin lógica de negocio compleja.

Qué se valida — Horarios:
  ✔ POST /horarios crea una franja horaria vinculada a un espacio.
  ✔ POST /horarios sin token → 401/403.
  ✔ PATCH /horarios/{id} actualiza los datos del horario.
  ✔ PATCH /horarios/{id} inexistente → 404.
  ✔ DELETE /horarios/{id} elimina el horario.
  ✔ DELETE /horarios/{id} inexistente → 404.

Qué se valida — Contactos:
  ✔ POST /contactos crea un contacto para un espacio.
  ✔ POST /contactos sin token → 401/403.
  ✔ DELETE /contactos/{id} elimina el contacto.
  ✔ DELETE /contactos/{id} inexistente → 404.

Qué se valida — Servicios:
  ✔ POST /servicios vincula un servicio a un espacio.
  ✔ POST /servicios sin token → 401/403.
  ✔ DELETE /servicios/{id} desvincula el servicio.
  ✔ DELETE /servicios/{id} inexistente → 404.
"""

import pytest
from httpx import AsyncClient
from app.models.horario import Horario
from app.models.contacto import Contacto
from app.models.servicio_espacio import ServicioEspacio

pytestmark = pytest.mark.asyncio


# ═══════════════════════════════════════════════════════════════════
# HORARIOS
# ═══════════════════════════════════════════════════════════════════

class TestCrearHorario:

    async def test_crear_horario_exitoso(
        self, client: AsyncClient, espacio_prueba, auth_headers
    ):
        """Un admin puede crear una franja horaria para un espacio."""
        payload = {
            "espacio_id": espacio_prueba.id,
            "dia_semana": 0,      # 0 = lunes
            "hora_apertura": "08:00:00",
            "hora_cierre": "20:00:00",
        }
        response = await client.post(
            "/api/v1/horarios", json=payload, headers=auth_headers
        )
        assert response.status_code == 201
        body = response.json()
        assert body["dia_semana"] == 0
        assert body["espacio_id"] == espacio_prueba.id
        assert "id" in body

    async def test_crear_horario_sin_token_retorna_403(
        self, client: AsyncClient, espacio_prueba
    ):
        response = await client.post(
            "/api/v1/horarios",
            json={
                "espacio_id": espacio_prueba.id,
                "dia_semana": 1,
                "hora_apertura": "09:00:00",
                "hora_cierre": "18:00:00",
            },
        )
        assert response.status_code in (401, 403)

    async def test_crear_horarios_multiples_dias(
        self, client: AsyncClient, espacio_prueba, auth_headers
    ):
        """Se pueden crear horarios distintos para cada día de la semana."""
        for dia in range(5):  # lunes a viernes
            resp = await client.post(
                "/api/v1/horarios",
                json={
                    "espacio_id": espacio_prueba.id,
                    "dia_semana": dia,
                    "hora_apertura": "07:00:00",
                    "hora_cierre": "21:00:00",
                },
                headers=auth_headers,
            )
            assert resp.status_code == 201


class TestActualizarHorario:

    @pytest.fixture()
    def horario(self, db_session, espacio_prueba) -> Horario:
        from datetime import time
        h = Horario(
            espacio_id=espacio_prueba.id,
            dia_semana=2,
            hora_apertura=time(8, 0),
            hora_cierre=time(18, 0),
        )
        db_session.add(h)
        db_session.commit()
        db_session.refresh(h)
        return h

    async def test_actualizar_hora_cierre(
        self, client: AsyncClient, horario, auth_headers
    ):
        response = await client.patch(
            f"/api/v1/horarios/{horario.id}",
            json={"hora_cierre": "22:00:00"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["hora_cierre"] == "22:00:00"

    async def test_actualizar_horario_inexistente_retorna_404(
        self, client: AsyncClient, auth_headers
    ):
        response = await client.patch(
            "/api/v1/horarios/999999",
            json={"hora_cierre": "22:00:00"},
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestEliminarHorario:

    @pytest.fixture()
    def horario(self, db_session, espacio_prueba) -> Horario:
        from datetime import time
        h = Horario(
            espacio_id=espacio_prueba.id,
            dia_semana=4,
            hora_apertura=time(9, 0),
            hora_cierre=time(17, 0),
        )
        db_session.add(h)
        db_session.commit()
        db_session.refresh(h)
        return h

    async def test_eliminar_horario_exitoso(
        self, client: AsyncClient, horario, auth_headers
    ):
        response = await client.delete(
            f"/api/v1/horarios/{horario.id}", headers=auth_headers
        )
        assert response.status_code == 200

    async def test_eliminar_horario_inexistente_retorna_404(
        self, client: AsyncClient, auth_headers
    ):
        response = await client.delete(
            "/api/v1/horarios/999999", headers=auth_headers
        )
        assert response.status_code == 404


# ═══════════════════════════════════════════════════════════════════
# CONTACTOS
# ═══════════════════════════════════════════════════════════════════

class TestCrearContacto:

    async def test_crear_contacto_exitoso(
        self, client: AsyncClient, espacio_prueba, auth_headers
    ):
        """Se puede registrar un teléfono o red social para un espacio."""
        payload = {
            "espacio_id": espacio_prueba.id,
            "tipo": "telefono",
            "valor": "656-688-1800",
            "descripcion": "Recepción principal",
        }
        response = await client.post(
            "/api/v1/contactos", json=payload, headers=auth_headers
        )
        assert response.status_code == 201
        body = response.json()
        assert body["valor"] == "656-688-1800"
        assert body["espacio_id"] == espacio_prueba.id

    async def test_crear_contacto_sin_token_retorna_403(
        self, client: AsyncClient, espacio_prueba
    ):
        response = await client.post(
            "/api/v1/contactos",
            json={"espacio_id": espacio_prueba.id, "tipo": "email", "valor": "test@uacj.mx"},
        )
        assert response.status_code in (401, 403)


class TestEliminarContacto:

    @pytest.fixture()
    def contacto(self, db_session, espacio_prueba) -> Contacto:
        c = Contacto(
            espacio_id=espacio_prueba.id,
            tipo="web",
            valor="https://uacj.mx",
        )
        db_session.add(c)
        db_session.commit()
        db_session.refresh(c)
        return c

    async def test_eliminar_contacto_exitoso(
        self, client: AsyncClient, contacto, auth_headers
    ):
        response = await client.delete(
            f"/api/v1/contactos/{contacto.id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["valor"] == "https://uacj.mx"

    async def test_eliminar_contacto_inexistente_retorna_404(
        self, client: AsyncClient, auth_headers
    ):
        response = await client.delete(
            "/api/v1/contactos/999999", headers=auth_headers
        )
        assert response.status_code == 404

    async def test_eliminar_contacto_sin_token_retorna_403(
        self, client: AsyncClient, contacto
    ):
        response = await client.delete(f"/api/v1/contactos/{contacto.id}")
        assert response.status_code in (401, 403)


# ═══════════════════════════════════════════════════════════════════
# SERVICIOS
# ═══════════════════════════════════════════════════════════════════

class TestCrearServicio:

    async def test_crear_servicio_exitoso(
        self, client: AsyncClient, espacio_prueba, auth_headers
    ):
        """Se puede vincular un servicio (Wi-Fi, impresión, etc.) a un espacio."""
        payload = {
            "espacio_id": espacio_prueba.id,
            "nombre": "Wi-Fi",
            "icono": "📶",
        }
        response = await client.post(
            "/api/v1/servicios", json=payload, headers=auth_headers
        )
        assert response.status_code == 201
        body = response.json()
        assert body["nombre"] == "Wi-Fi"
        assert body["espacio_id"] == espacio_prueba.id

    async def test_crear_servicio_sin_token_retorna_403(
        self, client: AsyncClient, espacio_prueba
    ):
        response = await client.post(
            "/api/v1/servicios",
            json={"espacio_id": espacio_prueba.id, "nombre": "Hack"},
        )
        assert response.status_code in (401, 403)


class TestEliminarServicio:

    @pytest.fixture()
    def servicio(self, db_session, espacio_prueba) -> ServicioEspacio:
        s = ServicioEspacio(
            espacio_id=espacio_prueba.id,
            nombre="Impresión",
            icono="🖨️",
        )
        db_session.add(s)
        db_session.commit()
        db_session.refresh(s)
        return s

    async def test_eliminar_servicio_exitoso(
        self, client: AsyncClient, servicio, auth_headers
    ):
        response = await client.delete(
            f"/api/v1/servicios/{servicio.id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["nombre"] == "Impresión"

    async def test_eliminar_servicio_inexistente_retorna_404(
        self, client: AsyncClient, auth_headers
    ):
        response = await client.delete(
            "/api/v1/servicios/999999", headers=auth_headers
        )
        assert response.status_code == 404

    async def test_eliminar_servicio_sin_token_retorna_403(
        self, client: AsyncClient, servicio
    ):
        response = await client.delete(f"/api/v1/servicios/{servicio.id}")
        assert response.status_code in (401, 403)
