"""
test_fotos.py — Tests de integración para /api/v1/fotos

Qué se valida:
  ✔ POST /fotos sube una foto y la vincula a un espacio (mock Cloudinary).
  ✔ POST /fotos sin token → 401/403.
  ✔ PATCH /fotos/{id} actualiza metadatos (descripcion, es_principal, orden).
  ✔ PATCH /fotos/{id} inexistente → 404.
  ✔ PATCH /fotos/{id} sin token → 401/403.
  ✔ DELETE /fotos/{id} elimina la foto y llama a Cloudinary.destroy (mock).
  ✔ DELETE /fotos/{id} inexistente → 404.
  ✔ DELETE /fotos/{id} sin token → 401/403.

Nota: POST /fotos usa multipart/form-data con un archivo binario.
      Cloudinary se mockea completamente para no requerir credenciales reales.
      El servicio de subida requiere que el espacio tenga piso + edificio
      asignados, por lo que se usa la fixture espacio_con_piso.
"""

import io
import pytest
from unittest.mock import patch
from httpx import AsyncClient
from app.models.foto_espacio import FotoEspacio
from app.models.edificio import Edificio
from app.models.piso import Piso
from app.models.espacio import Espacio

pytestmark = pytest.mark.asyncio

# ─── URL de Cloudinary simulada ───────────────────────────────────────────────
FAKE_CLOUDINARY_URL = "https://res.cloudinary.com/fake/image/upload/v1/mapacu/espacios/lab101_1.jpg"


# ─── Fixture: espacio con cadena completa edificio→piso→espacio ──────────────
@pytest.fixture()
def espacio_con_piso(db_session, categoria_prueba) -> Espacio:
    """
    El servicio de subida de fotos requiere que el espacio esté asignado
    a un piso que pertenezca a un edificio.  Esta fixture crea toda la cadena.
    """
    edificio = Edificio(
        codigo="FOTO-EDIF",
        nombre="Edificio Fotos",
        activo=True,
    )
    db_session.add(edificio)
    db_session.commit()
    db_session.refresh(edificio)

    piso = Piso(edificio_id=edificio.id, numero="PB")
    db_session.add(piso)
    db_session.commit()
    db_session.refresh(piso)

    espacio = Espacio(
        codigo="LAB-FOTO",
        nombre="Lab Fotos",
        categoria_id=categoria_prueba.id,
        piso_id=piso.id,
        latitud=31.72,
        longitud=-106.427,
        activo=True,
    )
    db_session.add(espacio)
    db_session.commit()
    db_session.refresh(espacio)
    return espacio


# ─── Fixture: foto existente en BD ───────────────────────────────────────────
@pytest.fixture()
def foto_existente(db_session, espacio_prueba) -> FotoEspacio:
    """
    Crea directamente un registro FotoEspacio en la BD de test.
    No requiere piso/edificio porque solo inserta la fila, sin usar el service.
    """
    foto = FotoEspacio(
        espacio_id=espacio_prueba.id,
        url=FAKE_CLOUDINARY_URL,
        descripcion="Vista frontal del laboratorio",
        es_principal=False,
        orden=1,
    )
    db_session.add(foto)
    db_session.commit()
    db_session.refresh(foto)
    return foto


# ─── Tests de subida ─────────────────────────────────────────────────────────
class TestSubirFoto:

    async def test_subir_foto_exitosa(
        self, client: AsyncClient, espacio_con_piso, auth_headers
    ):
        """
        POST /fotos con multipart/form-data debe subir la imagen a Cloudinary
        (mockeado) y registrar la URL resultante en la BD.
        El espacio debe tener piso + edificio asignados (requerido por el service).
        """
        fake_upload_result = {
            "secure_url": FAKE_CLOUDINARY_URL,
            "public_id": "mapacu/espacios/lab101_1",
        }

        with patch("app.services.fotos.cloudinary.uploader.upload") as mock_upload, \
             patch("app.services.fotos.cloudinary.api.create_folder"):
            mock_upload.return_value = fake_upload_result

            fake_image = io.BytesIO(b"fake-image-content")

            response = await client.post(
                "/api/v1/fotos",
                data={
                    "espacio_id": str(espacio_con_piso.id),
                    "descripcion": "Foto del laboratorio",
                    "es_principal": "false",
                    "orden": "1",
                },
                files={"file": ("foto_lab.jpg", fake_image, "image/jpeg")},
                headers=auth_headers,
            )

        assert response.status_code == 201
        body = response.json()
        assert body["url"] == FAKE_CLOUDINARY_URL
        assert body["espacio_id"] == espacio_con_piso.id
        mock_upload.assert_called_once()

    async def test_subir_foto_sin_token_retorna_403(
        self, client: AsyncClient, espacio_prueba
    ):
        """Sin JWT el endpoint de subida debe rechazar la petición."""
        fake_image = io.BytesIO(b"fake")
        response = await client.post(
            "/api/v1/fotos",
            data={"espacio_id": str(espacio_prueba.id)},
            files={"file": ("foto.jpg", fake_image, "image/jpeg")},
        )
        assert response.status_code in (401, 403)


# ─── Tests de actualización ──────────────────────────────────────────────────
class TestActualizarFoto:

    async def test_actualizar_descripcion_foto(
        self, client: AsyncClient, foto_existente, auth_headers
    ):
        """PATCH debe actualizar solo el campo enviado."""
        response = await client.patch(
            f"/api/v1/fotos/{foto_existente.id}",
            json={"descripcion": "Vista lateral del laboratorio"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["descripcion"] == "Vista lateral del laboratorio"

    async def test_marcar_foto_como_principal(
        self, client: AsyncClient, foto_existente, auth_headers
    ):
        """Se puede marcar una foto como principal con PATCH."""
        response = await client.patch(
            f"/api/v1/fotos/{foto_existente.id}",
            json={"es_principal": True},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["es_principal"] is True

    async def test_actualizar_foto_inexistente_retorna_404(
        self, client: AsyncClient, auth_headers
    ):
        response = await client.patch(
            "/api/v1/fotos/999999",
            json={"descripcion": "Ghost"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_actualizar_foto_sin_token_retorna_403(
        self, client: AsyncClient, foto_existente
    ):
        response = await client.patch(
            f"/api/v1/fotos/{foto_existente.id}",
            json={"descripcion": "Hack"},
        )
        assert response.status_code in (401, 403)


# ─── Tests de eliminación ────────────────────────────────────────────────────
class TestEliminarFoto:

    async def test_eliminar_foto_llama_cloudinary_destroy(
        self, client: AsyncClient, foto_existente, auth_headers
    ):
        """
        DELETE /fotos/{id} debe llamar a Cloudinary para eliminar el archivo
        y luego borrar el registro de la BD.
        """
        with patch("app.services.fotos.cloudinary.uploader.destroy") as mock_destroy:
            mock_destroy.return_value = {"result": "ok"}
            response = await client.delete(
                f"/api/v1/fotos/{foto_existente.id}",
                headers=auth_headers,
            )

        assert response.status_code == 200
        assert response.json()["id"] == foto_existente.id
        mock_destroy.assert_called_once()

    async def test_eliminar_foto_inexistente_retorna_404(
        self, client: AsyncClient, auth_headers
    ):
        response = await client.delete(
            "/api/v1/fotos/999999", headers=auth_headers
        )
        assert response.status_code == 404

    async def test_eliminar_foto_sin_token_retorna_403(
        self, client: AsyncClient, foto_existente
    ):
        response = await client.delete(f"/api/v1/fotos/{foto_existente.id}")
        assert response.status_code in (401, 403)
