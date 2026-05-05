from pydantic import BaseModel, ConfigDict


class EdificioBase(BaseModel):
    """Información base de un edificio físico."""
    codigo: str
    nombre: str
    descripcion: str | None = None
    latitud: float | None = None
    longitud: float | None = None
    foto_url: str | None = None


class EdificioCreate(EdificioBase):
    """Esquema para creación de edificios."""
    pass


class EdificioUpdate(BaseModel):
    """Campos actualizables de un edificio."""
    codigo: str | None = None
    nombre: str | None = None
    descripcion: str | None = None
    latitud: float | None = None
    longitud: float | None = None
    foto_url: str | None = None


class EdificioOut(EdificioBase):
    """Esquema de salida para información de edificio."""
    model_config = ConfigDict(from_attributes=True)

    id: int


class PisoSimple(BaseModel):
    """Representación simplificada de un piso."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero: str


class EdificioConPisos(EdificioOut):
    """Edificio detallado con su lista de pisos asociados."""
    pisos: list[PisoSimple] = []
