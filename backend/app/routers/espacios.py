"""Rutas para espacios — orden cuidadoso de rutas estáticas antes de /{id}."""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_admin
from app.models.administrador import Administrador
from app.schemas.espacio import EspacioCreate, EspacioOut, EspacioUpdate, EspacioCompleto
from app.schemas.evento import EventoOut
from app.services import espacios as svc
from app.services import eventos as svc_ev

router = APIRouter(prefix="/espacios", tags=["Espacios"])


# ── Rutas estáticas PRIMERO (antes de /{id}) ─────────────────────────────────

@router.get("/buscar/{q}", response_model=list[EspacioOut])
def buscar(q: str, db: Session = Depends(get_db)):
    return svc.buscar_espacios(db, q)


@router.get("/abiertos/ahora", response_model=list[EspacioOut])
def abiertos_ahora(db: Session = Depends(get_db)):
    return svc.espacios_abiertos_ahora(db)


@router.get("/cercanos", response_model=list[EspacioOut])
def cercanos(
    lat: float = Query(..., description="Latitud WGS84"),
    lon: float = Query(..., description="Longitud WGS84"),
    radio: float = Query(200.0, description="Radio en metros"),
    db: Session = Depends(get_db),
):
    return svc.espacios_cercanos(db, lat, lon, radio)


# ── CRUD general ──────────────────────────────────────────────────────────────

@router.get("", response_model=list[EspacioOut])
def listar(
    categoria_id: int | None = None,
    edificio_id: int | None = None,
    activo: bool | None = True,
    db: Session = Depends(get_db),
):
    return svc.listar_espacios(db, categoria_id=categoria_id, edificio_id=edificio_id, activo=activo)


@router.post("", response_model=EspacioOut, status_code=status.HTTP_201_CREATED)
def crear(
    datos: EspacioCreate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    return svc.crear_espacio(db, datos)


@router.get("/{espacio_id}", response_model=EspacioCompleto)
def detalle(espacio_id: int, db: Session = Depends(get_db)):
    return svc.obtener_espacio(db, espacio_id)


@router.patch("/{espacio_id}", response_model=EspacioOut)
def actualizar(
    espacio_id: int,
    datos: EspacioUpdate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    return svc.actualizar_espacio(db, espacio_id, datos)


@router.delete("/{espacio_id}", response_model=EspacioOut)
def desactivar(
    espacio_id: int,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    return svc.desactivar_espacio(db, espacio_id)


@router.get("/{espacio_id}/eventos", response_model=list[EventoOut])
def eventos_espacio(espacio_id: int, db: Session = Depends(get_db)):
    return svc_ev.eventos_de_espacio(db, espacio_id)
