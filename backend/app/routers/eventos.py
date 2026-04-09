"""Rutas para eventos"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_admin
from app.models.administrador import Administrador
from app.schemas.evento import EventoCreate, EventoOut, EventoUpdate
from app.services.eventos import listar_eventos, crear_evento, actualizar_evento, eliminar_evento

router = APIRouter(prefix="/eventos",tags=["Eventos"])

@router.get("",response_model=list[EventoOut])
def listar(tipo:str | None = None, db:Session = Depends(get_db)):
    return listar_eventos(db,tipo=tipo)

@router.post("",response_model=EventoOut,status_code=status.HTTP_201_CREATED)
def crear(
    datos: EventoCreate,
    db:Session = Depends(get_db),
    _:Administrador = Depends(get_current_admin),
):
    return crear_evento(db,datos)

@router.patch("/{evento_id}",response_model=EventoOut)
def actualizar(
    evento_id: int,
    datos: EventoUpdate,
    db: Session = Depends(get_db),
    _:Administrador= Depends(get_current_admin),
):
    return actualizar_evento(db,evento_id,datos)

@router.delete("/{evento_id}",status_code=status.HTTP_204_NO_CONTENT)
def borrar(
  evento_id: int,
  db: Session = Depends(get_db),
  _:Administrador = Depends(get_current_admin),  
):
    eliminar_evento(db,evento_id)