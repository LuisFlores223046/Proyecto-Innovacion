from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict


TipoEvento = Literal["academico", "deportivo", "cultural", "administrativo", "otro"]


class EventoBase(BaseModel):
    """Atributos base de un evento programado."""
    espacio_id: int | None = None
    titulo: str
    descripcion: str | None = None
    fecha_inicio: datetime
    fecha_fin: datetime | None = None
    tipo: TipoEvento = "otro"
    foto_url: str | None = None
    url_registro: str | None = None
    activo: bool = True


class EventoCreate(EventoBase):
    """Esquema para creación de eventos."""
    pass


class EventoUpdate(BaseModel):
    """Campos actualizables del evento."""
    espacio_id: int | None = None
    titulo: str | None = None
    descripcion: str | None = None
    fecha_inicio: datetime | None = None
    fecha_fin: datetime | None = None
    tipo: TipoEvento | None = None
    foto_url: str | None = None
    url_registro: str | None = None
    activo: bool | None = None


class EventoOut(EventoBase):
    """Esquema de salida para eventos."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    creado_en: datetime
