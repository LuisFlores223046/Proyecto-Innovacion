"""Lógica de negocio para eventos."""
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.evento import Evento
from app.schemas.evento import EventoCreate, EventoUpdate


def listar_eventos(db: Session, tipo: str | None = None) -> list[Evento]:
    ahora = datetime.now(timezone.utc)
    q = db.query(Evento).filter(
        Evento.activo == True,
        (Evento.fecha_fin == None) | (Evento.fecha_fin >= ahora),
    )
    if tipo:
        q = q.filter(Evento.tipo == tipo)
    return q.order_by(Evento.fecha_inicio).all()


def eventos_de_espacio(db: Session, espacio_id: int) -> list[Evento]:
    ahora = datetime.now(timezone.utc)
    return (
        db.query(Evento)
        .filter(
            Evento.espacio_id == espacio_id,
            Evento.activo == True,
            (Evento.fecha_fin == None) | (Evento.fecha_fin >= ahora),
        )
        .order_by(Evento.fecha_inicio)
        .all()
    )


def crear_evento(db: Session, datos: EventoCreate) -> Evento:
    evento = Evento(**datos.model_dump())
    db.add(evento)
    db.commit()
    db.refresh(evento)
    return evento


def actualizar_evento(db: Session, evento_id: int, datos: EventoUpdate) -> Evento:
    evento = db.query(Evento).filter(Evento.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(evento, campo, valor)
    db.commit()
    db.refresh(evento)
    return evento


def eliminar_evento(db: Session, evento_id: int) -> None:
    evento = db.query(Evento).filter(Evento.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado")
    db.delete(evento)
    db.commit()
