from datetime import time
from pydantic import BaseModel, ConfigDict, field_validator, model_validator


class HorarioBase(BaseModel):
    """Definición base de una franja horaria."""
    espacio_id: int
    dia_semana: int   # 0=lunes … 6=domingo
    hora_apertura: time
    hora_cierre: time

    @field_validator("dia_semana")
    @classmethod
    def validar_dia(cls, v: int) -> int:
        """Asegura que el día esté en el rango ISO (0-6)."""
        if v < 0 or v > 6:
            raise ValueError("dia_semana debe estar entre 0 y 6")
        return v

    @model_validator(mode="after")
    def validar_horario(self) -> "HorarioBase":
        """Valida que la apertura sea cronológicamente anterior al cierre."""
        if self.hora_apertura >= self.hora_cierre:
            raise ValueError("hora_apertura debe ser anterior a hora_cierre")
        return self


class HorarioCreate(HorarioBase):
    """Esquema para creación de horarios."""
    pass


class HorarioUpdate(BaseModel):
    """Campos modificables de un horario."""
    dia_semana: int | None = None
    hora_apertura: time | None = None
    hora_cierre: time | None = None


class HorarioOut(HorarioBase):
    """Esquema de salida para horarios."""
    model_config = ConfigDict(from_attributes=True)

    id: int
