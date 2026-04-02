from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP
from sqlalchemy.sql import func
from app.database import Base


class Administrador(Base):
    __tablename__ = "administradores"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(200), unique=True, nullable=False, index=True)
    password_hash = Column(String(200), nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    intentos_fallidos = Column(Integer, default=0, nullable=False)
    bloqueado_hasta = Column(TIMESTAMP(timezone=True), nullable=True)
    creado_en = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
