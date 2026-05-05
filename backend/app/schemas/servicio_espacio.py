from pydantic import BaseModel, ConfigDict


class ServicioBase(BaseModel):
    """Descripción base de una amenidad."""
    espacio_id: int
    descripcion: str


class ServicioCreate(ServicioBase):
    """Esquema para creación de servicios."""
    pass


class ServicioOut(ServicioBase):
    """Esquema de salida para servicios."""
    model_config = ConfigDict(from_attributes=True)

    id: int
