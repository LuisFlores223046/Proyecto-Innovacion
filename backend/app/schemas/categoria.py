from pydantic import BaseModel, ConfigDict


class CategoriaBase(BaseModel):
    nombre: str
    icono: str
    color_hex: str


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaUpdate(BaseModel):
    nombre: str | None = None
    icono: str | None = None
    color_hex: str | None = None


class CategoriaOut(CategoriaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
