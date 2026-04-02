from sqlalchemy import Column, Integer, SmallInteger, Time, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Horario(Base):
    __tablename__ = "horarios"
    __table_args__ = (
        CheckConstraint("dia_semana >= 0 AND dia_semana <= 6", name="ck_horario_dia_semana"),
    )

    id = Column(Integer, primary_key=True, index=True)
    espacio_id = Column(
        Integer,
        ForeignKey("espacios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    dia_semana = Column(SmallInteger, nullable=False)  # 0=lunes … 6=domingo
    hora_apertura = Column(Time, nullable=False)
    hora_cierre = Column(Time, nullable=False)

    espacio = relationship("Espacio", back_populates="horarios")
