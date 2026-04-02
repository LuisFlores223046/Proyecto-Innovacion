from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class FotoEspacio(Base):
    __tablename__ = "fotos_espacio"

    id = Column(Integer, primary_key=True, index=True)
    espacio_id = Column(
        Integer,
        ForeignKey("espacios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    url = Column(String(500), nullable=False)
    descripcion = Column(String(200), nullable=True)
    es_principal = Column(Boolean, default=False, nullable=False)
    orden = Column(Integer, default=0, nullable=False)
    subida_en = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    espacio = relationship("Espacio", back_populates="fotos")
