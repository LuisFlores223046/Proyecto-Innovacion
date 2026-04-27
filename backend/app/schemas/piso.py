from pydantic import BaseModel, ConfigDict


class PisoBase(BaseModel):
    """Referencia base de un nivel de edificio."""
    edificio_id: int
    numero: str  # PB, P1, P2, P3


class PisoCreate(PisoBase):
    """Esquema para creación de pisos."""
    pass


class PisoOut(PisoBase):
    """Esquema de salida para pisos."""
    model_config = ConfigDict(from_attributes=True)

    id: int
