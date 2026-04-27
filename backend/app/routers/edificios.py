"""Rutas para edificios y pisos."""
import re
import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_admin
from app.models.edificio import Edificio
from app.models.piso import Piso
from app.models.espacio import Espacio
from app.models.administrador import Administrador
from app.schemas.edificio import EdificioCreate, EdificioOut, EdificioUpdate, EdificioConPisos
from app.schemas.piso import PisoCreate, PisoOut
from app.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)

router = APIRouter(tags=["Edificios"])


# ── Edificios ─────────────────────────────────────────────────────────────────

@router.get("/edificios/completo", response_model=list[EdificioConPisos])
def listar_edificios_con_pisos(db: Session = Depends(get_db)):
    """Obtiene información básica de todos los edificios registrados."""
    edificios = db.query(Edificio).order_by(Edificio.nombre).all()
    for edificio in edificios:
        edificio.pisos = (
            db.query(Piso)
            .filter(Piso.edificio_id == edificio.id)
            .order_by(Piso.numero)
            .all()
        )
    return edificios


@router.get("/edificios", response_model=list[EdificioOut])
def listar_edificios(db: Session = Depends(get_db)):
    """Obtiene edificios incluyendo sus pisos asociados en una sola respuesta."""
    return db.query(Edificio).order_by(Edificio.nombre).all()


@router.post("/edificios", response_model=EdificioOut, status_code=status.HTTP_201_CREATED)
def crear_edificio(
    datos: EdificioCreate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """Registra un nuevo edificio físico en el sistema."""
    if db.query(Edificio).filter(Edificio.codigo == datos.codigo).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El código de edificio ya existe")
    edificio = Edificio(**datos.model_dump())
    db.add(edificio)
    db.commit()
    db.refresh(edificio)
    return edificio


@router.patch("/edificios/{edificio_id}", response_model=EdificioOut)
def actualizar_edificio(
    edificio_id: int,
    datos: EdificioUpdate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """
    Elimina un edificio, sus pisos y sus espacios de forma recursiva.

    Args:
        edificio_id: ID del edificio.
        db: Sesión de BD.

    Returns:
        Edificio: Datos del edificio eliminado.
    """
    edificio = db.query(Edificio).filter(Edificio.id == edificio_id).first()
    if not edificio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Edificio no encontrado")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(edificio, campo, valor)
    db.commit()
    db.refresh(edificio)
    return edificio


@router.post("/edificios/{edificio_id}/foto", response_model=EdificioOut)
def subir_foto_edificio(
    edificio_id: int,
    foto: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """Sube y vincula una imagen de Cloudinary a un edificio específico."""
    edificio = db.query(Edificio).filter(Edificio.id == edificio_id).first()
    if not edificio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Edificio no encontrado")

    slug = re.sub(r"[^a-z0-9]+", "_", edificio.nombre.lower()).strip("_")
    public_id = f"mapacu/edificios/{slug}_foto"

    resultado = cloudinary.uploader.upload(
        foto.file,
        public_id=public_id,
        overwrite=True,
        resource_type="image",
    )

    edificio.foto_url = resultado["secure_url"]
    db.commit()
    db.refresh(edificio)
    return edificio


@router.delete("/edificios/{edificio_id}/foto", response_model=EdificioOut)
def eliminar_foto_edificio(
    edificio_id: int,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """Desvincula la foto del edificio y la borra de la nube."""
    edificio = db.query(Edificio).filter(Edificio.id == edificio_id).first()
    if not edificio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Edificio no encontrado")
    if not edificio.foto_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El edificio no tiene foto")

    slug = re.sub(r"[^a-z0-9]+", "_", edificio.nombre.lower()).strip("_")
    public_id = f"mapacu/edificios/{slug}_foto"
    cloudinary.uploader.destroy(public_id, resource_type="image")

    edificio.foto_url = None
    db.commit()
    db.refresh(edificio)
    return edificio


@router.delete("/edificios/{edificio_id}", response_model=EdificioOut)
def eliminar_edificio(
    edificio_id: int,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """
    Elimina un edificio de forma permanente, incluyendo sus recursos y dependencias.

    Realiza una limpieza integral que abarca la eliminación de la imagen en 
    Cloudinary, así como el borrado en cascada manual de todos los pisos y 
    espacios asociados para mantener la integridad de la base de datos.

    Args:
        edificio_id: Identificador único del edificio a eliminar.
        db: Sesión de la base de datos.
        _: Dependencia de seguridad que valida privilegios de administrador.

    Returns:
        Edificio: El objeto del edificio eliminado.

    Raises:
        HTTPException: 404 si el edificio no existe en la base de datos.
    """
    edificio = db.query(Edificio).filter(Edificio.id == edificio_id).first()
    if not edificio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Edificio no encontrado")

    # Eliminar foto de Cloudinary si existe
    if edificio.foto_url:
        slug = re.sub(r"[^a-z0-9]+", "_", edificio.nombre.lower()).strip("_")
        public_id = f"mapacu/edificios/{slug}_foto"
        cloudinary.uploader.destroy(public_id, resource_type="image")

    # Cascada manual: eliminar espacios de cada piso, luego pisos
    pisos = db.query(Piso).filter(Piso.edificio_id == edificio_id).all()
    for piso in pisos:
        db.query(Espacio).filter(Espacio.piso_id == piso.id).delete()
    db.query(Piso).filter(Piso.edificio_id == edificio_id).delete()

    db.delete(edificio)
    db.commit()
    return edificio


# ── Pisos ─────────────────────────────────────────────────────────────────────

@router.get("/edificios/{edificio_id}/pisos", response_model=list[PisoOut])
def listar_pisos(edificio_id: int, db: Session = Depends(get_db)):
    """Lista todos los pisos pertenecientes a un edificio dado."""
    edificio = db.query(Edificio).filter(Edificio.id == edificio_id).first()
    if not edificio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Edificio no encontrado")
    return db.query(Piso).filter(Piso.edificio_id == edificio_id).order_by(Piso.numero).all()


@router.post("/pisos", response_model=PisoOut, status_code=status.HTTP_201_CREATED)
def crear_piso(
    datos: PisoCreate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """Agrega un nuevo nivel o piso a un edificio existente."""
    existente = (
        db.query(Piso)
        .filter(Piso.edificio_id == datos.edificio_id, Piso.numero == datos.numero)
        .first()
    )
    if existente:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El piso ya existe en ese edificio")
    piso = Piso(**datos.model_dump())
    db.add(piso)
    db.commit()
    db.refresh(piso)
    return piso
