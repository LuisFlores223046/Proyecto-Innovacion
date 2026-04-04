from pydantic import BaseModel, ConfigDict


class EdificioBase(BaseModel):
    codigo: str
    nombre: str
    descripcion: str | None = None
    latitud: float | None = None
    longitud: float | None = None
    foto_url: str | None = None


class EdificioCreate(EdificioBase):
    pass


class EdificioUpdate(BaseModel):
    codigo: str | None = None
    nombre: str | None = None
    descripcion: str | None = None
    latitud: float | None = None
    longitud: float | None = None
    foto_url: str | None = None


class EdificioOut(EdificioBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
