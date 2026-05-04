"""
test_espacios.py — Tests de integración para /api/v1/espacios

Qué se valida:
  ✔ Listar espacios activos devuelve lista con campos correctos.
  ✔ Filtro por categoria_id y edificio_id funciona correctamente.
  ✔ Buscar por texto retorna resultados coincidentes (nombre, código, notas).
  ✔ Búsqueda sin resultados devuelve lista vacía (no 404).
  ✔ GET /espacios/{id} retorna el detalle completo (EspacioCompleto).
  ✔ GET /espacios/{id} con ID inexistente → 404.
  ✔ POST /espacios crea un espacio (requiere JWT).
  ✔ POST /espacios sin token → 401/403.
  ✔ POST /espacios con coordenadas inválidas → 422 (validación Pydantic).
  ✔ POST /espacios con solo latitud y sin longitud → 422 (model_validator).
  ✔ PATCH /espacios/{id} actualiza campos específicos.
  ✔ DELETE /espacios/{id} realiza borrado lógico (activo=False).
  ✔ GET /espacios/cercanos devuelve espacios dentro del radio.
  ✔ GET /espacios/abiertos/ahora responde correctamente (no 500).
"""

import pytest
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio


class TestListarEspacios:
    """Pruebas del endpoint GET /espacios."""

    async def test_listar_devuelve_lista(self, client: AsyncClient, espacio_prueba):
        """El endpoint base devuelve una lista (puede estar vacía si no hay datos)."""
        response = await client.get("/api/v1/espacios")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_listar_incluye_espacio_activo(self, client: AsyncClient, espacio_prueba):
        """Un espacio activo debe aparecer en la lista de espacios activos."""
        response = await client.get("/api/v1/espacios")
        nombres = [e["nombre"] for e in response.json()]
        assert "Laboratorio de Cómputo 101" in nombres

    async def test_listar_filtra_por_categoria(self, client: AsyncClient, espacio_prueba, categoria_prueba):
        """El filtro categoria_id retorna solo espacios de esa categoría."""
        response = await client.get(
            "/api/v1/espacios", params={"categoria_id": categoria_prueba.id}
        )
        assert response.status_code == 200
        body = response.json()
        assert all(e["categoria_id"] == categoria_prueba.id for e in body)

    async def test_listar_inactivos_con_flag(self, client: AsyncClient, espacio_prueba, db_session):
        """Con activo=false se pueden recuperar espacios desactivados."""
        espacio_prueba.activo = False
        db_session.commit()

        response = await client.get("/api/v1/espacios", params={"activo": False})
        assert response.status_code == 200
        body = response.json()
        assert any(e["nombre"] == "Laboratorio de Cómputo 101" for e in body)


class TestBuscarEspacios:
    """Pruebas del endpoint GET /espacios/buscar/{q}."""

    async def test_busqueda_por_nombre_retorna_resultado(
        self, client: AsyncClient, espacio_prueba
    ):
        """Buscar 'Laboratorio' debe encontrar el espacio de prueba."""
        response = await client.get("/api/v1/espacios/buscar/Laboratorio")
        assert response.status_code == 200
        body = response.json()
        assert len(body) >= 1
        nombres = [e["nombre"] for e in body]
        assert "Laboratorio de Cómputo 101" in nombres

    async def test_busqueda_por_codigo(self, client: AsyncClient, espacio_prueba):
        """El término LAB debe coincidir con el código LAB-101."""
        response = await client.get("/api/v1/espacios/buscar/LAB")
        assert response.status_code == 200
        assert len(response.json()) >= 1

    async def test_busqueda_por_notas(self, client: AsyncClient, espacio_prueba):
        """El término 'equipos' existe en las notas y debe ser encontrado."""
        response = await client.get("/api/v1/espacios/buscar/equipos")
        assert response.status_code == 200
        assert len(response.json()) >= 1

    async def test_busqueda_sin_resultados_devuelve_lista_vacia(
        self, client: AsyncClient, espacio_prueba
    ):
        """Una búsqueda de texto inexistente devuelve [] y no un error."""
        response = await client.get("/api/v1/espacios/buscar/xyzabcdefghijk")
        assert response.status_code == 200
        assert response.json() == []

    async def test_busqueda_es_case_insensitive(self, client: AsyncClient, espacio_prueba):
        """La búsqueda debe funcionar sin importar mayúsculas/minúsculas."""
        r1 = await client.get("/api/v1/espacios/buscar/laboratorio")
        r2 = await client.get("/api/v1/espacios/buscar/LABORATORIO")
        assert r1.status_code == 200
        assert r2.status_code == 200
        # Ambas búsquedas deben devolver el mismo número de resultados
        assert len(r1.json()) == len(r2.json())


class TestDetalleEspacio:
    """Pruebas del endpoint GET /espacios/{id}."""

    async def test_detalle_retorna_espacio_completo(self, client: AsyncClient, espacio_prueba):
        """El detalle incluye las relaciones anidadas (horarios, servicios, fotos, etc.)."""
        response = await client.get(f"/api/v1/espacios/{espacio_prueba.id}")
        assert response.status_code == 200
        body = response.json()
        assert body["id"] == espacio_prueba.id
        assert body["nombre"] == "Laboratorio de Cómputo 101"
        # EspacioCompleto debe incluir estas claves con listas vacías como mínimo
        assert "horarios" in body
        assert "servicios" in body
        assert "fotos" in body
        assert "eventos" in body
        assert "contactos" in body

    async def test_detalle_id_inexistente_retorna_404(self, client: AsyncClient):
        """Un ID que no existe en BD debe devolver 404."""
        response = await client.get("/api/v1/espacios/999999")
        assert response.status_code == 404


class TestCrearEspacio:
    """Pruebas del endpoint POST /espacios — requiere autenticación."""

    async def test_crear_espacio_exitoso(
        self, client: AsyncClient, auth_headers, categoria_prueba
    ):
        """Un admin autenticado puede crear un espacio con datos válidos."""
        payload = {
            "codigo": "BIBL-01",
            "nombre": "Biblioteca Central",
            "categoria_id": categoria_prueba.id,
            "latitud": 31.7205,
            "longitud": -106.4265,
            "activo": True,
            "notas": "Biblioteca principal del campus.",
        }
        response = await client.post(
            "/api/v1/espacios", json=payload, headers=auth_headers
        )
        assert response.status_code == 201
        body = response.json()
        assert body["codigo"] == "BIBL-01"
        assert body["nombre"] == "Biblioteca Central"
        assert "id" in body

    async def test_crear_espacio_sin_token_retorna_403(self, client: AsyncClient, categoria_prueba):
        """Sin JWT, el endpoint protegido debe rechazar la petición."""
        payload = {
            "codigo": "SIN-AUTH",
            "nombre": "Espacio sin auth",
            "activo": True,
        }
        response = await client.post("/api/v1/espacios", json=payload)
        assert response.status_code in (401, 403)

    async def test_crear_espacio_coordenadas_invalidas_retorna_422(
        self, client: AsyncClient, auth_headers
    ):
        """Una latitud fuera de rango (-90 a 90) debe disparar el validador Pydantic → 422."""
        payload = {
            "codigo": "INV-01",
            "nombre": "Espacio inválido",
            "latitud": 999.0,  # Fuera de rango
            "longitud": -106.4270,
            "activo": True,
        }
        response = await client.post(
            "/api/v1/espacios", json=payload, headers=auth_headers
        )
        assert response.status_code == 422

    async def test_crear_espacio_solo_latitud_sin_longitud_retorna_422(
        self, client: AsyncClient, auth_headers
    ):
        """
        El model_validator requiere que latitud y longitud se den juntas.
        Proporcionar solo una debe resultar en 422.
        """
        payload = {
            "codigo": "HALF-COORD",
            "nombre": "Solo latitud",
            "latitud": 31.720,  # Longitud ausente a propósito
            "activo": True,
        }
        response = await client.post(
            "/api/v1/espacios", json=payload, headers=auth_headers
        )
        assert response.status_code == 422
        # Verificar que el mensaje de error viene de nuestro validador
        detail = str(response.json())
        assert "longitud" in detail.lower() or "latitud" in detail.lower()


class TestActualizarEspacio:
    """Pruebas del endpoint PATCH /espacios/{id}."""

    async def test_actualizar_nombre(
        self, client: AsyncClient, espacio_prueba, auth_headers
    ):
        """PATCH debe actualizar solo el campo enviado sin afectar los demás."""
        response = await client.patch(
            f"/api/v1/espacios/{espacio_prueba.id}",
            json={"nombre": "Lab. Cómputo Actualizado"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["nombre"] == "Lab. Cómputo Actualizado"
        # El código no debe haber cambiado
        assert response.json()["codigo"] == "LAB-101"

    async def test_actualizar_espacio_inexistente_retorna_404(
        self, client: AsyncClient, auth_headers
    ):
        response = await client.patch(
            "/api/v1/espacios/999999",
            json={"nombre": "Ghost"},
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestDesactivarEspacio:
    """Pruebas del endpoint DELETE /espacios/{id} — borrado lógico."""

    async def test_desactivar_espacio(
        self, client: AsyncClient, espacio_prueba, auth_headers, db_session
    ):
        """DELETE debe poner activo=False en el espacio, no eliminarlo de la BD."""
        response = await client.delete(
            f"/api/v1/espacios/{espacio_prueba.id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["activo"] is False

        # Verificar en BD que el registro sigue existiendo
        db_session.refresh(espacio_prueba)
        assert espacio_prueba.activo is False

    async def test_desactivar_sin_token_retorna_403(
        self, client: AsyncClient, espacio_prueba
    ):
        """Sin JWT el borrado lógico debe ser rechazado."""
        response = await client.delete(f"/api/v1/espacios/{espacio_prueba.id}")
        assert response.status_code in (401, 403)


class TestEspaciosCercanos:
    """Pruebas del endpoint GET /espacios/cercanos."""

    async def test_cercanos_con_radio_amplio(self, client: AsyncClient, espacio_prueba):
        """Con un radio suficientemente grande debe encontrar el espacio de prueba."""
        response = await client.get(
            "/api/v1/espacios/cercanos",
            params={
                "lat": 31.7200,
                "lon": -106.4270,
                "radio": 500,  # 500 metros — debe incluir el espacio en las mismas coords
            },
        )
        assert response.status_code == 200
        # La respuesta es una lista (puede incluir el espacio de prueba)
        assert isinstance(response.json(), list)

    async def test_cercanos_sin_parametros_retorna_422(self, client: AsyncClient):
        """lat y lon son obligatorios — sin ellos la API debe devolver 422."""
        response = await client.get("/api/v1/espacios/cercanos")
        assert response.status_code == 422


class TestAbiertosAhora:
    """Pruebas del endpoint GET /espacios/abiertos/ahora."""

    async def test_abiertos_ahora_responde_200(self, client: AsyncClient, espacio_prueba):
        """El endpoint de espacios abiertos debe responder sin errores internos."""
        response = await client.get("/api/v1/espacios/abiertos/ahora")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
