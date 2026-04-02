from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False)
    icono = Column(String(10), nullable=False)       # emoji
    color_hex = Column(String(7), nullable=False)    # #RRGGBB

    espacios = relationship("Espacio", back_populates="categoria")
