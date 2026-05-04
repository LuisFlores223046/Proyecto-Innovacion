"""
test_edificios.py — Tests de integración para /api/v1/edificios y /pisos

Qué se valida:
  ✔ GET /edificios devuelve lista de edificios.
  ✔ GET /edificios/completo incluye pisos anidados.
  ✔ POST /edificios crea un edificio (requiere JWT).
  ✔ POST /edificios código duplicado → 409 Conflict.
  ✔ POST /edificios sin token → 401/403.
  ✔ DELETE /edificios/{id} elimina el edificio (con mock Cloudinary).
  ✔ DELETE /edificios/{id} inexistente → 404.
  ✔ GET /edificios/{id}/pisos lista los pisos del edificio.
  ✔ GET /edificios/{id}/pisos con edificio inexistente → 404.
  ✔ POST /pisos crea un piso en un edificio existente.
  ✔ POST /pisos número duplicado en mismo edificio → 409.

Nota: los endpoints que llaman a Cloudinary (foto, delete con foto)
se parchean con unittest.mock para no necesitar credenciales reales.
"""

import pytest
from unittest.mock import patch, MagicMock
from httpx import AsyncClient
from app.models.edificio import Edificio
from app.models.piso import Piso

pytestmark = pytest.mark.asyncio


# ─── Fixture: edificio de prueba ──────────────────────────────────────────────
@pytest.fixture()
def edificio_prueba(db_session) -> Edificio:
    edificio = Edificio(
        codigo="ICSA",
        nombre="Instituto de Ciencias Sociales y Administración",
        latitud=31.7210,
        longitud=-106.4280,
        activo=True,
    )
    db_session.add(edificio)
    db_session.commit()
    db_session.refresh(edificio)
    return edificio


@pytest.fixture()
def piso_prueba(db_session, edificio_prueba) -> Piso:
    piso = Piso(
        edificio_id=edificio_prueba.id,
        numero=1,
        nombre="Planta Baja",
    )
    db_session.add(piso)
    db_session.commit()
    db_session.refresh(piso)
    return piso


# ─── Tests de Edificios ───────────────────────────────────────────────────────
class TestListarEdificios:

    async def test_listar_edificios_devuelve_lista(
        self, client: AsyncClient, edificio_prueba
    ):
        response = await client.get("/api/v1/edificios")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        codigos = [e["codigo"] for e in response.json()]
        assert "ICSA" in codigos

    async def test_listar_edificios_completo_incluye_pisos(
        self, client: AsyncClient, edificio_prueba, piso_prueba
    ):
        """GET /edificios/completo debe anidar la lista de pisos dentro de cada edificio."""
        response = await client.get("/api/v1/edificios/completo")
        assert response.status_code == 200
        edificio = next(
            (e for e in response.json() if e["codigo"] == "ICSA"), None
        )
        assert edificio is not None
        assert "pisos" in edificio
        assert isinstance(edificio["pisos"], list)


class TestCrearEdificio:

    async def test_crear_edificio_exitoso(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/edificios",
            json={
                "codigo": "IIT",
                "nombre": "Instituto de Ingeniería y Tecnología",
                "latitud": 31.7215,
                "longitud": -106.4285,
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        body = response.json()
        assert body["codigo"] == "IIT"
        assert "id" in body

    async def test_crear_edificio_codigo_duplicado_retorna_409(
        self, client: AsyncClient, edificio_prueba, auth_headers
    ):
        response = await client.post(
            "/api/v1/edificios",
            json={"codigo": "ICSA", "nombre": "Duplicado"},
            headers=auth_headers,
        )
        assert response.status_code == 409

    async def test_crear_edificio_sin_token_retorna_403(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/edificios",
            json={"codigo": "HACK", "nombre": "Sin auth"},
        )
        assert response.status_code in (401, 403)


class TestEliminarEdificio:

    async def test_eliminar_edificio_sin_foto(
        self, client: AsyncClient, edificio_prueba, auth_headers
    ):
        """
        DELETE /edificios/{id} debe eliminar el registro.
        Cloudinary no se llama si foto_url es None.
        """
        response = await client.delete(
            f"/api/v1/edificios/{edificio_prueba.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["codigo"] == "ICSA"

    async def test_eliminar_edificio_con_foto_llama_cloudinary(
        self, client: AsyncClient, db_session, auth_headers
    ):
        """
        Si el edificio tiene foto_url, Cloudinary.destroy debe ser llamado.
        Se usa mock para no necesitar credenciales reales.
        """
        edificio = Edificio(
            codigo="CON-FOTO",
            nombre="Edificio con foto",
            foto_url="https://res.cloudinary.com/demo/image/upload/sample.jpg",
            activo=True,
        )
        db_session.add(edificio)
        db_session.commit()

        with patch("cloudinary.uploader.destroy") as mock_destroy:
            mock_destroy.return_value = {"result": "ok"}
            response = await client.delete(
                f"/api/v1/edificios/{edificio.id}", headers=auth_headers
            )
        assert response.status_code == 200
        mock_destroy.assert_called_once()

    async def test_eliminar_edificio_inexistente_retorna_404(
        self, client: AsyncClient, auth_headers
    ):
        response = await client.delete(
            "/api/v1/edificios/999999", headers=auth_headers
        )
        assert response.status_code == 404

    async def test_eliminar_edificio_sin_token_retorna_403(
        self, client: AsyncClient, edificio_prueba
    ):
        response = await client.delete(f"/api/v1/edificios/{edificio_prueba.id}")
        assert response.status_code in (401, 403)


# ─── Tests de Pisos ───────────────────────────────────────────────────────────
class TestListarPisos:

    async def test_listar_pisos_de_edificio(
        self, client: AsyncClient, edificio_prueba, piso_prueba
    ):
        response = await client.get(
            f"/api/v1/edificios/{edificio_prueba.id}/pisos"
        )
        assert response.status_code == 200
        assert len(response.json()) >= 1
        assert response.json()[0]["numero"] == 1

    async def test_listar_pisos_edificio_inexistente_retorna_404(
        self, client: AsyncClient
    ):
        response = await client.get("/api/v1/edificios/999999/pisos")
        assert response.status_code == 404


class TestCrearPiso:

    async def test_crear_piso_exitoso(
        self, client: AsyncClient, edificio_prueba, auth_headers
    ):
        response = await client.post(
            "/api/v1/pisos",
            json={
                "edificio_id": edificio_prueba.id,
                "numero": 2,
                "nombre": "Segundo Piso",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert response.json()["numero"] == 2

    async def test_crear_piso_duplicado_retorna_409(
        self, client: AsyncClient, edificio_prueba, piso_prueba, auth_headers
    ):
        """El mismo número de piso en el mismo edificio → 409."""
        response = await client.post(
            "/api/v1/pisos",
            json={"edificio_id": edificio_prueba.id, "numero": 1, "nombre": "Dup"},
            headers=auth_headers,
        )
        assert response.status_code == 409

    async def test_crear_piso_sin_token_retorna_403(
        self, client: AsyncClient, edificio_prueba
    ):
        response = await client.post(
            "/api/v1/pisos",
            json={"edificio_id": edificio_prueba.id, "numero": 99, "nombre": "Hack"},
        )
        assert response.status_code in (401, 403)
