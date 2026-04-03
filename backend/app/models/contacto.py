from sqlalchemy import Column, Integer, String, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Contacto(Base):
    __tablename__ = "contactos"
    __table_args__ = (
        CheckConstraint(
            "tipo IN ('telefono', 'correo', 'extension')",
            name="ck_contacto_tipo",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    espacio_id = Column(
        Integer,
        ForeignKey("espacios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tipo = Column(String(20), nullable=False)   # telefono | correo | extension
    valor = Column(String(200), nullable=False)

    espacio = relationship("Espacio", back_populates="contactos")
