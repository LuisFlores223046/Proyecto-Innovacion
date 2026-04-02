from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr


class AdminCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class AdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    activo: bool
    creado_en: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginIn(BaseModel):
    username: str
    password: str
