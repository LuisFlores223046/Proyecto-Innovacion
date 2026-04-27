from datetime import datetime
from pydantic import BaseModel, ConfigDict


class FotoBase(BaseModel):
    """Atributos base de un registro fotográfico."""
    espacio_id: int
    descripcion: str | None = None
    es_principal: bool = False
    orden: int = 0


class FotoCreate(FotoBase):
    """Esquema para el registro inicial de una foto."""
    pass  # La URL la asigna el servicio tras subir a Cloudinary


class FotoUpdate(BaseModel):
    """Campos actualizables de la foto."""
    descripcion: str | None = None
    es_principal: bool | None = None
    orden: int | None = None


class FotoOut(FotoBase):
    """Esquema de salida con URL de storage generada."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    subida_en: datetime
