"""Lógica de subida / eliminación de fotos en Cloudinary."""
import re
import cloudinary
import cloudinary.uploader
import cloudinary.api
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.config import settings
from app.models.espacio import Espacio
from app.models.piso import Piso
from app.models.edificio import Edificio
from app.models.foto_espacio import FotoEspacio
from app.schemas.foto_espacio import FotoCreate, FotoUpdate

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


def _slug(text: str) -> str:
    """Normaliza texto para uso en carpetas/public_id."""
    return re.sub(r"[^A-Za-z0-9\-]", "_", text.strip())


def _public_id(orden: int) -> str:
    """Genera un public_id legible para el archivo dentro de la carpeta del espacio."""
    return f"foto_{orden}"


def _folder_path(edificio_codigo: str, piso_numero: str, espacio_codigo: str, espacio_nombre: str) -> str:
    """Genera la ruta de carpeta en Cloudinary: mapacu/A/P1/A-101_Audiovisual"""
    edificio_slug = _slug(edificio_codigo)
    piso_slug = _slug(piso_numero)
    espacio_slug = _slug(f"{espacio_codigo}_{espacio_nombre}")
    return f"mapacu/{edificio_slug}/{piso_slug}/{espacio_slug}"


def subir_foto(db: Session, file: UploadFile, datos: FotoCreate) -> FotoEspacio:
    # Obtener espacio con edificio y piso
    espacio = (
        db.query(Espacio)
        .join(Piso, Espacio.piso_id == Piso.id)
        .join(Edificio, Piso.edificio_id == Edificio.id)
        .filter(Espacio.id == datos.espacio_id)
        .first()
    )
    if not espacio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Espacio no encontrado")

    # Verificar que el espacio tenga edificio
    if not espacio.piso or not espacio.piso.edificio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El espacio debe estar asignado a un edificio válido"
        )

    folder_path = _folder_path(
        espacio.piso.edificio.codigo,
        espacio.piso.numero,
        espacio.codigo,
        espacio.nombre,
    )
    public_id = _public_id(datos.orden)

    # Crear la carpeta del espacio explícitamente para que aparezca en Folders
    try:
        cloudinary.api.create_folder(folder_path)
    except Exception:
        pass

    try:
        resultado = cloudinary.uploader.upload(
            file.file,
            public_id=public_id,
            folder=folder_path,
            resource_type="image",
            overwrite=True,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error al subir imagen a Cloudinary: {exc}",
        )

    foto = FotoEspacio(
        espacio_id=datos.espacio_id,
        url=resultado["secure_url"],
        descripcion=datos.descripcion,
        es_principal=datos.es_principal,
        orden=datos.orden,
    )
    db.add(foto)
    db.commit()
    db.refresh(foto)
    return foto


def actualizar_foto(db: Session, foto_id: int, datos: FotoUpdate) -> FotoEspacio:
    foto = db.query(FotoEspacio).filter(FotoEspacio.id == foto_id).first()
    if not foto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foto no encontrada")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(foto, campo, valor)
    db.commit()
    db.refresh(foto)
    return foto


def eliminar_foto(db: Session, foto_id: int) -> None:
    foto = db.query(FotoEspacio).filter(FotoEspacio.id == foto_id).first()
    if not foto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foto no encontrada")

    # Extraer el public_id de la URL de Cloudinary
    try:
        partes = foto.url.split("/")
        if "mapacu" in partes:
            inicio = partes.index("mapacu")
            public_id = "/".join(partes[inicio:-1])
            public_id = public_id.split(".")[0]
            cloudinary.uploader.destroy(public_id)
    except Exception:
        pass  # Si falla la eliminación en Cloudinary, seguimos borrando de BD

    db.delete(foto)
    db.commit()
