"""Rutas para horarios de espacios."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_admin
from app.models.horario import Horario
from app.models.administrador import Administrador
from app.schemas.horario import HorarioCreate, HorarioOut, HorarioUpdate

router = APIRouter(prefix="/horarios", tags=["Horarios"])


@router.post("", response_model=HorarioOut, status_code=status.HTTP_201_CREATED)
def crear(
    datos: HorarioCreate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """
    Permite crear un horario de un espacio.
    """
    horario = Horario(**datos.model_dump())
    db.add(horario)
    db.commit()
    db.refresh(horario)
    return horario


@router.patch("/{horario_id}", response_model=HorarioOut)
def actualizar(
    horario_id: int,
    datos: HorarioUpdate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """
    Permite actualizar un horario de un espacio o zona.
    """
    horario = db.query(Horario).filter(Horario.id == horario_id).first()
    if not horario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Horario no encontrado")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(horario, campo, valor)
    db.commit()
    db.refresh(horario)
    return horario


@router.delete("/{horario_id}", response_model=HorarioOut)
def eliminar(
    horario_id: int,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """
    Permite eliminar un horario de un espacio o zona.
    """
    horario = db.query(Horario).filter(Horario.id == horario_id).first()
    if not horario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Horario no encontrado")
    db.delete(horario)
    db.commit()
    return horario
