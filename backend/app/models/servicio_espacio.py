from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class ServicioEspacio(Base):
    __tablename__ = "servicios_espacio"
    __table_args__ = (
        UniqueConstraint("espacio_id", "descripcion", name="uq_servicio_espacio_desc"),
    )

    id = Column(Integer, primary_key=True, index=True)
    espacio_id = Column(
        Integer,
        ForeignKey("espacios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    descripcion = Column(String(200), nullable=False)

    espacio = relationship("Espacio", back_populates="servicios")
