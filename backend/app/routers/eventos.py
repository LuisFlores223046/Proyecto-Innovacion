"""Rutas para eventos."""
import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_admin
from app.models.administrador import Administrador
from app.models.evento import Evento
from app.schemas.evento import EventoCreate, EventoOut, EventoUpdate
from app.services.eventos import listar_eventos, crear_evento, actualizar_evento, eliminar_evento
from app.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)

router = APIRouter(prefix="/eventos", tags=["Eventos"])


@router.get("", response_model=list[EventoOut])
def listar(tipo: str | None = None, db: Session = Depends(get_db)):
    return listar_eventos(db, tipo=tipo)


@router.post("", response_model=EventoOut, status_code=status.HTTP_201_CREATED)
def crear(
    datos: EventoCreate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    return crear_evento(db, datos)


@router.patch("/{evento_id}", response_model=EventoOut)
def actualizar(
    evento_id: int,
    datos: EventoUpdate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    return actualizar_evento(db, evento_id, datos)


@router.delete("/{evento_id}", response_model=EventoOut)
def borrar(
    evento_id: int,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    return eliminar_evento(db, evento_id)


@router.post("/{evento_id}/foto", response_model=EventoOut)
def subir_foto_evento(
    evento_id: int,
    foto: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    evento = db.query(Evento).filter(Evento.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado")

    public_id = f"mapacu/eventos/{evento_id}_foto"
    resultado = cloudinary.uploader.upload(
        foto.file,
        public_id=public_id,
        overwrite=True,
        resource_type="image",
    )

    evento.foto_url = resultado["secure_url"]
    db.commit()
    db.refresh(evento)
    return evento


@router.delete("/{evento_id}/foto", response_model=EventoOut)
def eliminar_foto_evento(
    evento_id: int,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    evento = db.query(Evento).filter(Evento.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado")
    if not evento.foto_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El evento no tiene foto")

    public_id = f"mapacu/eventos/{evento_id}_foto"
    cloudinary.uploader.destroy(public_id, resource_type="image")

    evento.foto_url = None
    db.commit()
    db.refresh(evento)
    return evento
