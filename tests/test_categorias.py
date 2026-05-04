"""
test_categorias.py — Tests de integración para /api/v1/categorias

Qué se valida:
  ✔ GET /categorias devuelve lista en orden alfabético.
  ✔ POST /categorias crea una categoría (requiere JWT).
  ✔ POST /categorias sin token → 401/403.
  ✔ POST /categorias con nombre duplicado → 409 Conflict.
  ✔ PATCH /categorias/{id} actualiza campos individuales.
  ✔ PATCH /categorias/{id} inexistente → 404.
  ✔ PATCH /categorias/{id} sin token → 401/403.
"""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


class TestListarCategorias:

    async def test_listar_devuelve_lista(self, client: AsyncClient):
        """El endpoint público devuelve una lista (vacía o con datos)."""
        response = await client.get("/api/v1/categorias")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_listar_orden_alfabetico(self, client: AsyncClient, auth_headers):
        """Las categorías deben venir ordenadas por nombre."""
        # Crear dos categorías fuera de orden
        await client.post(
            "/api/v1/categorias",
            json={"nombre": "Zebra", "icono": "🦓", "color": "#000000"},
            headers=auth_headers,
        )
        await client.post(
            "/api/v1/categorias",
            json={"nombre": "Alfa", "icono": "🅰️", "color": "#111111"},
            headers=auth_headers,
        )
        response = await client.get("/api/v1/categorias")
        nombres = [c["nombre"] for c in response.json()]
        assert nombres == sorted(nombres)


class TestCrearCategoria:

    async def test_crear_categoria_exitosa(self, client: AsyncClient, auth_headers):
        """Un admin puede crear una categoría con nombre, icono y color."""
        response = await client.post(
            "/api/v1/categorias",
            json={"nombre": "Cafetería", "icono": "☕", "color": "#8B4513"},
            headers=auth_headers,
        )
        assert response.status_code == 201
        body = response.json()
        assert body["nombre"] == "Cafetería"
        assert body["icono"] == "☕"
        assert "id" in body

    async def test_crear_categoria_sin_token_retorna_403(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/categorias",
            json={"nombre": "Sin Auth", "icono": "🚫", "color": "#FF0000"},
        )
        assert response.status_code in (401, 403)

    async def test_crear_categoria_duplicada_retorna_409(
        self, client: AsyncClient, auth_headers
    ):
        """El mismo nombre de categoría no puede existir dos veces."""
        payload = {"nombre": "DupCategoria", "icono": "📌", "color": "#AAAAAA"}
        await client.post("/api/v1/categorias", json=payload, headers=auth_headers)
        response = await client.post(
            "/api/v1/categorias", json=payload, headers=auth_headers
        )
        assert response.status_code == 409


class TestActualizarCategoria:

    async def test_actualizar_nombre_categoria(
        self, client: AsyncClient, categoria_prueba, auth_headers
    ):
        """PATCH debe actualizar solo el campo enviado."""
        response = await client.patch(
            f"/api/v1/categorias/{categoria_prueba.id}",
            json={"nombre": "Lab Actualizado"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["nombre"] == "Lab Actualizado"

    async def test_actualizar_categoria_inexistente_retorna_404(
        self, client: AsyncClient, auth_headers
    ):
        response = await client.patch(
            "/api/v1/categorias/999999",
            json={"nombre": "Ghost"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_actualizar_categoria_sin_token_retorna_403(
        self, client: AsyncClient, categoria_prueba
    ):
        response = await client.patch(
            f"/api/v1/categorias/{categoria_prueba.id}",
            json={"nombre": "Hack"},
        )
        assert response.status_code in (401, 403)
