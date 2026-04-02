from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator
from app.schemas.categoria import CategoriaOut
from app.schemas.horario import HorarioOut
from app.schemas.contacto import ContactoOut
from app.schemas.servicio_espacio import ServicioOut
from app.schemas.foto_espacio import FotoOut
from app.schemas.evento import EventoOut


class EspacioBase(BaseModel):
    codigo: str
    nombre: str
    categoria_id: int | None = None
    piso_id: int | None = None
    latitud: float | None = None
    longitud: float | None = None
    activo: bool = True
    notas: str | None = None


class EspacioCreate(EspacioBase):
    pass


class EspacioUpdate(BaseModel):
    codigo: str | None = None
    nombre: str | None = None
    categoria_id: int | None = None
    piso_id: int | None = None
    latitud: float | None = None
    longitud: float | None = None
    activo: bool | None = None
    notas: str | None = None


class EspacioOut(EspacioBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    creado_en: datetime
    actualizado_en: datetime
    # Categoria anidada para que Leaflet pinte marcadores sin segunda petición
    categoria: CategoriaOut | None = None

    @field_validator("latitud", "longitud", mode="before")
    @classmethod
    def coerce_decimal(cls, v):
        if v is None:
            return None
        return float(v)


class EspacioCompleto(EspacioOut):
    """Detalle completo con todas las relaciones anidadas."""

    horarios: list[HorarioOut] = []
    contactos: list[ContactoOut] = []
    servicios: list[ServicioOut] = []
    fotos: list[FotoOut] = []
    eventos: list[EventoOut] = []
