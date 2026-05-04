"""
test_eventos.py — Tests de integración para /api/v1/eventos

Qué se valida:
  ✔ GET /eventos devuelve eventos activos cuya fecha_fin no ha pasado.
  ✔ GET /eventos?tipo= filtra por tipo correctamente.
  ✔ POST /eventos crea un evento (requiere JWT).
  ✔ POST /eventos sin token → 401/403.
  ✔ PATCH /eventos/{id} actualiza campos del evento.
  ✔ PATCH /eventos/{id} inexistente → 404.
  ✔ DELETE /eventos/{id} elimina el evento permanentemente.
  ✔ DELETE /eventos/{id} inexistente → 404.
  ✔ Eventos con fecha_fin pasada NO aparecen en el listado público.
  ✔ GET /espacios/{id}/eventos retorna los eventos de un espacio.
"""

import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient
from app.models.evento import Evento

pytestmark = pytest.mark.asyncio

# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture()
def evento_activo(db_session) -> Evento:
    """Evento futuro visible en el listado público."""
    evento = Evento(
        titulo="Feria de Ciencias UACJ",
        descripcion="Exposición de proyectos estudiantiles.",
        fecha_inicio=datetime.now(timezone.utc) + timedelta(days=1),
        fecha_fin=datetime.now(timezone.utc) + timedelta(days=3),
        tipo="academico",
        activo=True,
    )
    db_session.add(evento)
    db_session.commit()
    db_session.refresh(evento)
    return evento


@pytest.fixture()
def evento_expirado(db_session) -> Evento:
    """Evento cuya fecha_fin ya pasó — no debe aparecer en el listado público."""
    evento = Evento(
        titulo="Evento del pasado",
        descripcion="Ya terminó.",
        fecha_inicio=datetime.now(timezone.utc) - timedelta(days=10),
        fecha_fin=datetime.now(timezone.utc) - timedelta(days=5),
        tipo="cultural",
        activo=True,
    )
    db_session.add(evento)
    db_session.commit()
    db_session.refresh(evento)
    return evento


# ─── Tests ────────────────────────────────────────────────────────────────────

class TestListarEventos:

    async def test_listar_devuelve_lista(self, client: AsyncClient, evento_activo):
        response = await client.get("/api/v1/eventos")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_listar_incluye_eventos_activos(
        self, client: AsyncClient, evento_activo
    ):
        response = await client.get("/api/v1/eventos")
        titulos = [e["titulo"] for e in response.json()]
        assert "Feria de Ciencias UACJ" in titulos

    async def test_listar_excluye_eventos_expirados(
        self, client: AsyncClient, evento_activo, evento_expirado
    ):
        """Eventos con fecha_fin en el pasado NO deben aparecer en el listado."""
        response = await client.get("/api/v1/eventos")
        titulos = [e["titulo"] for e in response.json()]
        assert "Evento del pasado" not in titulos

    async def test_filtrar_por_tipo(self, client: AsyncClient, evento_activo):
        """El parámetro tipo debe filtrar solo los eventos de ese tipo."""
        response = await client.get("/api/v1/eventos", params={"tipo": "academico"})
        assert response.status_code == 200
        for evento in response.json():
            assert evento["tipo"] == "academico"

    async def test_filtrar_tipo_inexistente_devuelve_lista_vacia(
        self, client: AsyncClient, evento_activo
    ):
        response = await client.get("/api/v1/eventos", params={"tipo": "tipo_falso"})
        assert response.status_code == 200
        assert response.json() == []


class TestCrearEvento:

    async def test_crear_evento_exitoso(self, client: AsyncClient, auth_headers):
        payload = {
            "titulo": "Torneo de Robótica",
            "descripcion": "Competencia anual de robots.",
            "fecha_inicio": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "tipo": "academico",
            "activo": True,
        }
        response = await client.post(
            "/api/v1/eventos", json=payload, headers=auth_headers
        )
        assert response.status_code == 201
        body = response.json()
        assert body["titulo"] == "Torneo de Robótica"
        assert "id" in body

    async def test_crear_evento_sin_token_retorna_403(self, client: AsyncClient):
        payload = {
            "titulo": "Hack",
            "fecha_inicio": datetime.now(timezone.utc).isoformat(),
            "tipo": "otro",
        }
        response = await client.post("/api/v1/eventos", json=payload)
        assert response.status_code in (401, 403)

    async def test_crear_evento_vinculado_a_espacio(
        self, client: AsyncClient, espacio_prueba, auth_headers
    ):
        """Un evento puede estar vinculado a un espacio específico."""
        payload = {
            "titulo": "Clase de Yoga en Lab",
            "fecha_inicio": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
            "tipo": "deportivo",
            "espacio_id": espacio_prueba.id,
            "activo": True,
        }
        response = await client.post(
            "/api/v1/eventos", json=payload, headers=auth_headers
        )
        assert response.status_code == 201
        assert response.json()["espacio_id"] == espacio_prueba.id


class TestActualizarEvento:

    async def test_actualizar_titulo(
        self, client: AsyncClient, evento_activo, auth_headers
    ):
        response = await client.patch(
            f"/api/v1/eventos/{evento_activo.id}",
            json={"titulo": "Feria de Ciencias — Edición Especial"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["titulo"] == "Feria de Ciencias — Edición Especial"

    async def test_actualizar_evento_inexistente_retorna_404(
        self, client: AsyncClient, auth_headers
    ):
        response = await client.patch(
            "/api/v1/eventos/999999",
            json={"titulo": "Ghost"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_actualizar_evento_sin_token_retorna_403(
        self, client: AsyncClient, evento_activo
    ):
        response = await client.patch(
            f"/api/v1/eventos/{evento_activo.id}",
            json={"titulo": "Hack"},
        )
        assert response.status_code in (401, 403)


class TestEliminarEvento:

    async def test_eliminar_evento_exitoso(
        self, client: AsyncClient, evento_activo, auth_headers
    ):
        """DELETE debe eliminar físicamente el evento de la BD."""
        response = await client.delete(
            f"/api/v1/eventos/{evento_activo.id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["titulo"] == "Feria de Ciencias UACJ"

        # Verificar que ya no aparece en el listado
        lista = await client.get("/api/v1/eventos")
        titulos = [e["titulo"] for e in lista.json()]
        assert "Feria de Ciencias UACJ" not in titulos

    async def test_eliminar_evento_inexistente_retorna_404(
        self, client: AsyncClient, auth_headers
    ):
        response = await client.delete(
            "/api/v1/eventos/999999", headers=auth_headers
        )
        assert response.status_code == 404

    async def test_eliminar_evento_sin_token_retorna_403(
        self, client: AsyncClient, evento_activo
    ):
        response = await client.delete(f"/api/v1/eventos/{evento_activo.id}")
        assert response.status_code in (401, 403)


class TestEventosDeEspacio:

    async def test_eventos_de_espacio_retorna_lista(
        self, client: AsyncClient, espacio_prueba
    ):
        """GET /espacios/{id}/eventos devuelve lista (puede ser vacía)."""
        response = await client.get(
            f"/api/v1/espacios/{espacio_prueba.id}/eventos"
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_eventos_de_espacio_incluye_eventos_vinculados(
        self, client: AsyncClient, db_session, espacio_prueba
    ):
        """Un evento asociado a un espacio aparece en su lista de eventos."""
        evento = Evento(
            titulo="Evento del Lab",
            fecha_inicio=datetime.now(timezone.utc) + timedelta(days=1),
            tipo="academico",
            espacio_id=espacio_prueba.id,
            activo=True,
        )
        db_session.add(evento)
        db_session.commit()

        response = await client.get(
            f"/api/v1/espacios/{espacio_prueba.id}/eventos"
        )
        titulos = [e["titulo"] for e in response.json()]
        assert "Evento del Lab" in titulos
