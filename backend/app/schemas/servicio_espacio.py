from pydantic import BaseModel, ConfigDict


class ServicioBase(BaseModel):
    espacio_id: int
    descripcion: str


class ServicioCreate(ServicioBase):
    pass


class ServicioOut(ServicioBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
