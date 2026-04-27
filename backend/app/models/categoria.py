from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Categoria(Base):
    """
    Clasificación general para los espacios del mapa.

    Attributes:
        id: Identificador único.
        nombre: Nombre de la categoría (ej. 'Comida', 'Salones').
        icono: Representación visual mediante un emoji.
        color_hex: Código de color hexadecimal para la interfaz.
        espacios: Relación con los espacios pertenecientes a esta categoría.
    """
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False)
    icono = Column(String(10), nullable=False)       # emoji
    color_hex = Column(String(7), nullable=False)    # #RRGGBB

    espacios = relationship("Espacio", back_populates="categoria")
