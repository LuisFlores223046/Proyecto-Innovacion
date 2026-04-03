from datetime import datetime
from pydantic import BaseModel, ConfigDict


class FotoBase(BaseModel):
    espacio_id: int
    descripcion: str | None = None
    es_principal: bool = False
    orden: int = 0


class FotoCreate(FotoBase):
    pass  # La URL la asigna el servicio tras subir a Cloudinary


class FotoUpdate(BaseModel):
    descripcion: str | None = None
    es_principal: bool | None = None
    orden: int | None = None


class FotoOut(FotoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    subida_en: datetime
