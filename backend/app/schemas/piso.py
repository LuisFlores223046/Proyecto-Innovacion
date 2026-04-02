from pydantic import BaseModel, ConfigDict


class PisoBase(BaseModel):
    edificio_id: int
    numero: str  # PB, P1, P2, P3


class PisoCreate(PisoBase):
    pass


class PisoOut(PisoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
