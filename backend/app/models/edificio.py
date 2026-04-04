from sqlalchemy import Column, Integer, String, Numeric, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Edificio(Base):
    __tablename__ = "edificios"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, nullable=False)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=True)
    latitud = Column(Numeric(10, 7), nullable=True)
    longitud = Column(Numeric(10, 7), nullable=True)
    foto_url = Column(String(500), nullable=True)

    pisos = relationship("Piso", back_populates="edificio", cascade="all, delete-orphan")
