from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class FotoEspacio(Base):
    """
    Almacena referencias a imágenes asociadas a un espacio específico.

    Attributes:
        id: Identificador único.
        espacio_id: FK hacia el espacio propietario.
        url: Dirección del recurso en el storage (Cloudinary).
        descripcion: Texto descriptivo o leyenda de la imagen.
        es_principal: Indica si la foto debe mostrarse como portada.
        orden: Valor numérico para organizar la galería.
        subida_en: Registro temporal de la carga del archivo.
    """
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
