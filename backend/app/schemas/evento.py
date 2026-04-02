from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict


TipoEvento = Literal["academico", "deportivo", "cultural", "administrativo", "otro"]


class EventoBase(BaseModel):
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
    pass


class EventoUpdate(BaseModel):
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
    model_config = ConfigDict(from_attributes=True)

    id: int
    creado_en: datetime
