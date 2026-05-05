from typing import Literal
from pydantic import BaseModel, ConfigDict


class ContactoBase(BaseModel):
    """Atributos base de la información de contacto."""
    espacio_id: int
    tipo: Literal["telefono", "correo", "extension"]
    valor: str


class ContactoCreate(ContactoBase):
    """Esquema para creación de contactos."""
    pass


class ContactoOut(ContactoBase):
    """Esquema de salida para contactos."""
    model_config = ConfigDict(from_attributes=True)

    id: int
