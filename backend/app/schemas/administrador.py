from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr


class AdminCreate(BaseModel):
    """Atributos necesarios para registrar un administrador."""
    username: str
    email: EmailStr
    password: str


class AdminOut(BaseModel):
    """Representación pública de un administrador."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    activo: bool
    creado_en: datetime


class TokenOut(BaseModel):
    """Esquema de respuesta tras un login exitoso."""
    access_token: str
    token_type: str = "bearer"


class LoginIn(BaseModel):
    """Cuerpo de la petición para autenticación."""
    username: str
    password: str
