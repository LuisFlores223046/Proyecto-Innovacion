from pydantic import BaseModel, ConfigDict


class CategoriaBase(BaseModel):
    """Atributos base compartidos de una categoría."""
    nombre: str
    icono: str
    color_hex: str


class CategoriaCreate(CategoriaBase):
    """Esquema para creación de categorías."""
    pass


class CategoriaUpdate(BaseModel):
    """Atributos modificables de una categoría."""
    nombre: str | None = None
    icono: str | None = None
    color_hex: str | None = None


class CategoriaOut(CategoriaBase):
    """Esquema de salida para categorías."""
    model_config = ConfigDict(from_attributes=True)

    id: int
