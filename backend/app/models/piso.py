from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Piso(Base):
    __tablename__ = "pisos"
    __table_args__ = (UniqueConstraint("edificio_id", "numero", name="uq_piso_edificio_numero"),)

    id = Column(Integer, primary_key=True, index=True)
    edificio_id = Column(
        Integer,
        ForeignKey("edificios.id", ondelete="CASCADE"),
        nullable=False,
    )
    numero = Column(String(5), nullable=False)  # PB, P1, P2, P3

    edificio = relationship("Edificio", back_populates="pisos")
    espacios = relationship("Espacio", back_populates="piso")
