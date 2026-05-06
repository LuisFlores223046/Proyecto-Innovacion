"""
conftest.py — Fixtures compartidos para toda la suite de integración.

Estrategia:
  - Se usa una base de datos SQLite en memoria para aislar cada sesión de tests.
  - Se sobrescriben las dependencias de FastAPI (get_db) mediante app.dependency_overrides.
  - Se provee un cliente httpx.AsyncClient y un token JWT de administrador listo para usar.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models.administrador import Administrador
from app.models.espacio import Espacio
from app.models.categoria import Categoria
from app.auth.hashing import hash_password
from app.auth.jwt import create_access_token

# ─── Motor SQLite en memoria ──────────────────────────────────────────────────
SQLALCHEMY_TEST_URL = "sqlite:///./test_mapa_cu.db"

engine_test = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


# ─── Fixtures de sesión ───────────────────────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Crea todas las tablas una vez por sesión de tests y las elimina al finalizar."""
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)


@pytest.fixture()
def db_session():
    """Devuelve una sesión de BD con rollback automático después de cada test."""
    connection = engine_test.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def override_db(db_session):
    """Sobrescribe la dependencia get_db de FastAPI con la sesión de test."""
    def _override():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override
    yield
    app.dependency_overrides.clear()


# ─── Datos de prueba ──────────────────────────────────────────────────────────

@pytest.fixture()
def admin_user(db_session) -> Administrador:
    """Crea un administrador de prueba en la BD de test."""
    admin = Administrador(
        username="qa_admin",
        email="qa@uacj.mx",
        password_hash=hash_password("QaPass123!"),
        activo=True,
        intentos_fallidos=0,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture()
def admin_token(admin_user) -> str:
    """Genera un JWT válido para el administrador de prueba."""
    return create_access_token({"sub": admin_user.username})


@pytest.fixture()
def auth_headers(admin_token) -> dict:
    """Encabezados HTTP con el token JWT listo para usar en peticiones."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture()
def categoria_prueba(db_session) -> Categoria:
    """Crea una categoría de espacio para relacionarla con espacios de prueba."""
    cat = Categoria(nombre="Laboratorio", icono="🔬", color_hex="#003DA5")
    db_session.add(cat)
    db_session.commit()
    db_session.refresh(cat)
    return cat


@pytest.fixture()
def espacio_prueba(db_session, categoria_prueba) -> Espacio:
    """Crea un espacio activo con coordenadas para usarlo en tests de búsqueda y proximidad."""
    espacio = Espacio(
        codigo="LAB-101",
        nombre="Laboratorio de Cómputo 101",
        categoria_id=categoria_prueba.id,
        latitud=31.7200,
        longitud=-106.4270,
        activo=True,
        notas="Sala con 30 equipos disponibles para estudiantes.",
    )
    db_session.add(espacio)
    db_session.commit()
    db_session.refresh(espacio)
    return espacio


# ─── Cliente HTTP asíncrono ───────────────────────────────────────────────────

@pytest_asyncio.fixture()
async def client(override_db) -> AsyncClient:
    """
    Cliente httpx que monta la app FastAPI directamente en memoria.
    No necesita un servidor corriendo — perfecto para CI.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
