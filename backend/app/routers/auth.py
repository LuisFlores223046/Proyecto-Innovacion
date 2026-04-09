"""Rutas de autenticación."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt import create_access_token
from app.auth.dependencies import get_current_admin
from app.models.administrador import Administrador
from app.schemas.administrador import AdminCreate, AdminOut, LoginIn, TokenOut
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenOut)
def login(datos: LoginIn, db: Session = Depends(get_db)):
    admin = db.query(Administrador).filter(Administrador.username == datos.username).first()

    if not admin or not admin.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    # Verificar bloqueo
    if admin.bloqueado_hasta and admin.bloqueado_hasta > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta bloqueada temporalmente por múltiples intentos fallidos",
        )

    if not verify_password(datos.password, admin.password_hash):
        admin.intentos_fallidos += 1
        if admin.intentos_fallidos >= settings.MAX_LOGIN_ATTEMPTS:
            from datetime import timedelta
            admin.bloqueado_hasta = datetime.now(timezone.utc) + timedelta(
                minutes=settings.LOCKOUT_MINUTES
            )
            admin.intentos_fallidos = 0
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    # Login exitoso — resetear intentos
    admin.intentos_fallidos = 0
    admin.bloqueado_hasta = None
    db.commit()

    token = create_access_token({"sub": admin.username})
    return TokenOut(access_token=token)


@router.post("/admin", response_model=AdminOut, status_code=status.HTTP_201_CREATED)
def crear_admin(
    datos: AdminCreate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    if db.query(Administrador).filter(Administrador.username == datos.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El nombre de usuario ya existe",
        )
    if db.query(Administrador).filter(Administrador.email == datos.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo ya está registrado",
        )

    admin = Administrador(
        username=datos.username,
        email=datos.email,
        password_hash=hash_password(datos.password),
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@router.get("/me", response_model=AdminOut)
def perfil(admin: Administrador = Depends(get_current_admin)):
    return admin
