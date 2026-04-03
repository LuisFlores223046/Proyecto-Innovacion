from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, TIMESTAMP, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Evento(Base):
    __tablename__ = "eventos"
    __table_args__ = (
        CheckConstraint(
            "tipo IN ('academico', 'deportivo', 'cultural', 'administrativo', 'otro')",
            name="ck_evento_tipo",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    espacio_id = Column(Integer, ForeignKey("espacios.id"), nullable=True, index=True)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    fecha_inicio = Column(TIMESTAMP(timezone=True), nullable=False)
    fecha_fin = Column(TIMESTAMP(timezone=True), nullable=True)
    tipo = Column(String(20), default="otro", nullable=False)
    foto_url = Column(String(500), nullable=True)
    url_registro = Column(String(500), nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    creado_en = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    espacio = relationship("Espacio", back_populates="eventos")
