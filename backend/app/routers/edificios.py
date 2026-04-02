"""Rutas para edificios y pisos."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_admin
from app.models.edificio import Edificio
from app.models.piso import Piso
from app.models.administrador import Administrador
from app.schemas.edificio import EdificioCreate, EdificioOut, EdificioUpdate
from app.schemas.piso import PisoCreate, PisoOut

router = APIRouter(tags=["Edificios"])


# ── Edificios ─────────────────────────────────────────────────────────────────

@router.get("/edificios", response_model=list[EdificioOut])
def listar_edificios(db: Session = Depends(get_db)):
    return db.query(Edificio).order_by(Edificio.nombre).all()


@router.post("/edificios", response_model=EdificioOut, status_code=status.HTTP_201_CREATED)
def crear_edificio(
    datos: EdificioCreate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
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
