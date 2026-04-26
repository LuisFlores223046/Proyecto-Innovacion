"""Rutas para edificios y pisos."""
import re
import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.auth.dependencies import get_current_admin
from app.models.edificio import Edificio
from app.models.espacio import Espacio
from app.models.piso import Piso
from app.models.administrador import Administrador
from app.schemas.edificio import EdificioCreate, EdificioOut, EdificioUpdate, EdificioConPisos
from app.schemas.piso import PisoCreate, PisoOut

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

router = APIRouter(tags=["Edificios"])


# ── Edificios ─────────────────────────────────────────────────────────────────

@router.get("/edificios", response_model=list[EdificioOut])
def listar_edificios(db: Session = Depends(get_db)):
    """
    Devuelve la información de todos los edificios.
    """
    return db.query(Edificio).order_by(Edificio.nombre).all()


@router.get("/edificios/completo", response_model=list[EdificioConPisos])
def listar_edificios_con_pisos(db: Session = Depends(get_db)):
    """
    Devuelve todos los edificios que cuenten con pisos.
    """
    edificios = db.query(Edificio).order_by(Edificio.nombre).all()
    for edificio in edificios:
        edificio.pisos = db.query(Piso).filter(
            Piso.edificio_id == edificio.id
        ).order_by(Piso.numero).all()
    return edificios


@router.post("/edificios", response_model=EdificioOut, status_code=status.HTTP_201_CREATED)
def crear_edificio(
    datos: EdificioCreate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """
    Crea un nuevo edificio dentro del mapa. Acción reservada para un administrador.
    """
    if db.query(Edificio).filter(Edificio.codigo == datos.codigo).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El código de edificio ya existe")
    edificio = Edificio(**datos.model_dump())
    db.add(edificio)
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
    Elimina un edificio de la base de datos e imágenes. Acción reservada para un admministrador.
    """
    edificio = db.query(Edificio).filter(Edificio.id == edificio_id).first()
    if not edificio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Edificio no encontrado")

    # Eliminar foto de Cloudinary si existe
    if edificio.foto_url:
        try:
            slug = re.sub(r"[^A-Za-z0-9\-]", "_", edificio.codigo)
            cloudinary.uploader.destroy(f"mapacu/edificios/{slug}_foto")
        except Exception:
            pass

    # Eliminar espacios de cada piso (cascade se encarga de horarios, fotos, etc.)
    pisos = db.query(Piso).filter(Piso.edificio_id == edificio_id).all()
    for piso in pisos:
        db.query(Espacio).filter(Espacio.piso_id == piso.id).delete()
    db.query(Piso).filter(Piso.edificio_id == edificio_id).delete()

    db.delete(edificio)
    db.commit()
    return edificio


@router.post("/edificios/{edificio_id}/foto", response_model=EdificioOut)
def subir_foto_edificio(
    edificio_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """
    Permite subir una foto de un edificio. Acción reservada para un admministrador.
    """
    edificio = db.query(Edificio).filter(Edificio.id == edificio_id).first()
    if not edificio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Edificio no encontrado")

    slug = re.sub(r"[^A-Za-z0-9\-]", "_", edificio.codigo)
    try:
        resultado = cloudinary.uploader.upload(
            file.file,
            public_id=f"mapacu/edificios/{slug}_foto",
            overwrite=True,
            resource_type="image",
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Error al subir imagen: {exc}")

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
    """
    Elimina la foto de un edificio que ya no se requiere o está desactualizada. Acción reservada para un administrador.
    """
    edificio = db.query(Edificio).filter(Edificio.id == edificio_id).first()
    if not edificio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Edificio no encontrado")
    if not edificio.foto_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El edificio no tiene foto")

    slug = re.sub(r"[^A-Za-z0-9\-]", "_", edificio.codigo)
    try:
        cloudinary.uploader.destroy(f"mapacu/edificios/{slug}_foto")
    except Exception:
        pass

    edificio.foto_url = None
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
    Actualiza la información de un edificio. Acción reservada para un administrador.
    """
    edificio = db.query(Edificio).filter(Edificio.id == edificio_id).first()
    if not edificio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Edificio no encontrado")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(edificio, campo, valor)
    db.commit()
    db.refresh(edificio)
    return edificio


# ── Pisos ─────────────────────────────────────────────────────────────────────

@router.get("/edificios/{edificio_id}/pisos", response_model=list[PisoOut])
def listar_pisos(edificio_id: int, db: Session = Depends(get_db)):
    """
    Devuelve todos los pisos de un edificio en particular.
    """
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
    """
    Crea un nuevo piso dentro de un edificio. Acción reservada para un administrador.
    """
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
