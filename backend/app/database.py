from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """
    Generador de sesiones de base de datos para inyección de dependencias.
    
    Garantiza el cierre automático de la sesión tras finalizar la petición.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
