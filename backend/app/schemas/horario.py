from datetime import time
from pydantic import BaseModel, ConfigDict, field_validator


class HorarioBase(BaseModel):
    espacio_id: int
    dia_semana: int   # 0=lunes … 6=domingo
    hora_apertura: time
    hora_cierre: time

    @field_validator("dia_semana")
    @classmethod
    def validar_dia(cls, v: int) -> int:
        if v < 0 or v > 6:
            raise ValueError("dia_semana debe estar entre 0 y 6")
        return v


class HorarioCreate(HorarioBase):
    pass


class HorarioUpdate(BaseModel):
    dia_semana: int | None = None
    hora_apertura: time | None = None
    hora_cierre: time | None = None


class HorarioOut(HorarioBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
