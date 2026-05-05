"""Rutas para fotos de espacios (subida a Cloudinary)."""
from fastapi import APIRouter, Depends, Form, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_admin
from app.models.administrador import Administrador
from app.schemas.foto_espacio import FotoCreate, FotoOut, FotoUpdate
from app.services.fotos import subir_foto, actualizar_foto, eliminar_foto

router = APIRouter(prefix="/fotos", tags=["Fotos"])


@router.post("", response_model=FotoOut, status_code=status.HTTP_201_CREATED)
def crear(
    espacio_id: int = Form(...),
    descripcion: str | None = Form(None),
    es_principal: bool = Form(False),
    orden: int = Form(0),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """
    Sube una imagen al almacenamiento en la nube y la asocia a un espacio.

    Args:
        espacio_id: ID del espacio al que pertenece la foto.
        descripcion: Texto alternativo para la imagen.
        es_principal: Indica si es la foto de portada del espacio.
        orden: Prioridad de visualización en la galería.
        file: Binario de la imagen.
        db: Sesión de BD.
        _: Admin actual.
    """
    datos = FotoCreate(
        espacio_id=espacio_id,
        descripcion=descripcion,
        es_principal=es_principal,
        orden=orden,
    )
    return subir_foto(db, file, datos)


@router.patch("/{foto_id}", response_model=FotoOut)
def actualizar(
    foto_id: int,
    datos: FotoUpdate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """Modifica los metadatos de una foto ya existente."""
    return actualizar_foto(db, foto_id, datos)


@router.delete("/{foto_id}", response_model=FotoOut)
def borrar(
    foto_id: int,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """Borra el registro de la foto y el archivo en Cloudinary."""
    return eliminar_foto(db, foto_id)
