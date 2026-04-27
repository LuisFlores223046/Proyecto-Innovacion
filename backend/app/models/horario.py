from sqlalchemy import Column, Integer, SmallInteger, Time, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Horario(Base):
    """
    Define los tiempos de operación de un espacio según el día de la semana.

    Attributes:
        id: Identificador único del horario.
        espacio_id: Identificador del espacio al que pertenece este horario.
        dia_semana: Representación numérica (0=lunes, 6=domingo).
        hora_apertura: Objeto Time que indica el inicio de actividades.
        hora_cierre: Objeto Time que indica el fin de actividades.
        espacio: Relación inversa hacia el objeto Espacio.
    """
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
