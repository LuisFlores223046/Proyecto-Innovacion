"""Rutas para servicios de espacios."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_admin
from app.models.servicio_espacio import ServicioEspacio
from app.models.administrador import Administrador
from app.schemas.servicio_espacio import ServicioCreate, ServicioOut

router = APIRouter(prefix="/servicios", tags=["Servicios"])


@router.post("", response_model=ServicioOut, status_code=status.HTTP_201_CREATED)
def crear(
    datos: ServicioCreate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    servicio = ServicioEspacio(**datos.model_dump())
    db.add(servicio)
    db.commit()
    db.refresh(servicio)
    return servicio


@router.delete("/{servicio_id}", response_model=ServicioOut)
def eliminar(
    servicio_id: int,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    servicio = db.query(ServicioEspacio).filter(ServicioEspacio.id == servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Servicio no encontrado")
    db.delete(servicio)
    db.commit()
    return servicio
