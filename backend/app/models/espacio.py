from sqlalchemy import (
    Column, Integer, String, Numeric, Boolean, Text, ForeignKey, TIMESTAMP
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Espacio(Base):
    """
    Representa un punto de interés, oficina o lugar específico en el mapa.

    Attributes:
        id: Identificador único.
        codigo: Código único asignado al espacio.
        nombre: Nombre descriptivo del lugar.
        categoria_id: FK hacia la categoría del espacio.
        piso_id: FK hacia el piso donde se ubica el espacio.
        latitud: Coordenada de latitud específica.
        longitud: Coordenada de longitud específica.
        activo: Define si el espacio es visible para los usuarios.
        notas: Información interna o aclaraciones adicionales.
        creado_en: Timestamp de creación.
        actualizado_en: Timestamp de la última modificación.
    """
    __tablename__ = "espacios"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, nullable=False, index=True)
    nombre = Column(String(200), nullable=False, index=True)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=True)
    piso_id = Column(Integer, ForeignKey("pisos.id"), nullable=True)
    latitud = Column(Numeric(10, 7), nullable=True)
    longitud = Column(Numeric(10, 7), nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    notas = Column(Text, nullable=True)
    creado_en = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    actualizado_en = Column(TIMESTAMP(timezone=True), onupdate=func.now(), nullable=True)

    # Relaciones
    categoria = relationship("Categoria", back_populates="espacios")
    piso = relationship("Piso", back_populates="espacios")
    horarios = relationship("Horario", back_populates="espacio", cascade="all, delete-orphan")
    contactos = relationship("Contacto", back_populates="espacio", cascade="all, delete-orphan")
    servicios = relationship("ServicioEspacio", back_populates="espacio", cascade="all, delete-orphan")
    fotos = relationship("FotoEspacio", back_populates="espacio", cascade="all, delete-orphan")
    eventos = relationship("Evento", back_populates="espacio")
