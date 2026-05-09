from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from typing import Self
from app.schemas.categoria import CategoriaOut
from app.schemas.horario import HorarioOut
from app.schemas.contacto import ContactoOut
from app.schemas.servicio_espacio import ServicioOut
from app.schemas.foto_espacio import FotoOut
from app.schemas.evento import EventoOut


class EspacioBase(BaseModel):
    """Definición base de un espacio en el mapa."""
    codigo: str
    nombre: str
    categoria_id: int | None = None
    piso_id: int | None = None
    latitud: float | None = None
    longitud: float | None = None
    activo: bool = True
    notas: str | None = None


class EspacioCreate(EspacioBase):
    """Esquema para el registro de nuevos espacios."""

    @model_validator(mode="after")
    def validar_coordenadas(self) -> Self:
        lat, lon = self.latitud, self.longitud
        # Latitud y longitud deben proporcionarse juntas o dejarse ambas vacías
        if (lat is None) != (lon is None):
            raise ValueError(
                "Debes proporcionar latitud y longitud juntas, o dejar ambas vacías."
            )
        # Validar rangos geográficos si se proporcionaron
        if lat is not None and not (-90 <= lat <= 90):
            raise ValueError("La latitud debe estar entre -90 y 90.")
        if lon is not None and not (-180 <= lon <= 180):
            raise ValueError("La longitud debe estar entre -180 y 180.")
        return self


class EspacioUpdate(BaseModel):
    """Campos modificables de un espacio."""
    codigo: str | None = None
    nombre: str | None = None
    categoria_id: int | None = None
    piso_id: int | None = None
    latitud: float | None = None
    longitud: float | None = None
    activo: bool | None = None
    notas: str | None = None


class EspacioOut(EspacioBase):
    """Respuesta estándar para la visualización de espacios."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    creado_en: datetime
    actualizado_en: datetime | None = None
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
