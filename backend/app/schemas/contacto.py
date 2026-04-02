from typing import Literal
from pydantic import BaseModel, ConfigDict


class ContactoBase(BaseModel):
    espacio_id: int
    tipo: Literal["telefono", "correo", "extension"]
    valor: str


class ContactoCreate(ContactoBase):
    pass


class ContactoOut(ContactoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
