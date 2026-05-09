from sqlalchemy import Column, Integer, String, Numeric, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class Edificio(Base):
    """
    Estructura física principal que contiene pisos y espacios.

    Attributes:
        id: Identificador único.
        codigo: Abreviatura o código identificador único del edificio.
        nombre: Nombre completo del edificio.
        descripcion: Detalles adicionales sobre el inmueble.
        latitud: Coordenada geográfica de latitud.
        longitud: Coordenada geográfica de longitud.
        foto_url: Enlace a la imagen principal en el storage.
        pisos: Relación con los niveles que componen el edificio.
    """
    __tablename__ = "edificios"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, nullable=False)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=True)
    latitud = Column(Numeric(10, 7), nullable=True)
    longitud = Column(Numeric(10, 7), nullable=True)
    foto_url = Column(String(500), nullable=True)
    activo = Column(Boolean, default=True, nullable=False)

    pisos = relationship("Piso", back_populates="edificio", cascade="all, delete-orphan")
